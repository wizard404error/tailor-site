import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders - List orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const email = searchParams.get('email')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (email) {
      where.customerEmail = email
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { id: { contains: search } },
      ]
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Parse JSON fields
    const parsed = orders.map((o) => ({
      ...o,
      shippingAddress: JSON.parse(o.shippingAddress),
      items: o.items.map((item) => ({
        ...item,
        measurementData: item.measurementData
          ? JSON.parse(item.measurementData)
          : {},
        referenceImages: item.referenceImages
          ? JSON.parse(item.referenceImages)
          : [],
      })),
    }))

    return NextResponse.json({ orders: parsed })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerEmail,
      phone,
      shippingAddress,
      items,
      couponCode,
      userId,
    } = body

    if (!customerName || !customerEmail || !phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail, phone, items' },
        { status: 400 }
      )
    }

    // Calculate subtotal
    let subtotal = 0
    for (const item of items) {
      subtotal += item.priceAtBooking * item.quantity
    }

    // Validate coupon if provided
    let discountAmount = 0
    let appliedCouponCode: string | null = null

    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode },
      })

      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { error: 'Invalid or inactive coupon code' },
          { status: 400 }
        )
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'Coupon has expired' },
          { status: 400 }
        )
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: 'Coupon usage limit reached' },
          { status: 400 }
        )
      }

      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        return NextResponse.json(
          { error: `Minimum order value of ${coupon.minOrderValue} required for this coupon` },
          { status: 400 }
        )
      }

      // Calculate discount
      if (coupon.discountType === 'percent') {
        discountAmount = subtotal * (coupon.discountValue / 100)
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal)
      appliedCouponCode = couponCode
    }

    const total = subtotal - discountAmount

    // Create the order with items
    const order = await db.order.create({
      data: {
        customerName,
        customerEmail,
        phone,
        shippingAddress: JSON.stringify(shippingAddress || {}),
        total,
        couponCode: appliedCouponCode,
        discountAmount,
        status: 'pending',
        userId: userId || null,
        items: {
          create: items.map(
            (item: {
              itemType: string
              itemId: string
              itemName: string
              quantity: number
              priceAtBooking: number
              size?: string
              measurementData?: Record<string, unknown>
              referenceImages?: string[]
              appointmentDate?: string
            }) => ({
              itemType: item.itemType,
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              priceAtBooking: item.priceAtBooking,
              size: item.size || null,
              measurementData: JSON.stringify(item.measurementData || {}),
              referenceImages: JSON.stringify(item.referenceImages || []),
            })
          ),
        },
      },
      include: { items: true },
    })

    // If coupon was used, increment usage
    if (appliedCouponCode) {
      await db.coupon.update({
        where: { code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      })
    }

    // Create appointments for service items that have appointment dates
    for (const item of items) {
      if (item.itemType === 'service' && item.appointmentDate) {
        const orderItem = order.items.find((oi) => oi.itemId === item.itemId)
        if (orderItem) {
          await db.appointment.create({
            data: {
              orderItemId: orderItem.id,
              preferredDate: new Date(item.appointmentDate),
              status: 'pending',
              notes: null,
            },
          })
        }
      }
    }

    // Fetch the full order with appointments
    const fullOrder = await db.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { appointment: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({
      ...fullOrder,
      shippingAddress: JSON.parse(fullOrder!.shippingAddress),
      items: fullOrder!.items.map((item) => ({
        ...item,
        measurementData: item.measurementData
          ? JSON.parse(item.measurementData)
          : {},
        referenceImages: item.referenceImages
          ? JSON.parse(item.referenceImages)
          : [],
      })),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
