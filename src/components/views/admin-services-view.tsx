'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/lib/store'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeasurementField {
  name: string
  label: string
  type: 'number' | 'select' | 'text'
  required: boolean
  options?: string[]
}

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  turnaroundDays: number
  measurementSchema: Record<string, MeasurementField>
  requiresAppointment: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ServiceFormData {
  name: string
  slug: string
  description: string
  basePrice: string
  turnaroundDays: string
  measurementSchema: MeasurementField[]
  requiresAppointment: boolean
  isActive: boolean
}

const emptyForm: ServiceFormData = {
  name: '',
  slug: '',
  description: '',
  basePrice: '',
  turnaroundDays: '7',
  measurementSchema: [],
  requiresAppointment: false,
  isActive: true,
}

const emptyField: MeasurementField = {
  name: '',
  label: '',
  type: 'number',
  required: false,
  options: [],
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminServicesView() {
  const { isAdmin } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ServiceFormData>(emptyForm)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error('Failed to fetch services')
      const data = await res.json()
      setServices(data.services || data || [])
    } catch {
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const schemaToArray = (schema: Record<string, MeasurementField>): MeasurementField[] => {
    if (!schema || typeof schema !== 'object') return []
    return Object.entries(schema).map(([key, val]) => ({
      ...val,
      name: key,
    }))
  }

  const arrayToSchema = (fields: MeasurementField[]): Record<string, MeasurementField> => {
    const schema: Record<string, MeasurementField> = {}
    for (const field of fields) {
      if (field.name) {
        schema[field.name] = {
          label: field.label,
          type: field.type,
          required: field.required,
          ...(field.type === 'select' ? { options: field.options || [] } : {}),
        }
      }
    }
    return schema
  }

  const openAddDialog = () => {
    setEditingService(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setForm({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      basePrice: service.basePrice.toString(),
      turnaroundDays: service.turnaroundDays.toString(),
      measurementSchema: schemaToArray(service.measurementSchema),
      requiresAppointment: service.requiresAppointment,
      isActive: service.isActive,
    })
    setDialogOpen(true)
  }

  const updateField = (index: number, updates: Partial<MeasurementField>) => {
    const updated = [...form.measurementSchema]
    updated[index] = { ...updated[index], ...updates }
    setForm({ ...form, measurementSchema: updated })
  }

  const addField = () => {
    setForm({ ...form, measurementSchema: [...form.measurementSchema, { ...emptyField }] })
  }

  const removeField = (index: number) => {
    setForm({
      ...form,
      measurementSchema: form.measurementSchema.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.basePrice) {
      toast.error('Name and base price are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...(editingService ? { id: editingService.id } : {}),
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description || null,
        basePrice: parseFloat(form.basePrice),
        turnaroundDays: parseInt(form.turnaroundDays) || 7,
        measurementSchema: arrayToSchema(form.measurementSchema),
        requiresAppointment: form.requiresAppointment,
        isActive: form.isActive,
      }

      const res = await fetch('/api/admin/services', {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save service')
      }

      toast.success(
        editingService ? 'Service updated successfully' : 'Service created successfully'
      )
      setDialogOpen(false)
      fetchServices()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingService.id, isActive: false }),
      })
      if (!res.ok) throw new Error('Failed to deactivate service')
      toast.success('Service deactivated successfully')
      setDeleteOpen(false)
      setDeletingService(null)
      fetchServices()
    } catch {
      toast.error('Failed to deactivate service')
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-heading text-primary">Services</h1>
          <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
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
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No services found. Click &quot;Add Service&quot; to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Turnaround</TableHead>
                  <TableHead>Measurement Fields</TableHead>
                  <TableHead>Requires Appointment</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-accent font-semibold">
                      ${service.basePrice.toFixed(2)}
                    </TableCell>
                    <TableCell>{service.turnaroundDays} days</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {Object.keys(service.measurementSchema || {}).length} fields
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.requiresAppointment ? 'default' : 'outline'}>
                        {service.requiresAppointment ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingService(service)
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">
              {editingService ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? 'Update service details below.'
                : 'Fill in the details to create a new service.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-name">Name *</Label>
                <Input
                  id="svc-name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })
                  }}
                  placeholder="Service name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-slug">Slug</Label>
                <Input
                  id="svc-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="service-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Service description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-price">Base Price *</Label>
                <Input
                  id="svc-price"
                  type="number"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-turnaround">Turnaround Days</Label>
                <Input
                  id="svc-turnaround"
                  type="number"
                  value={form.turnaroundDays}
                  onChange={(e) => setForm({ ...form, turnaroundDays: e.target.value })}
                  placeholder="7"
                />
              </div>
            </div>

            {/* Measurement Schema Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Measurement Schema</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Field
                </Button>
              </div>

              {form.measurementSchema.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No measurement fields. Click &quot;Add Field&quot; to define what measurements this service requires.
                </p>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {form.measurementSchema.map((field, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg space-y-2 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Field {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Field Name (key)</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value })}
                          placeholder="chest"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Chest Measurement"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: 'number' | 'select' | 'text') =>
                            updateField(index, { type: value, options: value === 'select' ? field.options || [] : [] })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 pb-1">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, { required: checked })}
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                      <div></div>
                    </div>
                    {field.type === 'select' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={(field.options || []).join(', ')}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value
                                .split(',')
                                .map((o) => o.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Small, Medium, Large"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="svc-appointment"
                checked={form.requiresAppointment}
                onCheckedChange={(checked) =>
                  setForm({ ...form, requiresAppointment: checked })
                }
              />
              <Label htmlFor="svc-appointment" className="cursor-pointer">
                Requires Appointment
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="svc-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="svc-active" className="cursor-pointer">
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
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Deactivate Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deletingService?.name}&quot;? This will hide it from the store.
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
