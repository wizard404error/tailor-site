import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/admin/coupons/[id] - Update a coupon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { code, discountType, discountValue, minOrderValue, expiresAt, usageLimit, isActive } = body

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // If code is being changed, check for conflicts
    if (code && code !== existing.code) {
      const codeConflict = await db.coupon.findUnique({ where: { code } })
      if (codeConflict) {
        return NextResponse.json(
          { error: 'Coupon with this code already exists' },
          { status: 409 }
        )
      }
    }

    if (discountType && !['percent', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'discountType must be "percent" or "fixed"' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (code !== undefined) updateData.code = code
    if (discountType !== undefined) updateData.discountType = discountType
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue)
    if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue ? parseFloat(minOrderValue) : null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const coupon = await db.coupon.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/coupons/[id] - Delete a coupon
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    await db.coupon.delete({ where: { id } })

    return NextResponse.json({ message: 'Coupon deleted successfully' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
