import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { persistIfRenewed, resolveSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const resolved = await resolveSession(request);

  if (!resolved) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { session } = resolved;

  const response = NextResponse.json({
    user: {
      id: session.userId,
      sub: session.sub,
      email: session.email,
      displayName: session.displayName,
    },
    skillsAppUrl: config().SKILLS_APP_URL ?? null,
  });

  return persistIfRenewed(response, resolved);
}
