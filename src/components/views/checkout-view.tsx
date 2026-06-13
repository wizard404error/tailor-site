'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Truck,
  Scissors,
  CreditCard,
  Banknote,
  ShieldCheck,
} from 'lucide-react'
import { useCartStore, useAuthStore, useNavigationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface MeasurementField {
  key: string
  label: string
  type: 'number' | 'select' | 'text'
  unit?: string
  options?: string[]
}

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

const STEPS = [
  { label: 'Contact & Shipping', icon: Truck },
  { label: 'Measurements', icon: Scissors },
  { label: 'Review & Place', icon: CreditCard },
]

export function CheckoutView() {
  const { items, total, updateMeasurement, clearCart } = useCartStore()
  const { user, isLoggedIn } = useAuthStore()
  const { navigate } = useNavigationStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1 state
  const [contactInfo, setContactInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  })
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({})

  // Step 2 state
  const [measurementSchemas, setMeasurementSchemas] = useState<Record<string, MeasurementField[]>>({})
  const [schemasLoading, setSchemasLoading] = useState(false)
  const [measurementErrors, setMeasurementErrors] = useState<Record<string, string>>({})

  // Step 3 state
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const serviceItems = items.filter((i) => i.itemType === 'service')
  const hasServices = serviceItems.length > 0
  const effectiveSteps = hasServices ? STEPS : [STEPS[0], STEPS[2]]
  const subtotal = total()

  // Pre-fill contact info when user data is available
  useEffect(() => {
    if (user) {
      setContactInfo((prev) => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
      }))
    }
  }, [user])

  // Fetch measurement schemas for service items
  useEffect(() => {
    if (currentStep === 1 && hasServices) {
      const fetchSchemas = async () => {
        setSchemasLoading(true)
        const schemas: Record<string, MeasurementField[]> = {}
        for (const item of serviceItems) {
          try {
            const res = await fetch(`/api/services/${item.itemId}`)
            const data = await res.json()
            if (data.measurementSchema && typeof data.measurementSchema === 'object') {
              const fields: MeasurementField[] = Object.entries(data.measurementSchema).map(
                ([key, def]: [string, unknown]) => {
                  const defObj = def as Record<string, unknown>
                  return {
                    key,
                    label: (defObj.label as string) || key,
                    type: (defObj.type as 'number' | 'select' | 'text') || 'number',
                    unit: defObj.unit as string | undefined,
                    options: defObj.options as string[] | undefined,
                  }
                }
              )
              schemas[item.id] = fields
            }
          } catch {
            // Schema fetch failed, allow empty
            schemas[item.id] = []
          }
        }
        setMeasurementSchemas(schemas)
        setSchemasLoading(false)
      }
      fetchSchemas()
    }
  }, [currentStep, hasServices])

  const validateContact = (): boolean => {
    const errors: Record<string, string> = {}
    if (!contactInfo.name.trim()) errors.name = 'Name is required'
    if (!contactInfo.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) errors.email = 'Invalid email'
    if (!contactInfo.phone.trim()) errors.phone = 'Phone is required'
    if (!contactInfo.street.trim()) errors.street = 'Street address is required'
    if (!contactInfo.city.trim()) errors.city = 'City is required'
    if (!contactInfo.state.trim()) errors.state = 'State is required'
    if (!contactInfo.zip.trim()) errors.zip = 'ZIP code is required'
    if (!contactInfo.country.trim()) errors.country = 'Country is required'
    setContactErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateMeasurements = (): boolean => {
    const errors: Record<string, string> = {}
    for (const item of serviceItems) {
      const fields = measurementSchemas[item.id] || []
      const data = item.measurementData || {}
      for (const field of fields) {
        if (!data[field.key] && data[field.key] !== 0) {
          errors[`${item.id}-${field.key}`] = `${field.label} is required`
        }
      }
    }
    setMeasurementErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateContact()) {
        toast.error('Please fill in all required fields')
        return
      }
    }
    if (currentStep === 1) {
      if (!validateMeasurements()) {
        toast.error('Please fill in all measurement fields')
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, effectiveSteps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

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
        toast.success(`Coupon applied! You save $${data.discountAmount.toFixed(2)}`)
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

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    setIsSubmitting(true)
    try {
      const orderItems = items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.name,
        quantity: item.quantity,
        priceAtBooking: item.price,
        size: item.size || undefined,
        measurementData: item.measurementData || undefined,
        appointmentDate: item.appointmentDate || undefined,
      }))

      const body: Record<string, unknown> = {
        customerName: contactInfo.name,
        customerEmail: contactInfo.email,
        phone: contactInfo.phone,
        shippingAddress: {
          street: contactInfo.street,
          city: contactInfo.city,
          state: contactInfo.state,
          zip: contactInfo.zip,
          country: contactInfo.country,
        },
        items: orderItems,
        couponCode: couponResult?.valid ? couponResult.coupon?.code : undefined,
      }

      if (isLoggedIn && user) {
        body.userId = user.id
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to place order')
        return
      }

      clearCart()
      toast.success('Order placed successfully!')
      navigate('order-confirmation', { id: data.id })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your cart before checking out</p>
          <Button onClick={() => navigate('home')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Browse Collection
          </Button>
        </motion.div>
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
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-10">
          {effectiveSteps.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = idx === currentStep
            const isCompleted = idx < currentStep
            return (
              <div key={idx} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? 'bg-accent border-accent text-accent-foreground'
                        : isActive
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < effectiveSteps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors ${
                      idx < currentStep ? 'bg-accent' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Contact & Shipping */}
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Contact & Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={contactInfo.name}
                        onChange={(e) => {
                          setContactInfo({ ...contactInfo, name: e.target.value })
                          if (contactErrors.name) setContactErrors({ ...contactErrors, name: '' })
                        }}
                        placeholder="Your full name"
                        className={contactErrors.name ? 'border-destructive' : ''}
                      />
                      {contactErrors.name && (
                        <p className="text-xs text-destructive">{contactErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => {
                          setContactInfo({ ...contactInfo, email: e.target.value })
                          if (contactErrors.email) setContactErrors({ ...contactErrors, email: '' })
                        }}
                        placeholder="your@email.com"
                        className={contactErrors.email ? 'border-destructive' : ''}
                      />
                      {contactErrors.email && (
                        <p className="text-xs text-destructive">{contactErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={contactInfo.phone}
                        onChange={(e) => {
                          setContactInfo({ ...contactInfo, phone: e.target.value })
                          if (contactErrors.phone) setContactErrors({ ...contactErrors, phone: '' })
                        }}
                        placeholder="+1 (555) 000-0000"
                        className={contactErrors.phone ? 'border-destructive' : ''}
                      />
                      {contactErrors.phone && (
                        <p className="text-xs text-destructive">{contactErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-4">Shipping Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="street">Street Address *</Label>
                        <Input
                          id="street"
                          value={contactInfo.street}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, street: e.target.value })
                            if (contactErrors.street) setContactErrors({ ...contactErrors, street: '' })
                          }}
                          placeholder="123 Main Street"
                          className={contactErrors.street ? 'border-destructive' : ''}
                        />
                        {contactErrors.street && (
                          <p className="text-xs text-destructive">{contactErrors.street}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={contactInfo.city}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, city: e.target.value })
                            if (contactErrors.city) setContactErrors({ ...contactErrors, city: '' })
                          }}
                          placeholder="City"
                          className={contactErrors.city ? 'border-destructive' : ''}
                        />
                        {contactErrors.city && (
                          <p className="text-xs text-destructive">{contactErrors.city}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State / Province *</Label>
                        <Input
                          id="state"
                          value={contactInfo.state}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, state: e.target.value })
                            if (contactErrors.state) setContactErrors({ ...contactErrors, state: '' })
                          }}
                          placeholder="State"
                          className={contactErrors.state ? 'border-destructive' : ''}
                        />
                        {contactErrors.state && (
                          <p className="text-xs text-destructive">{contactErrors.state}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP / Postal Code *</Label>
                        <Input
                          id="zip"
                          value={contactInfo.zip}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, zip: e.target.value })
                            if (contactErrors.zip) setContactErrors({ ...contactErrors, zip: '' })
                          }}
                          placeholder="12345"
                          className={contactErrors.zip ? 'border-destructive' : ''}
                        />
                        {contactErrors.zip && (
                          <p className="text-xs text-destructive">{contactErrors.zip}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={contactInfo.country}
                          onChange={(e) => {
                            setContactInfo({ ...contactInfo, country: e.target.value })
                            if (contactErrors.country) setContactErrors({ ...contactErrors, country: '' })
                          }}
                          placeholder="Country"
                          className={contactErrors.country ? 'border-destructive' : ''}
                        />
                        {contactErrors.country && (
                          <p className="text-xs text-destructive">{contactErrors.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Measurements (only if cart has service items) */}
          {currentStep === 1 && hasServices && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Measurement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {schemasLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    serviceItems.map((item) => {
                      const fields = measurementSchemas[item.id] || []
                      const data = item.measurementData || {}
                      if (fields.length === 0) {
                        return (
                          <div key={item.id} className="p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-heading font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              No measurements required for this service.
                            </p>
                          </div>
                        )
                      }
                      return (
                        <div key={item.id} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-accent" />
                            <h4 className="font-heading font-semibold">{item.name}</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {fields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <Label>
                                  {field.label}
                                  {field.unit && (
                                    <span className="text-muted-foreground ml-1">({field.unit})</span>
                                  )}
                                </Label>
                                {field.type === 'select' && field.options ? (
                                  <Select
                                    value={(data[field.key] as string) || ''}
                                    onValueChange={(val) => {
                                      updateMeasurement(item.id, { ...data, [field.key]: val })
                                      if (measurementErrors[`${item.id}-${field.key}`]) {
                                        const newErrors = { ...measurementErrors }
                                        delete newErrors[`${item.id}-${field.key}`]
                                        setMeasurementErrors(newErrors)
                                      }
                                    }}
                                  >
                                    <SelectTrigger
                                      className={
                                        measurementErrors[`${item.id}-${field.key}`]
                                          ? 'border-destructive'
                                          : ''
                                      }
                                    >
                                      <SelectValue placeholder={`Select ${field.label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={data[field.key] ?? ''}
                                    onChange={(e) => {
                                      const val =
                                        field.type === 'number'
                                          ? e.target.value === ''
                                            ? ''
                                            : parseFloat(e.target.value)
                                          : e.target.value
                                      updateMeasurement(item.id, { ...data, [field.key]: val })
                                      if (measurementErrors[`${item.id}-${field.key}`]) {
                                        const newErrors = { ...measurementErrors }
                                        delete newErrors[`${item.id}-${field.key}`]
                                        setMeasurementErrors(newErrors)
                                      }
                                    }}
                                    placeholder={`Enter ${field.label}`}
                                    className={
                                      measurementErrors[`${item.id}-${field.key}`]
                                        ? 'border-destructive'
                                        : ''
                                    }
                                  />
                                )}
                                {measurementErrors[`${item.id}-${field.key}`] && (
                                  <p className="text-xs text-destructive">
                                    {measurementErrors[`${item.id}-${field.key}`]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          <Separator />
                        </div>
                      )
                    })
                  )}

                  {isLoggedIn && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm text-foreground">
                        <ShieldCheck className="w-4 h-4 inline mr-1 text-accent" />
                        Your measurements will be saved to your profile for future orders.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3 (or Step 2 if no services): Review & Place Order */}
          {(currentStep === (hasServices ? 2 : 1)) && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Review & Place Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* COD Notice */}
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-3">
                    <Banknote className="w-6 h-6 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        You will pay upon delivery. No online payment required.
                      </p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground ml-auto">COD</Badge>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Order Items
                    </h4>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                            {item.itemType === 'service' ? (
                              <Scissors className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.itemType}
                              </Badge>
                              {item.size && (
                                <span className="text-xs text-muted-foreground">Size: {item.size}</span>
                              )}
                              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-heading font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Shipping Address
                    </h4>
                    <p className="text-sm text-foreground">
                      {contactInfo.name}<br />
                      {contactInfo.street}<br />
                      {contactInfo.city}, {contactInfo.state} {contactInfo.zip}<br />
                      {contactInfo.country}
                    </p>
                    <p className="text-sm text-muted-foreground">{contactInfo.email} · {contactInfo.phone}</p>
                  </div>

                  <Separator />

                  {/* Coupon */}
                  <div className="space-y-2">
                    <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Coupon Code
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          if (couponResult) setCouponResult(null)
                        }}
                        disabled={couponResult?.valid}
                      />
                      {couponResult?.valid ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCouponResult(null)
                            setCouponCode('')
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </Button>
                      )}
                    </div>
                    {couponResult?.valid && (
                      <p className="text-xs text-green-600">
                        Coupon &quot;{couponResult.coupon?.code}&quot; applied! Saving $
                        {discountAmount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-heading font-bold text-lg">
                      <span>Grand Total</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                        Placing Order...
                      </div>
                    ) : (
                      <>
                        <Banknote className="w-5 h-5 mr-2" />
                        Place Order (Cash on Delivery)
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You will pay upon delivery. No online payment required.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('cart')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Cart
            </Button>
          )}
          {currentStep < effectiveSteps.length - 1 && (
            <Button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
