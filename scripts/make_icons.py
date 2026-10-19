#!/usr/bin/env python3
"""Regenerates the app icons in public/icons/ from the Dostyq logo mark.

Source of truth: public/icons/logo-mark.svg (the book, traced from the official
logo). It is drawn in white on the pink Dostyq gradient.

Usage (needs Pillow: `pip install pillow`):

    python3 scripts/make_icons.py

Outputs:
    favicon.svg                  gradient tile + mark, vector
    icon-192.png, icon-512.png   rounded square, transparent corners ("any")
    apple-touch-icon.png         180x180 full-bleed square (iOS rounds it itself)
    icon-maskable-512.png        full-bleed square, mark inside the 80% safe zone
"""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ICONS = Path(__file__).resolve().parent.parent / "public" / "icons"
GRAD_FROM = (0xF4, 0x5F, 0xB5)  # top-left   (--color-primary)
GRAD_TO = (0xC2, 0x33, 0x8D)  # bottom-right (--color-primary-dark)
SS = 4  # supersampling factor for smooth edges


def load_mark() -> tuple[float, float, list[list[tuple[float, float]]]]:
    """Returns (width, height, subpaths) of the mark; Bezier curves are flattened to polylines."""
    svg = (ICONS / "logo-mark.svg").read_text(encoding="utf-8")
    width, height = (float(v) for v in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg).groups())
    d = re.search(r' d="([^"]+)"', svg).group(1)
    tokens = re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", d)
    subpaths: list[list[tuple[float, float]]] = []
    cur: list[tuple[float, float]] = []
    i = 0
    nums = lambda n: [float(t) for t in tokens[i + 1 : i + 1 + n]]
    while i < len(tokens):
        cmd = tokens[i]
        if cmd == "M":
            x, y = nums(2)
            cur = [(x, y)]
            i += 3
        elif cmd == "L":
            x, y = nums(2)
            cur.append((x, y))
            i += 3
        elif cmd == "C":
            x1, y1, x2, y2, x3, y3 = nums(6)
            x0, y0 = cur[-1]
            for s in range(1, 25):
                t = s / 24
                u = 1 - t
                cur.append((
                    u**3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3,
                    u**3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3,
                ))
            i += 7
        elif cmd == "Z":
            subpaths.append(cur)
            cur = []
            i += 1
        else:
            raise ValueError(f"unexpected token {cmd!r} in path")
    return width, height, subpaths


def gradient(size: int) -> Image.Image:
    """Diagonal gradient, top-left -> bottom-right."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(GRAD_FROM, GRAD_TO))
    return img


def mark_mask(size: int, fraction: float) -> Image.Image:
    """White-where-mark mask (even-odd fill) with the mark `fraction` of the tile tall, centred."""
    width, height, subpaths = load_mark()
    scale = size * fraction / height
    ox = (size - width * scale) / 2
    oy = (size - height * scale) / 2
    mask = Image.new("1", (size, size), 0)
    for sub in subpaths:
        layer = Image.new("1", (size, size), 0)
        ImageDraw.Draw(layer).polygon([(ox + x * scale, oy + y * scale) for x, y in sub], fill=1)
        mask = ImageChops.logical_xor(mask, layer)  # even-odd
    return mask.convert("L")


def make(size: int, *, rounded: bool, mark_fraction: float) -> Image.Image:
    big = size * SS
    img = gradient(big).convert("RGBA")
    img.paste((255, 255, 255, 255), (0, 0), mark_mask(big, mark_fraction))
    if rounded:
        round_mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(round_mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.22, fill=255)
        img.putalpha(round_mask)
    return img.resize((size, size), Image.LANCZOS)


def write_favicon(fraction: float) -> None:
    width, height, _ = load_mark()
    d = re.search(r' d="([^"]+)"', (ICONS / "logo-mark.svg").read_text(encoding="utf-8")).group(1)
    scale = 100 * fraction / height
    tx, ty = (100 - width * scale) / 2, (100 - height * scale) / 2
    (ICONS / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="#{GRAD_FROM[0]:02X}{GRAD_FROM[1]:02X}{GRAD_FROM[2]:02X}"/>'
        f'<stop offset="1" stop-color="#{GRAD_TO[0]:02X}{GRAD_TO[1]:02X}{GRAD_TO[2]:02X}"/></linearGradient></defs>'
        '<rect width="100" height="100" rx="22" fill="url(#g)"/>'
        f'<path transform="translate({tx:.2f} {ty:.2f}) scale({scale:.4f})" fill="#fff" fill-rule="evenodd" d="{d}"/>'
        "</svg>\n",
        encoding="utf-8",
    )


def main() -> None:
    write_favicon(0.56)
    make(192, rounded=True, mark_fraction=0.56).save(ICONS / "icon-192.png", optimize=True)
    make(512, rounded=True, mark_fraction=0.56).save(ICONS / "icon-512.png", optimize=True)
    make(180, rounded=False, mark_fraction=0.56).convert("RGB").save(ICONS / "apple-touch-icon.png", optimize=True)
    # Maskable: launchers crop to a circle/squircle, so keep the mark in the central 80%.
    make(512, rounded=False, mark_fraction=0.46).convert("RGB").save(ICONS / "icon-maskable-512.png", optimize=True)
    for name in ("favicon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-maskable-512.png"):
        print(f"{name}: {(ICONS / name).stat().st_size} bytes")


if __name__ == "__main__":
    main()
