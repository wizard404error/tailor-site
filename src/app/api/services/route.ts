import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const services = await db.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON fields
    const parsed = services.map((s) => ({
      ...s,
      measurementSchema: JSON.parse(s.measurementSchema),
    }))

    return NextResponse.json({ services: parsed })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
