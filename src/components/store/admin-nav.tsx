'use client';

import { useNavigationStore, useAuthStore } from '@/lib/store';
import {
  LayoutDashboard,
  Package,
  Scissors,
  ShoppingCart,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { label: 'Dashboard', page: 'admin-dashboard' as const, icon: LayoutDashboard },
  { label: 'Products', page: 'admin-products' as const, icon: Package },
  { label: 'Services', page: 'admin-services' as const, icon: Scissors },
  { label: 'Orders', page: 'admin-orders' as const, icon: ShoppingCart },
  { label: 'Coupons', page: 'admin-coupons' as const, icon: Tag },
  { label: 'Portfolio', page: 'admin-portfolio' as const, icon: ImageIcon },
];

export function AdminNav() {
  const { currentPage, navigate } = useNavigationStore();
  const { isAdmin } = useAuthStore();

  if (!isAdmin) return null;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 border-b border-border">
      {adminNavItems.map((item) => {
        const isActive = currentPage === item.page;
        const Icon = item.icon;
        return (
          <button
            key={item.page}
            onClick={() => navigate(item.page)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              isActive
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
