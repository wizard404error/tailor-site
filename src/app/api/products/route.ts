import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') // 'price_asc', 'price_desc', 'newest', 'name'

    const where: Record<string, unknown> = { isActive: true }

    if (category) {
      // Find category by slug or name
      const cat = await db.category.findFirst({
        where: { OR: [{ slug: category }, { name: category }] },
      })
      if (cat) {
        where.categoryId = cat.id
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    else if (sort === 'price_desc') orderBy = { price: 'desc' }
    else if (sort === 'newest') orderBy = { createdAt: 'desc' }
    else if (sort === 'name') orderBy = { name: 'asc' }

    const products = await db.product.findMany({
      where,
      orderBy,
      include: { category: true },
    })

    // Parse JSON fields
    const parsed = products.map((p) => ({
      ...p,
      sizes: JSON.parse(p.sizes),
      images: JSON.parse(p.images),
    }))

    return NextResponse.json({ products: parsed })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
