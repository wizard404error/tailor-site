import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/portfolio - List all portfolio items
export async function GET() {
  try {
    const portfolio = await db.portfolio.findMany({
      orderBy: { order: 'asc' },
      include: { service: true },
    })

    return NextResponse.json({ portfolio })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
