# DinoBudget — Visual Theme & Asset Guide

> Design direction: personal finance dashboard with a serious fintech foundation, balanced pixel-art dinosaur personality, and a dark prehistoric-forest atmosphere.
>
> Product principle: **a finance app that happens to have dinosaurs—not a dinosaur game with finance features.**

## 1. Brand direction

- **Product name:** DinoBudget
- **Audience:** People managing personal finances
- **Personality:** Calm, trustworthy, friendly, slightly nostalgic
- **Visual keywords:** Dark forest, pixel art, prehistoric landscape, mint green, warm amber, clean financial data
- **Primary language:** Indonesian
- **Platform:** Responsive desktop and mobile

### Design principles

1. Prioritize financial readability over decoration.
2. Use dinosaur art to establish identity, not to replace navigation or data labels.
3. Keep charts, transaction lists, forms, and balances visually quiet.
4. Use consistent color semantics across the whole product.
5. Ensure status is communicated by text/icons as well as color.

## 2. Color palette

### Core colors

| Token | Hex | Purpose |
|---|---|---|
| `forest-950` | `#081B1C` | Main app background |
| `forest-900` | `#0B201F` | Main content surface |
| `forest-800` | `#10302D` | Card and panel background |
| `forest-700` | `#17372E` | Raised cards, selected navigation |
| `forest-600` | `#24483C` | Borders and subtle separators |
| `dino-400` | `#7DD3A7` | Primary accent, positive status, progress |
| `amber-400` | `#F2B36D` | Warnings, highlights, achievements |
| `coral-400` | `#F47777` | Expenses, errors, negative status |
| `beige-100` | `#E9EBDD` | Main text on dark surfaces |
| `sage-300` | `#B7D2C6` | Secondary text |
| `sage-400` | `#91AFA3` | Muted labels and helper text |
| `slate-500` | `#687B80` | Disabled and tertiary UI |

### Color usage

- **Income / positive:** `dino-400`
- **Expenses / negative:** `coral-400`
- **Warnings / due soon:** `amber-400`
- **Neutral information:** muted sage or blue-gray
- **Main background:** `forest-950`
- **Cards:** `forest-900` or `forest-800`
- **Selected navigation:** `forest-700`
- **Text:** `beige-100`; secondary text `sage-300`

Do not use green for every element. Reserve the bright accent for actions, focus states, progress, and positive indicators.

## 3. Typography

- **Primary font:** Inter, Geist, or another highly legible sans-serif.
- **Body text:** 14–16 px.
- **Secondary labels:** 12–13 px, while maintaining accessible contrast.
- **Page headings:** 24–32 px on desktop; 22–26 px on mobile.
- **Financial figures:** use tabular numerals (`font-variant-numeric: tabular-nums`).
- **Pixel fonts:** decorative use only; do not use them for balances, forms, tables, or long copy.

## 4. Layout and component styling

| Element | Recommendation |
|---|---|
| Desktop sidebar | 220–250 px |
| Optional right panel | 280–320 px |
| Main content | Flexible grid; avoid fixed content widths |
| Card radius | 12–16 px |
| Input/button height | 44–48 px minimum |
| Spacing scale | Multiples of 4 px, with 8 px as the common unit |
| Borders | Thin, low-contrast forest green |
| Shadows | Subtle; avoid strong glows |
| Icons | Consistent stroke weight and size |
| Mobile navigation | Bottom bar with a prominent add-transaction action |

### Responsive behavior

- **Desktop (≥ 1024 px):** sidebar, multi-column dashboard, charts beside category breakdown.
- **Tablet (768–1023 px):** collapsible sidebar, two-column statistics, stack charts as needed.
- **Mobile (< 768 px):** compact header, two-column statistics, full-width charts, transaction rows optimized for touch, bottom navigation.

Never shrink the desktop table until it becomes unreadable. Replace it with stacked transaction rows or a card list on narrow screens.

## 5. Dinosaur mascot system

### Character states

| State | Use |
|---|---|
| `idle` | Header, default avatar, empty states |
| `happy` | Savings milestones and positive habits |
| `warning` | Budget nearly exhausted or a bill is due |
| `explorer` | Onboarding, long-term goals, educational banners |
| `success` | Goal reached or a positive milestone |

### Pixel-art asset guidelines

- Base sprite grid: 32×32 or 48×48 pixels.
- Use a limited, consistent color palette and consistent outline thickness.
- Prefer transparent PNG or a sprite sheet for character sprites.
- For CSS rendering, consider `image-rendering: pixelated`.
- Use small sprites for avatars and larger illustrations for banners.
- Keep animation subtle and respect `prefers-reduced-motion`.
- Mascot state is presentational; financial rules should determine when each state appears.

## 6. Image and illustration inventory

Use original or properly licensed artwork. The prompts below are art-direction prompts for creating consistent assets; they are not references to existing image files.

### A. Hero landscape

**Filename:** `dino-hero-forest.webp`

**Purpose:** Dashboard banner or onboarding hero.

**Art direction prompt:**
> Wide pixel-art prehistoric forest at sunset, layered dark teal mountains, muted olive trees, warm amber sunlight, tiny distant pterosaurs, a friendly small green dinosaur exploring a rocky ledge, limited retro-game palette, clean pixel clusters, high-quality indie game environment, calm and hopeful mood, no text, no UI, 16:9 composition.

**Recommended output:** 1600×900 WebP; keep important content near the center/right so it can crop responsively.

### B. Mascot sprites

**Filenames:**
- `dino-idle.png`
- `dino-happy.png`
- `dino-warning.png`
- `dino-explorer.png`
- `dino-success.png`

**Art direction prompt:**
> A cohesive set of cute green dinosaur pixel-art game sprites, 32×32 or 48×48 pixel grid, side-facing three-quarter view, limited dark green, mint, olive, beige and amber palette, consistent outline and proportions, crisp pixel edges, transparent background, no text, no shadows outside the sprite. Create distinct idle, happy, concerned, explorer and success poses.

**Recommended output:** individual transparent PNGs or one sprite sheet with documented frame dimensions.

### C. Empty-state illustration

**Filename:** `dino-empty-transactions.webp`

**Purpose:** Display when the transaction list is empty.

**Art direction prompt:**
> Small friendly green pixel-art dinosaur looking at an empty parchment ledger beside a few stones and ferns, dark prehistoric forest, muted forest-green and beige palette, a little mint accent, calm and encouraging, compact centered composition, no text, transparent or solid dark background.

### D. Savings-goal illustration

**Filename:** `dino-savings-goal.webp`

**Purpose:** Savings goal card or milestone screen.

**Art direction prompt:**
> Cute green pixel-art dinosaur discovering a small golden fossil treasure chest on a rocky ledge, warm amber highlights, dark teal prehistoric forest at dusk, restrained retro-game palette, crisp pixel edges, optimistic but not childish, no text, horizontal composition.

### E. Warning illustration

**Filename:** `dino-budget-warning.webp`

**Purpose:** Budget warning or bill reminder.

**Art direction prompt:**
> Friendly green pixel-art dinosaur with a mildly concerned expression holding a tiny wooden sign with a simple exclamation symbol, dark forest-green palette, restrained amber highlight, clean transparent sprite, readable at small size, no words or numbers.

### F. Goal landscape cards

**Filename:** `dino-goal-landscape.webp`

**Purpose:** Decorative goal cards for emergency savings, travel, or future purchases.

**Art direction prompt:**
> Retro pixel-art landscape triptych style: prehistoric forest trail, distant mountains and a warm sunset, tiny explorer dinosaur, layered depth, forest teal and olive with subtle amber highlights, limited palette, crisp pixels, no text, wide horizontal scene.

## 7. Asset directory suggestion

```text
public/
└── images/
    └── dino/
        ├── landscapes/
        │   ├── dino-hero-forest.webp
        │   ├── dino-goal-landscape.webp
        │   └── dino-savings-goal.webp
        ├── mascot/
        │   ├── dino-idle.png
        │   ├── dino-happy.png
        │   ├── dino-warning.png
        │   ├── dino-explorer.png
        │   └── dino-success.png
        └── states/
            ├── dino-empty-transactions.webp
            └── dino-budget-warning.webp
```

## 8. Suggested CSS variables

```css
:root {
  color-scheme: dark;

  --color-forest-950: #081B1C;
  --color-forest-900: #0B201F;
  --color-forest-800: #10302D;
  --color-forest-700: #17372E;
  --color-forest-600: #24483C;

  --color-dino-400: #7DD3A7;
  --color-amber-400: #F2B36D;
  --color-coral-400: #F47777;

  --color-beige-100: #E9EBDD;
  --color-sage-300: #B7D2C6;
  --color-sage-400: #91AFA3;
  --color-slate-500: #687B80;

  --radius-card: 14px;
  --radius-control: 10px;
  --space-unit: 4px;
}
```

## 9. Accessibility and finance UX

- Do not communicate income/expense status through color alone.
- Check text contrast, particularly muted text over forest surfaces.
- Use explicit currency formatting such as `Rp2.450.000`.
- Keep destructive actions (delete transaction) visually distinct and confirm them where appropriate.
- Ensure all controls have labels and keyboard focus states.
- Avoid decorative backgrounds behind financial values.
- Provide reduced-motion behavior and descriptive alt text for meaningful illustrations.
- Keep sample data clearly marked as demo data.

## 10. Implementation priorities

1. Implement color, typography, spacing and component tokens.
2. Build transaction entry and reliable balance calculations.
3. Build dashboard cards and charts with accessible labels.
4. Add budgets and savings goals.
5. Integrate pixel-art assets and mascot states.
6. Test responsive layouts, keyboard navigation, contrast and financial calculations.

**Core rule:** financial correctness and readability come first; pixel-art reinforces the product identity without competing with the data.
