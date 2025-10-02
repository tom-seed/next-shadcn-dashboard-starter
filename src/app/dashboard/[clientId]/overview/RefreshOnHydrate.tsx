'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = { trigger: any };

export default function RefreshOnHydrate({ trigger }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!trigger) return;
    // Any change to "trigger" (e.g., a new latest audit) refreshes the server component
    router.refresh();
  }, [trigger, router]);

  return null;
}
