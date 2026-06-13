import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/newsletter - Subscribe email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existing = await db.newsletter.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Email already subscribed' },
        { status: 200 }
      )
    }

    const subscription = await db.newsletter.create({
      data: { email },
    })

    return NextResponse.json(
      { message: 'Successfully subscribed', subscription },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
