'use client';

import { useNavigationStore, useAuthStore } from '@/lib/store';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { WhatsAppButton } from '@/components/store/whatsapp-button';
import { CartDrawer } from '@/components/store/cart-drawer';
import { HomeView } from '@/components/views/home-view';
import { ProductsView } from '@/components/views/products-view';
import { ProductDetailView } from '@/components/views/product-detail-view';
import { ServicesView } from '@/components/views/services-view';
import { ServiceDetailView } from '@/components/views/service-detail-view';
import { CartView } from '@/components/views/cart-view';
import { CheckoutView } from '@/components/views/checkout-view';
import { OrderConfirmationView } from '@/components/views/order-confirmation-view';
import { OrderTrackingView } from '@/components/views/order-tracking-view';
import { LoginView } from '@/components/views/login-view';
import { AccountOrdersView } from '@/components/views/account-orders-view';
import { AccountMeasurementsView } from '@/components/views/account-measurements-view';
import { AccountProfileView } from '@/components/views/account-profile-view';
import { AdminDashboardView } from '@/components/views/admin-dashboard-view';
import { AdminProductsView } from '@/components/views/admin-products-view';
import { AdminServicesView } from '@/components/views/admin-services-view';
import { AdminOrdersView } from '@/components/views/admin-orders-view';
import { AdminCouponsView } from '@/components/views/admin-coupons-view';
import { AdminPortfolioView } from '@/components/views/admin-portfolio-view';
import { motion, AnimatePresence } from 'framer-motion';

function ViewRouter() {
  const { currentPage } = useNavigationStore();

  const views: Record<string, React.ReactNode> = {
    home: <HomeView />,
    products: <ProductsView />,
    'product-detail': <ProductDetailView />,
    services: <ServicesView />,
    'service-detail': <ServiceDetailView />,
    cart: <CartView />,
    checkout: <CheckoutView />,
    'order-confirmation': <OrderConfirmationView />,
    'order-tracking': <OrderTrackingView />,
    login: <LoginView />,
    'account-orders': <AccountOrdersView />,
    'account-measurements': <AccountMeasurementsView />,
    'account-profile': <AccountProfileView />,
    'admin-dashboard': <AdminDashboardView />,
    'admin-products': <AdminProductsView />,
    'admin-services': <AdminServicesView />,
    'admin-orders': <AdminOrdersView />,
    'admin-coupons': <AdminCouponsView />,
    'admin-portfolio': <AdminPortfolioView />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {views[currentPage] || <HomeView />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ViewRouter />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}
