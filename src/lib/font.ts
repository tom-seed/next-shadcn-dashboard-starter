import { Geist, Geist_Mono, Noto_Sans_Mono } from 'next/font/google';

import { cn } from '@/lib/utils';

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans'
});

const fontNotoMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-mono'
});

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontNotoMono.variable
);
