# ParkShare — Brand Guidelines v1.0

> **Motto:** *Park smarter. Share more.*
> **One-liner:** The peer-to-peer parking spot — for drivers who can't find one and hosts with space to spare.

The park-and-share marketplace for any city. This document defines the marks, palette, type, and rules so every touchpoint — app, web, deck, video — speaks the same visual language.

---

## 1. The Mark · *Share-P*

A classic European **parking "P"**, redrawn as **two halves of one spot**:

- **Stem** — solid ink. The permanent, trustworthy core (the sign, the anchor).
- **Bowl, left half** — emerald 500. One party claiming the spot.
- **Bowl, right half** — emerald 700. The second party sharing it.
- The **split down the bowl** is the seam where the exchange happens — two users, one bay, working together.

The mark reads as a parking sign at a glance and as a *share* metaphor on a second one. It stays legible from a 16 px favicon to an app-store icon to a billboard.

### Anatomy

```
    bowl top aligns with stem cap
            ⌄
      ┌──────────────────┐
      │                 │  bowl radius R
      │   ┌──┐          │
      │   │  │  ▓ ╎ ▓   │   left half  = emerald 500
      │   │  │  ▓ ╎ ▓   │   right half = emerald 700
      │   │  │  ▓ ╎ ▓   │   the ╎ gap   = shared seam
      │   │  │          │
      │   └──┴──────────┤   bowl bottom ≈ 61% of stem height
      │ stem (ink)      │
      └──────────────────┘
```

- Bowl flat side sits 2 u from the stem's right edge (the classic open-D of the parking sign).
- Bowl diameter = 38 u, stem width = 13 u (≈ 2.9×), bowl height ≈ 61 % of stem height — classic proportions.
- The seam is a vertical 1.1 u gap at the bowl's midpoint.

### Clear space

Keep clear space equal to **one bowl radius (R)** on all sides of the symbol in every lockup.

### Minimum sizes

| Medium | Symbol | Horizontal lockup |
|---|---|---|
| Screen | 16 px | 120 px |
| Print | 4 mm | 22 mm |
| App icon | 44 px rendered | n/a |

---

## 2. Lockups

| File | Use |
|---|---|
| `lockup-horizontal` | Default — headers, decks, web, email |
| `lockup-horizontal-dark` | On ink / photos (white version) |
| `lockup-stacked` | Icons, avatars, stalls, merch, square formats |

- One lockup per layout; never mix horizontal and stacked in the same view.
- The motto may be dropped below ~180 px lockup width.

---

## 3. Color Palette

| Name | Hex | Usage |
|---|---|---|
| **Emerald 500** | `#009967` | Primary brand color; CTAs, active states, left bowl half |
| **Emerald 700** | `#006552` | Gradient end; deep green, right bowl half |
| **Emerald 100** | `#D7F8E8` | Tints, badges, soft fills, success backgrounds |
| **Ink** | `#101826` | Primary text, stem, dark surfaces |
| **Paper** | `#F9FAFB` | App background, light surfaces |
| **Slate** | `#62748E` | Secondary / muted text |
| **Teal** | `#0F766E` | Civic / trust accents (municipal, standings, admin) |
| **Amber** | `#D97706` | Warnings, alerts, ratings below threshold |

### Rules

- Emerald 500 is the action color; never recolor the mark with arbitrary hues.
- Ink text on paper and white on emerald 700 pass WCAG AA.
- Emerald 100 is for fills only — never as text color.
- Two-color logo uses exactly Emerald 500 + Emerald 700 + Ink. One-color (mono) versions are Ink or White only.

---

## 4. Typography

| Role | Face | Weights |
|---|---|---|
| Display, headings, numbers, the wordmark | **Space Grotesk** | 500 Medium · 600 SemiBold · 700 Bold |
| UI, body, paragraphs, captions | **Inter** | 400 Regular · 500 Medium · 600 SemiBold |

- Wordmark is always `Space Grotesk 700`, camel-case **ParkShare** (never PARKS#HARE, never all-caps, never lower-case).
- Heading hierarchy: title `700`, section `600`, labels `600`, body `Inter 400/500`.
- Fallback stacks: `'Space Grotesk', 'Inter', system-ui, sans-serif` and `'Inter', system-ui, sans-serif`.
- Both families ship in the repo (`frontend/node_modules/@expo-google-fonts/*`) — no external font dependencies.

---

## 5. Symbol Variants & When to Use

| Variant | When |
|---|---|
| Color (two-tone + ink) | Light / white backgrounds. The default. |
| White | Ink or photo backgrounds, app icon on gradient |
| Mono (ink) | One-color print, engraving, doc headers |
| Solid white | Favicon & sub-32 px (seam dropped for legibility) |

On the **gradient app icon**, the mark renders white and the seam lets the gradient show through — keeping the "two halves, one spot" story at icon size.

---

## 6. Iconography & Imagery

- UI icons: line style, 2 px stroke, rounded caps (match lucide/ionicons styles already in the app).
- Imagery: real city streets + shallow depth, green on neutral, people > empty lots.
- Never use a generic blue "P" sign — the brand P replaces it everywhere.

---

## 7. File Inventory

```
docs/brand/
├── brand-spec.md
├── svg/                              (canonical vector sources)
│   ├── symbol-color.svg
│   ├── symbol-white.svg
│   ├── symbol-mono.svg
│   ├── symbol-solid-white.svg
│   ├── app-icon.svg                  (1024, square, no alpha → app.json)
│   ├── app-icon-rounded.svg          (display / marketing only)
│   ├── favicon.svg
│   ├── lockup-horizontal.svg
│   ├── lockup-horizontal-dark.svg
│   ├── lockup-stacked.svg
│   └── brand-sheet.svg               (one-page overview poster)
└── png/                              (raster exports; symbol 1024, icons 1024/192,
                                        favicon 64/32, lockups 1200/560, sheet 1920)
```

### Cutting the brand in (follow-on, not yet applied)

- `frontend/app.json` → `icon: docs/brand/png/app-icon.png` (1024 square, no alpha), splash/favicon assets.
- Web export favicon → `docs/brand/png/favicon-64.png` / `favicon-32.png`.
- Marketing video → replace the placeholder Car-in-rounded-square mark in Scene 3/7 with the Share-P symbol.
- Backend/docs → favicon + lockup on the README and Typst cover.

---

## 8. Do's & Don'ts

**Do**
- Keep clear space ≥ 1 bowl radius.
- Use the black/white or white/black lockups on photos.
- Prefer the Wordmark lockup for most product UI; the symbol alone for favicon-size contexts.

**Don't**
- Don't stretch, tilt, or squeeze the mark.
- Don't recolor it (no purple "P", no black bowl).
- Don't add drop shadows, strokes, or outlines around the mark.
- Don't place the mark on busy photography without a clear panel.
- Don't hyphenate or re-case "ParkShare".