# Pencel — Brand Guidelines (`brand-guidelines.md`)

> Compact usage guide for the official visual identity of **Pencel** (Direction C — _Stage & Droplet_), crafted in harmony with the _Clarity_, _Deference_, and _Depth_ principles of `@pencel/design-tokens`.

---

## 1. Brand Concept & Identity

- **Core Concept (_Stage & Droplet_):** A studio stage (a continuous-curvature squircle inspired by macOS) carved from the bottom edge by a fluid negative-space stroke forming the lowercase initial `p`, framing a centered brush droplet.
- **Proprietary Wordmark (`pencel`):** Rendered in modern editorial lowercase, converted into precise vector curves (`<path>`), featuring optical compensation (`2px` overshoot on round glyphs), calligraphic terminals cut at $30^\circ$ on `e` and `c`, and a fluid brush flick on the base of `l`.
- **Official Assets (`apps/web/public/brand/`):**
  - **Horizontal Lockup (Primary):** `pencel-logo-horizontal-color.svg` (Light theme) and `pencel-logo-horizontal-dark.svg` (Dark theme).
  - **Stacked Lockup (Vertical):** `pencel-logo-stacked-color.svg` and `pencel-logo-stacked-dark.svg`.
  - **Standalone Symbol:** `pencel-symbol-color.svg`, `pencel-symbol-black.svg`, `pencel-symbol-white.svg`.
  - **Micro Scaled Version (`16px–32px`):** `pencel-symbol-small.svg` (also served as `apps/web/public/favicon.svg`).
  - **Isolated Wordmark:** `pencel-wordmark-black.svg` and `pencel-wordmark-white.svg`.
  - **React Component:** `<BrandLogo variant="lockup | symbol | wordmark" size="sm | md | lg" />` in `apps/web/src/components/ui/BrandLogo/`.

---

## 2. Clear Space

Maintain a minimum clearance of **$1 \times d$** on all sides of the mark, where **$d$** equals the width of the symbol's inner droplet (or the x-height of the letter `e` in typographic-only usage). This buffer scales proportionally with the mark.

---

## 3. Minimum Display Sizes

| Version               | Digital / Web Display          | Print         | Technical Note                                                                     |
| :-------------------- | :----------------------------- | :------------ | :--------------------------------------------------------------------------------- |
| **Horizontal Lockup** | `84 px` width (`22 px` height) | `24 mm` width | Standard size in `TopToolbar` with `size="sm"` (`22 px` height).                   |
| **Stacked Lockup**    | `64 px` width                  | `18 mm` width | Ideal for square cards and modal welcome banners.                                  |
| **Standalone Symbol** | `16 px × 16 px`                | `5 mm × 5 mm` | From `16 px` to `32 px`, always utilize `pencel-symbol-small.svg` (`favicon.svg`). |

---

## 4. Chromatic Palette and Contrast

Pencel's identity palette is mapped directly to `@pencel/design-tokens`:

| Name             | CSS Token                      | HEX       | RGB             | CMYK (Ref.)      | Pantone (Ref.)  | Contrast Ratio                    |
| :--------------- | :----------------------------- | :-------- | :-------------- | :--------------- | :-------------- | :-------------------------------- |
| **Pencel Blue**  | `--color-accent-primary`       | `#0071E3` | `0, 113, 227`   | `92, 50, 0, 0`   | `2175 C`        | `4.64 : 1` on white (`#FFFFFF`)   |
| **Studio Ink**   | `--color-text-primary` (Light) | `#1D1D1F` | `29, 29, 31`    | `72, 66, 62, 78` | `Black 6 C`     | `17.1 : 1` on white (`#FFFFFF`)   |
| **Canvas Stage** | `--color-text-primary` (Dark)  | `#F5F5F7` | `245, 245, 247` | `3, 2, 1, 0`     | `Cool Gray 1 C` | `15.4 : 1` on dark (`#141416`)    |
| **Pure White**   | `--color-surface-primary`      | `#FFFFFF` | `255, 255, 255` | `0, 0, 0, 0`     | —               | Inner cutout on light backgrounds |

### Approved Background Pairings

- **Light Surfaces (`#FFFFFF`, `#F5F5F7`):** `#0071E3` Symbol + `#1D1D1F` Wordmark.
- **Dark Surfaces (`#141416`, `#1D1D1F`):** `#0071E3` Symbol + `#F5F5F7` Wordmark (or monochrome white `#FFFFFF`).
- **Brand Blue Surfaces (`#0071E3`):** Monochrome white version (`pencel-symbol-white.svg` / `pencel-logo-horizontal-white.svg`).
- **Monochrome Print / High Contrast:** Solid black version (`pencel-logo-horizontal-black.svg`).

---

## 5. UI & Content Typography

- **Brand Wordmark:** Always utilize the vectorized path assets. **Never re-type `pencel` using a system or web font.**
- **Application Interface Fonts (`@pencel/design-tokens`):**
  - `--font-family-ui`: `-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif`
  - `--font-family-mono`: `ui-monospace, 'SFMono-Regular', 'SF Mono', 'Cascadia Mono', 'Segoe UI Mono', Menlo, Consolas, monospace`

---

## 6. Incorrect Usage (Don'ts)

1. **Do not distort:** Never stretch, compress, or scale the mark non-uniformly.
2. **Do not alter lockup relationships:** Never change the distance or proportion between the symbol and the wordmark.
3. **Do not apply unapproved effects:** Do not add drop shadows, outer glow, bevels, or multicolored gradients.
4. **Do not fill negative space:** The `p` cutout is a true path knockout (`fill-rule="evenodd"`) intended to show the underlying surface.
5. **Do not retype the wordmark:** The $30^\circ$ terminal cuts on `e`/`c` and brush curve on `l` are unique to the vector master.
