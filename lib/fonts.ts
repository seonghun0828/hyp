import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const font1 = localFont({
  src: '../public/fonts/JalnanGothicTTF.woff2',
  // display: 'swap',
  // variable: '--font-1', // CSS 변수명으로 참조할 수 있도록 설정
});
const font2 = localFont({
  src: '../public/fonts/BMHANNAAir_ttf.woff2',
});
const font3 = localFont({
  src: '../public/fonts/BMDOHYEON_ttf.woff2',
});
const font4 = localFont({
  src: '../public/fonts/나눔손글씨 다행체.woff2',
});
const font5 = localFont({
  src: '../public/fonts/NanumSquareRoundB.woff2',
});
const font6 = localFont({
  src: '../public/fonts/나눔손글씨 암스테르담.woff2',
});
const font7 = localFont({
  src: '../public/fonts/BMEULJIROTTF.woff2',
});
const font8 = localFont({
  src: '../public/fonts/BMYEONSUNG_ttf.woff2',
});

export const fonts = [
  inter,
  font1,
  font2,
  font3,
  font4,
  font5,
  font6,
  font7,
  font8,
];
export const fontNames = [
  'Modern',
  'Bold',
  'Subtle',
  'Retro',
  'Hand',
  'Vibe',
  'Easy',
  'Strong',
  'Rhythm',
];
