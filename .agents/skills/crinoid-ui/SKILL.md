---
name: crinoid-ui
description: Build renderer interfaces with crinoid's shadcn-derived UI layer, composed blocks, and Recharts wrappers. Use when adding Tailwind styling, buttons, forms, dialogs, tables, tabs, dashboard/settings/auth layouts, or line/area/bar/pie/donut charts. Triggers on crinoid/ui, crinoid/blocks, crinoid/charts, crinoid/ui/styles.css, shadcn, Tailwind v4, Recharts, ChartContainer, StatCard, PageBlock.
---

# Crinoid UI, blocks, and charts

The renderer UI layer is optional and Tailwind v4-based. It wraps shadcn/ui primitives and Recharts so
feature code uses one consistent API instead of importing component libraries directly.

## Setup

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```css
/* src/renderer/index.css */
@import "crinoid/ui/styles.css";
```

```ts
// vite.config.mts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createRendererViteConfig } from 'crinoid/vite'

export default createRendererViteConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()]
})
```

`crinoid/ui/styles.css` imports Tailwind, defines the light/dark design tokens (`--background`,
`--primary`, `--chart-1`…`--chart-5`), and scans the package's own component sources. `ThemeProvider` from
`crinoid/react` toggles the `data-theme` attribute, which the stylesheet supports alongside `.dark`.

## Primitives

Import from `crinoid/ui`:

```tsx
import {
  Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, AvatarImage,
  Badge, Button, Card, CardAction, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle, Checkbox, Dialog, DialogClose, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Input, Label, Progress, Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue, Separator, Skeleton, Switch, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, cn
} from 'crinoid/ui'
```

All components are shadcn-derived: they accept `className`, forward standard HTML/Radix props, expose
`data-slot` attributes, and use `cn` for class merging. Use `Button` `variant` (`default`, `destructive`,
`outline`, `secondary`, `ghost`, `link`) and `size` (`default`, `xs`, `sm`, `lg`, `icon`, `icon-sm`,
`icon-lg`); use `asChild` to render a link or router element.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Profile</CardTitle>
    <CardDescription>Update your account</CardDescription>
    <CardAction><Button size="sm">Save</Button></CardAction>
  </CardHeader>
  <CardContent className="grid gap-4">
    <Label htmlFor="name">Name</Label>
    <Input id="name" />
    <Switch aria-label="Notifications" />
  </CardContent>
</Card>
```

## Blocks

Import composed layouts from `crinoid/blocks`:

| Block | Use |
| --- | --- |
| `PageBlock` | page title, description, actions, and content |
| `SettingsBlock` + `SettingsSection` + `SettingsRow` | settings cards and label/control rows |
| `AuthBlock` | centered login/signup card with form and footer |
| `DashboardBlock` + `StatsGrid` + `StatCard` + `ChartPanel` | dashboard header, KPI cards, chart panels |
| `EmptyBlock` | empty state with icon, description, and action |

```tsx
<DashboardBlock title="Overview" description="Last 7 days" actions={<Button>Refresh</Button>}>
  <StatsGrid>
    <StatCard label="Users" value="1,248" trend={<Badge>+12%</Badge>} />
    <StatCard label="Revenue" value="$8,420" trend={<Badge variant="secondary">+4%</Badge>} />
  </StatsGrid>
  <ChartPanel title="Traffic">
    <AreaChart data={data} xKey="day" series={[{ key: 'visits', label: 'Visits' }]} height={240} />
  </ChartPanel>
</DashboardBlock>
```

Blocks are layouts, not data providers. Keep fetching, mutations, and feature state in
`src/features/<feature>/`; pass plain props into blocks.

## Charts

Import wrappers from `crinoid/charts`:

```tsx
import { AreaChart, BarChart, DonutChart, LineChart, PieChart } from 'crinoid/charts'

<LineChart
  data={[{ month: 'Jan', value: 12 }, { month: 'Feb', value: 18 }]}
  xKey="month"
  series={[{ key: 'value', label: 'Value' }]}
  height={240}
  showLegend
/>

<DonutChart data={byPlan} nameKey="plan" valueKey="count" height={240} />
```

Common props: `data`, `xKey`, `series` (`key`, `label`, `color`, `stackId`), `height`, `showGrid`,
`showTooltip`, `showLegend`, and `valueFormatter`. Pie/donut props: `nameKey`, `valueKey`, `colors`,
`innerRadius`.

Low-level shadcn chart primitives are re-exported for custom charts: `ChartContainer`, `ChartTooltip`,
`ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, and the `ChartConfig` type. Use
them with Recharts primitives only when a wrapper cannot express the chart.

## Styling rules

- Keep colors on the token system (`bg-background`, `text-muted-foreground`, `border-border`, chart vars).
- Use `cn` instead of string concatenation for conditional classes.
- Prefer the block layouts and wrappers; do not re-copy shadcn component source into the app.
- All user-facing labels belong in `react-intl` messages, including chart labels and empty states.
- Tailwind scans the package source through `crinoid/ui/styles.css`; keep custom component classes in app
  files so the app's Tailwind build discovers them.

## Authoritative references

`node_modules/crinoid/API.md` (UI components), `node_modules/crinoid/README.md` (usage), and the
`packages/crinoid/src/ui`, `src/blocks`, and `src/charts.tsx` sources.
