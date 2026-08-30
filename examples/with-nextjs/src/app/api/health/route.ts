import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();

  return Response.json({
    status: "ok",
    framework: "nextjs",
    requestId: requestHeaders.get("x-kiln-request-id") ?? null,
  });
}
