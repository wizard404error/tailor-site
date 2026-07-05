'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore, useNavigationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function LoginView() {
  const { login } = useAuthStore()
  const { navigate } = useNavigationStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address'
    if (!password.trim()) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Invalid credentials')
        return
      }

      login(data.user)
      toast.success(`Welcome back, ${data.user.name}!`)

      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('admin-dashboard')
      } else {
        navigate('home')
      }
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Decorative background pattern */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-xl" />

          <Card className="relative border-accent/20">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center"
              >
                <Lock className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              <CardTitle className="font-heading text-2xl sm:text-3xl font-bold">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Sign in to access your account and orders
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: '' })
                      }}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: '' })
                      }}
                      className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Sign In
                  {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('home')}
                >
                  Continue as Guest
                </Button>
              </div>

              {/* Decorative divider */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Quick access hint */}
              <p className="text-xs text-center text-muted-foreground mt-4">
                Admin access: admin@tailorher.com
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
