"""Renders the LED cube as favicons: public/cube/*.png, cube.svg and an animated cube-spin.gif.
Same cube as src/components/led/ledCanvas.ts: a 14 x 14 window of round lamps, orange, a few brightness steps.
Run: python3 scripts/cube-icons.py   (needs Pillow)
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

N = 14
S = 0.5
VIEW = 0.98
ORANGE = (249, 115, 22)
LIGHT = (-0.75, 0.5, -0.35)
l = math.sqrt(sum(c * c for c in LIGHT))
LIGHT = tuple(c / l for c in LIGHT)
OUT = Path(__file__).resolve().parent.parent / "public" / "cube"


def matrix(yaw, tilt):
    cy, sy, cx, sx = math.cos(yaw), math.sin(yaw), math.cos(tilt), math.sin(tilt)
    return [[cy, 0, sy], [sx * sy, cx, -sx * cy], [-cx * sy, sx, cx * cy]]


def mul(m, v):
    return [sum(m[r][c] * v[c] for c in range(3)) for r in range(3)]


def mul_t(m, v):
    return [sum(m[r][c] * v[r] for r in range(3)) for c in range(3)]


def sample(m, i, j):
    x = ((i + 0.5) / N * 2 - 1) * VIEW
    y = (1 - (j + 0.5) / N * 2) * VIEW
    o = mul_t(m, [x, y, -3])
    d = mul_t(m, [0, 0, 1])
    tmin, tmax, axis, sign = -math.inf, math.inf, 0, 1
    for a in range(3):
        t1, t2 = (-S - o[a]) / d[a] if d[a] else -math.inf, (S - o[a]) / d[a] if d[a] else math.inf
        near, far = min(t1, t2), max(t1, t2)
        if near > tmin:
            tmin, axis, sign = near, a, (-1 if d[a] > 0 else 1)
        tmax = min(tmax, far)
    if tmin > tmax:
        return -1
    n = [0, 0, 0]
    n[axis] = sign
    nv = mul(m, n)
    diffuse = max(0, sum(nv[k] * LIGHT[k] for k in range(3)))
    return 0.36 + 0.64 * diffuse


def lamps(yaw, tilt):
    m = matrix(yaw, tilt)
    res = []
    for j in range(N):
        for i in range(N):
            b = sample(m, i, j)
            if b < 0:
                continue
            level = max(0.58, round(b * 6) / 6)  # a little brighter than the page, for tiny tab icons
            res.append((i, j, tuple(round(c * level) for c in ORANGE)))
    return res


def render(size, yaw, tilt, ss=8):
    big = size * ss
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cell = big / N
    for i, j, color in lamps(yaw, tilt):
        cx, cy, r = (i + 0.5) * cell, (j + 0.5) * cell, cell * 0.46
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (255,))
    return img.resize((size, size), Image.LANCZOS)


YAW, TILT = 0.81, 0.69  # the still frame: three faces visible
for size in (16, 32, 48, 64, 180):
    render(size, YAW, TILT).save(OUT / f"cube-{size}.png")

# vector version
circles = "".join(f'<circle cx="{i + 0.5}" cy="{j + 0.5}" r="0.44" fill="rgb{c}"/>' for i, j, c in lamps(YAW, TILT))
(OUT / "cube.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}">{circles}</svg>\n')

# spinning: a cube repeats every quarter turn, so one quarter loops seamlessly
frames = []
for k in range(16):
    im = render(32, (math.pi / 2) * k / 16, 0.66)
    alpha = im.getchannel("A").point(lambda a: 255 if a > 110 else 0)
    p = im.convert("RGB").quantize(colors=15, dither=Image.NONE)
    mask = Image.eval(alpha, lambda a: 255 if a == 0 else 0)
    p.paste(15, mask)  # palette index 15 = transparent
    frames.append(p)
frames[0].save(OUT / "cube-spin.gif", save_all=True, append_images=frames[1:], duration=90, loop=0, transparency=15, disposal=2)
print("ok", sorted(p.name for p in OUT.iterdir()))
