'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Scissors,
  Calendar,
} from 'lucide-react'
import { useNavigationStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface TrackedOrder {
  id: string
  customerName: string
  customerEmail: string
  phone: string
  shippingAddress: Record<string, string>
  total: number
  couponCode?: string
  discountAmount: number
  status: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    itemType: string
    itemName: string
    quantity: number
    priceAtBooking: number
    size?: string
    measurementData?: Record<string, unknown>
    appointment?: {
      id: string
      preferredDate: string
      status: string
      notes?: string
    } | null
  }>
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Circle },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'in_production', label: 'In Production', icon: Scissors },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function getStatusIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    in_production: 'bg-orange-100 text-orange-800 border-orange-200',
    ready_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function OrderTrackingView() {
  const { pageParams, navigate } = useNavigationStore()
  const [email, setEmail] = useState(pageParams.email || '')
  const [orderId, setOrderId] = useState(pageParams.orderId || '')
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Auto-fetch if params provided
  useEffect(() => {
    if (pageParams.email && pageParams.orderId) {
      handleTrackOrder(pageParams.email, pageParams.orderId)
    }
  }, [])

  const handleTrackOrder = async (emailVal?: string, orderIdVal?: string) => {
    const e = emailVal || email
    const o = orderIdVal || orderId

    if (!e.trim() || !o.trim()) {
      toast.error('Please enter both email and order ID')
      return
    }

    setLoading(true)
    setNotFound(false)
    setOrder(null)

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e.trim(), orderId: o.trim() }),
      })

      if (res.status === 404) {
        setNotFound(true)
        return
      }

      const data = await res.json()
      if (data.error) {
        setNotFound(true)
        return
      }

      setOrder(data)
    } catch {
      toast.error('Failed to track order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentStatusIdx = order ? getStatusIndex(order.status) : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Track Your Order
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter your email and order ID to check your order status
        </p>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="track-email">Email Address</Label>
                <Input
                  id="track-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track-order-id">Order ID</Label>
                <Input
                  id="track-order-id"
                  placeholder="clxxxxxx..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleTrackOrder()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Track Order
            </Button>
          </CardContent>
        </Card>

        {/* Not Found */}
        {notFound && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Package className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">Order Not Found</h3>
                <p className="text-muted-foreground text-sm">
                  We couldn&apos;t find an order matching the provided email and order ID.
                  Please double-check your information.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold">Order {order.id.slice(0, 8)}...</h2>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Badge className={`${getStatusBadgeColor(order.status)} border`}>
                {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Badge>
            </div>

            {/* Status Timeline */}
            {order.status !== 'cancelled' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold mb-6">Order Status</h3>
                  <div className="relative">
                    {/* Progress Bar */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-border">
                      <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${(currentStatusIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="flex justify-between relative">
                      {STATUS_STEPS.map((step, idx) => {
                        const StepIcon = step.icon
                        const isCompleted = idx <= currentStatusIdx
                        const isCurrent = idx === currentStatusIdx
                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors ${
                                isCompleted
                                  ? 'bg-accent border-accent text-accent-foreground'
                                  : 'bg-card border-border text-muted-foreground'
                              } ${isCurrent ? 'ring-2 ring-accent/30 ring-offset-2' : ''}`}
                            >
                              <StepIcon className="w-5 h-5" />
                            </div>
                            <span
                              className={`text-xs mt-2 text-center max-w-[80px] ${
                                isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.itemName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.itemType}
                          </Badge>
                          {item.size && (
                            <span className="text-xs text-muted-foreground">Size: {item.size}</span>
                          )}
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <p className="font-heading font-bold text-sm">
                        {formatPrice(item.priceAtBooking * item.quantity)}
                      </p>
                    </div>

                    {/* Measurement Data for Services */}
                    {item.itemType === 'service' && item.measurementData && Object.keys(item.measurementData).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Measurements:</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(item.measurementData).map(([key, value]) => (
                            <span key={key} className="text-xs text-muted-foreground">
                              {key}: <span className="text-foreground">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Appointment */}
                    {item.appointment && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-accent" />
                        <span className="text-xs text-muted-foreground">
                          Appointment: {new Date(item.appointment.preferredDate).toLocaleDateString()}
                          {item.appointment.status && ` (${item.appointment.status})`}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-heading font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <h3 className="font-heading font-semibold">Shipping Address</h3>
                </div>
                <p className="text-sm text-foreground">
                  {order.customerName}<br />
                  {order.shippingAddress?.street || ''}<br />
                  {order.shippingAddress?.city || ''}{order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}{order.shippingAddress?.state || ''} {order.shippingAddress?.zip || ''}<br />
                  {order.shippingAddress?.country || ''}
                </p>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Clock className="w-3 h-3" />
              Last updated: {new Date(order.updatedAt).toLocaleString()}
            </div>
          </motion.div>
        )}

        {/* No order and no search yet */}
        {!order && !notFound && !loading && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Enter your details above to track your order</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
