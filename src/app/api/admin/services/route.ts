import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/services - Create a service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, basePrice, turnaroundDays, measurementSchema, requiresAppointment, isActive } = body

    if (!name || !slug || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, basePrice' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await db.service.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Service with this slug already exists' },
        { status: 409 }
      )
    }

    const service = await db.service.create({
      data: {
        name,
        slug,
        description: description || null,
        basePrice: parseFloat(basePrice),
        turnaroundDays: turnaroundDays ? parseInt(turnaroundDays) : 7,
        measurementSchema: JSON.stringify(measurementSchema || {}),
        requiresAppointment: requiresAppointment || false,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({
      ...service,
      measurementSchema: JSON.parse(service.measurementSchema),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/services - Update a service
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, description, basePrice, turnaroundDays, measurementSchema, requiresAppointment, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Service id is required' },
        { status: 400 }
      )
    }

    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check for conflicts
    if (slug && slug !== existing.slug) {
      const slugConflict = await db.service.findUnique({ where: { slug } })
      if (slugConflict) {
        return NextResponse.json(
          { error: 'Service with this slug already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice)
    if (turnaroundDays !== undefined) updateData.turnaroundDays = parseInt(turnaroundDays)
    if (measurementSchema !== undefined) updateData.measurementSchema = JSON.stringify(measurementSchema)
    if (requiresAppointment !== undefined) updateData.requiresAppointment = requiresAppointment
    if (isActive !== undefined) updateData.isActive = isActive

    const service = await db.service.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...service,
      measurementSchema: JSON.parse(service.measurementSchema),
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}
