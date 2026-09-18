import { NextResponse } from "next/server";
import { buildAuthorizationUrl, randomString } from "@/lib/auth";
import {
  seal,
  cookieOptions,
  TRANSACTION_COOKIE,
  TRANSACTION_TTL_SECONDS,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const transaction = {
    state: randomString(),
    nonce: randomString(),
    codeVerifier: randomString(),
  };

  const authorizationUrl = await buildAuthorizationUrl(transaction);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(
    TRANSACTION_COOKIE,
    await seal(transaction, TRANSACTION_TTL_SECONDS),
    {
      ...cookieOptions,
      maxAge: TRANSACTION_TTL_SECONDS,
    },
  );

  return response;
}
