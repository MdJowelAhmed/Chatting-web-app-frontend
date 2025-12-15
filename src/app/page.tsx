'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { fetchConversations, isLoadingConversations } = useChatStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <ChatLayout />
      <IncomingCallModal />
    </>
  );
}

