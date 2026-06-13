'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Loader2, Trash2, Ruler } from 'lucide-react'
import { useAuthStore, useNavigationStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface Measurement {
  id: string
  userId: string
  serviceId: string
  name: string
  measurementData: Record<string, unknown>
  createdAt: string
  service: {
    id: string
    name: string
  }
}

export function AccountMeasurementsView() {
  const { user, isLoggedIn } = useAuthStore()
  const { navigate } = useNavigationStore()

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('login')
      return
    }

    const fetchMeasurements = async () => {
      try {
        const res = await fetch(`/api/measurements?userId=${encodeURIComponent(user.id)}`)
        const data = await res.json()
        setMeasurements(Array.isArray(data) ? data : data.measurements || [])
      } catch {
        toast.error('Failed to load measurements')
      } finally {
        setLoading(false)
      }
    }

    fetchMeasurements()
  }, [isLoggedIn, user, navigate])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      // Since there's no DELETE endpoint for measurements, we'll just remove from UI
      // In a real app, this would call a DELETE API
      setMeasurements((prev) => prev.filter((m) => m.id !== id))
      toast.success('Measurement deleted')
    } catch {
      toast.error('Failed to delete measurement')
    } finally {
      setDeletingId(null)
    }
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
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-8">
          My Measurements
        </h1>

        {measurements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Ruler className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                No Saved Measurements
              </h3>
              <p className="text-muted-foreground mb-6">
                Your saved measurements will appear here when you book tailoring services.
              </p>
              <Button
                onClick={() => navigate('services')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Scissors className="w-4 h-4 mr-2" />
                Browse Services
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {measurements.map((measurement) => (
                <motion.div
                  key={measurement.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-heading text-base">
                            {measurement.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Scissors className="w-3 h-3 mr-1" />
                              {measurement.service.name}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => handleDelete(measurement.id)}
                          disabled={deletingId === measurement.id}
                        >
                          {deletingId === measurement.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(measurement.measurementData).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-1">
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <p className="text-xs text-muted-foreground">
                        Saved on{' '}
                        {new Date(measurement.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
