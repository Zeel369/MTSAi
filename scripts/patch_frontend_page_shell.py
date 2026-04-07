#!/usr/bin/env python3
"""
Insert page-shell.css after bundle.css and remove duplicated shell rules
from inline <style> blocks (html/body/container/scroll/skip/nav through .mts-nav__actions).
"""
from __future__ import annotations

import re
from pathlib import Path

FRONTEND = Path(__file__).resolve().parents[1] / "apps" / "Frontend"

SKIP = frozenset(
    {
        "carbon-ultimate-stack-light.html",
    }
)

BUNDLE_LINE = '<link rel="stylesheet" href="assets/css/bundle.css">'
SHELL_LINK = (
    '<link rel="stylesheet" href="assets/css/bundle.css">\n'
    '  <link rel="stylesheet" href="assets/css/page-shell.css">'
)


def strip_shell_css(style_inner: str) -> str:
    key = "    html { scroll-behavior: smooth; }"
    if key not in style_inner:
        return style_inner
    i = style_inner.index(key)
    j = style_inner.find(".mts-nav__actions", i)
    if j < 0:
        return style_inner
    k = style_inner.index("{", j)
    depth = 0
    p = k
    while p < len(style_inner):
        ch = style_inner[p]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = p + 1
                while end < len(style_inner) and style_inner[end] in " \t\r":
                    end += 1
                if end < len(style_inner) and style_inner[end] == "\n":
                    end += 1
                return style_inner[:i] + style_inner[end:]
        p += 1
    return style_inner


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    orig = text

    if "assets/css/bundle.css" not in text:
        return False
    if "assets/css/page-shell.css" not in text:
        if BUNDLE_LINE not in text:
            return False
        text = text.replace(BUNDLE_LINE, SHELL_LINK, 1)

    def repl_style(m: re.Match[str]) -> str:
        inner = m.group(1)
        inner = strip_shell_css(inner)
        return f"<style>{inner}</style>"

    text = re.sub(r"<style>([\s\S]*?)</style>", repl_style, text, count=1)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    n = 0
    for path in sorted(FRONTEND.glob("*.html")):
        if path.name in SKIP:
            continue
        if patch_file(path):
            print("patched", path.name)
            n += 1
    print(f"Done. Updated {n} files.")


if __name__ == "__main__":
    main()
