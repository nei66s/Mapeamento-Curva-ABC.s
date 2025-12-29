"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const Preferences = dynamic(() => import('./Preferences'), { ssr: false });

export default function PreferencesClient(props: any) {
  return <Preferences {...props} />;
}
