import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function RequestTimeSsrPage() {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-kiln-request-id") ?? "not-provided";

  return (
    <main>
      <h1>Request-time SSR works</h1>
      <p data-request-id={requestId}>Request ID: {requestId}</p>
    </main>
  );
}
