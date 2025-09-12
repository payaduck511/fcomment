import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | 메이플 코멘트',
    default: '메이플 코멘트 | 정보 & 시뮬레이터',
  },
  description: '메이플스토리 큐브, 애플, 반지 시뮬레이터와 캐릭터 정보 조회, 직업 추천 등 다양한 기능을 제공합니다.',
  authors: [{ name: 'comment.pe.kr' }],
  openGraph: {
    title: '메이플 코멘트',
    description: '메이플스토리 유저들을 위한 정보 및 시뮬레이터 사이트',
    images: [
      {
        url: 'https://comment.pe.kr/assets/images/logo.png',
        width: 200,
        height: 200,
        alt: '메이플 코멘트 로고',
      },
    ],
    url: 'https://comment.pe.kr',
    siteName: '메이플 코멘트',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-2B1NC2DVXQ" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2B1NC2DVXQ');
          `}
        </Script>
      </body>
    </html>
  );
}