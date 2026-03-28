'use client';

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "./ThemeProvider";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="lti-theme-pref"
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
