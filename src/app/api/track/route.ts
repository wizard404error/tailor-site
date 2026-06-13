import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/track - Track order by email + orderId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, orderId } = body

    if (!email || !orderId) {
      return NextResponse.json(
        { error: 'Email and orderId are required' },
        { status: 400 }
      )
    }

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        customerEmail: email,
      },
      include: {
        items: {
          include: {
            appointment: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found. Please check your email and order ID.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      phone: order.phone,
      shippingAddress: JSON.parse(order.shippingAddress),
      total: order.total,
      couponCode: order.couponCode,
      discountAmount: order.discountAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        itemName: item.itemName,
        quantity: item.quantity,
        priceAtBooking: item.priceAtBooking,
        size: item.size,
        measurementData: item.measurementData
          ? JSON.parse(item.measurementData)
          : {},
        appointment: item.appointment
          ? {
              id: item.appointment.id,
              preferredDate: item.appointment.preferredDate,
              status: item.appointment.status,
              notes: item.appointment.notes,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    )
  }
}
