export async function parseJsonRequest(req: Request) {
  try {
    return { ok: true as const, body: await req.json() };
  } catch {
    return { ok: false as const };
  }
}
