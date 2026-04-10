# Design System

## Overview

The Job Application Tracker uses a warm, dark palette built around deep red-tinted surfaces, premium gold accents, and restrained semantic red usage.

This system is designed to feel focused and premium during long sessions:
- Backgrounds are never cold neutral grays.
- Gold communicates interactivity and momentum.
- Red is split into quiet structure versus loud danger.
- Text uses warm off-white for comfort and harmony.

## Core Palette

| Token | Hex | Purpose |
|---|---|---|
| `surface-1` | `#0D0A0B` | App background base |
| `surface-2` | `#171112` | Cards, panels, menus |
| `surface-3` | `#221B1C` | Raised rows, secondary panels |
| `text-primary` | `#EDE8E3` | Primary text (replaces pure white) |
| `text-secondary` | `#C9BBB2` | Secondary/supporting text |
| `text-tertiary` | `#A58F87` | Muted metadata |
| `accent-gold` | `#C8922A` | Interactive accent only |
| `red-quiet` | `#8B2424` | Structural borders, rejected badge border |
| `red-danger` | `#C44040` | Destructive and danger actions only |
| `status-applied` | `#7F97BD` | Applied status |
| `status-offer` | `#3D8D78` | Offer status |

## Accent Rules

### Gold usage

Gold (`#C8922A`) is used exclusively as an interactive accent:
- Primary buttons
- Active/focused states
- Interview badge/status
- Focus outlines

Gold must not be used as a large background flood.

### Red split

Use two distinct red roles:
- `#8B2424` (quiet): structural borders and rejected badge border
- `#C44040` (loud): delete, destructive actions, danger messaging

Users should only see loud red when immediate attention is needed.

## Background Philosophy

All surfaces from `#0D0A0B` through `#221B1C` include a subtle warm-red undertone. This keeps gold and red accents cohesive instead of fighting against a cold gray base.

## Text Rules

- Primary text: `#EDE8E3`
- Never use pure white for body UI copy
- Keep headings and labels in warm off-white family for long-session comfort

## Component Mapping

### Buttons

- Primary: gold fill (`#C8922A`), dark text (`#1B1415`)
- Secondary: dark warm surface (`#21191A`) with quiet border (`#3A2A2B`)
- Danger: use `#C44040` only for destructive actions

### Status badges

- Applied: `#7F97BD`
- Interview: `#C8922A`
- Offer: `#3D8D78`
- Rejected: dark fill with `#8B2424` border

### Inputs and focus

- Input background: deep surface (`#130F10`)
- Border default: `#3A2A2B`
- Focus ring/border: `#C8922A`
- Error border: `#C44040`

## CSS Custom Properties

```css
:root {
  --surface-bg: #0D0A0B;
  --surface-card: #171112;
  --surface-raised: #221B1C;
  --surface-overlay: rgba(7, 4, 5, 0.76);

  --text-primary: #EDE8E3;
  --text-secondary: #C9BBB2;
  --text-tertiary: #A58F87;

  --border-default: #3A2A2B;
  --border-strong: #8B2424;
  --border-focus: #C8922A;
  --border-error: #C44040;

  --status-applied: #7F97BD;
  --status-interview: #C8922A;
  --status-offer: #3D8D78;
  --status-rejected: #8B2424;
}
```

## Accessibility Notes

- Maintain 4.5:1 minimum contrast for normal text against all warm dark surfaces.
- Keep touch targets at minimum 44x44px.
- Restrict high-chroma red (`#C44040`) to destructive contexts so urgency remains meaningful.
