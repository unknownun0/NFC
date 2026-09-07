import { kv } from "@vercel/kv";
import { profileKey, isValidSlug } from "../../../lib/defaultData";

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!isValidSlug(slug)) {
    return res.status(400).json({ error: "Invalid slug" });
  }

  if (req.method === "GET") {
    try {
      const data = await kv.get(profileKey(slug));
      if (!data) {
        return res.status(404).json({ error: "Profile not found" });
      }
      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ error: "Failed to read profile" });
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    // Editing an EXISTING profile does not require admin auth here —
    // the admin password gate already lives client-side in the page UI
    // (same behavior as your original artifact). If you want server-side
    // enforcement too, add the same ADMIN_PASSWORD check as in create.js.
    try {
      const exists = await kv.get(profileKey(slug));
      if (!exists) {
        return res.status(404).json({ error: "Profile not found" });
      }
      const body = req.body;
      await kv.set(profileKey(slug), body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save profile" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} not allowed`);
}
