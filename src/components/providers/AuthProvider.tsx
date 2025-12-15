'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setIsInitialized(true);
    };
    init();
  }, [fetchUser]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

