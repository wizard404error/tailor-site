import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/[id] - Get single order with items
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { appointment: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: {
        ...order,
        shippingAddress: JSON.parse(order.shippingAddress),
        items: order.items.map((item) => ({
          ...item,
          measurementData: item.measurementData
            ? JSON.parse(item.measurementData)
            : {},
          referenceImages: item.referenceImages
            ? JSON.parse(item.referenceImages)
            : [],
        })),
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = [
      'pending',
      'confirmed',
      'in_production',
      'ready_for_delivery',
      'delivered',
      'cancelled',
    ]

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { appointment: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      items: order.items.map((item) => ({
        ...item,
        measurementData: item.measurementData
          ? JSON.parse(item.measurementData)
          : {},
        referenceImages: item.referenceImages
          ? JSON.parse(item.referenceImages)
          : [],
      })),
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
