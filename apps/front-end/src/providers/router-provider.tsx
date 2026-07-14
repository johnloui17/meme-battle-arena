"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setRouter } from "@/lib/utils/navigation";

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    setRouter({ push: (href) => router.push(href), replace: (href) => router.replace(href) });
  }, [router]);
  return <>{children}</>;
}
