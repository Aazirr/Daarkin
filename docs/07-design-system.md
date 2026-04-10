# Design System

## Color Palette

The Job Application Tracker uses a modern, luxurious dark theme designed for focused, distraction-free work sessions.

### Core Colors

| Token | Name | Hex | RGB | Usage |
|-------|------|-----|-----|-------|
| `blackBean` | Black Bean | `#1A0F0F` | `26, 15, 15` | Primary background, base layer |
| `oxblood` | Oxblood Red | `#4A0E0E` | `74, 14, 14` | Secondary containers, dividers, depth |
| `gold` | Muted Champagne Gold | `#C5A059` | `197, 160, 89` | Primary CTA, accents, highlights |
| `bone` | Bone | `#E3DAC9` | `227, 218, 201` | Body text, high contrast elements |

### Semantic Usage

- **Background**: Use `blackBean` for primary surfaces and full-screen backgrounds
- **Containers**: Use `oxblood` for secondary containers, cards, and input backgrounds
- **Text**: Use `bone` for all readable text; adjust opacity for hierarchy (`bone/50`, `bone/70`, `bone/80`)
- **Interactive**: Use `gold` for buttons, links, and hover states
- **Feedback**: Use red-tinted colors for errors (`red-300`, `red-900/30`), green for success states (to be added in future phases)

### Tailwind Configuration

The palette is extended in `tailwind.config.js`:

```javascript
colors: {
  blackBean: "#1A0F0F",
  oxblood: "#4A0E0E", 
  gold: "#C5A059",
  bone: "#E3DAC9",
}
```

### CSS Variables

For broader use outside of Tailwind, CSS custom properties are available:

```css
--black-bean: #1A0F0F;
--oxblood: #4A0E0E;
--gold: #C5A059;
--bone: #E3DAC9;
```

## Typography

- **Font Family**: "Trebuchet MS", "Lucida Sans Unicode", "Segoe UI", sans-serif
- **Base Color**: `#E3DAC9` (bone)
- **Base Line Height**: 1.5 (from Tailwind defaults)

## Component Patterns

### Buttons

- **Primary (CTA)**: `bg-gold text-blackBean hover:bg-gold/90`
- **Secondary (Outline)**: `border-gold/40 text-gold hover:bg-gold/20`

### Inputs

- **Background**: `bg-blackBean`
- **Border**: `border-gold/20`
- **Focus**: `focus:border-gold/60 focus:ring-1 focus:ring-gold/30`
- **Text**: `text-bone`

### Cards

- **Background**: `bg-oxblood/40` or `bg-oxblood/50`
- **Border**: `border-oxblood/30` or `border-gold/30`
- **Hover**: `hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10`

### Status Badges

- **Background**: `bg-gold/20`
- **Border**: `border-gold/30`
- **Text**: `text-gold`

## Opacity Scale

For hierarchy and visual distinction:

- `100` - Full opacity (default)
- `90` - Slightly muted hover states
- `80` - Secondary text
- `70` - Body text alternative
- `60` - Disabled or tertiary text
- `50` - Hint or helper text 
- `40` - Very subtle dividers
- `30` - Light overlays and focus rings
- `20` - Faint backgrounds
- `15` - Very subtle fills
- `10` - Ghost backgrounds

## Future Considerations

- Will add explicit accent colors for success (green), warning (orange), and info (blue) states
- Typography scale (H1–H6, body, caption) will be formally documented when more page variety exists
- Animation and transition patterns will be added as the app grows in interactivity
