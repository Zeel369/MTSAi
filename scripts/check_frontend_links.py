#!/usr/bin/env python3
from __future__ import annotations

import argparse
import concurrent.futures
import html.parser
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional


FRONTEND_DIR_DEFAULT = Path("apps/Frontend")
HTML_GLOB_DEFAULT = "**/*.html"


ABS_URL_RE = re.compile(r"^https?://", re.IGNORECASE)
SCHEME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*:")


def _now_ms() -> int:
    return int(time.time() * 1000)


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _strip_query(url: str) -> str:
    # Keep fragments for anchor checks; queries are irrelevant for static existence.
    parsed = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", parsed.fragment))


def _is_external(url: str) -> bool:
    return bool(ABS_URL_RE.match(url))


def _is_mail_tel(url: str) -> bool:
    return url.startswith("mailto:") or url.startswith("tel:")


def _is_hash_only(url: str) -> bool:
    return url.startswith("#")


def _is_other_scheme(url: str) -> bool:
    # e.g. data:, javascript:
    return bool(SCHEME_RE.match(url)) and not _is_external(url) and not _is_mail_tel(url)


@dataclass(frozen=True)
class Finding:
    kind: str  # internal_missing, anchor_missing, external_bad, parse_error
    source_file: str
    source_attr: str
    url: str
    detail: str


@dataclass(frozen=True)
class Ref:
    tag: str
    attr: str
    url: str
    rel: str  # only meaningful for <link>


class SimpleHTMLLinkExtractor(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[Ref] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        rel = ""
        if tag == "link":
            for k, v in attrs:
                if k == "rel" and v:
                    rel = v.strip().lower()
                    break
        for k, v in attrs:
            if v is None:
                continue
            if k == "id" and v:
                self.ids.add(v)
            if k in ("href", "src", "poster"):
                self.refs.append(Ref(tag=tag, attr=k, url=v.strip(), rel=rel))
            if k == "srcset":
                # Split by comma; take the URL part before any descriptor.
                for part in v.split(","):
                    u = part.strip().split(" ")[0].strip()
                    if u:
                        self.refs.append(Ref(tag=tag, attr=k, url=u, rel=rel))


def extract(html_text: str) -> tuple[list[Ref], set[str]]:
    parser = SimpleHTMLLinkExtractor()
    parser.feed(html_text)
    parser.close()
    return parser.refs, parser.ids


def resolve_internal(frontend_root: Path, source_file: Path, url: str) -> Path:
    # Treat relative links as relative to the source file directory.
    # Leading "/" is treated as frontend_root-relative.
    parsed = urllib.parse.urlsplit(url)
    path = parsed.path
    if path.startswith("/"):
        return (frontend_root / path.lstrip("/")).resolve()
    return (source_file.parent / path).resolve()


def check_internal_file_exists(frontend_root: Path, source_file: Path, url: str) -> Optional[str]:
    url = _strip_query(url)
    parsed = urllib.parse.urlsplit(url)
    if not parsed.path:
        return None

    target = resolve_internal(frontend_root, source_file, url)
    try:
        target.relative_to(frontend_root.resolve())
    except ValueError:
        return f"Resolved outside frontend root: {target}"

    if target.exists():
        return None
    return f"Missing file: {target.relative_to(frontend_root)}"


def check_anchor(frontend_root: Path, source_file: Path, url: str, ids_by_file: dict[Path, set[str]]) -> Optional[str]:
    url = _strip_query(url)
    parsed = urllib.parse.urlsplit(url)
    frag = parsed.fragment
    if not frag:
        return None

    if not parsed.path or parsed.path == "":
        ids = ids_by_file.get(source_file, set())
        if frag in ids:
            return None
        return f"Missing in-page anchor id: #{frag}"

    target_file = resolve_internal(frontend_root, source_file, parsed.path)
    if not target_file.exists():
        return None  # handled by missing file check
    ids = ids_by_file.get(target_file, set())
    if frag in ids:
        return None
    return f"Missing anchor id in {target_file.relative_to(frontend_root)}: #{frag}"


def _request(url: str, method: str, timeout_s: float, user_agent: str) -> tuple[int, str]:
    req = urllib.request.Request(url, method=method)
    req.add_header("User-Agent", user_agent)
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        status = getattr(resp, "status", None) or resp.getcode()
        final_url = resp.geturl()
        return int(status), str(final_url)


def check_external_url(url: str, timeout_s: float, max_redirects: int, user_agent: str) -> Optional[str]:
    # Strict: any non-2xx (after redirects) is broken. We also treat timeouts/errors as broken.
    # NOTE: Some external references are connectivity hints (e.g., preconnect) and use a bare origin.
    # Treat bare origins (no path or "/") as not checkable via HTTP status and skip them.
    try:
        p0 = urllib.parse.urlsplit(url)
        if p0.path in ("", "/"):
            return None
    except Exception:
        pass

    current = url
    visited: set[str] = set()
    for _ in range(max_redirects + 1):
        if current in visited:
            return "Redirect loop"
        visited.add(current)
        try:
            try:
                status, final = _request(current, "HEAD", timeout_s, user_agent)
            except urllib.error.HTTPError as e:
                status = int(e.code)
                final = current
            except Exception:
                # Some servers block HEAD; try GET.
                status, final = _request(current, "GET", timeout_s, user_agent)
        except urllib.error.HTTPError as e:
            status = int(e.code)
            final = current
        except (urllib.error.URLError, socket.timeout, TimeoutError) as e:
            return f"Network error: {type(e).__name__}"
        except Exception as e:
            return f"Error: {type(e).__name__}"

        if 200 <= status < 300:
            return None
        if status in (301, 302, 303, 307, 308):
            # urllib already follows redirects by default for GET; but for HEAD/HTTPError cases,
            # we treat the final URL as-is. If it changed, keep going.
            if final != current:
                current = final
                continue
            return f"Redirect status {status}"
        return f"HTTP {status}"
    return "Too many redirects"


def iter_html_files(frontend_root: Path, glob_pat: str) -> Iterable[Path]:
    for p in sorted(frontend_root.glob(glob_pat)):
        if p.is_file():
            yield p


def main() -> int:
    ap = argparse.ArgumentParser(description="Check internal/external links under apps/Frontend.")
    ap.add_argument("--root", default=str(FRONTEND_DIR_DEFAULT), help="Frontend root directory")
    ap.add_argument("--glob", default=HTML_GLOB_DEFAULT, help="Glob for HTML files under root")
    ap.add_argument("--external", action="store_true", help="Check external http/https links")
    ap.add_argument("--timeout", type=float, default=6.0, help="External request timeout (seconds)")
    ap.add_argument("--max-redirects", type=int, default=5, help="Max redirects for external checks")
    ap.add_argument("--workers", type=int, default=10, help="External check concurrency")
    ap.add_argument("--json", dest="json_out", default="", help="Write JSON report to path")
    args = ap.parse_args()

    frontend_root = Path(args.root).resolve()
    if not frontend_root.exists():
        print(f"Frontend root not found: {frontend_root}", file=sys.stderr)
        return 2

    html_files = list(iter_html_files(frontend_root, args.glob))
    ids_by_file: dict[Path, set[str]] = {}
    refs_by_file: dict[Path, list[Ref]] = {}

    findings: list[Finding] = []

    for f in html_files:
        try:
            text = _read_text(f)
            refs, ids = extract(text)
            ids_by_file[f.resolve()] = ids
            refs_by_file[f.resolve()] = refs
        except Exception as e:
            findings.append(Finding("parse_error", str(f.relative_to(frontend_root)), "", "", f"{type(e).__name__}"))

    # Internal checks (files + anchors)
    for f in html_files:
        rel = str(f.relative_to(frontend_root))
        for ref in refs_by_file.get(f.resolve(), []):
            attr, url = ref.attr, ref.url
            if not url or url == "/":
                continue
            if _is_external(url) or _is_mail_tel(url) or _is_other_scheme(url):
                continue
            # ignore pure fragments here; anchor check will handle
            if _is_hash_only(url):
                err = check_anchor(frontend_root, f.resolve(), url, ids_by_file)
                if err:
                    findings.append(Finding("anchor_missing", rel, attr, url, err))
                continue

            internal_err = check_internal_file_exists(frontend_root, f.resolve(), url)
            if internal_err:
                findings.append(Finding("internal_missing", rel, attr, url, internal_err))

            anchor_err = check_anchor(frontend_root, f.resolve(), url, ids_by_file)
            if anchor_err:
                findings.append(Finding("anchor_missing", rel, attr, url, anchor_err))

    # External checks
    user_agent = "MTSAiLinkCheck/1.0 (+https://mtsai.in)"
    external_urls: dict[str, list[tuple[str, str, str]]] = {}  # url -> [(file, attr, url)]
    if args.external:
        for f in html_files:
            rel = str(f.relative_to(frontend_root))
            for ref in refs_by_file.get(f.resolve(), []):
                if not _is_external(ref.url):
                    continue
                # Only treat user-facing navigations/resources as "links".
                # Ignore connectivity hints and metadata like canonical URLs.
                if ref.tag == "link" and ref.rel in ("preconnect", "dns-prefetch", "canonical"):
                    continue
                external_urls.setdefault(ref.url, []).append((rel, ref.attr, ref.url))

        def _check_one(u: str) -> tuple[str, Optional[str]]:
            return u, check_external_url(u, args.timeout, args.max_redirects, user_agent)

        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
            for u, err in ex.map(_check_one, list(external_urls.keys())):
                if err:
                    for rel, attr, original in external_urls.get(u, []):
                        findings.append(Finding("external_bad", rel, attr, original, err))

    # Output
    findings_sorted = sorted(findings, key=lambda x: (x.source_file, x.kind, x.url))
    summary: dict[str, dict[str, int]] = {}
    for f in findings_sorted:
        summary.setdefault(f.kind, {"count": 0})
        summary[f.kind]["count"] += 1

    ok = len(findings_sorted) == 0
    print(f"Checked {len(html_files)} HTML files under {frontend_root}")
    if ok:
        print("OK: no broken links found.")
    else:
        print(f"FAIL: {len(findings_sorted)} findings")
        for f in findings_sorted[:200]:
            print(f"- [{f.kind}] {f.source_file} {f.source_attr}={f.url!r} -> {f.detail}")
        if len(findings_sorted) > 200:
            print(f"... ({len(findings_sorted) - 200} more)")

    if args.json_out:
        out_path = Path(args.json_out)
        out = {
            "generatedAtMs": _now_ms(),
            "root": str(frontend_root),
            "htmlFiles": [str(p.relative_to(frontend_root)) for p in html_files],
            "summary": summary,
            "findings": [f.__dict__ for f in findings_sorted],
        }
        out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"Wrote JSON report: {out_path}")

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

