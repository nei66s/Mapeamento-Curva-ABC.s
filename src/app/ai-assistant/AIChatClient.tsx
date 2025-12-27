"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const AIChat = dynamic(() => import('./AIChat'), { ssr: false });

export default function AIChatClient(props: any) {
  return <AIChat {...props} />;
}
