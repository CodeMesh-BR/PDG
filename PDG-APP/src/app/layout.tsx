import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "./providers";
import ClientLayout from "./ClientLayout";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: {
    template: "PDG - Dashboard",
    default: "PDG - Dashboard",
  },
  description: "PDG - Dashboard",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
