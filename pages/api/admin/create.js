import { kv } from "@vercel/kv";
import { defaultData, profileKey, slugListKey, isValidSlug } from "../../../lib/defaultData";

// Set this in Vercel Project Settings -> Environment Variables.
// This is a SERVER-side secret, never exposed to the browser.
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method not allowed");
  }

  const { secret, slug, name } = req.body || {};

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isValidSlug(slug)) {
    return res.status(400).json({
      error: "Invalid slug. Use lowercase letters, numbers, and hyphens only (2-40 chars)."
    });
  }

  const existing = await kv.get(profileKey(slug));
  if (existing) {
    return res.status(409).json({ error: "That slug already exists." });
  }

  const newProfile = {
    ...structuredClone(defaultData),
    name: name || defaultData.name,
    handle: "@" + slug
  };

  await kv.set(profileKey(slug), newProfile);

  // maintain a simple index of all slugs for an admin dashboard
  const list = (await kv.get(slugListKey())) || [];
  if (!list.includes(slug)) {
    list.push(slug);
    await kv.set(slugListKey(), list);
  }

  return res.status(200).json({ ok: true, slug, url: `/${slug}` });
}
