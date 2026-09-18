import { NextResponse } from "next/server";
import { config, getOidc } from "@/lib/config";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { OIDC_CLIENT_ID, BASE_URL } = config();
  const oidc = await getOidc();

  const url = new URL("/v2/logout", oidc.issuer); // Auth0 predates the standard path

  url.searchParams.set("client_id", OIDC_CLIENT_ID);
  url.searchParams.set("returnTo", BASE_URL);

  const response = NextResponse.redirect(url.toString());
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
