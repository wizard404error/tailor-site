'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  ChevronDown,
  ChevronUp,
  Loader2,
  Scissors,
  MapPin,
  Calendar,
  XCircle,
  ShoppingBag,
} from 'lucide-react'
import { useAuthStore, useNavigationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  itemType: string
  itemId: string
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
}

interface Order {
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
  items: OrderItem[]
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

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AccountOrdersView() {
  const { user, isLoggedIn } = useAuthStore()
  const { navigate } = useNavigationStore()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('login')
      return
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : data.orders || [])
      } catch {
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isLoggedIn, user, navigate])

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to cancel order')
        return
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      )
      toast.success('Order cancelled successfully')
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId))
  }

  if (!isLoggedIn || !user) return null

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t placed any orders yet. Start exploring our collection!
              </p>
              <Button
                onClick={() => navigate('home')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id
              const canCancel = order.status === 'pending'

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      {/* Order Header */}
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-heading font-semibold text-sm sm:text-base">
                                Order #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                {' · '}
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            <Badge className={`${getStatusBadgeColor(order.status)} border text-xs`}>
                              {formatStatus(order.status)}
                            </Badge>
                            <span className="font-heading font-bold text-sm sm:text-base">
                              ${order.total.toFixed(2)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border space-y-4">
                              {/* Items */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Items
                                </h4>
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-lg bg-secondary/30"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="text-sm font-medium">{item.itemName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="secondary" className="text-xs">
                                            {item.itemType}
                                          </Badge>
                                          {item.size && (
                                            <span className="text-xs text-muted-foreground">
                                              Size: {item.size}
                                            </span>
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            Qty: {item.quantity}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="font-heading font-bold text-sm">
                                        ${(item.priceAtBooking * item.quantity).toFixed(2)}
                                      </p>
                                    </div>

                                    {/* Measurement Data */}
                                    {item.itemType === 'service' &&
                                      item.measurementData &&
                                      Object.keys(item.measurementData).length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-border">
                                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {Object.entries(item.measurementData).map(
                                              ([key, value]) => (
                                                <span
                                                  key={key}
                                                  className="text-xs text-muted-foreground"
                                                >
                                                  {key}:{' '}
                                                  <span className="text-foreground">
                                                    {String(value)}
                                                  </span>
                                                </span>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Appointment */}
                                    {item.appointment && (
                                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-accent" />
                                        <span className="text-xs text-muted-foreground">
                                          Appointment:{' '}
                                          {new Date(
                                            item.appointment.preferredDate
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Shipping Address */}
                              <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Shipping Address
                                </h4>
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-3 h-3 text-accent mt-1 flex-shrink-0" />
                                  <p className="text-sm text-foreground">
                                    {order.shippingAddress?.street || ''}
                                    <br />
                                    {order.shippingAddress?.city || ''}
                                    {order.shippingAddress?.city && order.shippingAddress?.state
                                      ? ', '
                                      : ''}
                                    {order.shippingAddress?.state || ''}{' '}
                                    {order.shippingAddress?.zip || ''}
                                    <br />
                                    {order.shippingAddress?.country || ''}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              {/* Totals */}
                              <div className="space-y-1">
                                {order.discountAmount > 0 && (
                                  <div className="flex justify-between text-sm text-green-600">
                                    <span>
                                      Discount
                                      {order.couponCode ? ` (${order.couponCode})` : ''}
                                    </span>
                                    <span>-${order.discountAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-heading font-bold">
                                  <span>Total</span>
                                  <span>${order.total.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Cancel Button */}
                              {canCancel && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={cancellingId === order.id}
                                >
                                  {cancellingId === order.id ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
