'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, ImageOff, X } from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/lib/store'
import { AdminNav } from '@/components/store/admin-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  slug: string
}

interface ColorOption {
  name: string
  hex: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  sizes: string[]
  colors: ColorOption[]
  images: string[]
  isActive: boolean
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  name: string
  slug: string
  description: string
  price: string
  stock: string
  sizes: string[]
  colors: ColorOption[]
  categoryId: string
  images: string
  isActive: boolean
}

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL']

const PRESET_COLORS: ColorOption[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Burgundy', hex: '#7F1D1D' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Sage', hex: '#6B8E6B' },
  { name: 'Blush Pink', hex: '#F9C4D2' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Dusty Rose', hex: '#B76E79' },
  { name: 'Mauve', hex: '#9C6B8E' },
  { name: 'Lavender', hex: '#A78BFA' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Cream', hex: '#FDF8F5' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Terracotta', hex: '#CC5500' },
  { name: 'Plum', hex: '#8E4585' },
]

const emptyForm: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '',
  sizes: [],
  colors: [],
  categoryId: '',
  images: '',
  isActive: true,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminProductsView() {
  const { isAdmin } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#000000')
  const [showCustomColor, setShowCustomColor] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products || data || [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data.categories || data || [])
    } catch {
      toast.error('Failed to load categories')
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const openAddDialog = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setShowCustomColor(false)
    setDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      sizes: product.sizes || [],
      colors: product.colors || [],
      categoryId: product.categoryId || '',
      images: (product.images || []).join(', '),
      isActive: product.isActive,
    })
    setShowCustomColor(false)
    setDialogOpen(true)
  }

  const addPresetColor = (color: ColorOption) => {
    if (form.colors.some(c => c.name.toLowerCase() === color.name.toLowerCase())) {
      toast.error(`Color "${color.name}" already added`)
      return
    }
    setForm({ ...form, colors: [...form.colors, color] })
  }

  const addCustomColor = () => {
    if (!newColorName.trim()) {
      toast.error('Please enter a color name')
      return
    }
    if (form.colors.some(c => c.name.toLowerCase() === newColorName.toLowerCase())) {
      toast.error(`Color "${newColorName}" already added`)
      return
    }
    setForm({
      ...form,
      colors: [...form.colors, { name: newColorName.trim(), hex: newColorHex }],
    })
    setNewColorName('')
    setNewColorHex('#000000')
    setShowCustomColor(false)
  }

  const removeColor = (index: number) => {
    setForm({ ...form, colors: form.colors.filter((_, i) => i !== index) })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        sizes: form.sizes,
        colors: form.colors,
        categoryId: form.categoryId || null,
        images: form.images
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean),
        isActive: form.isActive,
      }

      const res = await fetch(
        editingProduct ? '/api/admin/products' : '/api/admin/products',
        {
          method: editingProduct ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save product')
      }

      toast.success(
        editingProduct ? 'Product updated successfully' : 'Product created successfully'
      )
      setDialogOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update product')
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`)
      fetchProducts()
    } catch {
      toast.error('Failed to update product')
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingProduct.id, isActive: false }),
      })
      if (!res.ok) throw new Error('Failed to delete product')
      toast.success('Product deactivated successfully')
      setDeleteOpen(false)
      setDeletingProduct(null)
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-heading text-primary">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AdminNav />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-heading text-primary">Products</h1>
          <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No products found. Click &quot;Add Product&quot; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Sizes</TableHead>
                    <TableHead>Colors</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">{product.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-accent font-semibold">
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(product.sizes || []).map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap items-center">
                          {(product.colors || []).length > 0 ? (
                            product.colors.map((color, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1 group"
                                title={color.name}
                              >
                                <span
                                  className="inline-block h-5 w-5 rounded-full border border-border shadow-sm"
                                  style={{ backgroundColor: color.hex }}
                                />
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleActive(product)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingProduct(product)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product details below.'
                : 'Fill in the details to create a new product.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-name">Name *</Label>
                <Input
                  id="prod-name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })
                  }}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-slug">Slug</Label>
                <Input
                  id="prod-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="product-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-price">Price *</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-stock">Stock</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <Label>Sizes</Label>
              <div className="flex gap-3 flex-wrap">
                {ALL_SIZES.map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <Checkbox
                      id={`size-${size}`}
                      checked={form.sizes.includes(size)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setForm({ ...form, sizes: [...form.sizes, size] })
                        } else {
                          setForm({ ...form, sizes: form.sizes.filter((s) => s !== size) })
                        }
                      }}
                    />
                    <Label htmlFor={`size-${size}`} className="text-sm font-normal cursor-pointer">
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Colors</Label>

              {/* Selected Colors */}
              {form.colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 bg-secondary rounded-full pl-1.5 pr-2.5 py-1 group"
                    >
                      <span
                        className="inline-block h-5 w-5 rounded-full border border-border/50 shadow-sm shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs font-medium text-foreground">{color.name}</span>
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preset Color Swatches */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Click to add a color:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.filter(
                    (pc) => !form.colors.some((fc) => fc.name.toLowerCase() === pc.name.toLowerCase())
                  ).map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => addPresetColor(color)}
                      title={color.name}
                      className="group relative h-7 w-7 rounded-full border-2 border-transparent hover:border-accent transition-all hover:scale-110 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    >
                      {color.hex === '#FFFFFF' || color.hex === '#FFFFF0' || color.hex === '#FDF8F5' ? (
                        <span className="absolute inset-0 rounded-full border border-border/50" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color */}
              <div>
                {!showCustomColor ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomColor(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Custom Color
                  </Button>
                ) : (
                  <div className="flex items-end gap-2 p-3 bg-secondary/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="e.g. Midnight"
                        className="h-8 text-sm w-28"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="h-8 w-8 rounded cursor-pointer border border-border"
                        />
                        <Input
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="h-8 text-sm w-24 font-mono"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addCustomColor}
                      className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomColor(false)}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => setForm({ ...form, categoryId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-images">Images (comma-separated URLs)</Label>
              <Input
                id="prod-images"
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="prod-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="prod-active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Deactivate Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deletingProduct?.name}&quot;? This will hide it from the store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
