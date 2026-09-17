import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { persistIfRenewed, resolveSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const resolved = await resolveSession(request);
  if (!resolved)
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const upstream = await fetch(`${config().SERVER_URL}/api/jobs`, {
    headers: { Authorization: `Bearer ${resolved.session.accessToken}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: "upstream_failed",
        status: upstream.status,
        detail: await upstream.text(),
      },
      { status: 502 },
    );
  }

  return persistIfRenewed(NextResponse.json(await upstream.json()), resolved);
}

export async function POST(request: NextRequest) {
  const resolved = await resolveSession(request);
  if (!resolved)
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body: unknown = await request.json();

  const upstream = await fetch(`${config().SERVER_URL}/api/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolved.session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload: unknown = await upstream
    .json()
    .catch(() => ({ error: "invalid_response" }));

  return persistIfRenewed(
    NextResponse.json(payload, { status: upstream.status }),
    resolved,
  );
}
