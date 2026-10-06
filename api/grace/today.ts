import type { VercelRequest, VercelResponse } from "@vercel/node";

import { GetGraceTodayResponse } from "../_lib/schemas.js";
import { dailyPractices } from "../_lib/daily-practices.js";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const dayOfYear = Math.floor(
    (Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) /
      (1000 * 60 * 60 * 24),
  );
  const practice = dailyPractices[dayOfYear % dailyPractices.length];

  res.json(GetGraceTodayResponse.parse(practice));
}
