'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in',
        variant: 'success',
      });
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background-light items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <MessageCircle className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            WhatsApp Clone
          </h1>
          <p className="text-text-secondary text-lg max-w-md">
            Connect with friends and family. Send messages, make calls, and share moments.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {['💬', '📹', '🎤', '📁'].map((emoji, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-3xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome back
          </h2>
          <p className="text-text-secondary mb-8">
            Sign in to continue to WhatsApp Clone
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-6"
            >
              <p className="text-danger text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-text-secondary">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-text-secondary mt-8">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

