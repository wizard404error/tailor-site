'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Plus, Minus, Trash2, Tag, ArrowRight, Scissors, Calendar } from 'lucide-react'
import { useCartStore, useNavigationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

interface CouponResult {
  valid: boolean
  discountAmount: number
  coupon?: {
    code: string
    discountType: string
    discountValue: number
  }
  error?: string
}

export function CartView() {
  const { items, removeItem, updateQuantity, total } = useCartStore()
  const { navigate } = useNavigationStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const subtotal = total()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderValue: subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setCouponResult(data)
        toast.success(`Coupon applied! You save ${formatPrice(data.discountAmount)}`)
      } else {
        setCouponResult(null)
        toast.error(data.error || 'Invalid coupon code')
      }
    } catch {
      toast.error('Failed to validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const discountAmount = couponResult?.valid ? couponResult.discountAmount : 0
  const grandTotal = Math.max(0, subtotal - discountAmount)

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Discover our exquisite collection of bespoke garments and luxury tailoring services
          </p>
          <Button
            onClick={() => navigate('home')}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Browse Collection
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.itemType === 'service' ? (
                                <Scissors className="w-8 h-8 text-muted-foreground" />
                              ) : (
                                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-heading font-semibold text-foreground text-sm sm:text-base">
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {item.itemType === 'service' ? 'Service' : 'Product'}
                                </Badge>
                                {item.size && (
                                  <span className="text-xs text-muted-foreground">Size: {item.size}</span>
                                )}
                                {item.color && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {item.size && <span>·</span>}
                                    {item.colorHex ? (
                                      <span
                                        className="inline-block h-3 w-3 rounded-full border border-border/50"
                                        style={{ backgroundColor: item.colorHex }}
                                      />
                                    ) : null}
                                    {item.color}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() => {
                                removeItem(item.id)
                                toast.success('Item removed from cart')
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Service-specific info */}
                          {item.itemType === 'service' && (
                            <div className="mt-2 space-y-1">
                              {item.measurementData && Object.keys(item.measurementData).length > 0 ? (
                                <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">
                                  Measurements Added
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => navigate('checkout')}
                                >
                                  Add Measurements
                                </Button>
                              )}
                              {item.appointmentDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  Appointment: {new Date(item.appointmentDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.price)} each
                              </p>
                              <p className="font-heading font-bold text-foreground">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {couponResult?.valid && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({couponResult.coupon?.code})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-heading font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          if (couponResult) setCouponResult(null)
                        }}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </Button>
                  </div>
                  {couponResult?.valid && (
                    <p className="text-xs text-green-600">
                      Coupon applied! Saving {formatPrice(discountAmount)}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                  onClick={() => navigate('checkout')}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => navigate('home')}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
