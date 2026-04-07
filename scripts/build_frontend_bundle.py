#!/usr/bin/env python3
"""Concatenate design-system CSS into apps/Frontend/assets/css/bundle.css."""
from __future__ import annotations

from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
FRONTEND = REPO / "apps" / "Frontend"

# Order must match historical bundle (tokens → base → components → premium → hero… → site).
BUNDLE_PARTS = [
    "assets/design-system/tokens/colors.css",
    "assets/design-system/tokens/semantic.css",
    "assets/design-system/tokens/brand-visual.css",
    "assets/design-system/tokens/density.css",
    "assets/design-system/tokens/data-viz.css",
    "assets/design-system/tokens/typography.css",
    "assets/design-system/tokens/spacing.css",
    "assets/design-system/tokens/motion.css",
    "assets/design-system/tokens/elevation.css",
    "assets/design-system/base/reset.css",
    "assets/design-system/base/grid.css",
    "assets/design-system/base/utilities.css",
    "assets/design-system/base/utilities-extended.css",
    "assets/design-system/base/animations.css",
    "assets/design-system/components/button.css",
    "assets/design-system/components/nav.css",
    "assets/design-system/components/card.css",
    "assets/design-system/components/tag.css",
    "assets/design-system/components/layout.css",
    "assets/design-system/components/segmented-control.css",
    "assets/design-system/components/side-nav.css",
    "assets/design-system/components/stepper.css",
    "assets/design-system/components/marketing.css",
    "assets/design-system/components/data-display.css",
    "assets/design-system/components/overlay.css",
    "assets/design-system/components/combobox.css",
    "assets/design-system/components/otp-input.css",
    "assets/design-system/components/accordion.css",
    "assets/design-system/components/modal.css",
    "assets/design-system/components/tabs.css",
    "assets/design-system/components/tooltip.css",
    "assets/design-system/components/skeleton.css",
    "assets/design-system/components/input.css",
    "assets/design-system/components/select.css",
    "assets/design-system/components/checkbox.css",
    "assets/design-system/components/radio.css",
    "assets/design-system/components/toggle.css",
    "assets/design-system/components/pagination.css",
    "assets/design-system/components/breadcrumb.css",
    "assets/design-system/components/avatar.css",
    "assets/design-system/components/form-layout.css",
    "assets/design-system/components/empty-state.css",
    "assets/design-system/components/dropdown.css",
    "assets/design-system/components/popover.css",
    "assets/design-system/components/progress.css",
    "assets/design-system/components/notification.css",
    "assets/design-system/components/table.css",
    "assets/design-system/base/premium.css",
    "assets/design-system/components/hero.css",
    "assets/design-system/components/status.css",
    "assets/design-system/components/kpi.css",
    "assets/design-system/components/article.css",
    "assets/design-system/components/callout.css",
    "assets/design-system/components/media.css",
    "assets/design-system/components/footer.css",
    "assets/design-system/components/section.css",
    "assets/design-system/components/content-card.css",
    "assets/ai-review.css",
    "assets/site.css",
]


def main() -> None:
    chunks: list[str] = []
    for rel in BUNDLE_PARTS:
        path = FRONTEND / rel
        if not path.is_file():
            raise SystemExit(f"Missing bundle part: {path}")
        chunks.append(f"/* ── {rel} ─────────────────────────────── */")
        chunks.append(path.read_text(encoding="utf-8").rstrip() + "\n")

    header = (
        f"/* MTSAi Design System Bundle — {len(BUNDLE_PARTS)} files concatenated */\n"
        f"/* Generated: {date.today().isoformat()} */\n\n"
    )
    out = FRONTEND / "assets/css/bundle.css"
    out.write_text(header + "\n".join(chunks), encoding="utf-8")
    print(f"Wrote {out} ({len(BUNDLE_PARTS)} files)")


if __name__ == "__main__":
    main()
