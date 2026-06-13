'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AdminNav } from '@/components/store/admin-nav'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Ruler,
  Users,
  RefreshCw,
  Download,
  CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  lowStockCount: number
  pendingMeasurements: number
  revenueByDay: { date: string; products: number; services: number }[]
  salesBreakdown: { products: number; services: number }
  topProducts: { name: string; quantity: number }[]
  topServices: { name: string; bookings: number }[]
  ordersByStatus: { status: string; count: number }[]
  customerStats: {
    newCustomersPerMonth: { month: string; count: number }[]
    repeatRate: number
  }
  recentOrders: {
    id: string
    customerName: string
    total: number
    status: string
    createdAt: string
    itemCount: number
  }[]
  lowStockProducts: {
    id: string
    name: string
    stock: number
    price: number
  }[]
}

type TimeRange = '7d' | '30d' | '90d' | 'custom'

// ─── Color Constants ──────────────────────────────────────────────────────────

const COLORS = {
  plum: '#2D1B2E',
  gold: '#D4AF37',
  roseGold: '#B76E79',
  cream: '#FDF8F5',
  amber: '#F59E0B',
  blue: '#3B82F6',
  orange: '#F97316',
  purple: '#8B5CF6',
  green: '#10B981',
  red: '#EF4444',
}

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.amber,
  confirmed: COLORS.blue,
  in_production: COLORS.orange,
  ready_for_delivery: COLORS.purple,
  delivered: COLORS.green,
  cancelled: COLORS.red,
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy')
  } catch {
    return dateStr
  }
}

function formatMonth(monthStr: string): string {
  try {
    return format(new Date(monthStr + '-01'), 'MMM yyyy')
  } catch {
    return monthStr
  }
}

function getStatusBadgeClass(status: string): string {
  const color = STATUS_COLORS[status] || COLORS.plum
  return `text-white border-transparent`
}

function getStatusBgColor(status: string): string {
  const color = STATUS_COLORS[status] || COLORS.plum
  return color
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Custom Pie Label ─────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180
function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboardView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const getDateRange = useCallback((): { from: string; to: string } => {
    const to = new Date()
    let from = new Date()

    if (timeRange === '7d') {
      from.setDate(to.getDate() - 7)
    } else if (timeRange === '30d') {
      from.setDate(to.getDate() - 30)
    } else if (timeRange === '90d') {
      from.setDate(to.getDate() - 90)
    } else if (timeRange === 'custom' && dateFrom && dateTo) {
      from = dateFrom
      from.setHours(0, 0, 0, 0)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      return {
        from: from.toISOString(),
        to: toDate.toISOString(),
      }
    } else {
      from.setDate(to.getDate() - 30)
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }, [timeRange, dateFrom, dateTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { from, to } = getDateRange()
      const res = await fetch(`/api/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (!res.ok) throw new Error('Failed to fetch analytics data')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [getDateRange])

  useEffect(() => {
    if (timeRange !== 'custom' || (dateFrom && dateTo)) {
      fetchData()
    }
  }, [timeRange, dateFrom, dateTo, fetchData])

  // ─── CSV Export ───────────────────────────────────────────────────────────

  const exportDashboardCSV = () => {
    if (!data) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', data.totalRevenue.toString()],
      ['Total Orders', data.totalOrders.toString()],
      ['Average Order Value', data.avgOrderValue.toFixed(2)],
      ['Low Stock Products', data.lowStockCount.toString()],
      ['Pending Measurements', data.pendingMeasurements.toString()],
      ['Repeat Customer Rate', data.customerStats.repeatRate.toFixed(1) + '%'],
      [],
      ['Sales Breakdown'],
      ['Products Revenue', data.salesBreakdown.products.toString()],
      ['Services Revenue', data.salesBreakdown.services.toString()],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportOrdersCSV = () => {
    if (!data) return
    const rows = [
      ['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Items'],
      ...data.recentOrders.map((o) => [
        o.id.substring(0, 8),
        o.customerName,
        o.total.toString(),
        o.status,
        formatDate(o.createdAt),
        o.itemCount.toString(),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ─── Sales breakdown for pie chart ────────────────────────────────────────

  const salesBreakdownData = data
    ? [
        { name: 'Products', value: data.salesBreakdown.products },
        { name: 'Services', value: data.salesBreakdown.services },
      ]
    : []

  const ordersByStatusData = data
    ? data.ordersByStatus.map((item) => ({
        name: item.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: item.count,
        status: item.status,
      }))
    : []

  const topProductsData = data ? data.topProducts.slice(0, 5) : []
  const topServicesData = data ? data.topServices.slice(0, 5) : []
  const customersPerMonthData = data ? data.customerStats.newCustomersPerMonth : []

  const totalOrdersFromStatus = ordersByStatusData.reduce((sum, item) => sum + item.value, 0)

  // ─── Loading Skeletons ────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Charts Skeleton */}
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <Skeleton className="h-72 w-full" />
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="mb-4 h-6 w-40" />
                <Skeleton className="h-64 w-full" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────────────────────

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <h2 className="font-heading mb-2 text-xl font-semibold">Failed to Load Dashboard</h2>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button onClick={fetchData} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AdminNav />
        {/* ── A. Header Section ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated: {format(lastUpdated, 'MMM dd, yyyy h:mm a')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={timeRange}
              onValueChange={(val: TimeRange) => {
                setTimeRange(val)
                if (val !== 'custom') {
                  setDateFrom(undefined)
                  setDateTo(undefined)
                }
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            {timeRange === 'custom' && (
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="size-4" />
                    {dateFrom && dateTo
                      ? `${format(dateFrom, 'MMM dd')} - ${format(dateTo, 'MMM dd')}`
                      : 'Pick dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      setDateFrom(range?.from)
                      setDateTo(range?.to)
                      if (range?.from && range?.to) {
                        setCalendarOpen(false)
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} title="Refresh data">
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* ── B. KPI Cards ──────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Total Revenue */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-accent">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <DollarSign className="size-6 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {formatCurrency(data?.totalRevenue ?? 0)}
                      </p>
                      <span className="flex items-center text-xs font-medium text-green-600">
                        <ArrowUpRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Orders */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingCart className="size-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {data?.totalOrders ?? 0}
                      </p>
                      <span className="flex items-center text-xs font-medium text-green-600">
                        <ArrowUpRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average Order Value */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-[#B76E79]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#B76E79]/10">
                    <TrendingUp className="size-6 text-[#B76E79]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {formatCurrency(data?.avgOrderValue ?? 0)}
                      </p>
                      <span className="flex items-center text-xs font-medium text-red-500">
                        <ArrowDownRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Low Stock Products */}
          <motion.div variants={itemVariants}>
            <Card className={`relative overflow-hidden border-l-4 ${(data?.lowStockCount ?? 0) > 0 ? 'border-l-amber-500' : 'border-l-green-500'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${(data?.lowStockCount ?? 0) > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
                    <AlertTriangle className={`size-6 ${(data?.lowStockCount ?? 0) > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Low Stock Products</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {data?.lowStockCount ?? 0}
                      </p>
                      {(data?.lowStockCount ?? 0) > 0 && (
                        <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs">
                          Warning
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Measurements */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <Ruler className="size-6 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Pending Measurements</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {data?.pendingMeasurements ?? 0}
                      </p>
                      {(data?.pendingMeasurements ?? 0) > 0 && (
                        <span className="flex items-center text-xs font-medium text-amber-600">
                          <ArrowUpRight className="size-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Repeat Customer Rate */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden border-l-4 border-l-accent">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Users className="size-6 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Repeat Customer Rate</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-heading text-2xl font-bold text-foreground">
                        {(data?.customerStats.repeatRate ?? 0).toFixed(1)}%
                      </p>
                      {(data?.customerStats.repeatRate ?? 0) >= 30 ? (
                        <span className="flex items-center text-xs font-medium text-green-600">
                          <ArrowUpRight className="size-3" />
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-medium text-red-500">
                          <ArrowDownRight className="size-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ── C. Revenue Chart (Line Chart - Full Width) ────────────────── */}
        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Revenue Over Time</CardTitle>
              <CardDescription>Products vs Services revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.revenueByDay ?? []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                      tickFormatter={(val: string) => {
                        try {
                          return format(new Date(val), 'MMM dd')
                        } catch {
                          return val
                        }
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                      tickFormatter={(val: number) => `$${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="products"
                      name="Products"
                      stroke={COLORS.plum}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLORS.plum }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="services"
                      name="Services"
                      stroke={COLORS.gold}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLORS.gold }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── D. Sales Breakdown & E. Orders by Status ──────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* D. Sales Breakdown (Pie Chart) */}
          <motion.div variants={sectionVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Sales Breakdown</CardTitle>
                <CardDescription>Products vs Services revenue split</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {salesBreakdownData.length > 0 && (salesBreakdownData[0].value > 0 || salesBreakdownData[1].value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesBreakdownData}
                          cx="50%"
                          cy="45%"
                          outerRadius={80}
                          dataKey="value"
                          label={renderCustomizedLabel}
                          labelLine={false}
                          animationBegin={0}
                          animationDuration={800}
                        >
                          <Cell fill={COLORS.plum} stroke="none" />
                          <Cell fill={COLORS.gold} stroke="none" />
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-card)',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value: string) => (
                            <span className="text-sm text-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No sales data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* E. Orders by Status (Donut Chart) */}
          <motion.div variants={sectionVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Orders by Status</CardTitle>
                <CardDescription>Current order status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {ordersByStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ordersByStatusData}
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={80}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {ordersByStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.status] || COLORS.plum}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-card)',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value: string) => (
                            <span className="text-sm text-foreground">{value}</span>
                          )}
                        />
                        {/* Center text */}
                        <text
                          x="50%"
                          y="42%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground font-heading text-2xl font-bold"
                        >
                          {totalOrdersFromStatus}
                        </text>
                        <text
                          x="50%"
                          y="52%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-muted-foreground text-xs"
                        >
                          orders
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No order data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── F. Top Products & G. Top Services ─────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* F. Top 5 Products (Horizontal Bar) */}
          <motion.div variants={sectionVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Top 5 Products</CardTitle>
                <CardDescription>Best selling products by quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {topProductsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topProductsData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                          width={120}
                        />
                        <Tooltip content={<SimpleTooltip />} />
                        <Bar
                          dataKey="quantity"
                          name="Quantity"
                          fill={COLORS.plum}
                          radius={[0, 4, 4, 0]}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No product data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* G. Top 5 Services (Vertical Bar) */}
          <motion.div variants={sectionVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Top 5 Services</CardTitle>
                <CardDescription>Most booked services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {topServicesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topServicesData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                          angle={-25}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                        />
                        <Tooltip content={<SimpleTooltip />} />
                        <Bar
                          dataKey="bookings"
                          name="Bookings"
                          fill={COLORS.gold}
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No service data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── H. Customer Analytics ──────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Customer Analytics</CardTitle>
              <CardDescription>New customer growth and retention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Repeat Rate Display */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-accent/5 p-6">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Repeat Customer Rate</p>
                  <p className="font-heading text-5xl font-bold text-accent">
                    {(data?.customerStats.repeatRate ?? 0).toFixed(1)}%
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">of customers return</p>
                </div>
                {/* New Customers Chart */}
                <div className="lg:col-span-2 h-48">
                  {customersPerMonthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={customersPerMonthData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                          tickFormatter={(val: string) => formatMonth(val)}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-card)',
                          }}
                          labelFormatter={(label: string) => formatMonth(label)}
                          formatter={(value: number) => [value, 'New Customers']}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="New Customers"
                          stroke={COLORS.roseGold}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: COLORS.roseGold }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No customer data available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── I. Recent Orders Table ─────────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Recent Orders</CardTitle>
              <CardDescription>Latest 10 orders placed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.recentOrders && data.recentOrders.length > 0 ? (
                      data.recentOrders.map((order) => (
                        <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">
                            {order.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="font-medium">{order.customerName}</TableCell>
                          <TableCell>{formatCurrency(order.total)}</TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadgeClass(order.status)}
                              style={{ backgroundColor: getStatusBgColor(order.status) }}
                            >
                              {order.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No recent orders
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── J. Low Stock Products Table ────────────────────────────────── */}
        <motion.div variants={sectionVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Low Stock Products</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                      data.lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            {product.stock < 3 ? (
                              <Badge className="bg-red-500/15 text-red-700 border-red-200 text-xs">
                                Critical
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          All products are well stocked
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── K. Export Buttons ──────────────────────────────────────────── */}
        <motion.div variants={sectionVariants} className="flex flex-wrap gap-3">
          <Button
            onClick={exportDashboardCSV}
            disabled={!data}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Download className="size-4" />
            Export Dashboard CSV
          </Button>
          <Button
            onClick={exportOrdersCSV}
            disabled={!data}
            variant="outline"
            className="gap-2"
          >
            <Download className="size-4" />
            Export Orders CSV
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
