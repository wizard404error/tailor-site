'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  minOrderValue: number | null
  expiresAt: string | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  createdAt: string
}

interface CouponFormData {
  code: string
  discountType: string
  discountValue: string
  minOrderValue: string
  expiresAt: string
  usageLimit: string
  isActive: boolean
}

const emptyForm: CouponFormData = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  minOrderValue: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminCouponsView() {
  const { isAdmin } = useAuthStore()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CouponFormData>(emptyForm)

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/coupons')
      if (!res.ok) throw new Error('Failed to fetch coupons')
      const data = await res.json()
      setCoupons(Array.isArray(data) ? data : data.coupons || [])
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const openAddDialog = () => {
    setEditingCoupon(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderValue: coupon.minOrderValue ? coupon.minOrderValue.toString() : '',
      expiresAt: coupon.expiresAt
        ? format(new Date(coupon.expiresAt), 'yyyy-MM-dd')
        : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      isActive: coupon.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.code || !form.discountValue) {
      toast.error('Code and discount value are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null,
        expiresAt: form.expiresAt || null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        isActive: form.isActive,
      }

      let res: Response
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save coupon')
      }

      toast.success(
        editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully'
      )
      setDialogOpen(false)
      fetchCoupons()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCoupon) return
    try {
      const res = await fetch(`/api/admin/coupons/${deletingCoupon.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete coupon')
      }
      toast.success('Coupon deleted successfully')
      setDeleteOpen(false)
      setDeletingCoupon(null)
      fetchCoupons()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete coupon')
    }
  }

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-heading text-primary">Coupons</h1>
          <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No coupons found. Click &quot;Add Coupon&quot; to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Usage Limit</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-semibold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {coupon.discountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-accent font-semibold">
                      {coupon.discountType === 'percent'
                        ? `${coupon.discountValue}%`
                        : `$${coupon.discountValue.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {coupon.minOrderValue
                        ? `$${coupon.minOrderValue.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {coupon.expiresAt ? (
                        <span className={isExpired(coupon) ? 'text-destructive' : ''}>
                          {format(new Date(coupon.expiresAt), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.usageLimit ?? '∞'}
                    </TableCell>
                    <TableCell>{coupon.usedCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !coupon.isActive
                            ? 'secondary'
                            : isExpired(coupon)
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        {!coupon.isActive
                          ? 'Inactive'
                          : isExpired(coupon)
                            ? 'Expired'
                            : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingCoupon(coupon)
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
          )}
        </div>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">
              {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? 'Update coupon details below.'
                : 'Fill in the details to create a new coupon.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code *</Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="SAVE20"
                className="uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-type">Discount Type *</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(value) => setForm({ ...form, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {form.discountType === 'percent' ? 'Discount %' : 'Discount $'} *
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  step={form.discountType === 'percent' ? '1' : '0.01'}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === 'percent' ? '20' : '10.00'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-min">Min Order Value</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  step="0.01"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-limit">Usage Limit</Label>
                <Input
                  id="coupon-limit"
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-expiry">Expiry Date</Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="coupon-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="coupon-active" className="cursor-pointer">
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
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon &quot;{deletingCoupon?.code}&quot;? This action cannot be undone.
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
