import { auth0 } from "@/lib/auth0";
import { CareerLanding } from "@/components/landing/career-landing";
import { manrope } from "@/lib/brand-font";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const authenticated = Boolean(await auth0.getSession());
  return <CareerLanding authenticated={authenticated} fontClassName={manrope.variable} />;
}
