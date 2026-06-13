import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
];

const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=400&fit=crop',
];

const PORTFOLIO_IMAGES = [
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=800&h=1000&fit=crop',
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1400&h=700&fit=crop';

const FIRST_NAMES = ['Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria'];
const LAST_NAMES = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];

const STATUSES = ['pending', 'confirmed', 'in_production', 'ready_for_delivery', 'delivered', 'cancelled'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.appointment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.savedMeasurement.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tailorher.com',
      name: 'Admin',
      role: 'admin',
      password: '$2a$10$YourHashedPasswordHere', // In production, use bcrypt
    },
  });

  // Create customer users
  const customers = [];
  for (let i = 0; i < 20; i++) {
    const first = FIRST_NAMES[i];
    const last = LAST_NAMES[i];
    const customer = await prisma.user.create({
      data: {
        email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
        name: `${first} ${last}`,
        role: 'customer',
        phone: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
      },
    });
    customers.push(customer);
  }

  // Create categories
  const dressesCat = await prisma.category.create({
    data: {
      name: 'Dresses',
      slug: 'dresses',
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop',
    },
  });

  const blousesCat = await prisma.category.create({
    data: {
      name: 'Blouses',
      slug: 'blouses',
      imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=400&fit=crop',
    },
  });

  const trousersCat = await prisma.category.create({
    data: {
      name: 'Trousers',
      slug: 'trousers',
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
    },
  });

  const skirtsCat = await prisma.category.create({
    data: {
      name: 'Skirts & Knitwear',
      slug: 'skirts-knitwear',
      imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=400&fit=crop',
    },
  });

  // Create products
  const productsData = [
    {
      name: 'Velvet Wrap Dress',
      slug: 'velvet-wrap-dress',
      description: 'A luxurious velvet wrap dress that transitions effortlessly from day to evening. Features a flattering crossover neckline and adjustable waist tie. Available in rich jewel tones.',
      price: 89,
      stock: 15,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      images: JSON.stringify([PRODUCT_IMAGES[0], PRODUCT_IMAGES[2]]),
      categoryId: dressesCat.id,
    },
    {
      name: 'Silk Pleated Blouse',
      slug: 'silk-pleated-blouse',
      description: 'Elegant silk blouse with delicate pleating detail and a relaxed fit. The perfect blend of sophistication and comfort for the modern woman.',
      price: 59,
      stock: 20,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      images: JSON.stringify([PRODUCT_IMAGES[1], PRODUCT_IMAGES[3]]),
      categoryId: blousesCat.id,
    },
    {
      name: 'High-Waist Trousers',
      slug: 'high-waist-trousers',
      description: 'Tailored high-waist trousers with a sleek silhouette. Crafted from premium fabric with a subtle stretch for all-day comfort.',
      price: 79,
      stock: 12,
      sizes: JSON.stringify(['S', 'M', 'L']),
      images: JSON.stringify([PRODUCT_IMAGES[2], PRODUCT_IMAGES[4]]),
      categoryId: trousersCat.id,
    },
    {
      name: 'Floral Midi Skirt',
      slug: 'floral-midi-skirt',
      description: 'A stunning floral midi skirt with flowing fabric and an A-line cut. Pairs beautifully with both casual and dressy tops.',
      price: 49,
      stock: 8,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      images: JSON.stringify([PRODUCT_IMAGES[3], PRODUCT_IMAGES[5]]),
      categoryId: skirtsCat.id,
    },
    {
      name: 'Cashmere Cardigan',
      slug: 'cashmere-cardigan',
      description: 'Pure cashmere cardigan with pearl buttons. Incredibly soft and lightweight, perfect for layering in any season.',
      price: 129,
      stock: 5,
      sizes: JSON.stringify(['S', 'M', 'L']),
      images: JSON.stringify([PRODUCT_IMAGES[4], PRODUCT_IMAGES[0]]),
      categoryId: blousesCat.id,
    },
    {
      name: 'Linen Jumpsuit',
      slug: 'linen-jumpsuit',
      description: 'A chic linen jumpsuit with a wide-leg design and adjustable straps. Ideal for warm weather and effortless style.',
      price: 99,
      stock: 6,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      images: JSON.stringify([PRODUCT_IMAGES[5], PRODUCT_IMAGES[1]]),
      categoryId: dressesCat.id,
    },
  ];

  const products = [];
  for (const pd of productsData) {
    const product = await prisma.product.create({ data: pd });
    products.push(product);
  }

  // Create services
  const servicesData = [
    {
      name: 'Bespoke Evening Gown',
      slug: 'bespoke-evening-gown',
      description: 'A one-of-a-kind evening gown crafted to your exact measurements. Choose from our luxurious fabric selection and let our master tailors bring your vision to life.',
      basePrice: 350,
      turnaroundDays: 14,
      measurementSchema: JSON.stringify({
        chest: { label: 'Chest (inches)', type: 'number', required: true },
        waist: { label: 'Waist (inches)', type: 'number', required: true },
        hips: { label: 'Hips (inches)', type: 'number', required: true },
        hollowToHem: { label: 'Hollow to Hem (inches)', type: 'number', required: true },
        straps: { label: 'Strap Style', type: 'select', options: ['Spaghetti', 'Standard', 'Cap Sleeve', 'Strapless'], required: true },
      }),
      requiresAppointment: true,
    },
    {
      name: 'Wedding Dress Alteration',
      slug: 'wedding-dress-alteration',
      description: 'Expert alterations for your wedding dress. Our skilled seamstresses ensure a perfect fit for your special day, from bustle additions to hem adjustments.',
      basePrice: 120,
      turnaroundDays: 7,
      measurementSchema: JSON.stringify({
        bustAlteration: { label: 'Bust Alteration (inches to adjust)', type: 'number', required: true },
        waistTakenIn: { label: 'Waist Taken In (inches)', type: 'number', required: true },
        hemLength: { label: 'Desired Hem Length (inches)', type: 'number', required: true },
      }),
      requiresAppointment: true,
    },
    {
      name: 'Custom Blouse',
      slug: 'custom-blouse',
      description: 'A custom-tailored blouse made to your specifications. Choose the fabric, style, and fit that suits you perfectly.',
      basePrice: 90,
      turnaroundDays: 10,
      measurementSchema: JSON.stringify({
        bust: { label: 'Bust (inches)', type: 'number', required: true },
        shoulder: { label: 'Shoulder Width (inches)', type: 'number', required: true },
        sleeveLength: { label: 'Sleeve Length (inches)', type: 'number', required: true },
        blouseLength: { label: 'Blouse Length', type: 'select', options: ['Crop', 'Standard', 'Long'], required: true },
      }),
      requiresAppointment: false,
    },
    {
      name: 'Hemming Service',
      slug: 'hemming-service',
      description: 'Professional hemming for any garment. Quick turnaround with precision stitching that maintains the original look and feel.',
      basePrice: 25,
      turnaroundDays: 2,
      measurementSchema: JSON.stringify({
        garmentType: { label: 'Garment Type', type: 'text', required: true },
        desiredLength: { label: 'Desired Length (inches)', type: 'number', required: true },
      }),
      requiresAppointment: false,
    },
  ];

  const services = [];
  for (const sd of servicesData) {
    const service = await prisma.service.create({ data: sd });
    services.push(service);
  }

  // Create coupons
  await prisma.coupon.create({
    data: {
      code: 'HER10',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 0,
      usageLimit: 100,
      usedCount: 3,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'WELCOME25',
      discountType: 'fixed',
      discountValue: 25,
      minOrderValue: 100,
      usageLimit: 50,
      usedCount: 1,
    },
  });

  // Create portfolio items
  const portfolioTitles = ['Midnight Elegance', 'Rose Garden Gown', 'Silk Dreams', 'Golden Hour Dress', 'Classic Tailoring'];
  for (let i = 0; i < 5; i++) {
    await prisma.portfolio.create({
      data: {
        title: portfolioTitles[i],
        imageUrl: PORTFOLIO_IMAGES[i],
        description: `A stunning ${portfolioTitles[i].toLowerCase()} creation from our atelier.`,
        serviceId: services[Math.min(i, services.length - 1)].id,
        order: i,
      },
    });
  }

  // Create 25 demo orders over the past 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const addresses = [
    { street: '123 Fashion Ave', city: 'New York', state: 'NY', zip: '10001', country: 'US' },
    { street: '456 Style Blvd', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' },
    { street: '789 Elegance Ln', city: 'Chicago', state: 'IL', zip: '60601', country: 'US' },
    { street: '321 Chic St', city: 'Miami', state: 'FL', zip: '33101', country: 'US' },
    { street: '654 Couture Dr', city: 'Dallas', state: 'TX', zip: '75201', country: 'US' },
  ];

  for (let i = 0; i < 25; i++) {
    const customer = randomItem(customers);
    const orderDate = randomDate(ninetyDaysAgo, now);
    const hasService = Math.random() > 0.4;
    const hasProduct = Math.random() > 0.3;
    const address = randomItem(addresses);

    // Determine status - weight towards delivered
    const statusRoll = Math.random();
    let status: string;
    if (statusRoll < 0.2) status = 'pending';
    else if (statusRoll < 0.35) status = 'confirmed';
    else if (statusRoll < 0.5) status = 'in_production';
    else if (statusRoll < 0.65) status = 'ready_for_delivery';
    else if (statusRoll < 0.9) status = 'delivered';
    else status = 'cancelled';

    const items: { itemType: string; itemId: string; itemName: string; quantity: number; priceAtBooking: number; size?: string; measurementData?: string }[] = [];

    if (hasProduct) {
      const product = randomItem(products);
      const sizes = JSON.parse(product.sizes) as string[];
      const size = randomItem(sizes);
      const qty = Math.floor(Math.random() * 2) + 1;
      items.push({
        itemType: 'product',
        itemId: product.id,
        itemName: product.name,
        quantity: qty,
        priceAtBooking: product.price,
        size,
      });
    }

    if (hasService) {
      const service = randomItem(services);
      const schema = JSON.parse(service.measurementSchema) as Record<string, { label: string; type: string; options?: string[] }>;
      const measurements: Record<string, number | string> = {};
      for (const [key, field] of Object.entries(schema)) {
        if (field.type === 'number') {
          measurements[key] = Math.floor(Math.random() * 20) + 30;
        } else if (field.type === 'select' && field.options) {
          measurements[key] = randomItem(field.options);
        } else {
          measurements[key] = 'Standard';
        }
      }
      items.push({
        itemType: 'service',
        itemId: service.id,
        itemName: service.name,
        quantity: 1,
        priceAtBooking: service.basePrice,
        measurementData: JSON.stringify(measurements),
      });
    }

    if (items.length === 0) {
      // Ensure at least one item
      const product = randomItem(products);
      const sizes = JSON.parse(product.sizes) as string[];
      items.push({
        itemType: 'product',
        itemId: product.id,
        itemName: product.name,
        quantity: 1,
        priceAtBooking: product.price,
        size: randomItem(sizes),
      });
    }

    const total = items.reduce((sum, item) => sum + item.priceAtBooking * item.quantity, 0);
    const discountAmount = Math.random() > 0.7 ? Math.floor(total * 0.1) : 0;

    const order = await prisma.order.create({
      data: {
        userId: Math.random() > 0.2 ? customer.id : null,
        customerName: customer.name,
        customerEmail: customer.email,
        phone: customer.phone || '+1234567890',
        shippingAddress: JSON.stringify(address),
        total: total - discountAmount,
        couponCode: discountAmount > 0 ? 'HER10' : null,
        discountAmount,
        status,
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    for (const item of items) {
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          priceAtBooking: item.priceAtBooking,
          size: item.size || null,
          measurementData: item.measurementData || '{}',
        },
      });

      // Create appointment for services that require it
      if (item.itemType === 'service') {
        const service = services.find(s => s.id === item.itemId);
        if (service?.requiresAppointment) {
          const aptDate = new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
          await prisma.appointment.create({
            data: {
              orderItemId: orderItem.id,
              preferredDate: aptDate,
              status: status === 'delivered' ? 'completed' : status === 'cancelled' ? 'pending' : Math.random() > 0.5 ? 'confirmed' : 'pending',
            },
          });
        }
      }
    }
  }

  // Create some newsletter subscribers
  for (let i = 0; i < 5; i++) {
    const first = FIRST_NAMES[i + 10];
    const last = LAST_NAMES[i + 10];
    await prisma.newsletter.create({
      data: {
        email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`,
      },
    }).catch(() => {}); // Ignore duplicates
  }

  console.log('✅ Seed completed successfully!');
  console.log(`  - Admin user: admin@tailorher.com`);
  console.log(`  - ${customers.length} customers created`);
  console.log(`  - ${products.length} products created`);
  console.log(`  - ${services.length} services created`);
  console.log(`  - 25 demo orders created`);
  console.log(`  - 2 coupons created`);
  console.log(`  - 5 portfolio items created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
