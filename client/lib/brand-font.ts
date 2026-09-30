import { Manrope } from "next/font/google";

/** The one typeface for the landing page and the workspace (variable: every weight 200–800 is real, never synthesized). */
export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-landing",
  display: "swap",
});
