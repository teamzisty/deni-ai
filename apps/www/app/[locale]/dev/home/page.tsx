"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';

export default function DevHomePage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations();

  const createSession = () => {
    const id = crypto.randomUUID();
    router.push(`/${locale}/dev/chat/${id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('devHomePage.title')}</h1>
      <Button onClick={createSession}>{t('devHomePage.button')}</Button>
    </div>
  );
} 