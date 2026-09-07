import { kv } from "@vercel/kv";
import { slugListKey } from "../../../lib/defaultData";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
  const { secret } = req.query;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const list = (await kv.get(slugListKey())) || [];
  return res.status(200).json({ slugs: list });
}
