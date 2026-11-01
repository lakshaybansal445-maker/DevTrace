---
name: DevTrace Kinetic Intelligence
colors:
  surface: '#fbf8ff'
  surface-dim: '#d7d8ee'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ececff'
  surface-container-high: '#e5e7fd'
  surface-container-highest: '#e0e1f7'
  on-surface: '#181b2a'
  on-surface-variant: '#474554'
  inverse-surface: '#2d2f40'
  inverse-on-surface: '#f0efff'
  outline: '#787585'
  outline-variant: '#c8c4d6'
  surface-tint: '#584acb'
  primary: '#4c3dbf'
  on-primary: '#ffffff'
  primary-container: '#6558d9'
  on-primary-container: '#efebff'
  inverse-primary: '#c6c0ff'
  secondary: '#5c4bc3'
  on-secondary: '#ffffff'
  secondary-container: '#9485ff'
  on-secondary-container: '#2a0992'
  tertiary: '#00603b'
  on-tertiary: '#ffffff'
  tertiary-container: '#007b4e'
  on-tertiary-container: '#abffcd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6c0ff'
  on-primary-fixed: '#150066'
  on-primary-fixed-variant: '#3f2eb2'
  secondary-fixed: '#e5deff'
  secondary-fixed-dim: '#c7bfff'
  on-secondary-fixed: '#180065'
  on-secondary-fixed-variant: '#4330aa'
  tertiary-fixed: '#80fab9'
  tertiary-fixed-dim: '#62dd9e'
  on-tertiary-fixed: '#002111'
  on-tertiary-fixed-variant: '#005232'
  background: '#fbf8ff'
  on-background: '#181b2a'
  surface-variant: '#e0e1f7'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies precise, analytical power delivered through an uncompromising modern minimalism. Built for principal engineers, architects, and engineering leadership, it avoids playful SaaS tropes in favor of disciplined execution, rigorous typographic clarity, and structural balance. The visual atmosphere is calm, cerebral, and distinctly premium.

The aesthetic fuses precise architectural layout with tactile, micro-layered surfacing. High density of information is balanced by generous whitespace, hairline separation lines, and purposeful accents of electric violet. Interactions prioritize predictability and speed: instant feedback, subtle border shifts on hover, and deliberate focus states that respect keyboard-first workflows.

## Colors

The palette is engineered for prolonged operational focus under light mode. It relies on a low-strain off-white canvas (`#F7F8FC`) layered with pure white (`#FFFFFF`) containers to establish clear figure-ground segregation without harsh contrasts.

- **Primary Canvas & Surfaces**: Base canvas sits on `#F7F8FC`. Primary cards and popovers inhabit pure `#FFFFFF`. Elevated tooltips and inverted code inspection drawers leverage deep neutral `#202333`.
- **Text & Hierarchy**: Primary typography is anchored by `#202333`, yielding WCAG AAA readability. Secondary body, timestamps, and muted metadata reside in `#777B8A`. Disabled elements and tertiary glyphs use `#A0A4B4`.
- **Accent & Actions**: Actionable surfaces, interactive indicators, and primary states use `#6558D9`. Secondary interactions, active filter states, and hover states shift to the luminous `#8B7CF6`.
- **Structural Lines**: Hairline dividers, card outlines, and table tracks use `#E8EAF1`.
- **Functional Semantics**: Crisp telemetry states:
  - Success: `#16A36A` (Surface: `#F0FDF4`, Border: `#BBF7D0`)
  - Warning: `#E5A23B` (Surface: `#FFFBEB`, Border: `#FDE68A`)
  - Danger: `#DC6262` (Surface: `#FEF2F2`, Border: `#FECACA`)

## Typography

Typographic scale balances functional speed with deep scanning clarity. Headlines utilize **Geist** to project technical modernism and clean tabular proportions. Running copy and long-form analysis rely on **Inter** for neutral legibility and dependable x-height metrics.

Numeric indicators, metric callouts, and badge labels enforce tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during live telemetry updates. All label variants utilize slightly increased tracking for immediate recognition across dense operational dashboards.

## Layout & Spacing

The layout is structured around a 12-column fluid grid system with controlled maximum content widths (1536px for ultra-wide dashboards) and fixed navigational rails (64px collapsed, 240px expanded). 

- **Desktop (>= 1280px)**: 12 columns, 24px (`1.5rem`) gutters, 32px (`2rem`) page margin. Multi-column cards span 3, 4, 6, or 12 units.
- **Tablet (768px - 1279px)**: 8 columns, 16px (`1rem`) gutters, 24px (`1.5rem`) page margin. Secondary sidebars collapse into overlay slide-overs.
- **Mobile (< 768px)**: 4 columns, 12px (`0.75rem`) gutters, 16px (`1rem`) page margin. Cards reflow strictly into a single column.

Component density is tuned for information architecture: inner card padding maintains a strict 24px (`1.5rem`) standard, tightening to 16px (`1rem`) on compact metrics widgets. Element spacing uses an 8-point rhythmic step, reserving 4px (`space-xs`) strictly for badge insets and inline micro-pairings.

## Elevation & Depth

Visual hierarchy does not rely on heavy, disorienting shadows. Instead, it relies on tonal layering, delicate structural borders (`1px solid #E8EAF1`), and diffused ambient light.

- **Level 0 (Canvas)**: Background color `#F7F8FC`, no shadow, no border.
- **Level 1 (Default Containers & Cards)**: Background `#FFFFFF`, border `1px solid #E8EAF1`, shadow `0 1px 3px 0 rgba(32, 35, 51, 0.03), 0 1px 2px -1px rgba(32, 35, 51, 0.02)`.
- **Level 2 (Hovered Cards & Segmented Controls)**: Background `#FFFFFF`, border `1px solid rgba(101, 88, 217, 0.25)`, shadow `0 4px 12px -2px rgba(32, 35, 51, 0.05), 0 2px 6px -2px rgba(32, 35, 51, 0.03)`.
- **Level 3 (Flyouts, Menus & Filter Dropdowns)**: Background `#FFFFFF`, border `1px solid #E8EAF1`, shadow `0 10px 24px -4px rgba(32, 35, 51, 0.08), 0 4px 10px -4px rgba(32, 35, 51, 0.04)`.
- **Level 4 (Modals & Command Palettes)**: Centered over canvas backdrop `rgba(32, 35, 51, 0.4)` with backdrop-filter blur `4px`. Container border `1px solid #E8EAF1`, shadow `0 24px 48px -12px rgba(32, 35, 51, 0.16)`.

## Shapes

The geometric signature uses deliberate, structured curve radii that establish card-like clarity without appearing toy-like.

- **Cards & Primary Surfaces**: Standardized on `rounded-xl` (24px / 1.5rem on outer bounds, 16px / 1rem for inset sections).
- **Interactive Controls (Buttons, Inputs, Selects)**: Defined with `rounded-md` to `rounded-lg` (8px to 10px), offering a sharp, engineered grip.
- **Pills & Status Indicators**: Pure circular/pill radius (9999px) for categorical badges, presence dots, and active filter pills.
- **Code & Graph Nodes**: Strict 6px radius to accentuate linear, diagrammatic geometry.

## Components

### Buttons
- **Primary**: Solid background `#6558D9`, text `#FFFFFF`, radius 8px, padding 8px 16px. Hover transitions to `#8B7CF6`. Active state scales subtly (99%). Focus-visible rings outline `2px solid #8B7CF6` offset by 2px.
- **Secondary**: Background `#FFFFFF`, text `#202333`, border `1px solid #E8EAF1`. Hover triggers background `#F7F8FC` and border `#777B8A`.
- **Ghost/Tertiary**: No background or border. Text `#777B8A`, hover background `rgba(101, 88, 217, 0.06)`, text `#6558D9`.

### Badges & Status Chips
- Height 22px, padding 2px 8px, border-radius 9999px. Typeface `label-sm` with tabular alignment.
- **Success**: Text `#16A36A`, background `#F0FDF4`, border `1px solid #BBF7D0`.
- **Warning**: Text `#E5A23B`, background `#FFFBEB`, border `1px solid #FDE68A`.
- **Danger**: Text `#DC6262`, background `#FEF2F2`, border `1px solid #FECACA`.
- **Neutral/System**: Text `#777B8A`, background `#F7F8FC`, border `1px solid #E8EAF1`.

### Cards & Dashboards Panes
- Background `#FFFFFF`, corner radius 16px (`rounded-xl`), border `1px solid #E8EAF1`. Internal header sections feature a 1px border-bottom divider in `#E8EAF1`, with trailing actions and timestamp typography set to `body-sm` (`#777B8A`).

### Input Fields & Controls
- Height 38px, corner radius 8px, border `1px solid #E8EAF1`, background `#FFFFFF`, font `body-md` (`#202333`).
- Placeholder text `#A0A4B4`. 
- Focus state: Border color transitions to `#6558D9`, box-shadow `0 0 0 3px rgba(101, 88, 217, 0.12)`.
- Checkboxes: 16x16px, radius 4px, unchecked border `1.5px solid #E8EAF1`, checked fill `#6558D9` with crisp `#FFFFFF` check vector.

### Decision Intelligence Nodes & Traces
- Diagnostic cards that link pipeline traces use left-side accent indicators: a 3px border-left colored by state (Success `#16A36A`, Danger `#DC6262`, AI Recommendation `#6558D9`).
- Embedded code snippets sit inside containers with background `#F7F8FC`, border `1px solid #E8EAF1`, and monospace sizing at 12px with 1.5 line height.