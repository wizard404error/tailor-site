'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, ChevronUp, ChevronDown, ImageOff } from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/lib/store'
import { AdminNav } from '@/components/store/admin-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceOption {
  id: string
  name: string
}

interface PortfolioItem {
  id: string
  title: string
  imageUrl: string
  description: string | null
  serviceId: string | null
  order: number
  service: ServiceOption | null
}

interface PortfolioFormData {
  title: string
  imageUrl: string
  description: string
  serviceId: string
  order: string
}

const emptyForm: PortfolioFormData = {
  title: '',
  imageUrl: '',
  description: '',
  serviceId: '',
  order: '0',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminPortfolioView() {
  const { isAdmin } = useAuthStore()
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PortfolioFormData>(emptyForm)

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/portfolio')
      if (!res.ok) throw new Error('Failed to fetch portfolio')
      const data = await res.json()
      const items = (data.portfolio || data || []).sort(
        (a: PortfolioItem, b: PortfolioItem) => a.order - b.order
      )
      setPortfolio(items)
    } catch {
      toast.error('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error('Failed to fetch services')
      const data = await res.json()
      const svcList = data.services || data || []
      setServices(
        svcList.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))
      )
    } catch {
      toast.error('Failed to load services')
    }
  }, [])

  useEffect(() => {
    fetchPortfolio()
    fetchServices()
  }, [fetchPortfolio, fetchServices])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm({ ...emptyForm, order: String(portfolio.length) })
    setDialogOpen(true)
  }

  const openEditDialog = (item: PortfolioItem) => {
    setEditingItem(item)
    setForm({
      title: item.title,
      imageUrl: item.imageUrl,
      description: item.description || '',
      serviceId: item.serviceId || '',
      order: item.order.toString(),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.imageUrl) {
      toast.error('Title and image URL are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...(editingItem ? { id: editingItem.id } : {}),
        title: form.title,
        imageUrl: form.imageUrl,
        description: form.description || null,
        serviceId: form.serviceId || null,
        order: parseInt(form.order) || 0,
      }

      const res = await fetch('/api/admin/portfolio', {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save portfolio item')
      }

      toast.success(
        editingItem
          ? 'Portfolio item updated successfully'
          : 'Portfolio item created successfully'
      )
      setDialogOpen(false)
      fetchPortfolio()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save portfolio item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingItem.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete portfolio item')
      }
      toast.success('Portfolio item deleted successfully')
      setDeleteOpen(false)
      setDeletingItem(null)
      fetchPortfolio()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete portfolio item')
    }
  }

  const handleMoveUp = async (item: PortfolioItem, index: number) => {
    if (index === 0) return
    const prevItem = portfolio[index - 1]
    try {
      await fetch('/api/admin/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, order: prevItem.order }),
      })
      await fetch('/api/admin/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prevItem.id, order: item.order }),
      })
      fetchPortfolio()
    } catch {
      toast.error('Failed to reorder items')
    }
  }

  const handleMoveDown = async (item: PortfolioItem, index: number) => {
    if (index === portfolio.length - 1) return
    const nextItem = portfolio[index + 1]
    try {
      await fetch('/api/admin/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, order: nextItem.order }),
      })
      await fetch('/api/admin/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nextItem.id, order: item.order }),
      })
      fetchPortfolio()
    } catch {
      toast.error('Failed to reorder items')
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
      <AdminNav />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-heading text-primary">Portfolio</h1>
          <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : portfolio.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground rounded-lg border bg-card">
            No portfolio items found. Click &quot;Add Item&quot; to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portfolio.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="group rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-muted">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      #{item.order}
                    </Badge>
                  </div>
                  {item.service && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {item.service.name}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="font-heading text-primary font-semibold line-clamp-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(item, index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(item, index)}
                        disabled={index === portfolio.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingItem(item)
                          setDeleteOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">
              {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update portfolio item details below.'
                : 'Fill in the details to add a new portfolio item.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="port-title">Title *</Label>
              <Input
                id="port-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Portfolio item title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port-image">Image URL *</Label>
              <Input
                id="port-image"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port-desc">Description</Label>
              <Textarea
                id="port-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe this portfolio item"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port-service">Service</Label>
                <Select
                  value={form.serviceId}
                  onValueChange={(value) => setForm({ ...form, serviceId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((svc) => (
                      <SelectItem key={svc.id} value={svc.id}>
                        {svc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="port-order">Order</Label>
                <Input
                  id="port-order"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete Portfolio Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
