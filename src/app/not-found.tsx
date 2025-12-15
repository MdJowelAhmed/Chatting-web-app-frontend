'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          Page Not Found
        </h2>
        <p className="text-text-secondary max-w-md mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

