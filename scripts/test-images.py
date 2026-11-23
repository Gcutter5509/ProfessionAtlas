"""
Генератор минималистичных иллюстраций к вопросам теста Климова.
Каждая картинка — пара занятий: слева вариант «А», справа «Б».
Запуск: python3 scripts/test-images.py  →  public/test/q01.svg … q20.svg
"""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "test"

IND, SKY, COR, MINT, YEL, W = "#3B3FD8", "#8FB4FF", "#FF8A65", "#5FD3A8", "#FFD166", "#FFFFFF"
NV = "var(--nv)"  # тёмные детали: в тёмной теме становятся светлыми
DK = "#1E2240"  # тёмное всегда: экраны, стрелки и глаза на цветных предметах
G = 330  # линия «пола»


def rect(x, y, w, h, fill, rx=0, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>'


def circ(cx, cy, r, fill, extra=""):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" {extra}/>'


def path(d, fill="none", stroke=None, sw=0, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if stroke else ""
    return f'<path d="{d}" fill="{fill}"{s} {extra}/>'


def line(x1, y1, x2, y2, stroke, sw=8):
    return path(f"M{x1} {y1}L{x2} {y2}", stroke=stroke, sw=sw)


def person(x, col, h=1.0, g=G, arm=None, arm2=None):
    """Безликая фигурка. arm/arm2 — точка, куда тянется рука от плеча."""
    hy = g - 152 * h
    parts = []
    sh_y = g - 118 * h
    for a, side in ((arm, -1), (arm2, 1)):
        if a:
            parts.append(line(x + side * 18 * h, sh_y, a[0], a[1], col, 13 * h))
    parts += [
        rect(x - 14 * h, g - 62 * h, 11 * h, 62 * h, NV, 5 * h),
        rect(x + 3 * h, g - 62 * h, 11 * h, 62 * h, NV, 5 * h),
        rect(x - 27 * h, g - 128 * h, 54 * h, 76 * h, col, 24 * h),
        circ(x, hy, 21 * h, NV),
    ]
    return "".join(parts)


def seated(x, col, g=G, h=1.0, arm=None):
    """Сидящая фигурка (за столом, на стуле)."""
    parts = []
    if arm:
        parts.append(line(x + 14 * h, g - 108 * h, arm[0], arm[1], col, 13 * h))
    parts += [
        rect(x - 18 * h, g - 52 * h, 52 * h, 12 * h, NV, 6 * h),
        rect(x + 22 * h, g - 52 * h, 12 * h, 52 * h, NV, 6 * h),
        rect(x - 24 * h, g - 118 * h, 48 * h, 74 * h, col, 22 * h),
        circ(x, g - 140 * h, 20 * h, NV),
    ]
    return "".join(parts)


def bubble(x, y, w, h, fill, tail="left"):
    tx = x + 18 if tail == "left" else x + w - 18
    d = f"M{tx} {y + h - 2}l{-8 if tail == 'left' else 8} 18l18 -18z"
    return rect(x, y, w, h, fill, 14) + path(d, fill=fill)


def ground(x1=40, x2=260):
    return line(x1, G + 2, x2, G + 2, "var(--gr)", 6)


def backdrop(fill):
    return circ(150, 196, 122, fill, 'opacity="0.22"')


def plant(x, g, leaf=MINT, pot=COR, s=1.0):
    return (
        line(x, g - 44 * s, x, g - 110 * s, MINT, 6 * s)
        + path(f"M{x} {g - 80 * s}c-8 -26 -34 -32 -52 -24 4 22 28 30 52 24z", fill=leaf)
        + path(f"M{x} {g - 96 * s}c8 -28 36 -34 56 -26 -4 24 -32 32 -56 26z", fill=leaf, extra='opacity="0.8"')
        + path(f"M{x - 30 * s} {g - 48 * s}h{60 * s}l-8 {48 * s}h{-44 * s}z", fill=pot)
    )


def gear(cx, cy, r, fill, teeth=8):
    import math

    pts = []
    for i in range(teeth * 4):
        a = i / (teeth * 4) * 2 * math.pi
        rr = r if i % 4 < 2 else r * 0.78
        pts.append(f"{cx + math.cos(a) * rr:.1f},{cy + math.sin(a) * rr:.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>' + circ(cx, cy, r * 0.32, "var(--bg)")


def dog(x, g):
    return (
        rect(x - 48, g - 70, 96, 44, YEL, 22)
        + rect(x - 40, g - 34, 12, 34, YEL, 6)
        + rect(x + 26, g - 34, 12, 34, YEL, 6)
        + circ(x + 50, g - 82, 26, YEL)
        + path(f"M{x + 34} {g - 104}q-10 20 2 34", fill=COR)
        + circ(x + 70, g - 80, 6, DK)
        + path(f"M{x - 46} {g - 62}q-26 -14 -20 -40", stroke=YEL, sw=10)
    )


def cat(x, g, col=SKY):
    return (
        path(f"M{x - 34} {g}q0 -70 34 -76q34 6 34 76z", fill=col)
        + circ(x, g - 92, 26, col)
        + path(f"M{x - 22} {g - 108}l4 -26 16 16z", fill=col)
        + path(f"M{x + 22} {g - 108}l-4 -26 -16 16z", fill=col)
        + path(f"M{x + 32} {g - 8}q34 0 28 -40", stroke=col, sw=10)
    )


def cross(cx, cy, s, fill):
    return rect(cx - s / 6, cy - s / 2, s / 3, s, fill, 3) + rect(cx - s / 2, cy - s / 6, s, s / 3, fill, 3)


def doc(x, y, w, h, lines=5, accent=None):
    out = rect(x, y, w, h, W, 10, 'stroke="var(--line)" stroke-width="3"')
    for i in range(lines):
        lw = w - 36 - (i * 17 % 40)
        out += rect(x + 18, y + 22 + i * 22, lw, 8, accent if accent and i == 2 else "var(--txt)", 4)
    return out


def monitor(x, y, w, h):
    return (
        rect(x, y, w, h, DK, 12)
        + rect(x + 10, y + 10, w - 20, h - 22, IND, 6)
        + rect(x + w / 2 - 8, y + h, 16, 26, NV)
        + rect(x + w / 2 - 40, y + h + 24, 80, 10, NV, 5)
    )


def book(cx, cy, col, w=70):
    return path(f"M{cx} {cy}c-16 -10 -40 -10 -{w} -4v56c30 -6 54 -6 {w} 4z", fill=col) + path(
        f"M{cx} {cy}c16 -10 40 -10 {w} -4v56c-30 -6 -54 -6 -{w} 4z", fill=col, extra='opacity="0.75"'
    )


def note(x, y, fill):
    return circ(x, y, 9, fill) + rect(x + 6, y - 40, 5, 42, fill, 2) + path(f"M{x + 11} {y - 40}q14 6 14 20", stroke=fill, sw=5)


def spotlight(x, y, to_x, fill=YEL):
    return path(f"M{x - 8} {y}L{to_x - 70} {G}H{to_x + 70}L{x + 8} {y}z", fill=fill, extra='opacity="0.35"') + circ(x, y, 14, NV)


# ---------------- Сцены: каждая рисуется в половине 300×400 ----------------

S = {}

# 1
S["animals_care"] = lambda: backdrop(YEL) + ground() + dog(120, G) + rect(200, G - 22, 56, 22, IND, 8) + rect(196, G - 26, 64, 8, IND, 4) + circ(214, G - 30, 6, COR) + circ(232, G - 32, 6, COR)
S["machines_service"] = lambda: backdrop(SKY) + ground() + rect(60, 120, 180, 210, IND, 14) + rect(78, 140, 144, 70, DK, 8) + path("M90 180l20 -16 18 26 20 -30 16 20 22 -6", stroke=MINT, sw=5) + circ(108, 250, 20, W) + line(108, 250, 118, 236, DK, 5) + circ(170, 250, 20, W) + line(170, 250, 156, 242, DK, 5) + rect(206, 236, 18, 30, YEL, 4) + rect(80, 292, 140, 10, SKY, 5)

# 2
S["heal_people"] = lambda: backdrop(COR) + ground() + rect(40, 250, 200, 26, IND, 10) + rect(40, 230, 26, 100, IND, 8) + rect(214, 262, 18, 68, IND, 6) + circ(86, 228, 20, NV) + rect(72, 222, 160, 34, SKY, 16) + person(232, W, 0.95, arm=(204, 236)) + cross(232, 150, 22, COR) + circ(150, 120, 26, W, 'opacity="0.9"') + cross(150, 120, 28, COR)
S["tables_programs"] = lambda: backdrop(SKY) + ground() + monitor(64, 110, 172, 120) + "".join(rect(84 + (i % 3) * 48, 132 + (i // 3) * 26, 40, 16, [W, MINT, YEL][(i + i // 3) % 3], 4) for i in range(9)) + rect(70, 290, 160, 22, DK, 8) + "".join(rect(80 + i * 15, 296, 10, 10, SKY, 2) for i in range(10))

# 3
S["illustrations_quality"] = lambda: backdrop(COR) + ground() + rect(52, 96, 116, 150, W, 8, 'stroke="var(--line)" stroke-width="3"') + rect(66, 110, 88, 84, SKY, 4) + path("M66 194l30 -36 22 22 16 -16 20 30z", fill=IND) + circ(136, 132, 10, YEL) + rect(66, 206, 60, 8, "var(--txt)", 4) + circ(206, 250, 50, DK) + circ(206, 250, 18, COR) + circ(206, 250, 4, "var(--bg)") + circ(206, 152, 32, "none", f'stroke="{IND}" stroke-width="10"') + line(228, 176, 256, 206, IND, 12)
S["plants_growth"] = lambda: backdrop(MINT) + ground() + plant(120, G, s=1.4) + rect(210, 140, 14, 190, YEL, 4) + "".join(rect(224, 156 + i * 30, 12 if i % 2 else 20, 4, NV, 2) for i in range(6)) + path("M120 178 Q160 130 200 120", stroke=COR, sw=5, extra='stroke-dasharray="2 12"')

# 4
S["materials"] = lambda: backdrop(YEL) + ground() + rect(40, 262, 220, 22, COR, 6) + rect(52, 284, 14, 46, NV, 4) + rect(234, 284, 14, 46, NV, 4) + rect(70, 230, 140, 32, YEL, 6) + "".join(line(84 + i * 24, 238, 96 + i * 24, 254, "#E0B04A", 3) for i in range(5)) + path("M140 120l70 70", stroke=SKY, sw=18) + "".join(path(f"M{150 + i * 12} {130 + i * 12}l-12 12", stroke=SKY, sw=6) for i in range(5)) + rect(190, 170, 34, 46, IND, 10, 'transform="rotate(-45 207 193)"') + rect(70, 140, 56, 18, NV, 4) + rect(92, 158, 12, 50, COR, 4)
S["sell_advertise"] = lambda: backdrop(COR) + ground() + rect(50, 200, 140, 130, W, 6, 'stroke="var(--line)" stroke-width="3"') + path("M40 200l18 -50h124l18 50z", fill=COR) + "".join(path(f"M{58 + i * 31} 150v50", stroke=W, sw=6) for i in range(4)) + rect(70, 230, 40, 40, MINT, 6) + rect(120, 240, 50, 30, YEL, 6) + path("M206 220l50 -30v80l-50 -30z", fill=IND) + rect(194, 220, 16, 20, IND, 4) + path("M268 210q12 20 0 40", stroke=IND, sw=5) + rect(212, 280, 46, 50, YEL, 8) + path("M222 280q13 -24 26 0", stroke=NV, sw=5)

# 5
S["discuss_science"] = lambda: backdrop(SKY) + ground() + person(90, IND, 0.95, arm=(130, 230)) + person(220, MINT, 0.95, arm2=(250, 200)) + bubble(98, 70, 110, 76, W) + circ(153, 108, 7, IND) + "".join(f'<ellipse cx="153" cy="108" rx="34" ry="12" fill="none" stroke="{IND}" stroke-width="4" transform="rotate({a} 153 108)"/>' for a in (0, 60, 120)) + book(155, 250, YEL, 40)
S["discuss_fiction"] = lambda: backdrop(COR) + ground() + person(80, COR, 0.95, arm=(118, 232)) + person(220, YEL, 0.95) + bubble(96, 64, 124, 82, W, "right") + circ(138, 104, 22, YEL) + circ(178, 104, 22, SKY) + circ(131, 98, 3.5, NV) + circ(145, 98, 3.5, NV) + path("M130 110q8 8 16 0", stroke=NV, sw=3) + circ(171, 98, 3.5, NV) + circ(185, 98, 3.5, NV) + path("M170 116q8 -8 16 0", stroke=NV, sw=3) + book(150, 252, COR, 40)

# 6
S["raise_young_animals"] = lambda: backdrop(YEL) + ground() + path("M60 330c0 -80 40 -120 90 -110 40 8 60 50 50 110z", fill=W, extra='stroke="var(--line)" stroke-width="3"') + circ(190, 196, 30, W, 'stroke="var(--line)" stroke-width="3"') + path("M216 190l22 8 -22 8z", fill=YEL) + path("M180 166q8 -18 22 -8", fill=COR, stroke=COR, sw=6) + circ(198, 190, 4, DK) + "".join(circ(x, G - 18, 18, YEL) + circ(x + 12, G - 34, 11, YEL) + path(f"M{x + 22} {G - 36}l8 3 -8 3z", fill=COR) for x in (200, 248))
S["train_peers"] = lambda: backdrop(MINT) + ground() + person(90, IND, 1.0, arm=(128, 150)) + circ(132, 146, 9, YEL) + person(200, COR, 0.78, arm=(170, 190), arm2=(236, 190)) + path("M30 330l14 -30 14 30z", fill=COR) + path("M244 330l14 -30 14 30z", fill=COR) + circ(160, 310, 18, W, f'stroke="{NV}" stroke-width="3"')

# 7
S["copy_drawings"] = lambda: backdrop(SKY) + ground() + rect(36, 120, 104, 130, W, 6, 'stroke="var(--line)" stroke-width="3"') + circ(88, 176, 28, YEL) + path("M50 236l30 -30 22 18 24 -26v38z", fill=MINT) + rect(158, 120, 104, 130, W, 6, 'stroke="var(--line)" stroke-width="3"') + circ(210, 176, 28, "none", f'stroke="{YEL}" stroke-width="4" stroke-dasharray="8 6"') + path("M172 236l30 -30 22 18 24 -26v38z", fill="none", stroke=MINT, sw=4, extra='stroke-dasharray="8 6"') + path("M186 300l70 -70", stroke=COR, sw=14) + path("M180 306l6 -6 6 6z", fill=NV) + path("M114 282q38 -26 70 0", stroke=IND, sw=5, extra='stroke-dasharray="4 10"')
S["drive_heavy"] = lambda: backdrop(YEL) + ground() + rect(60, 200, 120, 70, COR, 10) + rect(150, 150, 70, 110, COR, 10) + rect(162, 162, 46, 40, SKY, 6) + rect(70, 186, 10, 20, NV, 3) + circ(206, 286, 44, DK) + circ(206, 286, 16, YEL) + circ(90, 300, 30, DK) + circ(90, 300, 11, YEL)

# 8
S["inform_people"] = lambda: backdrop(SKY) + ground() + line(122, 330, 122, 96, NV, 5) + path("M126 96h46l-10 16 10 16h-46z", fill=COR) + person(80, IND, 1.0, arm2=(118, 160)) + person(180, MINT, 0.82) + person(236, YEL, 0.78) + circ(220, 104, 30, W) + rect(216, 100, 8, 22, IND, 3) + circ(220, 88, 5, IND)
S["decorate_exhibitions"] = lambda: backdrop(COR) + ground() + path("M30 70h240v28H30z", fill=COR) + path("M30 98q40 120 0 232z", fill=COR) + path("M270 98q-40 120 0 232z", fill=COR) + spotlight(150, 70, 150) + rect(110, 230, 80, 100, W, 6, 'stroke="var(--line)" stroke-width="3"') + rect(120, 160, 60, 70, IND, 6) + circ(150, 196, 16, YEL) + path("M70 160l6 14 14 2 -10 10 2 14 -12 -6 -12 6 2 -14 -10 -10 14 -2z", fill=YEL) + path("M226 200l5 11 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z", fill=YEL)

# 9
S["repair"] = lambda: backdrop(MINT) + ground() + path("M50 200l70 -60 70 60v130H50z", fill=SKY) + rect(98, 250, 44, 80, IND, 6) + rect(70, 210, 34, 30, W, 4) + rect(150, 210, 34, 30, W, 4) + rect(176, 268, 96, 62, COR, 8) + rect(204, 252, 40, 18, "none", 8, f'stroke="{NV}" stroke-width="6"') + path("M200 120l56 56", stroke=NV, sw=10) + rect(232, 98, 40, 20, YEL, 4, 'transform="rotate(45 252 108)"')
S["fix_errors"] = lambda: backdrop(SKY) + ground() + doc(60, 80, 160, 200, 7, COR) + f'<ellipse cx="128" cy="150" rx="70" ry="20" fill="none" stroke="{COR}" stroke-width="5"/>' + circ(214, 236, 38, W, f'stroke="{IND}" stroke-width="10"') + line(240, 264, 270, 296, IND, 14) + path("M196 236l12 12 22 -24", stroke=MINT, sw=7)

# 10
S["heal_animals"] = lambda: backdrop(MINT) + ground() + cat(118, G, SKY) + rect(92, 270, 52, 12, W, 6) + cross(118, 276, 10, COR) + circ(212, 156, 36, W) + cross(212, 156, 34, COR) + path("M190 300c0 -50 40 -50 40 -90", stroke=NV, sw=6) + circ(190, 304, 10, NV)
S["calculations"] = lambda: backdrop(YEL) + ground() + rect(80, 90, 140, 220, DK, 18) + rect(96, 108, 108, 48, MINT, 8) + "".join(rect(96 + (i % 4) * 28, 172 + (i // 4) * 32, 22, 24, [W, W, W, COR][i % 4], 5) for i in range(16)) + path("M232 120h28M246 106v28", stroke=IND, sw=6) + path("M36 220h26M36 232h26", stroke=IND, sw=6)

# 11
S["breed_plants"] = lambda: backdrop(MINT) + ground() + line(70, 330, 70, 210, MINT, 6) + circ(70, 196, 18, COR) + line(150, 330, 150, 210, MINT, 6) + circ(150, 196, 18, YEL) + path("M70 170q40 -50 80 0", stroke=NV, sw=4, extra='stroke-dasharray="4 10"') + path("M110 140v-20", stroke=NV, sw=4) + line(232, 330, 232, 180, MINT, 6) + "".join(circ(232 + dx, 166 + dy, 13, c) for dx, dy, c in ((-12, -8, COR), (12, -8, YEL), (0, 12, COR), (0, -24, YEL))) + circ(232, 160, 8, W) + path("M174 250h34l-8 -8M208 250l-8 8", stroke=IND, sw=5) + path("M232 260c-20 -6 -34 4 -40 18 18 4 34 -2 40 -18z", fill=MINT)
S["design_products"] = lambda: backdrop(SKY) + ground() + rect(40, 90, 220, 170, IND, 10) + "".join(line(40, 110 + i * 30, 260, 110 + i * 30, SKY, 1) for i in range(5)) + "".join(line(60 + i * 30, 90, 60 + i * 30, 260, SKY, 1) for i in range(7)) + path("M70 210h160l-10 -30 -40 -10 -20 -26h-50l-24 30z", stroke=W, sw=5) + circ(104, 214, 16, IND, f'stroke="{W}" stroke-width="5"') + circ(196, 214, 16, IND, f'stroke="{W}" stroke-width="5"') + path("M200 330l30 -90 30 90", stroke=NV, sw=6) + circ(230, 236, 8, YEL)

# 12
S["resolve_disputes"] = lambda: backdrop(COR) + ground() + person(60, COR, 0.85) + person(240, SKY, 0.85) + person(150, MINT, 1.0, arm=(112, 200), arm2=(188, 200)) + path("M24 110l16 -20 16 14 16 -20 16 14 14 -18v44H24z", fill=COR) + bubble(208, 90, 70, 40, SKY, "left") + circ(150, 70, 24, W) + path("M138 70l9 9 16 -18", stroke=MINT, sw=6)
S["check_drawings"] = lambda: backdrop(SKY) + ground() + rect(50, 90, 200, 200, W, 8, 'stroke="var(--line)" stroke-width="3"') + rect(70, 110, 90, 60, "none", 0, f'stroke="{IND}" stroke-width="4"') + circ(208, 140, 26, "none", f'stroke="{IND}" stroke-width="4"') + path("M70 190h160M70 214h160M70 238h160M150 190v72", stroke="var(--line)", sw=3) + path("M80 202l8 8 14 -14", stroke=MINT, sw=5) + path("M80 226l8 8 14 -14", stroke=MINT, sw=5) + path("M80 250l8 8 14 -14", stroke=MINT, sw=5) + path("M180 300l70 -70", stroke=YEL, sw=14) + path("M174 306l6 -6 6 6z", fill=NV)

# 13
S["art_club"] = lambda: backdrop(YEL) + ground() + line(110, 330, 110, 190, NV, 7) + rect(84, 322, 52, 10, NV, 5) + path("M110 190l30 -30", stroke=NV, sw=6) + rect(130, 128, 30, 44, IND, 15, 'transform="rotate(45 145 150)"') + person(196, YEL, 0.95, arm=(152, 168)) + note(240, 120, COR) + note(60, 140, SKY) + note(256, 230, MINT)
S["microbes"] = lambda: backdrop(MINT) + ground() + rect(80, 306, 110, 24, NV, 8) + path("M120 306v-40h40", stroke=NV, sw=16) + path("M150 260l-40 -100", stroke=IND, sw=26) + rect(92, 138, 36, 26, NV, 6, 'transform="rotate(-22 110 151)"') + rect(140, 236, 60, 10, SKY, 4) + circ(224, 150, 50, W, 'stroke="var(--line)" stroke-width="3"') + "".join(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 0.6}" fill="{c}" transform="rotate({a} {x} {y})"/>' for x, y, r, c, a in ((208, 136, 12, MINT, 20), (238, 160, 9, COR, -30), (220, 172, 7, IND, 60), (244, 132, 6, YEL, 0)))

# 14
S["medical_devices"] = lambda: backdrop(SKY) + ground() + rect(50, 100, 170, 140, DK, 14) + rect(62, 112, 146, 92, IND, 6) + path("M70 160h28l10 -26 14 50 12 -34 8 10h50", stroke=MINT, sw=5) + circ(80, 222, 8, COR) + circ(104, 222, 8, YEL) + rect(120, 216, 80, 12, SKY, 6) + rect(110, 240, 50, 90, NV, 6) + path("M210 300l46 -60", stroke=COR, sw=12) + path("M252 246l14 -18", stroke=NV, sw=6)
S["first_aid"] = lambda: backdrop(COR) + ground() + rect(60, 200, 150, 120, W, 14, 'stroke="var(--line)" stroke-width="3"') + rect(110, 180, 50, 26, "none", 10, f'stroke="{NV}" stroke-width="7"') + cross(135, 260, 50, COR) + rect(180, 110, 90, 34, YEL, 17, 'transform="rotate(-30 225 127)"') + rect(208, 112, 34, 30, "#F2C14E", 4, 'transform="rotate(-30 225 127)"')

# 15
S["accurate_reports"] = lambda: backdrop(SKY) + ground() + rect(54, 80, 140, 200, IND, 12) + rect(66, 96, 116, 172, W, 6) + rect(100, 72, 48, 22, NV, 6) + "".join(rect(80, 112 + i * 28, 14, 14, MINT, 3) + rect(104, 115 + i * 28, 60 - i * 6, 8, "var(--txt)", 4) for i in range(3)) + "".join(rect(84 + i * 24, 252 - hgt, 16, hgt, [COR, YEL, MINT, IND][i], 3) for i, hgt in enumerate((30, 54, 40, 70))) + rect(226, 120, 20, 160, W, 10, 'stroke="var(--line)" stroke-width="3"') + circ(236, 290, 20, COR) + rect(231, 180, 10, 100, COR, 5)
S["artistic_depict"] = lambda: backdrop(COR) + ground() + path("M80 330l50 -230M220 330l-50 -230M150 100v230", stroke=NV, sw=7) + rect(66, 110, 168, 124, W, 6, 'stroke="var(--line)" stroke-width="3"') + rect(78, 122, 144, 100, SKY, 4) + circ(190, 150, 16, YEL) + path("M78 222l40 -50 30 30 28 -24 46 44z", fill=MINT) + path("M232 300l30 -60", stroke=IND, sw=8) + path("M262 240l8 -18", stroke=COR, sw=10)

# 16
S["lab_tests"] = lambda: backdrop(MINT) + ground() + rect(50, 250, 150, 18, NV, 6) + rect(56, 268, 10, 62, NV, 4) + rect(184, 268, 10, 62, NV, 4) + "".join(rect(64 + i * 32, 150, 22, 110, W, 11, 'stroke="var(--line)" stroke-width="3"') + rect(67 + i * 32, 210 - i * 14, 16, 46 + i * 14, c, 8) for i, c in enumerate((COR, YEL, MINT, SKY))) + path("M214 190h40M224 190v50l-26 70h72l-26 -70v-50", fill=W, stroke=NV, sw=5) + path("M204 300l12 -34h40l12 34z", fill=IND)
S["doctor_patient"] = lambda: backdrop(COR) + ground() + seated(70, YEL) + rect(110, 240, 100, 12, NV, 6) + rect(150, 252, 12, 78, NV, 4) + person(240, W, 0.95, arm=(206, 214)) + path("M228 140q-6 40 12 56", stroke=NV, sw=4) + circ(240, 198, 7, NV) + cross(240, 160, 16, COR) + bubble(96, 90, 66, 40, W, "right")

# 17
S["paint_walls"] = lambda: backdrop(YEL) + ground() + rect(40, 80, 150, 250, SKY, 6) + "".join(rect(40 + i * 40, 80, 20, 250, IND, 0, 'opacity="0.18"') for i in range(4)) + rect(104, 80, 60, 140, COR, 4) + rect(176, 140, 66, 30, NV, 10) + path("M209 170v60h-50", stroke=NV, sw=7) + rect(190, 270, 70, 60, W, 6, 'stroke="var(--line)" stroke-width="3"') + rect(190, 270, 70, 18, COR, 6)
S["assembly"] = lambda: backdrop(SKY) + ground() + "".join(rect(50 + i * 70, 140, 14, 190, IND, 3) for i in range(3)) + "".join(rect(50, 140 + i * 64, 154, 12, IND, 3) for i in range(3)) + path("M58 150l60 60M128 150l-60 60", stroke=SKY, sw=4) + line(240, 40, 240, 128, NV, 4) + rect(206, 128, 68, 14, COR, 4) + path("M240 142v10", stroke=NV, sw=4) + gear(250, 290, 34, YEL) + path("M150 330l30 -50", stroke=NV, sw=10)

# 18
S["organize_trips"] = lambda: backdrop(MINT) + ground() + path("M20 330l90 -170 60 100 30 -40 80 110z", fill=SKY) + path("M110 160l-22 42 22 -10 20 10z", fill=W) + line(110, 160, 110, 104, NV, 5) + path("M110 104h40l-10 12 10 12h-40z", fill=COR) + path("M180 330l40 -70 40 70z", fill=YEL) + line(220, 260, 220, 330, NV, 3) + person(60, IND, 0.75) + rect(70, 230, 26, 40, COR, 10)
S["stage_perform"] = lambda: backdrop(COR) + ground() + spotlight(150, 60, 150) + rect(30, 300, 240, 30, NV, 6) + person(150, YEL, 1.0, g=300, arm=(186, 156)) + line(186, 156, 196, 140, NV, 5) + circ(200, 134, 9, NV) + note(62, 160, IND) + note(236, 120, MINT)

# 19
S["make_by_drawings"] = lambda: backdrop(YEL) + ground() + rect(36, 96, 110, 110, IND, 8) + rect(60, 124, 60, 54, "none", 0, f'stroke="{W}" stroke-width="3"') + circ(90, 151, 14, "none", f'stroke="{W}" stroke-width="3"') + path("M156 150h40l-8 -8M196 150l-8 8", stroke=NV, sw=5) + path("M208 124l40 -20 40 20v50l-40 20 -40 -20z", fill=COR) + path("M208 124l40 20 40 -20M248 144v50", stroke="#D4643F", sw=3) + "".join(rect(40 + (i % 5) * 44 + (22 if (i // 5) % 2 else 0), 246 + (i // 5) * 28, 40, 24, COR if (i + i // 5) % 2 else "#F4A07F", 3) for i in range(14) if 40 + (i % 5) * 44 + (22 if (i // 5) % 2 else 0) < 230)
S["drafting_maps"] = lambda: backdrop(SKY) + ground() + path("M40 130l70 -24 80 24 70 -24v190l-70 24 -80 -24 -70 24z", fill=W, extra='stroke="var(--line)" stroke-width="3"') + path("M110 106v190M190 130v190", stroke="var(--line)", sw=3) + path("M70 260q40 -80 90 -40t70 -70", stroke=COR, sw=5, extra='stroke-dasharray="10 8"') + circ(230, 150, 12, IND) + path("M230 150l0 22", stroke=IND, sw=5) + path("M80 200c10 -20 40 -10 30 10", fill=MINT) + path("M130 300l40 -110 40 110", stroke=NV, sw=6) + circ(170, 186, 8, YEL)

# 20
S["plant_pests"] = lambda: backdrop(MINT) + ground() + rect(112, 220, 20, 110, "#B07A4E", 6) + circ(122, 170, 66, MINT) + circ(96, 150, 10, COR) + circ(150, 190, 8, COR) + f'<ellipse cx="160" cy="146" rx="12" ry="8" fill="{NV}"/>' + path("M152 140l-6 -8M168 140l6 -8", stroke=NV, sw=3) + rect(206, 220, 40, 70, IND, 10) + rect(216, 200, 20, 22, NV, 4) + path("M226 200v-20h-40", stroke=NV, sw=5) + path("M186 180l-30 -10M186 180l-30 4M186 180l-28 18", stroke=SKY, sw=3, extra='stroke-dasharray="3 7"')
S["typing"] = lambda: backdrop(YEL) + ground() + monitor(118, 110, 150, 100) + "".join(rect(136, 132 + i * 18, 100 - i * 14, 8, W, 4) for i in range(3)) + seated(76, IND, arm=(150, 264)) + rect(110, 262, 170, 10, NV, 5) + rect(120, 256, 90, 8, SKY, 4) + rect(260, 272, 10, 58, NV, 4)

PAIRS = [
    ("animals_care", "machines_service"),
    ("heal_people", "tables_programs"),
    ("illustrations_quality", "plants_growth"),
    ("materials", "sell_advertise"),
    ("discuss_science", "discuss_fiction"),
    ("raise_young_animals", "train_peers"),
    ("copy_drawings", "drive_heavy"),
    ("inform_people", "decorate_exhibitions"),
    ("repair", "fix_errors"),
    ("heal_animals", "calculations"),
    ("breed_plants", "design_products"),
    ("resolve_disputes", "check_drawings"),
    ("art_club", "microbes"),
    ("medical_devices", "first_aid"),
    ("accurate_reports", "artistic_depict"),
    ("lab_tests", "doctor_patient"),
    ("paint_walls", "assembly"),
    ("organize_trips", "stage_perform"),
    ("make_by_drawings", "drafting_maps"),
    ("plant_pests", "typing"),
]

STYLE = """<style>
svg{--bg:#F6F7FB;--nv:#1E2240;--gr:#E3E6EE;--line:#D8DCE6;--txt:#C9CEDA}
@media (prefers-color-scheme:dark){svg{--bg:#181B24;--nv:#E9EBF2;--gr:#2A2F3D;--line:#3A4052;--txt:#9AA1B3}}
</style>"""


def build(left: str, right: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 50 600 300">'
        + STYLE
        + '<rect y="50" width="600" height="300" fill="var(--bg)"/>'
        + f"<g>{S[left]()}</g>"
        + f'<g transform="translate(300 0)">{S[right]()}</g>'
        + '<path d="M300 60V340" stroke="var(--gr)" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>'
        + "</svg>"
    )


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for i, (a, b) in enumerate(PAIRS, 1):
        (OUT / f"q{i:02d}.svg").write_text(build(a, b), encoding="utf-8")
    print(f"Готово: {len(PAIRS)} картинок в {OUT}")
