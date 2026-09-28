import localFont from "next/font/local";

export const manrope = localFont({
  src: [
    { path: "../public/fonts/manrope-regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/manrope-semibold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-landing",
  display: "swap",
});
