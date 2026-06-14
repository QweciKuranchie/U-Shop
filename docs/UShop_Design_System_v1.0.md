<!-- ================================================================
     U-SHOP — DESIGN SYSTEM DOCUMENT v1.0
     Author  : Richard Nuhu
     Date    : June 1, 2026
     Stack   : Next.js 15 · Tailwind CSS · shadcn/ui
     ================================================================ -->

<div align="center">

<br/>

<h1>
  <span style="background:#FF0000;color:#FFFFFF;padding:4px 16px;font-size:2.2rem;font-weight:900;border-radius:4px;">U</span>&nbsp;<span style="color:#5D1A89;font-size:2.2rem;font-weight:900;">sh</span><span style="color:#D1148A;font-size:2.2rem;font-weight:900;">op</span>
</h1>

<h2 style="color:#5D1A89;margin-top:0.5rem;">Design System</h2>
<p style="color:#D1148A;font-weight:600;">Version 1.0 — Developer Reference</p>

<br/>

| Field | Value |
|---|---|
| **Document** | Design System Document |
| **Version** | 1.0 |
| **Author** | Richard Nuhu |
| **Stack** | Next.js 15 · Tailwind CSS v3 · shadcn/ui |
| **Primary Viewport** | 360px (Android Chrome — mobile-first) |
| **Date** | June 1, 2026 |

</div>

---

<br/>

# <span style="color:#5D1A89;">Table of Contents</span>

| § | Section |
|---|---|
| 1 | [Brand Identity & Color Palette](#s1) |
| 2 | [Typography System](#s2) |
| 3 | [UI Component Guidelines](#s3) |
| 4 | [Layout & Spacing — Mobile-First](#s4) |
| 5 | [Developer Implementation](#s5) |
| 6 | [Iconography & Imagery](#s6) |
| 7 | [Motion & Interaction](#s7) |
| 8 | [Accessibility Standards](#s8) |

---

<br/>

<a name="s1"></a>

# <span style="color:#5D1A89;">1. Brand Identity & Color Palette</span>

## <span style="color:#D1148A;">1.1 Design Philosophy</span>

U-Shop's visual identity is built around three vivid brand colors extracted directly from the logo — a punchy Red badge, a prestigious Deep Purple wordmark, and an energetic Magenta accent. The palette communicates trust, youth energy, and tech-forward ambition to a university student audience. It is deliberately bold and high-contrast, optimized for legibility on low-brightness Android screens and under direct sunlight (common outdoor campus use).

**Governing color rules:**
- **Red** (`#FF0000`) is reserved for the brand logomark, critical alerts (`DISPUTED`), and destructive actions only. It is never used for interactive CTAs — its power would be diluted.
- **Deep Purple** (`#5D1A89`) is the platform's primary interactive color: all main CTAs, links, focus rings, and primary buttons.
- **Magenta** (`#D1148A`) is the accent energy: badges, seller tier indicators, price highlights, active states, and decorative brand moments.
- **Slates** ground the vibrant palette with neutral backgrounds, borders, and body text.

---

## <span style="color:#D1148A;">1.2 Brand Colors</span>

| Swatch | Name | Hex | HSL | Tailwind Custom | Usage |
|---|---|---|---|---|---|
| <span style="display:inline-block;width:40px;height:24px;background:#FF0000;border-radius:4px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;"></span> | Brand Red | `#FF0000` | `0 100% 50%` | `brand-red` | Logo, destructive actions, DISPUTED badge, error states |
| <span style="display:inline-block;width:40px;height:24px;background:#5D1A89;border-radius:4px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;"></span> | Deep Purple | `#5D1A89` | `276 68% 32%` | `brand-purple` | Primary CTAs, focus rings, links, active nav, `--primary` |
| <span style="display:inline-block;width:40px;height:24px;background:#D1148A;border-radius:4px;border:1px solid rgba(0,0,0,0.1);vertical-align:middle;"></span> | Magenta | `#D1148A` | `323 83% 45%` | `brand-magenta` | Accent badges, listing price, seller tier chips, highlights |

---

## <span style="color:#D1148A;">1.3 Brand Color Tints & Shades</span>

Each brand color has a full 9-step scale. Use **tints** (lighter) for backgrounds and hover states. Use **shades** (darker) for pressed states and high-contrast text.

### <span style="color:#5D1A89;">Purple Scale</span>

| Swatch | Token | Hex | Use |
|---|---|---|---|
| <span style="display:inline-block;width:40px;height:20px;background:#F3EDF9;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-50` | `#F3EDF9` | Hover backgrounds, selected row tint |
| <span style="display:inline-block;width:40px;height:20px;background:#E7DBEF;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-100` | `#E7DBEF` | Active backgrounds, badge fill |
| <span style="display:inline-block;width:40px;height:20px;background:#CEB6DF;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-200` | `#CEB6DF` | Borders on light backgrounds, skeleton shimmer |
| <span style="display:inline-block;width:40px;height:20px;background:#A880C2;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-300` | `#A880C2` | Disabled button text, placeholder text |
| <span style="display:inline-block;width:40px;height:20px;background:#8552A8;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-400` | `#8552A8` | Secondary icon color |
| <span style="display:inline-block;width:40px;height:20px;background:#5D1A89;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-600` | `#5D1A89` | **Brand Purple — primary CTA, links** |
| <span style="display:inline-block;width:40px;height:20px;background:#4A1570;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-700` | `#4A1570` | Hover state on primary buttons |
| <span style="display:inline-block;width:40px;height:20px;background:#380F57;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-800` | `#380F57` | Active/pressed state, nav header |
| <span style="display:inline-block;width:40px;height:20px;background:#240A3A;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `purple-900` | `#240A3A` | Dark mode backgrounds |

### <span style="color:#D1148A;">Magenta Scale</span>

| Swatch | Token | Hex | Use |
|---|---|---|---|
| <span style="display:inline-block;width:40px;height:20px;background:#FDF0F8;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-50` | `#FDF0F8` | Price highlight background, badge container |
| <span style="display:inline-block;width:40px;height:20px;background:#FAD6EE;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-100` | `#FAD6EE` | Seller tier chip background |
| <span style="display:inline-block;width:40px;height:20px;background:#F2A3D5;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-200` | `#F2A3D5` | Decorative borders, OTP box highlight |
| <span style="display:inline-block;width:40px;height:20px;background:#E565B5;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-400` | `#E565B5` | Hover on accent elements |
| <span style="display:inline-block;width:40px;height:20px;background:#D1148A;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-500` | `#D1148A` | **Brand Magenta — accent, price, badges** |
| <span style="display:inline-block;width:40px;height:20px;background:#A80E6E;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-600` | `#A80E6E` | Pressed accent, dark mode accent |
| <span style="display:inline-block;width:40px;height:20px;background:#800B54;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `magenta-700` | `#800B54` | High-contrast text on light magenta |

---

## <span style="color:#D1148A;">1.4 Neutral Palette (Slate)</span>

The neutral palette uses Tailwind's native `slate` scale, which carries a slight cool undertone that harmonises with the purple brand without competing with it.

| Swatch | Token | Hex | HSL | Use |
|---|---|---|---|---|
| <span style="display:inline-block;width:40px;height:20px;background:#F8FAFC;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-50` | `#F8FAFC` | `210 40% 98%` | Page background, modal overlay tint |
| <span style="display:inline-block;width:40px;height:20px;background:#F1F5F9;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-100` | `#F1F5F9` | `210 40% 96%` | Card background, input fill, skeleton base |
| <span style="display:inline-block;width:40px;height:20px;background:#E2E8F0;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-200` | `#E2E8F0` | `214 32% 91%` | Default border, divider, table row separator |
| <span style="display:inline-block;width:40px;height:20px;background:#CBD5E1;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-300` | `#CBD5E1` | `213 27% 84%` | Input border (resting), disabled input |
| <span style="display:inline-block;width:40px;height:20px;background:#94A3B8;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-400` | `#94A3B8` | `215 20% 65%` | Placeholder text, icon fill (inactive) |
| <span style="display:inline-block;width:40px;height:20px;background:#64748B;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-500` | `#64748B` | `215 16% 47%` | Secondary body text, caption |
| <span style="display:inline-block;width:40px;height:20px;background:#475569;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-600` | `#475569` | `215 19% 35%` | Body text (secondary pages) |
| <span style="display:inline-block;width:40px;height:20px;background:#334155;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-700` | `#334155` | `215 25% 27%` | Heading text |
| <span style="display:inline-block;width:40px;height:20px;background:#1E293B;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-800` | `#1E293B` | `217 33% 17%` | Primary body text, nav label |
| <span style="display:inline-block;width:40px;height:20px;background:#0F172A;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | `slate-900` | `#0F172A` | `222 47% 11%` | Display headings, logo text |

---

## <span style="color:#D1148A;">1.5 Semantic Colors — System States</span>

Semantic colors are used exclusively in their designated contexts. Never use brand colors for system state communication — it breaks mental models for users who learn "purple = interactive, magenta = price, green = delivered."

| Swatch | State | Token | Hex | HSL | Contexts |
|---|---|---|---|---|---|
| <span style="display:inline-block;width:40px;height:20px;background:#16A34A;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | **Success / Delivered** | `success` | `#16A34A` | `142 76% 36%` | `DELIVERED`, `COMPLETED`, payment success, seller approved |
| <span style="display:inline-block;width:40px;height:20px;background:#DCFCE7;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | Success BG | `success-subtle` | `#DCFCE7` | `142 76% 91%` | Toast background, status chip fill |
| <span style="display:inline-block;width:40px;height:20px;background:#D97706;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | **Warning / Pending** | `warning` | `#D97706` | `32 95% 44%` | `PROCESSING`, `READY_FOR_PICKUP`, `PENDING_COD`, pending payout |
| <span style="display:inline-block;width:40px;height:20px;background:#FEF3C7;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | Warning BG | `warning-subtle` | `#FEF3C7` | `32 95% 91%` | Toast background, badge fill |
| <span style="display:inline-block;width:40px;height:20px;background:#DC2626;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | **Error / Disputed** | `error` | `#DC2626` | `0 72% 51%` | `DISPUTED`, form validation errors, OTP mismatch, failed payment |
| <span style="display:inline-block;width:40px;height:20px;background:#FEE2E2;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | Error BG | `error-subtle` | `#FEE2E2` | `0 72% 93%` | Inline error background, error toast |
| <span style="display:inline-block;width:40px;height:20px;background:#2563EB;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | **Info / In Transit** | `info` | `#2563EB` | `221 83% 53%` | `IN_TRANSIT`, informational banners, tooltips |
| <span style="display:inline-block;width:40px;height:20px;background:#DBEAFE;border-radius:4px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;"></span> | Info BG | `info-subtle` | `#DBEAFE` | `221 83% 93%` | Info toast fill, highlight background |

### Order Status → Color Mapping

| Order Status | Color Token | Tailwind Classes |
|---|---|---|
| `PENDING_COD` | `warning` | `bg-amber-100 text-amber-700 border-amber-200` |
| `PAID` | `info` | `bg-blue-100 text-blue-700 border-blue-200` |
| `PROCESSING` | `warning` | `bg-amber-100 text-amber-700 border-amber-200` |
| `READY_FOR_PICKUP` | `warning` | `bg-orange-100 text-orange-700 border-orange-200` |
| `IN_TRANSIT` | `info` | `bg-blue-100 text-blue-700 border-blue-200` |
| `DELIVERED` | `success` | `bg-green-100 text-green-700 border-green-200` |
| `COMPLETED` | `success` | `bg-green-100 text-green-800 border-green-300` |
| `DISPUTED` | `error` | `bg-red-100 text-red-700 border-red-200` |

---

<br/>

<a name="s2"></a>

# <span style="color:#5D1A89;">2. Typography System</span>

## <span style="color:#D1148A;">2.1 Font Selection — Plus Jakarta Sans</span>

**Primary Typeface:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

**Rationale:**
- Designed specifically for digital/screen contexts — excellent on low-DPI Android displays
- Geometric structure with humanist warmth — communicates both tech precision and approachability (right for a student marketplace)
- Variable font with weights 200–800 — entire scale from one file load
- Superior legibility at small sizes (11px+) compared to Inter or Roboto — critical for product cards on 360px mobile screens
- Strong numeral design — prices and order references are visually clean

**Installation in Next.js:**
```typescript
// app/layout.tsx
import { Plus_Jakarta_Sans } from "next/font/google"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

**Secondary / Monospace:** `JetBrains Mono` (for order reference codes like `USH-20260601-A3F1`, OTP display, and price breakdowns requiring tabular alignment)

```typescript
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
})
```

---

## <span style="color:#D1148A;">2.2 Typographic Scale</span>

All sizes follow a **1.25 (major third) modular scale** anchored at 16px base. Every heading is `font-sans` (Plus Jakarta Sans). Use `tracking-tight` on sizes ≥ `text-2xl` to counter the generous letter-spacing the font applies at large sizes.

| Role | Size | Tailwind Classes | Weight | Line Height | Use |
|---|---|---|---|---|---|
| **Display** | 36px / 2.25rem | `text-4xl font-extrabold tracking-tight leading-tight` | 800 | 1.15 | Homepage hero, storefront name (desktop) |
| **H1** | 30px / 1.875rem | `text-3xl font-bold tracking-tight leading-tight` | 700 | 1.2 | Page titles (Product Detail, Checkout) |
| **H2** | 24px / 1.5rem | `text-2xl font-bold tracking-tight leading-snug` | 700 | 1.25 | Section headers, Dashboard section titles |
| **H3** | 20px / 1.25rem | `text-xl font-semibold leading-snug` | 600 | 1.3 | Card titles, modal headers, form sections |
| **H4** | 18px / 1.125rem | `text-lg font-semibold leading-snug` | 600 | 1.35 | Sidebar headings, list group labels |
| **H5** | 16px / 1rem | `text-base font-semibold leading-normal` | 600 | 1.5 | Table column headers, sub-section labels |
| **H6** | 14px / 0.875rem | `text-sm font-semibold uppercase tracking-wide leading-normal` | 600 | 1.5 | Category labels, eyebrow text, `PAID` label above ref |
| **Body Large** | 16px / 1rem | `text-base font-normal leading-relaxed` | 400 | 1.625 | Product description, onboarding copy |
| **Body** | 14px / 0.875rem | `text-sm font-normal leading-relaxed` | 400 | 1.625 | Default UI body text, form labels, order detail |
| **Caption** | 12px / 0.75rem | `text-xs font-normal leading-normal` | 400 | 1.5 | Timestamps, "3 hours ago", image captions |
| **Small / Legal** | 11px / 0.6875rem | `text-[11px] font-normal leading-normal` | 400 | 1.5 | Paystack fee disclaimer, T&C notice |
| **Price** | 20px / 1.25rem | `text-xl font-bold tabular-nums` | 700 | 1.3 | Product listing price (magenta) |
| **Price Large** | 28px / 1.75rem | `text-[28px] font-extrabold tabular-nums tracking-tight` | 800 | 1.2 | Checkout total, cart total |
| **Code / Reference** | 13px / 0.8125rem | `font-mono text-[13px] font-medium tracking-wide` | 500 | 1.5 | Order refs `USH-...`, OTP digits, code snippets |

### Typography Usage Examples

```tsx
// Page title (H1)
<h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
  My Storefront
</h1>

// Section header (H2)
<h2 className="text-2xl font-bold tracking-tight text-slate-800">
  Your Listings
</h2>

// Product price (accent magenta)
<span className="text-xl font-bold tabular-nums text-[#D1148A]">
  GHS 368.42
</span>

// Order reference (monospace)
<code className="font-mono text-[13px] font-medium tracking-wide text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
  USH-20260601-A3F1
</code>

// Caption / timestamp
<p className="text-xs text-slate-400">
  Listed 3 hours ago
</p>

// Body text
<p className="text-sm text-slate-700 leading-relaxed">
  This laptop is in excellent condition — used for one semester only.
  Comes with original charger and box.
</p>
```

---

<br/>

<a name="s3"></a>

# <span style="color:#5D1A89;">3. UI Component Guidelines</span>

## <span style="color:#D1148A;">3.1 Button System</span>

All buttons use `shadcn/ui` `<Button>` with custom variant overrides. Minimum touch target: **48px height** on mobile (Rider Dashboard and checkout CTA).

### Variant Definitions

#### Primary Button — Deep Purple

Used for: "Buy Now", "List Product", "Approve Seller", "Assign Rider"

```tsx
// Visual States:
// Default:  bg-[#5D1A89] text-white
// Hover:    bg-[#4A1570] (purple-700)
// Active:   bg-[#380F57] (purple-800) scale-[0.98]
// Focus:    ring-2 ring-[#5D1A89] ring-offset-2
// Disabled: opacity-50 cursor-not-allowed

<Button
  className="
    h-12 px-6 rounded-xl
    bg-[#5D1A89] text-white font-semibold text-sm
    hover:bg-[#4A1570]
    active:bg-[#380F57] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#5D1A89] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    transition-all duration-150
    shadow-sm
  "
>
  Buy Now — GHS 368.42
</Button>
```

#### Secondary Button — Outlined Purple

Used for: "Save Draft", "Cancel", "View Storefront", "Go Back"

```tsx
// Default:  bg-white border-2 border-[#5D1A89] text-[#5D1A89]
// Hover:    bg-[#F3EDF9] (purple-50)
// Active:   bg-[#E7DBEF] (purple-100)
// Disabled: border-slate-300 text-slate-400

<Button
  variant="outline"
  className="
    h-12 px-6 rounded-xl
    bg-white border-2 border-[#5D1A89] text-[#5D1A89] font-semibold text-sm
    hover:bg-[#F3EDF9]
    active:bg-[#E7DBEF] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#5D1A89] focus-visible:ring-offset-2
    disabled:border-slate-300 disabled:text-slate-400 disabled:pointer-events-none
    transition-all duration-150
  "
>
  Save Draft
</Button>
```

#### Accent Button — Magenta

Used for: "Share Storefront", promotional CTAs, "Verified Student" application

```tsx
// Default:  bg-[#D1148A] text-white
// Hover:    bg-[#A80E6E] (magenta-600)
// Active:   bg-[#800B54] (magenta-700)

<Button
  className="
    h-12 px-6 rounded-xl
    bg-[#D1148A] text-white font-semibold text-sm
    hover:bg-[#A80E6E]
    active:bg-[#800B54] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#D1148A] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    transition-all duration-150
    shadow-sm
  "
>
  Share My Storefront
</Button>
```

#### Destructive Button — Red

Used for: "Delete Listing", "Reject Seller KYC", "Mark Disputed"

```tsx
// Default:  bg-[#DC2626] text-white   (NOT brand-red #FF0000 — too harsh)
// Hover:    bg-[#B91C1C]
// Active:   bg-[#991B1B]

<Button
  variant="destructive"
  className="
    h-12 px-6 rounded-xl
    bg-[#DC2626] text-white font-semibold text-sm
    hover:bg-[#B91C1C]
    active:bg-[#991B1B] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    transition-all duration-150
  "
>
  Delete Listing
</Button>
```

#### Ghost Button

Used for: "Cancel", inline actions, icon-only nav items

```tsx
<Button
  variant="ghost"
  className="
    h-10 px-4 rounded-lg
    text-slate-600 font-medium text-sm
    hover:bg-slate-100 hover:text-slate-900
    active:bg-slate-200 active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#5D1A89] focus-visible:ring-offset-2
    transition-all duration-150
  "
>
  Cancel
</Button>
```

### Button Sizes

| Size | Class | Height | Use |
|---|---|---|---|
| **XS** | `h-7 px-3 text-xs rounded-md` | 28px | Inline actions, table row buttons |
| **SM** | `h-9 px-4 text-sm rounded-lg` | 36px | Card CTAs, secondary actions |
| **MD** (default) | `h-11 px-5 text-sm rounded-xl` | 44px | Standard buttons |
| **LG** | `h-12 px-6 text-base rounded-xl` | 48px | Primary page CTA — **minimum on mobile** |
| **XL** | `h-14 px-8 text-base rounded-2xl` | 56px | Hero CTA (homepage, onboarding) |
| **Full** | `w-full h-12 rounded-xl` | 48px | Mobile checkout, full-width mobile CTAs |

---

## <span style="color:#D1148A;">3.2 Forms & Input Fields</span>

### Input Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ Label text (text-sm font-medium text-slate-700)         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Placeholder or entered value (text-sm text-slate-9)│ │
│ └─────────────────────────────────────────────────────┘ │
│   border-slate-300  →  focus: border-[#5D1A89]          │
│                                                         │
│ Helper text (text-xs text-slate-500)                    │
│ or Error text (text-xs text-red-600 flex gap-1)         │
└─────────────────────────────────────────────────────────┘
```

### Input States — Tailwind Classes

```tsx
// Base input (all states share this foundation)
const inputBase = `
  w-full h-11 px-3.5 py-2.5
  rounded-xl
  bg-white
  border border-slate-300
  text-sm text-slate-900 placeholder:text-slate-400
  transition-all duration-150
  outline-none
`

// ── Resting state ─────────────────────────────────────────────────
// border-slate-300 bg-white

// ── Focus state ───────────────────────────────────────────────────
// border-[#5D1A89] ring-2 ring-[#5D1A89]/20
// (ring is 20% opacity purple — soft glow)

// ── Filled (valid) state ─────────────────────────────────────────
// border-slate-400 bg-white (no ring)

// ── Error state ───────────────────────────────────────────────────
// border-red-500 ring-2 ring-red-500/20 bg-red-50

// ── Disabled state ────────────────────────────────────────────────
// border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed

// Full component:
<div className="flex flex-col gap-1.5">
  <Label htmlFor="price" className="text-sm font-medium text-slate-700">
    Your asking price (GHS)
  </Label>
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
      GHS
    </span>
    <Input
      id="price"
      type="number"
      placeholder="0.00"
      className="
        pl-12 h-11 rounded-xl
        border-slate-300
        focus:border-[#5D1A89] focus:ring-2 focus:ring-[#5D1A89]/20
        aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-2
        aria-[invalid=true]:ring-red-500/20 aria-[invalid=true]:bg-red-50
        transition-all duration-150
      "
    />
  </div>
  {/* Dynamic preview — gross-up price */}
  <p className="text-xs text-slate-500">
    Buyers will see:{" "}
    <span className="font-semibold text-[#D1148A]">GHS 368.42</span>
  </p>
  {/* Error message */}
  {error && (
    <p className="flex items-center gap-1 text-xs text-red-600" role="alert">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {error}
    </p>
  )}
</div>
```

### Special Input: OTP 4-Digit Boxes (Rider Dashboard)

```tsx
// Large, mobile-optimised OTP input
// Each box: 60×64px minimum, numeric keyboard, auto-advance

<div className="flex items-center gap-3 justify-center" role="group" aria-label="Delivery OTP">
  {[0, 1, 2, 3].map((i) => (
    <input
      key={i}
      type="text"
      inputMode="numeric"
      pattern="[0-9]"
      maxLength={1}
      className="
        w-16 h-16
        rounded-2xl
        border-2 border-slate-300
        bg-white
        text-center text-2xl font-bold font-mono text-slate-900
        focus:border-[#5D1A89] focus:ring-4 focus:ring-[#5D1A89]/20
        focus:outline-none
        data-[state=success]:border-green-500 data-[state=success]:bg-green-50
        data-[state=error]:border-red-500 data-[state=error]:bg-red-50
        transition-all duration-150
        shadow-sm
      "
    />
  ))}
</div>
```

### Select & Dropdown

```tsx
<Select>
  <SelectTrigger
    className="
      h-11 rounded-xl
      border-slate-300
      focus:ring-2 focus:ring-[#5D1A89]/20 focus:border-[#5D1A89]
      text-sm
    "
  >
    <SelectValue placeholder="Select campus" />
  </SelectTrigger>
  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
    <SelectItem value="gctu" className="text-sm focus:bg-[#F3EDF9] focus:text-[#5D1A89]">
      GCTU — Tesano
    </SelectItem>
    <SelectItem value="ug" className="text-sm focus:bg-[#F3EDF9] focus:text-[#5D1A89]">
      University of Ghana — Legon
    </SelectItem>
  </SelectContent>
</Select>
```

### Form Validation Pattern

```tsx
// Error state pattern — consistent across all forms
{errors.price && (
  <div
    role="alert"
    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200"
  >
    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
    <p className="text-xs text-red-700 font-medium">{errors.price.message}</p>
  </div>
)}
```

---

## <span style="color:#D1148A;">3.3 Cards</span>

### Product Listing Card (Browse Grid)

The primary UI element buyers interact with. Optimised for a 2-column grid on 360px mobile (each card ≈ 164px wide).

```tsx
// Anatomy:
// ┌─────────────────────────┐
// │  [Image]  16:9 aspect   │
// │  Status badge (sold)    │
// ├─────────────────────────┤
// │  Product Title          │
// │  Condition chip         │
// │  GHS 368.42  (magenta)  │
// │  Kofi · GCTU 📍         │
// └─────────────────────────┘

<div
  className="
    group
    flex flex-col
    rounded-2xl
    bg-white
    border border-slate-200
    shadow-sm
    hover:shadow-md hover:border-[#CEB6DF]
    active:scale-[0.98]
    transition-all duration-200
    overflow-hidden
    cursor-pointer
  "
>
  {/* Image container */}
  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
    <Image
      src={imageUrl}
      alt={title}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      sizes="(max-width: 768px) 50vw, 25vw"
    />
    {/* Sold overlay */}
    {status === "SOLD" && (
      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
        <span className="text-white text-sm font-bold tracking-wide uppercase">Sold</span>
      </div>
    )}
    {/* Condition badge */}
    <div className="absolute top-2 left-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/90 text-slate-700 shadow-sm">
        {condition}
      </span>
    </div>
  </div>

  {/* Content */}
  <div className="p-3 flex flex-col gap-1.5">
    <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
      {title}
    </p>
    <p className="text-lg font-bold tabular-nums text-[#D1148A]">
      GHS {listingPrice}
    </p>
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="font-medium text-[#5D1A89]">{sellerHandle}</span>
      <span>·</span>
      <span>{campus}</span>
    </div>
  </div>
</div>
```

**Card tokens:**

| Property | Value | Tailwind |
|---|---|---|
| Border radius | 16px | `rounded-2xl` |
| Border (default) | `#E2E8F0` | `border border-slate-200` |
| Border (hover) | `#CEB6DF` (purple-200) | `hover:border-[#CEB6DF]` |
| Shadow (default) | `0 1px 3px rgba(0,0,0,0.08)` | `shadow-sm` |
| Shadow (hover) | `0 4px 12px rgba(0,0,0,0.10)` | `hover:shadow-md` |
| Background | `#FFFFFF` | `bg-white` |
| Inner padding | 12px | `p-3` |
| Image aspect | 4:3 | `aspect-[4/3]` |

### Rider Dashboard Order Card

Optimised for large touch targets and quick scanning at a glance. Minimum height: **80px**.

```tsx
<div
  className="
    flex items-center gap-3
    p-4
    rounded-2xl
    bg-white
    border border-slate-200
    shadow-sm
    active:scale-[0.99] active:bg-slate-50
    transition-all duration-150
    cursor-pointer
    min-h-[80px]
  "
>
  {/* Status indicator stripe */}
  <div className="w-1 self-stretch rounded-full bg-blue-400 flex-shrink-0" />

  {/* Order info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-semibold text-slate-900 truncate">{productTitle}</p>
      <StatusBadge status={status} />
    </div>
    <p className="text-xs text-slate-500 mt-0.5">{buyerFirstName} · {deliveryZone}</p>
    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{orderReference}</p>
  </div>

  {/* Chevron */}
  <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
</div>
```

### Admin KYC Review Card

```tsx
<div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
  {/* Header */}
  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-slate-900">{sellerName}</p>
      <p className="text-xs text-slate-500">{email} · Submitted {timeAgo}</p>
    </div>
    <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      Pending Review
    </span>
  </div>
  {/* Body */}
  <div className="p-4 grid grid-cols-2 gap-3">
    <KycDocumentPreview label="Student ID" s3Key={docKey} />
  </div>
  {/* Actions */}
  <div className="px-4 py-3 border-t border-slate-200 flex gap-2">
    <Button className="flex-1 h-10 rounded-xl bg-[#5D1A89] text-white text-sm font-semibold hover:bg-[#4A1570]">
      Approve
    </Button>
    <Button variant="outline" className="flex-1 h-10 rounded-xl border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50">
      Reject
    </Button>
  </div>
</div>
```

---

## <span style="color:#D1148A;">3.4 Badges & Chips</span>

```tsx
// Seller tier badge — Verified Student
<span className="
  inline-flex items-center gap-1
  px-2.5 py-0.5
  rounded-full
  bg-[#F3EDF9] text-[#5D1A89]
  text-[11px] font-semibold
  border border-[#CEB6DF]
">
  <ShieldCheck className="h-3 w-3" />
  Verified Student
</span>

// Verified Business
<span className="
  inline-flex items-center gap-1
  px-2.5 py-0.5 rounded-full
  bg-[#FDF0F8] text-[#D1148A]
  text-[11px] font-semibold
  border border-[#F2A3D5]
">
  <BadgeCheck className="h-3 w-3" />
  Verified Business
</span>

// Order status badge (example — IN_TRANSIT)
<span className="
  px-2.5 py-0.5 rounded-full
  bg-blue-100 text-blue-700
  text-[11px] font-semibold
  border border-blue-200
">
  In Transit
</span>
```

---

<br/>

<a name="s4"></a>

# <span style="color:#5D1A89;">4. Layout & Spacing — Mobile-First</span>

## <span style="color:#D1148A;">4.1 Spacing Scale (4pt Grid)</span>

Tailwind's default scale is 4px per unit. **Every spacing decision must be a multiple of 4px.** Never use arbitrary values for spacing (e.g., `mt-[7px]` is forbidden; use `mt-2` = 8px instead).

| Token | px | rem | Common Use |
|---|---|---|---|
| `space-1` | 4px | 0.25rem | Icon-to-label gap, badge inner padding |
| `space-2` | 8px | 0.5rem | Between related elements (label + input), chip gap |
| `space-3` | 12px | 0.75rem | Card inner padding (compact), list item gap |
| `space-4` | 16px | 1rem | Standard section padding, card body padding |
| `space-5` | 20px | 1.25rem | Between form fields |
| `space-6` | 24px | 1.5rem | Section gap on mobile, button vertical rhythm |
| `space-8` | 32px | 2rem | Major section separation, top padding on content areas |
| `space-10` | 40px | 2.5rem | Hero section padding |
| `space-12` | 48px | 3rem | Page top padding, large section gaps |
| `space-16` | 64px | 4rem | Full-page section spacing (desktop only) |

---

## <span style="color:#D1148A;">4.2 Container Constraints</span>

| Breakpoint | Min Width | Container | Columns | Gutter |
|---|---|---|---|---|
| **Mobile (default)** | 360px | `w-full px-4` | 2 | 8px (`gap-2`) |
| **Mobile Wide** | `sm: 480px` | `w-full px-4` | 2 | 12px (`gap-3`) |
| **Tablet** | `md: 768px` | `max-w-2xl mx-auto px-6` | 3 | 16px (`gap-4`) |
| **Desktop** | `lg: 1024px` | `max-w-5xl mx-auto px-8` | 4 | 24px (`gap-6`) |
| **Wide Desktop** | `xl: 1280px` | `max-w-6xl mx-auto px-8` | 4–5 | 24px (`gap-6`) |

```tsx
// Standard page container
<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
  {children}
</div>

// Product grid
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

---

## <span style="color:#D1148A;">4.3 Mobile Navigation Strategy</span>

**Decision: Bottom Tab Bar (not hamburger menu)**

**Rationale:** The primary audience (university students, Android users) is familiar with bottom tab navigation from Instagram, WhatsApp, and Google Maps. Bottom tabs provide one-thumb reachability on large phones and reduce tap depth to 1 for primary destinations. A hamburger menu adds unnecessary cognitive load and hides critical navigation.

### Bottom Tab Bar — Buyer / Seller

```tsx
// components/layout/BottomNav.tsx
const buyerTabs = [
  { href: "/",           icon: Home,       label: "Browse" },
  { href: "/search",     icon: Search,     label: "Search" },
  { href: "/account/orders", icon: Package, label: "Orders" },
  { href: "/account",    icon: User,       label: "Account" },
]

const sellerTabs = [
  { href: "/seller/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/seller/listings",  icon: Package2,         label: "Listings" },
  { href: "/seller/orders",    icon: ShoppingBag,      label: "Orders" },
  { href: "/account",          icon: User,             label: "Profile" },
]

<nav
  className="
    fixed bottom-0 left-0 right-0 z-50
    bg-white/95 backdrop-blur-sm
    border-t border-slate-200
    pb-safe                          /* iOS safe area */
    shadow-[0_-2px_16px_rgba(0,0,0,0.06)]
  "
  aria-label="Main navigation"
>
  <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
    {tabs.map(({ href, icon: Icon, label }) => (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px]",
          "transition-all duration-150",
          isActive(href)
            ? "text-[#5D1A89]"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-transform duration-150",
            isActive(href) && "scale-110"
          )}
          strokeWidth={isActive(href) ? 2.5 : 1.75}
        />
        <span className="text-[10px] font-semibold tracking-tight">{label}</span>
        {isActive(href) && (
          <div className="w-1 h-1 rounded-full bg-[#5D1A89] mt-0.5" />
        )}
      </Link>
    ))}
  </div>
</nav>

// Page content must have bottom padding to clear the nav bar
<main className="pb-24">{children}</main>
```

### Rider Dashboard Navigation

The Rider Dashboard has a simplified navigation — only 3 destinations. Uses the same bottom tab pattern but with teal-themed active states to visually distinguish the rider context from buyer/seller:

```tsx
const riderTabs = [
  { href: "/rider",         icon: Truck,   label: "Deliveries" },
  { href: "/rider/history", icon: History, label: "History" },
  { href: "/rider/profile", icon: User,    label: "Profile" },
]
// Active color: text-[#0F766E] (teal-700) — contextually distinguishes rider mode
```

### Admin Navigation — Sidebar on Desktop, Bottom Sheet on Mobile

Admin is primarily accessed on desktop (management tasks). On mobile (tablet min), a collapsible sidebar. On 360px mobile (fallback only — admin is not a mobile-primary role), a hamburger + full-screen drawer.

```tsx
// Mobile: Sheet (shadcn/ui)
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="lg:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-72 p-0">
    <AdminSidebarContent />
  </SheetContent>
</Sheet>

// Desktop: fixed sidebar
<aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 border-r border-slate-200 bg-white">
  <AdminSidebarContent />
</aside>
```

---

## <span style="color:#D1148A;">4.4 Safe Area Handling (iOS + Android Notch)</span>

```css
/* globals.css */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
.pt-safe {
  padding-top: env(safe-area-inset-top);
}
```

```typescript
// tailwind.config.ts — add to theme.extend
{
  padding: {
    safe: "env(safe-area-inset-bottom)",
  },
}
```

---

<br/>

<a name="s5"></a>

# <span style="color:#5D1A89;">5. Developer Implementation</span>

## <span style="color:#D1148A;">5.1 `globals.css` — CSS Variables (shadcn/ui Theme)</span>

This is the authoritative mapping of U-Shop brand colors to the shadcn/ui CSS variable system. All values are in HSL format **without** the `hsl()` wrapper, as required by shadcn/ui.

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Google Fonts ──────────────────────────────────────────────── */
/* Loaded via next/font/google in app/layout.tsx */

/* ── shadcn/ui CSS Variable Override ─────────────────────────── */
@layer base {
  :root {
    /* ── Backgrounds ──────────────────────────────────── */
    --background:             210 40% 98%;   /* slate-50  #F8FAFC */
    --foreground:             222 47% 11%;   /* slate-900 #0F172A */

    /* ── Card ─────────────────────────────────────────── */
    --card:                   0 0% 100%;     /* white */
    --card-foreground:        222 47% 11%;   /* slate-900 */

    /* ── Popover ──────────────────────────────────────── */
    --popover:                0 0% 100%;
    --popover-foreground:     222 47% 11%;

    /* ── Primary — Deep Purple #5D1A89 ────────────────── */
    --primary:                276 68% 32%;
    --primary-foreground:     0 0% 100%;     /* white text on purple */

    /* ── Secondary — Magenta #D1148A ──────────────────── */
    --secondary:              323 83% 45%;
    --secondary-foreground:   0 0% 100%;     /* white text on magenta */

    /* ── Muted ────────────────────────────────────────── */
    --muted:                  210 40% 96%;   /* slate-100 */
    --muted-foreground:       215 16% 47%;   /* slate-500 */

    /* ── Accent (Magenta, lighter context) ────────────── */
    --accent:                 323 83% 97%;   /* magenta-50 #FDF0F8 */
    --accent-foreground:      323 83% 35%;   /* dark magenta text */

    /* ── Destructive — Error Red ──────────────────────── */
    --destructive:            0 72% 51%;     /* #DC2626 */
    --destructive-foreground: 0 0% 100%;

    /* ── Border & Input ───────────────────────────────── */
    --border:                 214 32% 91%;   /* slate-200 */
    --input:                  214 32% 91%;   /* slate-200 */

    /* ── Ring (focus indicator) ── Deep Purple ────────── */
    --ring:                   276 68% 32%;   /* #5D1A89 */

    /* ── Border Radius ────────────────────────────────── */
    --radius:                 0.75rem;       /* 12px — rounded-xl */

    /* ── Chart Colors ─────────────────────────────────── */
    --chart-1:                276 68% 32%;   /* purple */
    --chart-2:                323 83% 45%;   /* magenta */
    --chart-3:                142 76% 36%;   /* green/success */
    --chart-4:                32 95% 44%;    /* amber/warning */
    --chart-5:                0 72% 51%;     /* red/error */
  }

  /* ── Dark Mode ─────────────────────────────────────────────── */
  .dark {
    --background:             222 47% 7%;    /* near-black with purple tint */
    --foreground:             210 40% 98%;   /* near-white */

    --card:                   222 47% 10%;
    --card-foreground:        210 40% 98%;

    --popover:                222 47% 10%;
    --popover-foreground:     210 40% 98%;

    --primary:                276 58% 65%;   /* lighter purple for dark bg */
    --primary-foreground:     222 47% 7%;    /* dark text on light purple */

    --secondary:              323 70% 65%;   /* lighter magenta */
    --secondary-foreground:   222 47% 7%;

    --muted:                  215 25% 18%;
    --muted-foreground:       215 20% 65%;

    --accent:                 276 40% 18%;   /* dark purple tint */
    --accent-foreground:      276 58% 80%;

    --destructive:            0 65% 55%;
    --destructive-foreground: 0 0% 100%;

    --border:                 215 25% 18%;
    --input:                  215 25% 18%;

    --ring:                   276 58% 65%;
  }
}

/* ── U-Shop Custom Properties ─────────────────────────────────── */
@layer base {
  :root {
    /* Brand triplet — raw for use in inline styles / gradients */
    --brand-red:              0 100% 50%;    /* #FF0000 */
    --brand-purple:           276 68% 32%;   /* #5D1A89 */
    --brand-magenta:          323 83% 45%;   /* #D1148A */

    /* Semantic state colors */
    --color-success:          142 76% 36%;   /* #16A34A */
    --color-success-subtle:   142 76% 93%;
    --color-warning:          32 95% 44%;    /* #D97706 */
    --color-warning-subtle:   32 95% 92%;
    --color-error:            0 72% 51%;     /* #DC2626 */
    --color-error-subtle:     0 72% 95%;
    --color-info:             221 83% 53%;   /* #2563EB */
    --color-info-subtle:      221 83% 95%;

    /* Font families */
    --font-sans:              "Plus Jakarta Sans", system-ui, sans-serif;
    --font-mono:              "JetBrains Mono", ui-monospace, monospace;
  }
}

/* ── Base Resets & Defaults ───────────────────────────────────── */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    /* Plus Jakarta Sans numeric features */
  }

  /* Smooth focus transitions — all interactive elements */
  button, input, select, textarea, a {
    @apply transition-shadow duration-150;
  }

  /* Tabular numerals on price elements */
  [data-price], .price {
    font-feature-settings: "tnum";
  }
}

/* ── Safe area utilities ──────────────────────────────────────── */
@layer utilities {
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
  .pt-safe { padding-top:    env(safe-area-inset-top); }
  .pl-safe { padding-left:   env(safe-area-inset-left); }
  .pr-safe { padding-right:  env(safe-area-inset-right); }
}

/* ── Skeleton loader animation ───────────────────────────────── */
@layer utilities {
  .skeleton {
    @apply relative overflow-hidden bg-slate-200 rounded;
  }
  .skeleton::after {
    content: "";
    @apply absolute inset-0;
    background: linear-gradient(
      90deg,
      transparent 25%,
      rgba(255,255,255,0.5) 50%,
      transparent 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
}
```

---

## <span style="color:#D1148A;">5.2 `tailwind.config.ts` — Full Configuration</span>

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config: Config = {
  darkMode: ["class"],

  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],

  theme: {
    // ── Container ─────────────────────────────────────────────────
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",    // 16px on mobile
        sm:      "1rem",
        md:      "1.5rem",  // 24px on tablet
        lg:      "2rem",    // 32px on desktop
        xl:      "2rem",
      },
      screens: {
        sm:  "480px",
        md:  "768px",
        lg:  "1024px",
        xl:  "1280px",
        "2xl": "1400px",
      },
    },

    extend: {
      // ── Brand Colors ───────────────────────────────────────────
      colors: {
        // Brand triplet
        "brand-red":     "#FF0000",
        "brand-purple":  "#5D1A89",
        "brand-magenta": "#D1148A",

        // Purple scale (complements Deep Purple brand color)
        purple: {
          50:  "#F3EDF9",
          100: "#E7DBEF",
          200: "#CEB6DF",
          300: "#A880C2",
          400: "#8552A8",
          500: "#6E3099",
          600: "#5D1A89",  // ← Brand Purple
          700: "#4A1570",
          800: "#380F57",
          900: "#240A3A",
        },

        // Magenta scale (complements Magenta brand color)
        magenta: {
          50:  "#FDF0F8",
          100: "#FAD6EE",
          200: "#F2A3D5",
          300: "#E878BE",
          400: "#DC4CA7",
          500: "#D1148A",  // ← Brand Magenta
          600: "#A80E6E",
          700: "#800B54",
          800: "#590839",
          900: "#33041F",
        },

        // shadcn/ui CSS variable bridge
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      // ── Typography ─────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-jakarta)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },

      // ── Font Sizes (augment Tailwind defaults) ─────────────────
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],     // 11px
        xs:    ["0.75rem",   { lineHeight: "1.125rem" }], // 12px
        sm:    ["0.875rem",  { lineHeight: "1.375rem" }], // 14px
        base:  ["1rem",      { lineHeight: "1.625rem" }], // 16px
        lg:    ["1.125rem",  { lineHeight: "1.75rem" }],  // 18px
        xl:    ["1.25rem",   { lineHeight: "1.875rem" }], // 20px
        "2xl": ["1.5rem",    { lineHeight: "2rem" }],     // 24px
        "3xl": ["1.875rem",  { lineHeight: "2.25rem" }],  // 30px
        "4xl": ["2.25rem",   { lineHeight: "2.5rem" }],   // 36px
      },

      // ── Border Radius ──────────────────────────────────────────
      borderRadius: {
        "none": "0",
        "sm":   "0.375rem",   // 6px  — badges, chips
        "md":   "0.5rem",     // 8px  — small buttons, tags
        "lg":   "0.75rem",    // 12px — default inputs, toast
        "xl":   "1rem",       // 16px — cards, standard buttons
        "2xl":  "1.25rem",    // 20px — large cards, sheet
        "3xl":  "1.5rem",     // 24px — modals, OTP boxes
        "full": "9999px",     // pills, badges
      },

      // ── Box Shadow ─────────────────────────────────────────────
      boxShadow: {
        "card":      "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover":"0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)",
        "button":    "0 1px 2px 0 rgba(0,0,0,0.08)",
        "nav":       "0 -2px 16px 0 rgba(0,0,0,0.06)",
        "modal":     "0 20px 60px -10px rgba(0,0,0,0.25)",
        "inner-sm":  "inset 0 1px 2px 0 rgba(0,0,0,0.05)",
        // Purple glow — for primary CTA focus
        "purple-glow": "0 0 0 3px rgba(93,26,137,0.20)",
        // Magenta glow — for accent element focus
        "magenta-glow": "0 0 0 3px rgba(209,20,138,0.20)",
      },

      // ── Animation ──────────────────────────────────────────────
      keyframes: {
        // Accordion (shadcn/ui)
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        // Slide in from bottom (mobile sheet, bottom nav)
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        // OTP error shake
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":      { transform: "translateX(-6px)" },
          "40%":      { transform: "translateX(6px)" },
          "60%":      { transform: "translateX(-4px)" },
          "80%":      { transform: "translateX(4px)" },
        },
        // Shimmer (skeleton loader)
        "shimmer": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        // Scale pulse (OTP success)
        "success-pop": {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "slide-up":        "slide-up 0.3s cubic-bezier(0.32,0.72,0,1)",
        "shake":           "shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97)",
        "shimmer":         "shimmer 1.5s linear infinite",
        "success-pop":     "success-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      },

      // ── Screens — Mobile-First ────────────────────────────────
      screens: {
        "xs": "360px",   // Minimum design target (Android 360px)
        "sm": "480px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1440px",
      },

      // ── Spacing additions ─────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",  // 18px — between h5/h6 and content
        "13":  "3.25rem",   // 52px — specific to OTP box sizing
        "15":  "3.75rem",   // 60px — OTP digit box dimension
        "18":  "4.5rem",    // 72px — bottom nav height
        "22":  "5.5rem",    // 88px — page header height
        "safe": "env(safe-area-inset-bottom)",
      },
    },
  },

  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),   // For product descriptions
    require("@tailwindcss/line-clamp"),   // For card title truncation
  ],
}

export default config
```

---

## <span style="color:#D1148A;">5.3 `components.json` — shadcn/ui Configuration</span>

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## <span style="color:#D1148A;">5.4 `cn()` Utility</span>

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## <span style="color:#D1148A;">5.5 Status Badge Component</span>

```tsx
// components/ui/StatusBadge.tsx
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@prisma/client"

const STATUS_CONFIG: Record<OrderStatus, {
  label:  string
  classes: string
}> = {
  PENDING_COD:     { label: "Pending COD",    classes: "bg-amber-100 text-amber-800 border-amber-200" },
  PAID:            { label: "Paid",           classes: "bg-blue-100 text-blue-800 border-blue-200" },
  PROCESSING:      { label: "Processing",     classes: "bg-amber-100 text-amber-800 border-amber-200" },
  READY_FOR_PICKUP:{ label: "Ready",          classes: "bg-orange-100 text-orange-800 border-orange-200" },
  IN_TRANSIT:      { label: "In Transit",     classes: "bg-blue-100 text-blue-800 border-blue-200" },
  DELIVERED:       { label: "Delivered",      classes: "bg-green-100 text-green-800 border-green-200" },
  COMPLETED:       { label: "Completed",      classes: "bg-green-100 text-green-900 border-green-300" },
  DISPUTED:        { label: "Disputed",       classes: "bg-red-100 text-red-800 border-red-200" },
  CANCELLED:       { label: "Cancelled",      classes: "bg-slate-100 text-slate-600 border-slate-200" },
}

export function StatusBadge({ status, className }: {
  status: OrderStatus
  className?: string
}) {
  const { label, classes } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "text-[11px] font-semibold border",
        "whitespace-nowrap",
        classes,
        className
      )}
    >
      {label}
    </span>
  )
}
```

---

<br/>

<a name="s6"></a>

# <span style="color:#5D1A89;">6. Iconography & Imagery</span>

## <span style="color:#D1148A;">6.1 Icon Library — Lucide React</span>

`lucide-react` is the standard icon library (bundled with shadcn/ui). All icons are stroke-based SVGs — consistent, scalable, tree-shakeable.

```bash
pnpm add lucide-react  # Already included with shadcn/ui
```

**Usage standards:**

| Context | Size | Stroke Width | Color |
|---|---|---|---|
| Bottom nav (inactive) | `h-5 w-5` (20px) | `strokeWidth={1.75}` | `text-slate-500` |
| Bottom nav (active) | `h-5 w-5` | `strokeWidth={2.5}` | `text-[#5D1A89]` |
| Button icon (leading) | `h-4 w-4` (16px) | `strokeWidth={2}` | Inherits button text color |
| Card action icon | `h-4 w-4` | `strokeWidth={2}` | `text-slate-500` |
| Status icon (success) | `h-5 w-5` | `strokeWidth={2}` | `text-green-600` |
| OTP success | `h-12 w-12` (48px) | `strokeWidth={1.5}` | `text-green-500` |
| Empty state | `h-16 w-16` (64px) | `strokeWidth={1}` | `text-slate-300` |

**Key icons used in U-Shop:**

```tsx
import {
  ShoppingBag,     // Orders, cart
  Package,         // Listings, seller items
  Package2,        // Seller dashboard listings tab
  Truck,           // Rider dashboard, dispatch
  ShieldCheck,     // Verified badge
  BadgeCheck,      // Verified Business
  CheckCircle2,    // Delivered/Completed success
  AlertCircle,     // Error/validation
  AlertTriangle,   // Warning/disputed
  Info,            // Informational
  ChevronRight,    // List item navigation
  Search,          // Product search
  SlidersHorizontal, // Filter
  QrCode,          // OTP input section
  MapPin,          // Campus location
  Phone,           // Rider phone (IN_TRANSIT)
  CircleDollarSign, // Price/commission
  BarChart3,       // Admin analytics
  Users,           // Admin user management
  Settings,        // Admin settings
  LogOut,          // Sign out
} from "lucide-react"
```

---

## <span style="color:#D1148A;">6.2 Product Image Guidelines</span>

| Property | Requirement |
|---|---|
| Upload formats | JPEG, PNG, WEBP |
| Max upload size | 5 MB per image |
| Max images per listing | 5 |
| Server-side processing | Resize to max 1200px wide, convert to WebP, quality 82 (via `sharp`) |
| Aspect ratio displayed | 4:3 (product cards), 1:1 (thumbnail fallback) |
| `next/image` sizes | `(max-width: 768px) 50vw, 25vw` |
| Placeholder | `blur` with a purple-tinted base64 blurDataURL |
| Alt text | Required: `{product.title} — {condition} — listed by {seller.storeName}` |

**Empty state (no image):**
```tsx
<div className="aspect-[4/3] bg-slate-100 rounded-xl flex items-center justify-center">
  <Package className="h-10 w-10 text-slate-300" strokeWidth={1} />
</div>
```

---

<br/>

<a name="s7"></a>

# <span style="color:#5D1A89;">7. Motion & Interaction</span>

## <span style="color:#D1148A;">7.1 Motion Principles</span>

U-Shop targets low-end Android devices (Tecno, Infinix, Samsung A-series). Heavy animations consume GPU and cause jank. **Motion must be purposeful, fast, and respectful of `prefers-reduced-motion`.**

| Principle | Rule |
|---|---|
| **Duration** | Interactive responses: 100–150ms. Page transitions: 200–300ms. Never > 400ms for UI feedback. |
| **Easing** | Buttons/badges: `ease-out` (feels snappy). Sheets/modals: `cubic-bezier(0.32, 0.72, 0, 1)` (natural deceleration). |
| **Reduced motion** | All animations must wrap with `@media (prefers-reduced-motion: reduce)` fallback or use `motion-safe:` Tailwind prefix. |
| **Scale transforms** | Use `scale-[0.98]` on active buttons (tactile press feel). Never scale cards on hover on mobile (causes scroll confusion). |

```css
/* globals.css — reduced motion override */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## <span style="color:#D1148A;">7.2 Key Micro-Interactions</span>

| Interaction | Animation | Duration | Class |
|---|---|---|---|
| Button press | `scale-[0.98]` | 100ms | `active:scale-[0.98] transition-transform duration-100` |
| OTP input correct | Green fill + `success-pop` scale | 350ms | `animate-success-pop` |
| OTP input wrong | Red fill + `shake` | 400ms | `animate-shake` |
| Product card hover | Image `scale-105` | 300ms | `group-hover:scale-105 transition-transform duration-300` |
| Bottom sheet open | `slide-up` | 300ms | `animate-slide-up` |
| Skeleton → content | `opacity-0` → `opacity-100` fade | 200ms | `animate-in fade-in duration-200` |
| Toast notification | Slide in from bottom-right | 250ms | shadcn/ui Sonner default |

---

<br/>

<a name="s8"></a>

# <span style="color:#5D1A89;">8. Accessibility Standards</span>

## <span style="color:#D1148A;">8.1 Colour Contrast Requirements (WCAG 2.1 AA)</span>

All text must meet minimum contrast ratios: **4.5:1** for normal text, **3:1** for large text (≥18px regular or ≥14px bold).

| Foreground | Background | Ratio | Usage | Pass/Fail |
|---|---|---|---|---|
| White `#FFFFFF` | Brand Purple `#5D1A89` | **8.2:1** | Primary button text | ✅ AA + AAA |
| White `#FFFFFF` | Magenta `#D1148A` | **4.8:1** | Accent button text | ✅ AA |
| White `#FFFFFF` | Error `#DC2626` | **5.3:1** | Destructive button text | ✅ AA |
| `slate-900 #0F172A` | White `#FFFFFF` | **19.6:1** | Body text | ✅ AAA |
| `slate-700 #334155` | White `#FFFFFF` | **10.7:1** | Heading text | ✅ AAA |
| `slate-500 #64748B` | White `#FFFFFF` | **5.7:1** | Caption / secondary text | ✅ AA |
| Magenta `#D1148A` | White `#FFFFFF` | **4.8:1** | Price display | ✅ AA |
| Purple `#5D1A89` | White `#FFFFFF` | **8.2:1** | Links, active nav | ✅ AAA |
| `amber-800` | `amber-100` | **7.4:1** | Warning badge text | ✅ AAA |
| `red-800` | `red-100` | **8.9:1** | Error badge text | ✅ AAA |

> ⚠️ **Do not use** Brand Red `#FF0000` as text on white — its contrast ratio is only **3.9:1** (fails AA for body text). It is reserved for the logo mark only.

## <span style="color:#D1148A;">8.2 Required ARIA Attributes</span>

```tsx
// OTP input group
<div role="group" aria-label="4-digit delivery OTP" aria-describedby="otp-help">
  {/* inputs */}
</div>
<p id="otp-help" className="sr-only">
  Enter the 4-digit code from your email. The rider will ask for this at your door.
</p>

// Status badge
<span role="status" aria-label={`Order status: ${statusLabel}`}>
  <StatusBadge status={status} />
</span>

// Error messages
<p role="alert" aria-live="assertive" className="text-xs text-red-600">
  {errorMessage}
</p>

// Product card (interactive)
<div
  role="article"
  aria-label={`${title} — GHS ${listingPrice} — ${condition}`}
  tabIndex={0}
  onKeyDown={(e) => e.key === "Enter" && router.push(`/products/${id}`)}
>
```

## <span style="color:#D1148A;">8.3 Focus Management</span>

```css
/* Ensure visible focus ring on all interactive elements */
/* Never remove outline without providing an alternative */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default browser outline — we provide our own */
*:focus:not(:focus-visible) {
  outline: none;
}
```

---

<br/>

<div align="center">

<p style="color:#94A3B8;font-style:italic;">— End of Document —</p>
<p style="color:#94A3B8;font-style:italic;font-size:0.85em;">U-Shop Design System v1.0 &nbsp;·&nbsp; Author: Richard Nuhu &nbsp;·&nbsp; ushopgh.com &nbsp;·&nbsp; Design Reference &nbsp;·&nbsp; Confidential</p>
<br/>
<span style="background:#FF0000;color:#FFFFFF;padding:2px 10px;font-weight:900;border-radius:3px;">U</span>&nbsp;<span style="color:#5D1A89;font-weight:900;">sh</span><span style="color:#D1148A;font-weight:900;">op</span>

</div>
