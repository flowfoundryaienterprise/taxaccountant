export function GET() {
  return Response.json({ ok: true, service: "taxaccountant-web", time: Date.now() });
}
