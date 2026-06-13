# U-Shop Design System Guidelines

This document details the visual style, custom palette, layout choices, and interactive elements designed to give U-Shop a premium, modern, and engaging user experience.

---

## 🎨 Brand Palette
U-Shop features a high-fidelity, vibrant color system derived from its brand identity:

| Token | Hex Code | Usage | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Brand Purple** | `#5D1A89` | Primary actions, branding elements, gradient accents. | `bg-brand-purple`, `text-brand-purple` |
| **Brand Pink** | `#D1148A` | Highlights, badges, hover accents, gradient endpoints. | `bg-brand-pink`, `text-brand-pink` |
| **Brand Red** | `#FF0000` | Notifications, danger warnings, secondary logo accent. | `bg-brand-red`, `text-brand-red` |

### Premium Gradients
*   **Hero Gradient:** `bg-gradient-to-r from-brand-purple via-[#9b158c] to-brand-pink`
*   **Glow Backdrops:** Large, blurred radial circles positioned absolutely in the background (`bg-brand-purple/15 blur-[120px]`).

---

## ✍️ Typography
*   **Display Font:** `Outfit` (`font-display`)
    *   Used for page headings, pricing numbers, key metrics, and large titles.
    *   Style: Bold tracking-tight to extra-bold (`font-extrabold`).
*   **Body Font:** `Inter` (`font-sans`)
    *   Used for content description, tables, labels, form controls, and general text.
    *   Style: Regular (`font-normal`), medium (`font-medium`), or light (`font-light`).

---

## ✨ Glassmorphism & UI Foundations
To create a modern, sleek interface, use frosted-glass cards:

### Glassmorphic Card Mixin
*   **Background:** Semi-transparent dark slate `bg-white/5` or `bg-slate-900/60` (depending on light/dark mode)
*   **Backdrop Blur:** `backdrop-blur-md`
*   **Border:** Sleek transparent white border `border border-white/10` (or `border-slate-800/80`)
*   **Shadow:** Deep subtle shadow `shadow-2xl shadow-purple-950/20`

### Interactive States & Micro-Animations
*   **Hover Scale:** Smooth translation and scale `transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]`
*   **Interactive Glow:** On hover, enhance border color from `border-white/10` to `border-brand-pink/30`.

---

## 📏 Layout & Grids
*   **Standard Max Width:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
*   **Responsive Grids:**
    *   Product Cards: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`
    *   KPI Stats: `grid grid-cols-1 md:grid-cols-3 gap-4`
*   **Rounded Corners:** Large cards utilize `rounded-2xl` (1rem), buttons and inputs use `rounded-xl` (0.75rem).
