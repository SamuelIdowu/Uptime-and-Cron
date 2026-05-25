"use client";

import * as React from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "#00d992",
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
