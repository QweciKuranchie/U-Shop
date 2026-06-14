import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],

  content: [
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
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
        border:      "rgb(var(--border) / <alpha-value>)", /* fallback or raw variable use */
        input:       "rgb(var(--input) / <alpha-value>)",
        ring:        "rgb(var(--ring) / <alpha-value>)",
        background:  "rgb(var(--background) / <alpha-value>)",
        foreground:  "rgb(var(--foreground) / <alpha-value>)",

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
        display: ["var(--font-jakarta)", ...fontFamily.sans],
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
    tailwindcssAnimate,
  ],
} satisfies Config

export default config
