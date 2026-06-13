'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Ruler, Truck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/store/product-card';
import { ServiceCard } from '@/components/store/service-card';
import { useNavigationStore } from '@/lib/store';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  stock: number;
  sizes: string[];
  images: string[];
  category?: { name: string; slug: string };
}

interface Service {
  id: string;
  name: string;
  slug?: string;
  description: string;
  basePrice: number;
  turnaroundDays: number;
  requiresAppointment: boolean;
  measurementSchema?: Record<string, unknown>;
}

interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  category?: string;
}

export function HomeView() {
  const { navigate } = useNavigationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetch('/api/products?sort=newest')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        setServices(data.services || []);
      })
      .catch(() => {})
      .finally(() => setLoadingServices(false));

    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        setPortfolio(data.portfolio || []);
      })
      .catch(() => {})
      .finally(() => setLoadingPortfolio(false));
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Thank you for subscribing!');
        setNewsletterEmail('');
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubscribing(false);
    }
  };

  const featuredProducts = products.slice(0, 4);
  const featuredServices = services.slice(0, 2);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        {/* Decorative gold accents */}
        <div className="absolute top-10 left-10 w-32 h-32 border border-accent/20 rounded-full" />
        <div className="absolute bottom-20 right-16 w-48 h-48 border border-accent/10 rounded-full" />

        <div className="relative z-10 text-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold text-primary-foreground tracking-wide">
              Tailored for Her
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            {/* Gold decorative line */}
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="h-px w-16 sm:w-24 bg-accent" />
              <div className="h-2 w-2 rounded-full bg-accent" />
              <div className="h-px w-16 sm:w-24 bg-accent" />
            </div>

            <p className="font-heading text-lg sm:text-xl md:text-2xl text-primary-foreground/80 italic tracking-wide">
              Where Elegance Meets Precision
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="mt-10"
          >
            <Button
              onClick={() => navigate('products')}
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading text-base px-8 py-6 shadow-lg"
            >
              Explore Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Featured Collection
          </h2>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-px w-12 bg-accent" />
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent" />
          </div>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Curated pieces that embody the essence of feminine sophistication.
          </p>
        </motion.div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuredProducts.map((product) => (
              <motion.div key={product.id} variants={fadeUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No products available yet. Check back soon!
          </p>
        )}

        {featuredProducts.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button
              variant="outline"
              onClick={() => navigate('products')}
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              View All Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </section>

      {/* Featured Services Section */}
      <section className="py-16 sm:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              Our Services
            </h2>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="h-px w-12 bg-accent" />
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <div className="h-px w-12 bg-accent" />
            </div>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Expert craftsmanship and personalized attention for every garment.
            </p>
          </motion.div>

          {loadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredServices.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {featuredServices.map((service) => (
                <motion.div key={service.id} variants={fadeUp}>
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No services available yet. Check back soon!
            </p>
          )}

          {services.length > 2 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Button
                variant="outline"
                onClick={() => navigate('services')}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-px w-12 bg-accent" />
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent" />
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
        >
          {[
            {
              step: 1,
              icon: Search,
              title: 'Browse',
              description:
                'Explore our curated collection of bespoke garments and tailoring services designed for the modern woman.',
            },
            {
              step: 2,
              icon: Ruler,
              title: 'Customize',
              description:
                'Choose your perfect fit with our detailed measurement guides and personalized styling consultations.',
            },
            {
              step: 3,
              icon: Truck,
              title: 'Receive',
              description:
                'Your custom-tailored piece is crafted with precision and delivered to your doorstep, ready to wear.',
            },
          ].map((item) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              className="relative text-center group"
            >
              {/* Gold step number */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute h-20 w-20 rounded-full border-2 border-accent/20 group-hover:border-accent/40 transition-colors" />
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
                  {item.step}
                </span>
              </div>

              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Portfolio Gallery Section */}
      {!loadingPortfolio && portfolio.length > 0 && (
        <section className="py-16 sm:py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Our Portfolio
              </h2>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="h-px w-12 bg-accent" />
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <div className="h-px w-12 bg-accent" />
              </div>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {portfolio.slice(0, 8).map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  className={`relative overflow-hidden rounded-lg group cursor-pointer ${
                    index === 0 ? 'row-span-2 col-span-2' : ''
                  }`}
                >
                  <div className={`overflow-hidden ${index === 0 ? 'aspect-square' : 'aspect-square'}`}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="font-heading text-sm text-primary-foreground font-medium">
                      {item.title}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="relative bg-card border border-border rounded-2xl p-8 sm:p-12 shadow-sm">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-accent/40 rounded-tl-lg" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-accent/40 rounded-br-lg" />

            <Mail className="h-10 w-10 text-accent mx-auto mb-4" />
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Stay in the Loop
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Subscribe to our newsletter for exclusive previews, style tips, and
              early access to new collections.
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="h-11 bg-background"
              />
              <Button
                type="submit"
                disabled={subscribing}
                className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-medium shrink-0"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
