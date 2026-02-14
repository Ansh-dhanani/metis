"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
