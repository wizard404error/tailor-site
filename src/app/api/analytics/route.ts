import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/analytics - Dashboard BI data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build date filter
    const dateFilter: Record<string, unknown> = {}
    if (from || to) {
      dateFilter.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    // Fetch all delivered orders for revenue calculation
    const deliveredOrders = await db.order.findMany({
      where: {
        status: 'delivered',
        ...dateFilter,
      },
      include: { items: true },
    })

    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0)

    // Total orders (all statuses) in date range
    const totalOrdersCount = await db.order.count({
      where: dateFilter,
    })

    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / deliveredOrders.length : 0

    // Low stock products (stock < 5)
    const lowStockProducts = await db.product.findMany({
      where: { stock: { lt: 5 }, isActive: true },
    })

    const lowStockCount = lowStockProducts.length

    // Pending measurements: orders with status "pending" that have service items
    const pendingOrders = await db.order.findMany({
      where: { status: 'pending' },
      include: { items: true },
    })

    let pendingMeasurements = 0
    for (const order of pendingOrders) {
      const hasServiceItem = order.items.some((item) => item.itemType === 'service')
      if (hasServiceItem) pendingMeasurements++
    }

    // Revenue by day split by products/services
    const allOrdersInRange = await db.order.findMany({
      where: {
        status: 'delivered',
        ...dateFilter,
      },
      include: { items: true },
    })

    // Build revenue by day map
    const revenueByDayMap = new Map<string, { products: number; services: number }>()

    for (const order of allOrdersInRange) {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0]
      const existing = revenueByDayMap.get(dateStr) || { products: 0, services: 0 }

      for (const item of order.items) {
        const itemTotal = item.priceAtBooking * item.quantity
        if (item.itemType === 'product') {
          existing.products += itemTotal
        } else if (item.itemType === 'service') {
          existing.services += itemTotal
        }
      }

      revenueByDayMap.set(dateStr, existing)
    }

    const revenueByDay = Array.from(revenueByDayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Sales breakdown
    let productsRevenue = 0
    let servicesRevenue = 0
    for (const order of allOrdersInRange) {
      for (const item of order.items) {
        const itemTotal = item.priceAtBooking * item.quantity
        if (item.itemType === 'product') {
          productsRevenue += itemTotal
        } else if (item.itemType === 'service') {
          servicesRevenue += itemTotal
        }
      }
    }

    // Top products by quantity sold
    const allOrderItems = await db.orderItem.findMany({
      where: {
        itemType: 'product',
        order: {
          status: 'delivered',
          ...dateFilter,
        },
      },
    })

    const productQuantityMap = new Map<string, number>()
    for (const item of allOrderItems) {
      const current = productQuantityMap.get(item.itemName) || 0
      productQuantityMap.set(item.itemName, current + item.quantity)
    }

    const topProducts = Array.from(productQuantityMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Top services by bookings
    const allServiceItems = await db.orderItem.findMany({
      where: {
        itemType: 'service',
        order: {
          status: 'delivered',
          ...dateFilter,
        },
      },
    })

    const serviceBookingsMap = new Map<string, number>()
    for (const item of allServiceItems) {
      const current = serviceBookingsMap.get(item.itemName) || 0
      serviceBookingsMap.set(item.itemName, current + item.quantity)
    }

    const topServices = Array.from(serviceBookingsMap.entries())
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10)

    // Orders by status
    const allOrdersForStatus = await db.order.findMany({
      where: dateFilter,
      select: { status: true },
    })

    const statusCountMap = new Map<string, number>()
    for (const order of allOrdersForStatus) {
      const current = statusCountMap.get(order.status) || 0
      statusCountMap.set(order.status, current + 1)
    }

    const ordersByStatus = Array.from(statusCountMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)

    // Customer stats
    const allUsers = await db.user.findMany({
      where: { role: 'customer' },
      select: { createdAt: true, id: true },
      orderBy: { createdAt: 'asc' },
    })

    const newCustomersPerMonthMap = new Map<string, number>()
    for (const user of allUsers) {
      const monthStr = new Date(user.createdAt).toISOString().substring(0, 7) // YYYY-MM
      const current = newCustomersPerMonthMap.get(monthStr) || 0
      newCustomersPerMonthMap.set(monthStr, current + 1)
    }

    const newCustomersPerMonth = Array.from(newCustomersPerMonthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Repeat rate: customers with more than 1 order
    const customerOrderCounts = await db.order.groupBy({
      by: ['customerEmail'],
      _count: { id: true },
    })

    const totalCustomers = customerOrderCounts.length
    const repeatCustomers = customerOrderCounts.filter((c) => c._count.id > 1).length
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0

    // Recent orders (last 10)
    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: { select: { id: true } } },
    })

    const recentOrdersParsed = recentOrders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      phone: o.phone,
      total: o.total,
      status: o.status,
      couponCode: o.couponCode,
      discountAmount: o.discountAmount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      userId: o.userId,
      itemCount: o.items.length,
    }))

    // Low stock products with parsed fields
    const lowStockProductsParsed = lowStockProducts.map((p) => ({
      ...p,
      sizes: JSON.parse(p.sizes),
      images: JSON.parse(p.images),
    }))

    return NextResponse.json({
      totalRevenue,
      totalOrders: totalOrdersCount,
      avgOrderValue,
      lowStockCount,
      pendingMeasurements,
      revenueByDay,
      salesBreakdown: { products: productsRevenue, services: servicesRevenue },
      topProducts,
      topServices,
      ordersByStatus,
      customerStats: {
        newCustomersPerMonth,
        repeatRate,
      },
      recentOrders: recentOrdersParsed,
      lowStockProducts: lowStockProductsParsed,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
