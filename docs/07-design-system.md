# Design System

The design system for this project follows a **Breathable Luxury** aesthetic—a light, high-contrast design that feels expensive and technical while maintaining clarity and breathing room. This design is perfect for professionals and appeals to technical competence.

## Color Palette

The core palette consists of five primary colors:

### Primary Light Background

| Token | Name | Hex | RGB | Usage |
|-------|------|-----|-----|-------|
| `cloudPearl` | Cloud Pearl | `#F5F5F7` | `245, 245, 247` | Primary canvas (60% of layout), breathing space |
| `charcoal` | Charcoal | `#2C2C2C` | `44, 44, 44` | Body text, headings, high contrast |

### Accent Colors

| Token | Name | Hex | RGB | Usage |
|-------|------|-----|-----|-------|
| `oxblood` | Oxblood Red | `#4A0E0E` | `74, 14, 14` | Header accents, primary buttons, status badges (used sparingly) |
| `gold` | Muted Gold | `#C5A059` | `197, 160, 89` | Premium callouts, decorative borders, highlights (strict use) |
| `silverMist` | Silver Mist | `#E2E2E2` | `226, 226, 226` | Card borders, input backgrounds, dividers, UI elements |

### Design Principles

1. **Breathing Space** — Light background with 60% coverage creates openness
2. **Minimalist Accents** — Oxblood and Gold used only for meaningful interactions
3. **High Contrast** — Charcoal text on Cloud Pearl ensures accessibility
4. **Technical Elegance** — Clean lines, subtle shadows suggest precision
5. **Premium Simplicity** — Every color choice must justify itself

### Tailwind Configuration

The palette is extended in `tailwind.config.js`:

```javascript
colors: {
  cloudPearl: "#F5F5F7",
  charcoal: "#2C2C2C",
  oxblood: "#4A0E0E",
  gold: "#C5A059",
  silverMist: "#E2E2E2",
}
```

### CSS Variables

For broader use outside of Tailwind, CSS custom properties are available:

```css
:root {
  --cloud-pearl: #F5F5F7;
  --charcoal: #2C2C2C;
  --oxblood: #4A0E0E;
  --gold: #C5A059;
  --silver-mist: #E2E2E2;
}
```

## Semantic Usage

- **Background**: Use `cloudPearl` for primary surfaces and full-screen backgrounds
- **Text**: Use `charcoal` for all readable text; adjust opacity for hierarchy (`charcoal/70`, `charcoal/50`)
- **Containers**: Use `white` or `cloudPearl` with `border-silverMist` for cards
- **Interactive**: Use `oxblood` for buttons and key accents; `gold` strictly for premium callouts
- **Feedback**: Use red-tinted colors for errors (`red-300`, `red-50`), success states to be added in future phases

## Typography

- **Font Family**: System fonts (Segoe UI, Helvetica, Arial, sans-serif)
- **Base Color**: `charcoal` (`#2C2C2C`)
- **Base Line Height**: 1.5 (from Tailwind defaults)

## Component Patterns

### Buttons

- **Primary (CTA)**: `bg-oxblood text-white hover:bg-oxblood/90`
- **Secondary (Outline)**: `border-charcoal/20 text-charcoal/70 hover:bg-silverMist`

### Inputs

- **Background**: `bg-cloudPearl`
- **Border**: `border-silverMist`
- **Focus**: `focus:border-oxblood focus:ring-1 focus:ring-oxblood/20`
- **Text**: `text-charcoal`

### Cards

- **Background**: `bg-white` or `bg-cloudPearl`
- **Border**: `border-silverMist` (or `border-gold/30` for premium callouts)
- **Hover**: `hover:shadow-md` on interaction
- **Premium Info Box**: `border-gold/30 bg-white` with gold accent line

### Status Badges

- **Background**: `bg-oxblood/10`
- **Border**: `border-oxblood/30`
- **Text**: `text-oxblood` with `font-medium`

### Gold Callouts (Premium)

- **Accent Line**: `h-0.5 w-4 bg-gold rounded-full`
- **Label**: `text-sm font-semibold text-gold`
- **Container**: `bg-white border-gold/30`

## Typography Scale

- **H1**: `text-5xl md:text-6xl font-light`
- **H2**: `text-lg font-semibold`
- **Body**: `text-base` or `text-sm`
- **Labels**: `text-sm font-medium` or `text-xs font-semibold uppercase tracking-widest`
- **Captions**: `text-xs text-charcoal/50`

## Layout Structure

- **Container Width**: `max-w-7xl`
- **Page Padding**: `px-4 py-8 md:px-8`
- **Grid Gap**: `gap-8` for major sections, `gap-4` for form fields
- **Border Radius**: `rounded-xl` for cards, `rounded-lg` for buttons/inputs
- **Responsive**: 2-column layout on desktop (`md:grid-cols-[1fr_1.2fr]`), stacked on mobile

## Opacity Scale

For hierarchy and visual distinction:

- `100` - Full opacity (default)
- `90` - Slightly muted hover states
- `70` - Secondary text
- `50` - Tertiary text
- `40` - Subtle dividers
- `30` - Light overlays, focus rings
- `20` - Faint backgrounds
- `10` - Ghost backgrounds

## Color Distribution (60/30/10 Rule)

- **60%** — Cloud Pearl breathing space and structure
- **30%** — Charcoal text and Silver Mist UI elements  
- **10%** — Oxblood accents and Gold highlights

## Future Considerations

- Will add explicit accent colors for success (green), warning (orange), and info (blue) states
- Animation and transition patterns will be added as the app grows in interactivity
- Dark mode toggle may be added as a future enhancement
