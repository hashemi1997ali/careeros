import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { exchangeCode, sessionFromTokens } from "@/lib/auth";
import {
  attachSession,
  cookieOptions,
  unseal,
  TRANSACTION_COOKIE,
  type AuthTransaction,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    return new NextResponse(
      `Provider returned an error: ${error} — ${params.get("error_description") ?? ""}`,
      { status: 400 },
    );
  }

  const rawTransaction = request.cookies.get(TRANSACTION_COOKIE)?.value;

  if (!rawTransaction) {
    return new NextResponse(
      `The ${TRANSACTION_COOKIE} cookie did not come back with this request.\n\n` +
        "The cookie is host-only, so the browser returns it only to the exact host that set it. " +
        `This callback arrived at "${request.nextUrl.host}", and BASE_URL is "${config().BASE_URL}". ` +
        "If the sign-in was started on a different host — localhost:3000 instead of the " +
        "configured one, for example — the cookie stayed behind on that host.",
      { status: 400 },
    );
  }

  const transaction = await unseal<AuthTransaction>(rawTransaction);

  if (!transaction) {
    return new NextResponse(
      "The auth cookie could not be decrypted. Either SESSION_SECRET changed after the " +
        "sign-in started, or the cookie is older than five minutes and has expired.",
      { status: 400 },
    );
  }

  if (!code || transaction.state !== state) {
    return new NextResponse(
      "State mismatch: this callback does not belong to the sign-in that started here. " +
        "Usually a stale tab or a reloaded callback URL — start the sign-in again.",
      { status: 400 },
    );
  }

  let tokens;
  let claims;
  try {
    ({ tokens, claims } = await exchangeCode(code, transaction));
  } catch (exchangeError) {
    const message =
      exchangeError instanceof Error ? exchangeError.message : "unknown";
    return new NextResponse(`Sign-in failed: ${message}`, { status: 502 });
  }

  const syncResponse = await fetch(`${config().SERVER_URL}/api/users/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });

  if (!syncResponse.ok) {
    return new NextResponse(
      `Could not provision the user: ${syncResponse.status} ${await syncResponse.text()}`,
      { status: 502 },
    );
  }

  const { user } = (await syncResponse.json()) as { user: { id: string } };

  const response = NextResponse.redirect(config().BASE_URL);
  response.cookies.delete(TRANSACTION_COOKIE);
  await attachSession(response, sessionFromTokens(tokens, claims, user.id));

  // Touch cookieOptions so the shared definition stays the single source.
  void cookieOptions;

  return response;
}
