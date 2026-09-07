# Profile Platform (Next.js + Vercel KV)

Multi-tenant profile pages. Each profile lives at `yourdomain.vercel.app/some-slug`
and is stored in Vercel KV (Redis), so edits made in the browser persist in the
cloud instead of only in local/artifact storage.

New profiles are created from an admin-only dashboard at `/admin` — visitors
can't self-register.

## 1. Push this folder to GitHub

```bash
cd profile-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Import into Vercel

1. Go to https://vercel.com/new and import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Click Deploy — it's fine if
   the first deploy fails/errors on API routes, since KV isn't connected yet.

## 3. Add Vercel KV

1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database** -> **KV** (Redis).
3. Connect it to this project. Vercel automatically adds the env vars
   `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`,
   `KV_REST_API_READ_ONLY_TOKEN` to your project — no manual copying needed.

## 4. Set your admin secret

1. Project Settings -> Environment Variables.
2. Add `ADMIN_SECRET` = a long random string only you know.
3. Redeploy (Vercel > Deployments > ... > Redeploy) so the new env var takes effect.

## 5. Create your first profile

1. Visit `https://your-project.vercel.app/admin`.
2. Enter your `ADMIN_SECRET` to unlock.
3. Enter a slug, e.g. `jane-doe` (lowercase letters, numbers, hyphens only).
4. Click "Create profile" — it's now live at `https://your-project.vercel.app/jane-doe`.

## 6. Editing a profile

Open the profile URL, tap the lock icon (top-left over the photo), and enter
the **in-page admin password** (separate from your platform ADMIN_SECRET —
see below) to unlock inline editing. Every save calls `/api/profile/[slug]`
and writes straight to Vercel KV, so it's saved in the cloud immediately and
persists across devices/browsers.

### Two different passwords, on purpose
- `ADMIN_SECRET` (env var) — gates the `/admin` dashboard, i.e. who can
  *create new profile slugs*.
- In-page password (`window.__PROFILE_ADMIN_PASSWORD__`, default `admin123`,
  set near the top of `pages/[slug].js`'s injected script or via a small
  script tag override) — gates who can *edit an existing profile's content*.

  To change it per-deployment without touching code, you can set it in
  `pages/_document.js` or inject via `next.config.js` env, but the simplest
  option is to just edit the `ADMIN_PASSWORD` fallback value directly in
  `pages/[slug].js` before deploying.

## Extending to per-profile passwords (optional next step)

Right now all profiles share one in-page edit password. If you want each
profile to have its own password, store a `password` (hashed, ideally) field
in that profile's KV record and check it server-side in the POST handler of
`pages/api/profile/[slug].js` instead of only client-side.

## Local development

```bash
npm install
vercel env pull .env.local   # pulls KV + ADMIN_SECRET from your Vercel project
npm run dev
```
