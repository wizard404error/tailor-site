'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  LogIn,
  LogOut,
  Package,
  LayoutDashboard,
  Ruler,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import { useNavigationStore, useCartStore, useAuthStore } from '@/lib/store';

export function Header() {
  const { currentPage, navigate } = useNavigationStore();
  const { itemCount, setCartOpen } = useCartStore();
  const { user, isLoggedIn, isAdmin, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', page: 'home' as const },
    { label: 'Shop', page: 'products' as const },
    { label: 'Services', page: 'services' as const },
  ];

  const handleNavClick = (page: Parameters<typeof navigate>[0]) => {
    navigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md shadow-sm'
            : 'bg-background/80 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 group"
            >
              <span className="font-heading text-xl sm:text-2xl font-bold text-primary tracking-wide group-hover:text-accent transition-colors">
                Tailored for Her
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors hover:text-accent ${
                    currentPage === link.page
                      ? 'text-accent'
                      : 'text-foreground'
                  }`}
                >
                  {link.label}
                  {currentPage === link.page && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-foreground hover:text-accent"
                onClick={() => setCartOpen(true)}
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {mounted && itemCount() > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-accent text-accent-foreground text-[10px] font-bold">
                    {itemCount()}
                  </Badge>
                )}
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-foreground hover:text-accent"
                    aria-label="User menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isLoggedIn && user ? (
                    <>
                      <DropdownMenuLabel className="font-heading">
                        {user.name}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('account-orders')}>
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('account-measurements')}>
                        <Ruler className="mr-2 h-4 w-4" />
                        Measurements
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('admin-dashboard')}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel>Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('login')}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('order-tracking')}>
                        <Package className="mr-2 h-4 w-4" />
                        Track Order
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-foreground hover:text-accent"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Gold accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent" />
      </motion.header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-background shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-heading text-lg font-bold text-primary">
                  Menu
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-col p-4 gap-1">
                {navLinks.map((link, index) => (
                  <motion.button
                    key={link.page}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNavClick(link.page)}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors hover:bg-secondary ${
                      currentPage === link.page
                        ? 'text-accent bg-secondary'
                        : 'text-foreground'
                    }`}
                  >
                    {link.label}
                  </motion.button>
                ))}
                <div className="h-px bg-border my-3" />
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                  onClick={() => {
                    handleNavClick('order-tracking');
                  }}
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Track Order
                </motion.button>
                {isLoggedIn ? (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navLinks.length + 1) * 0.05 }}
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Sign Out
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navLinks.length + 1) * 0.05 }}
                    onClick={() => handleNavClick('login')}
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Sign In
                  </motion.button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
