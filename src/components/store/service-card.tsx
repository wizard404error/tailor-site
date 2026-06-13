'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, ShoppingBag, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigationStore, useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    slug?: string;
    description: string;
    basePrice: number;
    turnaroundDays: number;
    requiresAppointment: boolean;
    measurementSchema?: Record<string, unknown>;
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { navigate } = useNavigationStore();
  const { addItem } = useCartStore();

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemType: 'service',
      itemId: service.id,
      name: service.name,
      price: service.basePrice,
      quantity: 1,
      requiresAppointment: service.requiresAppointment,
    });
    toast.success(`${service.name} added to cart`);
  };

  const handleClick = () => {
    navigate('service-detail', { id: service.id });
  };

  const excerpt =
    service.description && service.description.length > 120
      ? service.description.substring(0, 120) + '...'
      : service.description;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
        {/* Icon/Illustration Area */}
        <div className="relative h-40 bg-gradient-to-br from-secondary via-secondary/50 to-muted flex items-center justify-center overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`grid-${service.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${service.id})`} />
            </svg>
          </div>

          {/* Scissors / Ruler Icon */}
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <Ruler className="h-12 w-12 text-accent" strokeWidth={1.5} />
          </motion.div>

          {/* Requires Fitting Badge */}
          {service.requiresAppointment && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-medium gap-1">
              <Calendar className="h-3 w-3" />
              Requires Fitting
            </Badge>
          )}
        </div>

        {/* Service Info */}
        <div className="p-4 space-y-3">
          <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
            {service.name}
          </h3>

          {excerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-accent">
              From ${service.basePrice.toFixed(2)}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>{service.turnaroundDays} days</span>
            </div>
          </div>

          <Button
            onClick={handleBookNow}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
