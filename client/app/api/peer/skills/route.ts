import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { persistIfRenewed, resolveSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const resolved = await resolveSession(request);
  if (!resolved)
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const upstream = await fetch(`${config().SKILLS_API_URL}/api/public/skills`, {
    headers: { Authorization: `Bearer ${resolved.session.accessToken}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: "peer_request_failed",
        status: upstream.status,
        detail: await upstream.text(),
      },
      { status: 502 },
    );
  }

  return persistIfRenewed(NextResponse.json(await upstream.json()), resolved);
}
