'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Package, MapPin, Mail, Banknote, ArrowRight, Loader2 } from 'lucide-react'
import { useNavigationStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface OrderData {
  id: string
  customerName: string
  customerEmail: string
  phone: string
  shippingAddress: Record<string, string>
  total: number
  couponCode?: string
  discountAmount: number
  status: string
  items: Array<{
    id: string
    itemType: string
    itemName: string
    quantity: number
    priceAtBooking: number
    size?: string
    measurementData?: Record<string, unknown>
  }>
  createdAt: string
}

export function OrderConfirmationView() {
  const { pageParams, navigate } = useNavigationStore()
  const orderId = pageParams.id

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) {
          setError('Order not found')
          return
        }
        const data = await res.json()
        setOrder(data)
      } catch {
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
            {error || 'Order Not Found'}
          </h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find the order you&apos;re looking for.
          </p>
          <Button onClick={() => navigate('home')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Return Home
          </Button>
        </motion.div>
      </div>
    )
  }

  const shippingAddr = order.shippingAddress || {}

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="flex justify-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground">Thank you for your purchase</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {/* Order ID Card */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Order ID</p>
            <p className="font-heading text-xl font-bold text-primary tracking-wider">
              {order.id}
            </p>
          </CardContent>
        </Card>

        {/* COD Notice */}
        <Card className="mb-6 border-accent/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="w-6 h-6 text-accent flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">
                Pay when you receive your order. No online payment required.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Notice */}
        <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary/50 mb-6">
          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation shortly at <strong>{order.customerEmail}</strong>
          </p>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-heading font-semibold text-lg">Order Summary</h3>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.itemName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">
                        {item.itemType}
                      </Badge>
                      {item.size && (
                        <span className="text-xs text-muted-foreground">Size: {item.size}</span>
                      )}
                      <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                    </div>
                  </div>
                  <p className="font-heading font-bold text-sm">
                    {formatPrice(item.priceAtBooking * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatPrice(order.items.reduce((s, i) => s + i.priceAtBooking * i.quantity, 0))}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="font-heading font-semibold">Shipping Address</h3>
            </div>
            <p className="text-sm text-foreground">
              {order.customerName}<br />
              {shippingAddr.street || ''}<br />
              {shippingAddr.city || ''}{shippingAddr.city && shippingAddr.state ? ', ' : ''}{shippingAddr.state || ''} {shippingAddr.zip || ''}<br />
              {shippingAddr.country || ''}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('order-tracking', { email: order.customerEmail, orderId: order.id })}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Package className="w-4 h-4 mr-2" />
            Track Your Order
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('home')}
            className="flex-1"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
