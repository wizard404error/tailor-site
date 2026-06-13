import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/coupons/validate - Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderValue } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    const coupon = await db.coupon.findUnique({
      where: { code },
    })

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Coupon not found' },
        { status: 200 }
      )
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Coupon is not active' },
        { status: 200 }
      )
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Coupon has expired' },
        { status: 200 }
      )
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, error: 'Coupon usage limit reached' },
        { status: 200 }
      )
    }

    if (coupon.minOrderValue && orderValue && orderValue < coupon.minOrderValue) {
      return NextResponse.json(
        { valid: false, error: `Minimum order value of ${coupon.minOrderValue} required` },
        { status: 200 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    const effectiveOrderValue = orderValue || 0

    if (coupon.discountType === 'percent') {
      discountAmount = effectiveOrderValue * (coupon.discountValue / 100)
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue
    }

    // Cap discount at order value
    if (effectiveOrderValue > 0) {
      discountAmount = Math.min(discountAmount, effectiveOrderValue)
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
      },
      discountAmount,
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
