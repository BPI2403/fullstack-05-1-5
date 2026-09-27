"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  return useIsMounted() ? <>{children}</> : <>{fallback}</>;
}
