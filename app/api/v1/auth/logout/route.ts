import { handleError, json } from "@/lib/server/http";
import { destroySession } from "@/lib/server/session";

export async function POST() {
  try {
    await destroySession();
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
