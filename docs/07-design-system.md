# Design System

## Overview

The Job Application Tracker uses a **sophisticated, professional design** with a warm cream gradient background and carefully balanced accent colors. The system combines deep slate blues with warm teal accents, creating an inviting yet powerful interface that appeals to technical professionals.

## Color Palette

| Token | Name | Hex | RGB | Purpose |
|-------|------|-----|-----|---------|
| `cream` | Cream | `#FAF9F7` | `250, 249, 247` | Gradient base background (60% of layout) |
| `slate` | Deep Slate | `#2C3E50` | `44, 62, 80` | Primary text, headers, accents |
| `teal` | Teal | `#1B8B8B` | `27, 139, 139` | Secondary accent, status, UI highlights |
| `oxblood` | Burgundy | `#4A0E0E` | `74, 14, 14` | Premium accents, gradients |
| `gold` | Muted Gold | `#C5A059` | `197, 160, 89` | Reserved for future premium features |
| `muted` | Muted Gray | `#6B7280` | `107, 114, 128` | Secondary text, descriptions |
| `charcoal` | Charcoal | `#1A1A1A` | `26, 26, 26` | Body text, high contrast |

## Background & Gradient

- **Primary**: Warm cream gradient: `linear-gradient(135deg, #FAF9F7 0%, #FCF9F6 100%)`
- **Effect**: Creates visual depth while remaining 60% of layout as breathing space
- **Purpose**: Inviting, professional backdrop that doesn't overwhelm

## Design Principles

1. **Inviting Yet Professional** — Warm gradient background feels welcoming, not corporate
2. **High Contrast & Readability** — Slate text on cream ensures accessibility
3. **Sophisticated Accents** — Teal and slate create depth without visual noise
4. **Gradient Highlights** — Strategic gradients (slate→oxblood) add premium feel
5. **Shadow Depth** — Soft shadows (`shadow-md-soft`, `shadow-lg-soft`) create layering

## Typography

- **H1 (Page Title)**: `text-5xl md:text-6xl font-bold tracking-tight` with gradient color
- **H2 (Section Header)**: `text-xl font-bold text-slate`
- **H3 (Subsection)**: `text-sm font-bold text-slate uppercase tracking-wider`
- **Body**: `text-base text-charcoal` or `text-sm text-charcoal`
- **Secondary**: `text-sm text-muted font-medium` for descriptions
- **Labels**: `text-xs font-bold uppercase tracking-widest text-slate/60`

## Component Patterns

### Form Elements

**Inputs**:
- Border: `border-slate/15`
- Background: `bg-white`
- Focus: `focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft`
- Placeholder: `placeholder:text-muted/50`

**Labels**: `font-bold text-slate` with 12px size

**Buttons**:
- Primary: `bg-gradient-to-r from-slate to-slate text-white font-bold`
- Hover: `hover:shadow-lg-soft`
- Secondary: `border-slate/20 bg-gradient-to-br from-slate/10 to-slate/5 text-slate`

### Stats Cards

- Background: `bg-gradient-to-br from-white to-slate/5`
- Border: `border-slate/10`
- Text Value: Text with gradient `bg-gradient-to-r from-slate to-oxblood bg-clip-text text-transparent`
- Shadow: `shadow-sm-soft hover:shadow-md-soft`

### Info Box

- Background: `bg-gradient-to-br from-white to-teal/5`
- Border: `border-teal/20`
- Accent Line: `h-1 w-5 bg-gradient-to-r from-teal to-slate rounded-full`
- List Items: `h-2 w-2 rounded-full bg-teal` bullets

### Article Cards

- Background: `bg-gradient-to-br from-white to-white/50`
- Border: `border-slate/10`, hover: `hover:border-slate/20`
- Status Badge: `border-teal/30 bg-gradient-to-r from-teal/10 to-slate/5 text-teal`
- Secondary text: `text-muted`

### Messages

**Success**:
- Background: `bg-gradient-to-r from-teal/10 to-slate/5`
- Border: `border-teal/30`
- Text: `text-teal font-medium`

**Error**:
- Background: `bg-gradient-to-r from-red-50 to-red-50/30`
- Border: `border-red-200`
- Text: `text-red-700 font-medium`

## Spacing & Layout

- **Container**: `max-w-7xl`
- **Page Padding**: `px-4 py-8 md:px-8`
- **Section Gaps**: `gap-10` for major sections, `gap-5` within forms
- **Card Padding**: `p-8` for primary containers, `p-5-6` for cards
- **Border Radius**: `rounded-lg` (8px) for all elements

## Responsive Grid

- **Desktop**: `md:grid-cols-[0.9fr_1.4fr]` (sidebar + main)
- **Mobile**: Single column stack
- **Stats**: `grid-cols-2` on all breakpoints

## Shadow System

- `shadow-sm-soft`: `0 1px 2px rgba(0, 0, 0, 0.05)` — Subtle lift
- `shadow-md-soft`: `0 4px 6px rgba(0, 0, 0, 0.07)` — Medium depth
- `shadow-lg-soft`: `0 10px 15px rgba(0, 0, 0, 0.08)` — Strong depth

## Color Usage Rules

- Slate dominates text (90% of visible text)
- Teal used for accents, badges, interactive elements (8%)
- Oxblood used in gradients and special highlights (2%)
- Cream/white as background canvas
- Muted gray for secondary descriptions

## CSS Custom Properties

```css
:root {
  --cream: #FAF9F7;
  --card-bg: #FFFFFF;
  --oxblood: #4A0E0E;
  --slate: #2C3E50;
  --teal: #1B8B8B;
  --gold: #C5A059;
  --silver-mist: #E8E8E8;
  --charcoal: #1A1A1A;
  --muted: #6B7280;
}
```

## Future Enhancements

- Advanced theme toggle (dark mode)
- Animation library for transitions
- Additional accent colors (green for success, orange for warning)
- Accessibility ARIA patterns
- Component library documentation
