import { lazy, Suspense, useEffect, useState } from "react";

export function clientOnly<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const LazyComponent = lazy(factory);
  return (props: React.ComponentProps<T>) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return <Suspense fallback={null}><LazyComponent {...props} /></Suspense>;
  };
}
