import * as React from 'react'
import {
  Area as AreaPrimitive,
  AreaChart as AreaChartPrimitive,
  Bar as BarPrimitive,
  BarChart as BarChartPrimitive,
  CartesianGrid,
  Cell,
  Line as LinePrimitive,
  LineChart as LineChartPrimitive,
  Pie as PiePrimitive,
  PieChart as PieChartPrimitive,
  XAxis,
  YAxis
} from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from './ui/chart.js'
import { cn } from './ui/lib/utils.js'

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent
} from './ui/chart.js'
export type { ChartConfig } from './ui/chart.js'

export type ChartDatum = Record<string, string | number | null | undefined>

export interface ChartSeries {
  readonly key: string
  readonly label?: string
  readonly color?: string
  readonly stackId?: string
}

export interface CartesianChartProps {
  readonly data: readonly ChartDatum[]
  readonly xKey: string
  readonly series: readonly ChartSeries[]
  readonly className?: string
  readonly height?: number
  readonly showGrid?: boolean
  readonly showLegend?: boolean
  readonly showTooltip?: boolean
  readonly valueFormatter?: (value: number) => string
}

export interface PieChartProps {
  readonly data: readonly ChartDatum[]
  readonly nameKey: string
  readonly valueKey: string
  readonly className?: string
  readonly height?: number
  readonly showLegend?: boolean
  readonly showTooltip?: boolean
  readonly colors?: readonly string[]
  readonly innerRadius?: number
}

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'] as const

function buildConfig(series: readonly ChartSeries[]): ChartConfig {
  return Object.fromEntries(
    series.map((item, index) => [
      item.key,
      {
        label: item.label ?? item.key,
        color: item.color ?? CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]
      }
    ])
  ) as ChartConfig
}

function chartClassName(className: string | undefined): string {
  return cn('aspect-auto w-full', className)
}

function chartStyle(height: number | undefined): React.CSSProperties {
  return height === undefined ? {} : { height, width: '100%' }
}

function tooltipFormatter(valueFormatter: ((value: number) => string) | undefined) {
  return (value: unknown): string => (valueFormatter ? valueFormatter(Number(value)) : String(value))
}

function ChartFrame({
  config,
  className,
  height,
  children
}: {
  readonly config: ChartConfig
  readonly className?: string | undefined
  readonly height?: number | undefined
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <ChartContainer config={config} className={chartClassName(className)} style={chartStyle(height)}>
      {children}
    </ChartContainer>
  )
}

function CartesianAxes({
  xKey,
  showGrid = true
}: {
  readonly xKey: string
  readonly showGrid?: boolean
}): React.JSX.Element {
  return (
    <>
      {showGrid ? <CartesianGrid vertical={false} strokeDasharray="3 3" /> : null}
      <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
      <YAxis tickLine={false} axisLine={false} tickMargin={8} width={44} />
    </>
  )
}

function ChartChrome({
  showTooltip = true,
  showLegend = false,
  valueFormatter
}: {
  readonly showTooltip?: boolean
  readonly showLegend?: boolean
  readonly valueFormatter?: ((value: number) => string) | undefined
}): React.JSX.Element {
  return (
    <>
      {showTooltip ? (
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={tooltipFormatter(valueFormatter)} />} />
      ) : null}
      {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
    </>
  )
}

export function LineChart({
  data,
  xKey,
  series,
  className,
  height,
  showGrid,
  showLegend,
  showTooltip,
  valueFormatter
}: CartesianChartProps): React.JSX.Element {
  return (
    <ChartFrame config={buildConfig(series)} className={className} height={height}>
      <LineChartPrimitive data={[...data]}>
        <CartesianAxes xKey={xKey} showGrid={showGrid ?? true} />
        <ChartChrome
          showTooltip={showTooltip ?? true}
          showLegend={showLegend ?? false}
          valueFormatter={valueFormatter ?? undefined}
        />
        {series.map((item) => (
          <LinePrimitive
            key={item.key}
            type="monotone"
            dataKey={item.key}
            stroke={`var(--color-${item.key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChartPrimitive>
    </ChartFrame>
  )
}

export function AreaChart({
  data,
  xKey,
  series,
  className,
  height,
  showGrid,
  showLegend,
  showTooltip,
  valueFormatter
}: CartesianChartProps): React.JSX.Element {
  return (
    <ChartFrame config={buildConfig(series)} className={className} height={height}>
      <AreaChartPrimitive data={[...data]}>
        <CartesianAxes xKey={xKey} showGrid={showGrid ?? true} />
        <ChartChrome
          showTooltip={showTooltip ?? true}
          showLegend={showLegend ?? false}
          valueFormatter={valueFormatter ?? undefined}
        />
        {series.map((item) => (
          <AreaPrimitive
            key={item.key}
            type="monotone"
            dataKey={item.key}
            {...(item.stackId === undefined ? {} : { stackId: item.stackId })}
            stroke={`var(--color-${item.key})`}
            fill={`var(--color-${item.key})`}
            fillOpacity={0.35}
            strokeWidth={2}
          />
        ))}
      </AreaChartPrimitive>
    </ChartFrame>
  )
}

export function BarChart({
  data,
  xKey,
  series,
  className,
  height,
  showGrid,
  showLegend,
  showTooltip,
  valueFormatter
}: CartesianChartProps): React.JSX.Element {
  return (
    <ChartFrame config={buildConfig(series)} className={className} height={height}>
      <BarChartPrimitive data={[...data]}>
        <CartesianAxes xKey={xKey} showGrid={showGrid ?? true} />
        <ChartChrome
          showTooltip={showTooltip ?? true}
          showLegend={showLegend ?? false}
          valueFormatter={valueFormatter ?? undefined}
        />
        {series.map((item) => (
          <BarPrimitive
            key={item.key}
            dataKey={item.key}
            {...(item.stackId === undefined ? {} : { stackId: item.stackId })}
            fill={`var(--color-${item.key})`}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChartPrimitive>
    </ChartFrame>
  )
}

export function PieChart({
  data,
  nameKey,
  valueKey,
  className,
  height,
  showLegend = true,
  showTooltip = true,
  colors,
  innerRadius = 0
}: PieChartProps): React.JSX.Element {
  const palette = colors ?? CHART_COLORS
  const config: ChartConfig = Object.fromEntries(
    data.map((item, index) => [
      String(item[nameKey] ?? index),
      {
        label: String(item[nameKey] ?? index),
        color: palette[index % palette.length] ?? CHART_COLORS[0]
      }
    ])
  ) as ChartConfig

  return (
    <ChartFrame config={config} className={className} height={height}>
      <PieChartPrimitive>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey={nameKey} indicator="dot" />} />
        {showLegend ? <ChartLegend content={<ChartLegendContent nameKey={nameKey} />} /> : null}
        <PiePrimitive
          data={[...data]}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius={innerRadius}
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((item, index) => (
            <Cell key={String(item[nameKey] ?? index)} fill={palette[index % palette.length] ?? CHART_COLORS[0]} />
          ))}
        </PiePrimitive>
      </PieChartPrimitive>
    </ChartFrame>
  )
}

export function DonutChart(props: PieChartProps): React.JSX.Element {
  return <PieChart {...props} innerRadius={props.innerRadius ?? 60} />
}
