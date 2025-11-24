# Theme Customization Guide

This project is built with **Tailwind CSS** and **Shadcn UI**. While it started as a fork, you can fully "disconnect" and establish your own brand identity by customizing the core design tokens.

## 1. Customizing Colors

The color palette is defined in `src/app/globals.css` using CSS variables. These variables are then mapped to Tailwind utility classes in `tailwind.config.ts` (or implicitly via Tailwind v4 if configured).

To change the primary brand color:

1.  Open `src/app/globals.css`.
2.  Locate the `:root` (light mode) and `.dark` (dark mode) blocks.
3.  Update the `--primary` and `--primary-foreground` values.

**Example (Switching to a Blue Brand):**

```css
/* src/app/globals.css */
:root {
  /* ... other vars ... */
  --primary: 221.2 83.2% 53.3%; /* Blue-600 (HSL) */
  --primary-foreground: 210 40% 98%;
}

.dark {
  /* ... other vars ... */
  --primary: 217.2 91.2% 59.8%; /* Blue-500 (HSL) */
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

> **Tip:** Use a tool like [Realtime Colors](https://realtimecolors.com/) or [Shadcn Themes](https://ui.shadcn.com/themes) to generate compatible HSL values for your brand.

## 2. Customizing Typography

To change the font family:

1.  Open `src/app/layout.tsx`.
2.  Import your desired font from `next/font/google`.
3.  Apply it to the `<body>` tag.

**Example (Switching to "Inter"):**

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ... */}
      </body>
    </html>
  );
}
```

## 3. Component Styling

The UI components live in `src/components/ui`. You own this code!

-   **Global Changes:** Edit `src/app/globals.css` for base styles.
-   **Component Changes:** Directly modify the files in `src/components/ui`. For example, to make all buttons rounded, open `src/components/ui/button.tsx` and change the `radius` class or update the `defaultVariants`.

## 4. "Disconnecting" from the Starter

Since you have the code locally, you are already technically disconnected. To make it feel like *your* project:

1.  **Update Metadata:** Change the `title` and `description` in `src/app/layout.tsx` and `src/app/dashboard/layout.tsx`.
2.  **Clean Up:** Remove any unused components or pages from the starter that you don't need (e.g., `src/app/(auth)/...` if you implement your own auth flow, though Clerk is recommended).
3.  **Favicon:** Replace `public/favicon.ico` with your own logo.

By following these steps, you transform the generic starter into a custom application tailored to your brand.
