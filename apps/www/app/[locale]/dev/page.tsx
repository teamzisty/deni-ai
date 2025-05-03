"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useDevSessions } from '@/hooks/use-dev-sessions';

export default function DevPage() {
  const router = useRouter();
  const { createSession: createDevSession } = useDevSessions();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations();

  const createSession = () => {
    const session = createDevSession();
    router.push(`/${locale}/dev/chat/${session.id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('devHomePage.title')}</h1>
      <Button onClick={createSession}>{t('devHomePage.button')}</Button>
    </div>
  );
} 