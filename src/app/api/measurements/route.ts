import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/measurements - List user's saved measurements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const measurements = await db.savedMeasurement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { service: true },
    })

    // Parse JSON fields
    const parsed = measurements.map((m) => ({
      ...m,
      measurementData: JSON.parse(m.measurementData),
    }))

    return NextResponse.json({ measurements: parsed })
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}

// POST /api/measurements - Save measurements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, serviceId, name, measurementData } = body

    if (!userId || !serviceId || !name || !measurementData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, serviceId, name, measurementData' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify service exists
    const service = await db.service.findUnique({ where: { id: serviceId } })
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const measurement = await db.savedMeasurement.create({
      data: {
        userId,
        serviceId,
        name,
        measurementData: JSON.stringify(measurementData),
      },
      include: { service: true },
    })

    return NextResponse.json({
      ...measurement,
      measurementData: JSON.parse(measurement.measurementData),
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving measurements:', error)
    return NextResponse.json(
      { error: 'Failed to save measurements' },
      { status: 500 }
    )
  }
}
