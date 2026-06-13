import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/products - Create a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, price, stock, sizes, images, isActive, categoryId } = body

    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, price' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        stock: stock ? parseInt(stock) : 0,
        sizes: JSON.stringify(sizes || []),
        images: JSON.stringify(images || []),
        isActive: isActive !== undefined ? isActive : true,
        categoryId: categoryId || null,
      },
      include: { category: true },
    })

    return NextResponse.json({
      ...product,
      sizes: JSON.parse(product.sizes),
      images: JSON.parse(product.images),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/products - Update a product
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, description, price, stock, sizes, images, isActive, categoryId } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Product id is required' },
        { status: 400 }
      )
    }

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check for conflicts
    if (slug && slug !== existing.slug) {
      const slugConflict = await db.product.findUnique({ where: { slug } })
      if (slugConflict) {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (stock !== undefined) updateData.stock = parseInt(stock)
    if (sizes !== undefined) updateData.sizes = JSON.stringify(sizes)
    if (images !== undefined) updateData.images = JSON.stringify(images)
    if (isActive !== undefined) updateData.isActive = isActive
    if (categoryId !== undefined) updateData.categoryId = categoryId || null

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json({
      ...product,
      sizes: JSON.parse(product.sizes),
      images: JSON.parse(product.images),
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}
