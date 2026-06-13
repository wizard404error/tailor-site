'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function WhatsAppButton() {
  const { user } = useAuthStore();

  const phoneNumber = '1234567890';
  const baseMessage = user
    ? `Hello! I'm ${user.name} (${user.email}). I'd like to inquire about your services.`
    : 'Hello! I\'d like to inquire about your tailoring services.';

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(baseMessage)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.3 }}
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" fill="white" />
    </motion.a>
  );
}
