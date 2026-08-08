import { ToastContainer } from "react-toastify";

import { manrope } from "@/constants/Fonts";
import MainLayout from "@/components/layout/MainLayout";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/constants/site";

import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';



const appName = `${SITE_NAME} - ${SITE_TAGLINE}`;

export const metadata = {
  //! metadataBase is what lets every other page hand back a relative canonical
  //! and a relative OG image. Without it Next drops relative URLs entirely and
  //! warns at build time rather than failing, which is easy to never notice.
  metadataBase: new URL(SITE_URL),
  title: {
    default: appName,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["watch movies online", "stream tv series", "cinema tickets", "movie streaming", SITE_NAME],
  openGraph: {
    title: appName,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': 'large',
    }
  },
  //! left relative on purpose — metadataBase resolves them, and an unset
  //! NEXT_PUBLIC_BASE_URL used to bake the literal string "undefined" into
  //! every icon href
  icons: {
    icon: [
      { url: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: ['/images/android-chrome-192x192.png'],
    apple: [
      { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/images/safari-pinned-tab.svg', color: '#E50000' },
    ],
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} custom-scrollbar custom-scrollbar-md bg-c-black-08`}>
        <MainLayout>
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            closeOnClick={true}
          />
        </MainLayout>
      </body>
    </html>
  );
}
