import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/portfolio - Add portfolio item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, imageUrl, description, serviceId, order } = body

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, imageUrl' },
        { status: 400 }
      )
    }

    const portfolio = await db.portfolio.create({
      data: {
        title,
        imageUrl,
        description: description || null,
        serviceId: serviceId || null,
        order: order ? parseInt(order) : 0,
      },
      include: { service: true },
    })

    return NextResponse.json(portfolio, { status: 201 })
  } catch (error) {
    console.error('Error creating portfolio item:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio item' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/portfolio - Update portfolio item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, imageUrl, description, serviceId, order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Portfolio item id is required' },
        { status: 400 }
      )
    }

    const existing = await db.portfolio.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Portfolio item not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (description !== undefined) updateData.description = description
    if (serviceId !== undefined) updateData.serviceId = serviceId || null
    if (order !== undefined) updateData.order = parseInt(order)

    const portfolio = await db.portfolio.update({
      where: { id },
      data: updateData,
      include: { service: true },
    })

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error('Error updating portfolio item:', error)
    return NextResponse.json(
      { error: 'Failed to update portfolio item' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/portfolio - Delete portfolio item
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Portfolio item id is required' },
        { status: 400 }
      )
    }

    const existing = await db.portfolio.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Portfolio item not found' },
        { status: 404 }
      )
    }

    await db.portfolio.delete({ where: { id } })

    return NextResponse.json({ message: 'Portfolio item deleted successfully' })
  } catch (error) {
    console.error('Error deleting portfolio item:', error)
    return NextResponse.json(
      { error: 'Failed to delete portfolio item' },
      { status: 500 }
    )
  }
}
