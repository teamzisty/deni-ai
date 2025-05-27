"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useIntellipulseSessions } from '@/hooks/use-intellipulse-sessions';

export default function IntellipulsePage() {
  const router = useRouter();
  const { createSession: createIntellipulseSession } = useIntellipulseSessions();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations();

  const createSession = () => {
    const session = createIntellipulseSession();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('intellipulseHomePage.title')}</h1>
      <Button onClick={createSession}>{t('intellipulseHomePage.button')}</Button>
    </div>
  );
}
