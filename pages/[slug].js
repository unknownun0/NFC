import { kv } from "@vercel/kv";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { profileKey, isValidSlug } from "../lib/defaultData";

export async function getServerSideProps({ params, res }) {
  const { slug } = params;
  if (!isValidSlug(slug)) {
    return { notFound: true };
  }
  const data = await kv.get(profileKey(slug));
  if (!data) {
    return { notFound: true };
  }
  // avoid caching stale profile data at the edge
  res.setHeader("Cache-Control", "no-store");
  return { props: { slug, initialData: data } };
}

export default function ProfilePage({ slug, initialData }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Boot the client-side app (vanilla JS, ported from the original artifact)
    initProfileApp(slug, initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <>
      <Head>
        <title>{initialData?.name ? `${initialData.name} — Profile` : "Profile"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{PROFILE_CSS}</style>
      </Head>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: PROFILE_HTML }} />
      <div className="toast" id="toast"></div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Below: your original CSS + HTML markup + client JS, adapted to     */
/* fetch/save via /api/profile/[slug] instead of window.storage.      */
/* ------------------------------------------------------------------ */

const PROFILE_CSS = `
:root{
  --white:#ffffff; --white-72:rgba(255,255,255,0.72); --white-50:rgba(255,255,255,0.5);
  --white-30:rgba(255,255,255,0.3); --pill-line:rgba(255,255,255,0.22); --divider:rgba(255,255,255,0.14);
  --sheet-bg:linear-gradient(180deg, rgba(10,10,11,0.86), rgba(6,6,7,0.96)); --danger:#ff6b6b; --ok:#5fe3a1;
}
*{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html,body{ height:100%; margin:0; }
body{ background:#e7e7e5; font-family:'Inter', sans-serif; color:var(--white); display:flex; align-items:center; justify-content:center; min-height:100dvh; padding:24px 12px; }
.stage{ position:relative; width:100%; max-width:400px; height:820px; max-height:calc(100vh - 48px); border-radius:34px; overflow:hidden; background:#111; box-shadow:0 30px 60px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.18); }
@media (max-width:480px){ body{ padding:0; } .stage{ width:100vw; max-width:100%; height:100dvh; max-height:100dvh; border-radius:0; box-shadow:none; } }
.photo-layer{ position:absolute; inset:0; background:#1a1c22 center 22%/cover no-repeat; }
.photo-fallback{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:radial-gradient(ellipse at 50% 20%, #3a3d46, #101114 70%); }
.photo-fallback span{ font-size:120px; font-weight:800; color:rgba(255,255,255,0.14); }
.photo-scrim{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.85) 100%); pointer-events:none; }
.hero-controls{ position:absolute; top:18px; left:18px; right:18px; display:flex; justify-content:space-between; align-items:flex-start; z-index:5; transition:opacity .25s ease; }
.stage.expanded .hero-controls{ opacity:1; pointer-events:auto; }
.circle-btn{ width:38px; height:38px; border-radius:50%; background:rgba(20,20,22,0.45); backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; color:var(--white); cursor:pointer; }
.circle-btn.small{ width:30px; height:30px; }
.circle-btn svg{ width:18px; height:18px; }
.sheet{ position:absolute; left:0; right:0; bottom:0; background:var(--sheet-bg); backdrop-filter:blur(18px); border-radius:26px 26px 0 0; padding:10px 22px 22px; z-index:4; display:flex; flex-direction:column; transition:height .45s cubic-bezier(.22,.8,.25,1), border-radius .3s; height:auto; max-height:88%; }
.stage.expanded .sheet{ height:88%; }
.drag-zone{ cursor:grab; user-select:none; }
.drag-zone:active{ cursor:grabbing; }
.handle-bar{ width:36px; height:4px; border-radius:2px; background:rgba(255,255,255,0.28); margin:2px auto 12px; }
.sheet-topbar{ display:flex; align-items:center; justify-content:space-between; min-height:30px; margin-bottom:6px; }
.back-btn{ display:none; }
.stage.expanded .back-btn{ display:flex; }
.see-profile-btn{ display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--white-72); font-family:'Inter'; font-size:13px; font-weight:600; cursor:pointer; margin-left:auto; }
.stage.expanded .see-profile-btn{ display:none; }
.see-profile-btn svg{ width:14px; height:14px; }
.handle-tag{ color:var(--white-72); font-size:13px; font-weight:600; display:none; }
.stage.expanded .handle-tag{ display:block; }
.admin-btn-inline{ display:none; }
.stage.expanded .admin-btn-inline{ display:flex; }
.sheet-header{ padding-top:4px; }
.p-name{ font-size:26px; font-weight:800; line-height:1.12; letter-spacing:-0.5px; }
.p-handle{ font-size:14px; color:var(--white-50); font-weight:500; margin-top:6px; }
.p-quote{ font-size:14.5px; line-height:1.5; color:var(--white-72); margin-top:10px; }
.p-quote::before, .p-quote::after{ content:'"'; }
.stats-row{ display:flex; gap:26px; margin-top:16px; }
.stat b{ font-size:16px; font-weight:800; display:block; }
.stat span{ font-size:11.5px; color:var(--white-50); }
.cta-btn{ margin-top:18px; width:100%; background:var(--white); color:#0b0b0c; border:none; font-family:'Inter'; font-weight:700; font-size:14.5px; padding:13px; border-radius:100px; cursor:pointer; text-align:center; text-decoration:none; display:block; }
.stage.expanded .cta-btn{ display:none; }
.edit-fab{ display:none; align-items:center; gap:5px; background:rgba(255,255,255,0.1); border:1px solid var(--pill-line); color:var(--white); font-size:11px; font-weight:600; font-family:'Inter'; padding:6px 10px; border-radius:100px; cursor:pointer; }
.stage.expanded .edit-fab{ display:inline-flex; }
.edit-fab svg{ width:12px; height:12px; }
.section-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.section-label{ font-size:11.5px; font-weight:700; letter-spacing:1.2px; color:var(--white-50); }
.sheet-extra{ max-height:0; opacity:0; overflow:hidden; transition:max-height .5s ease, opacity .35s ease, margin .4s ease; }
.stage.expanded .sheet-extra{ max-height:3000px; opacity:1; margin-top:20px; overflow-y:auto; flex:1; }
.tag-row{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:22px; }
.tag{ font-size:12.5px; font-weight:600; padding:7px 12px; border-radius:100px; border:1px solid var(--pill-line); color:var(--white); }
.gallery-wrap{ margin-bottom:24px; }
.gallery-track{ display:flex; gap:10px; overflow-x:auto; scroll-behavior:smooth; padding-bottom:4px; scrollbar-width:none; }
.gallery-track::-webkit-scrollbar{ display:none; }
.gallery-item{ flex:0 0 auto; width:76px; height:76px; border-radius:14px; background:#22242b center/cover no-repeat; border:1px solid rgba(255,255,255,0.14); }
.gallery-nav{ display:flex; gap:8px; margin-top:10px; }
.project-list{ margin-bottom:24px; }
.project-card{ display:flex; gap:12px; padding:14px 0; border-top:1px solid var(--divider); }
.project-card:first-child{ border-top:none; padding-top:0; }
.project-image{ width:88px; height:64px; border-radius:10px; flex:0 0 auto; object-fit:cover; background:#22242b; border:1px solid rgba(255,255,255,0.14); }
.project-thumb{ width:44px; height:44px; border-radius:50%; flex:0 0 auto; background:#22242b center/cover no-repeat; border:1px solid rgba(255,255,255,0.14); }
.project-title{ font-size:14px; font-weight:700; }
.project-desc{ font-size:13.5px; color:var(--white-72); line-height:1.5; margin-top:3px; }
.experience-card, .certificate-card{ padding:14px 0; border-top:1px solid var(--divider); }
.experience-card:first-child, .certificate-card:first-child{ border-top:none; padding-top:0; }
.item-meta{ color:var(--white-50); font-size:12px; margin-top:3px; }
.item-link{ color:var(--white-72); font-size:12px; text-decoration:underline; display:inline-block; margin-top:6px; }
.contact-section{ padding-bottom:6px; }
.contact-row{ display:flex; align-items:center; gap:12px; padding:11px 0; border-top:1px solid var(--divider); font-size:14px; }
.contact-row:first-of-type{ border-top:none; }
.contact-row a{ color:var(--white); text-decoration:none; }
.contact-row .ico{ color:var(--white-72); width:18px; height:18px; flex-shrink:0; }
.social-row{ display:flex; gap:10px; margin-top:14px; flex-wrap:wrap; }
.social-icon{ width:38px; height:38px; border-radius:50%; border:1px solid var(--pill-line); display:flex; align-items:center; justify-content:center; color:var(--white); }
.social-icon svg{ width:16px; height:16px; }
label.f-label{ display:block; font-size:11px; font-weight:700; letter-spacing:.6px; color:var(--white-50); margin:12px 0 5px; }
input[type=text], input[type=number], textarea, select{ width:100%; background:rgba(255,255,255,0.06); border:1px solid var(--pill-line); color:var(--white); font-family:'Inter'; font-size:14px; padding:9px 11px; border-radius:10px; outline:none; }
input:focus, textarea:focus, select:focus{ border-color:rgba(255,255,255,0.5); }
textarea{ resize:vertical; min-height:60px; }
input[type=file]{ font-size:12px; color:var(--white-72); }
.field-row{ display:flex; gap:8px; }
.field-row > div{ flex:1; }
.mini-item{ border:1px dashed var(--pill-line); border-radius:12px; padding:12px; margin-bottom:10px; }
.mini-item-head{ display:flex; justify-content:space-between; align-items:center; }
.save-bar{ display:flex; gap:8px; margin-top:16px; }
.btn{ flex:1; font-family:'Inter'; font-weight:700; font-size:12.5px; padding:11px; text-align:center; cursor:pointer; border:1px solid var(--pill-line); background:transparent; color:var(--white); border-radius:100px; }
.btn.primary{ background:var(--white); color:#0b0b0c; border:none; }
.btn.remove{ flex:none; padding:8px 12px; color:var(--danger); border-color:rgba(255,107,107,0.4); font-size:11px; }
.add-row-btn{ display:flex; align-items:center; gap:6px; justify-content:center; width:100%; padding:10px; margin-top:4px; background:rgba(255,255,255,0.06); border:1px dashed var(--pill-line); color:var(--white); border-radius:12px; cursor:pointer; font-size:12.5px; font-weight:600; font-family:'Inter'; }
.add-row-btn svg{ width:13px; height:13px; }
.overlay{ position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
.modal{ width:100%; max-width:300px; background:#141417; border:1px solid rgba(255,255,255,0.14); border-radius:20px; padding:22px; }
.modal h3{ font-size:15px; font-weight:800; margin-bottom:14px; }
.modal p.hint{ font-size:12px; color:var(--danger); margin-top:8px; display:none; }
.toast{ position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#141417; border:1px solid var(--ok); color:var(--ok); font-size:12px; font-weight:700; padding:10px 16px; border-radius:100px; z-index:60; opacity:0; pointer-events:none; transition:opacity .25s; }
.toast.show{ opacity:1; }
.hidden{ display:none !important; }
.empty-note{ color:var(--white-50); font-size:13px; }
@media (min-width:768px){
  body{ padding:0; }
  .stage{ width:100vw; max-width:none; height:100vh; max-height:none; border-radius:0; box-shadow:none; }
  .photo-layer, .photo-fallback, .photo-scrim{ right:auto; width:40%; }
  .photo-scrim{ background:linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.72)); }
  .hero-controls{ right:auto; left:24px; }
  .stage.expanded .hero-controls{ opacity:1; pointer-events:auto; }
  .sheet{ left:40%; right:0; top:0; bottom:0; width:60%; height:100%; max-height:none; border-radius:0; padding:28px clamp(24px, 4vw, 56px); overflow:hidden; }
  .stage.expanded .sheet{ height:100%; }
  .drag-zone{ cursor:default; }
  .handle-bar, .back-btn, .see-profile-btn{ display:none !important; }
  .handle-tag, .stage.expanded .handle-tag{ display:block; }
  .admin-btn-inline{ display:flex; }
  .sheet-topbar{ margin-bottom:26px; }
  .sheet-header{ padding-top:0; }
  .stage.expanded .cta-btn{ display:none; }
  .sheet-extra, .stage.expanded .sheet-extra{ max-height:none; opacity:1; margin-top:28px; overflow-y:auto; flex:1; }
}
@media (min-width:1024px){
  .photo-layer, .photo-fallback, .photo-scrim{ width:42%; }
  .sheet{ left:42%; width:58%; }
}
`;

const PROFILE_HTML = `
<div class="stage" id="stage">
  <div class="photo-fallback" id="photoFallback"><span id="fallbackLetter">A</span></div>
  <div class="photo-layer" id="photoLayer"></div>
  <div class="photo-scrim"></div>

  <div class="hero-controls">
    <button class="circle-btn" id="adminBtnHero" title="Admin"></button>
    <span></span>
  </div>

  <div class="sheet" id="sheet">
    <div class="drag-zone" id="dragZone">
      <div class="handle-bar"></div>
      <div class="sheet-topbar">
        <button class="circle-btn small back-btn" id="backBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="handle-tag" id="handleTagTop"></span>
        <button class="see-profile-btn" id="seeProfileBtn">See profile
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
      </div>
      <div class="sheet-header" id="sheetHeader"></div>
    </div>

    <a class="cta-btn" id="ctaBtn">Get in touch</a>

    <div class="sheet-extra" id="sheetExtra"></div>
  </div>
</div>
`;

function initProfileApp(slug, initialData) {
  if (typeof window === "undefined") return;
  // Prevent double-init if this effect fires more than once (e.g. React strict mode)
  if (window.__profileAppBooted === slug) return;
  window.__profileAppBooted = slug;

  const ICONS = {
    lockOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
    lockClosed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    phone: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.4 7.86 10.94.57.1.78-.25.78-.55v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.78 2.72 1.26 3.38.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17v3.22c0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.6 17.6 0 0 0 15.9 4l-.24.47a13 13 0 0 1 3.8 1.7 15 15 0 0 0-14.9 0 13 13 0 0 1 3.85-1.72L8.16 4a17.5 17.5 0 0 0-4.4 1.4C1.4 9 .68 12.5.95 15.9a17.7 17.7 0 0 0 5.3 2.6l.9-1.42a11.4 11.4 0 0 1-1.87-.86c.16-.11.31-.23.46-.35a12.6 12.6 0 0 0 10.5 0c.15.12.3.24.46.35-.6.36-1.22.64-1.87.86l.9 1.42a17.6 17.6 0 0 0 5.3-2.6c.35-3.94-.6-7.4-2.73-10.5ZM8.68 13.9c-.9 0-1.63-.83-1.63-1.85 0-1.02.72-1.85 1.63-1.85.92 0 1.65.84 1.63 1.85 0 1.02-.71 1.85-1.63 1.85Zm6.65 0c-.9 0-1.63-.83-1.63-1.85 0-1.02.72-1.85 1.63-1.85.92 0 1.65.84 1.63 1.85 0 1.02-.71 1.85-1.63 1.85Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.4-.43-5a2.8 2.8 0 0 0-2-2C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.57.5a2.8 2.8 0 0 0-2 2C1 8.6 1 12 1 12s0 3.4.43 5a2.8 2.8 0 0 0 2 2c1.67.5 8.57.5 8.57.5s6.9 0 8.57-.5a2.8 2.8 0 0 0 2-2C23 15.4 23 12 23 12ZM9.8 15.5v-7l6 3.5-6 3.5Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.3 8.3L23.3 22h-6.8l-5.3-6.9L5 22H1.9l7.8-8.9L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 4H5.3l12.4 16Z"/></svg>',
    website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>'
  };
  function socialIcon(p) { return ICONS[p] || ICONS.website; }

  let data = JSON.parse(JSON.stringify(initialData));
  data.socials = Array.isArray(data.socials) ? data.socials : [];
  data.projects = Array.isArray(data.projects) ? data.projects : [];
  data.skills = Array.isArray(data.skills) ? data.skills : [];
  data.experiences = Array.isArray(data.experiences) ? data.experiences : [];
  data.certificates = Array.isArray(data.certificates) ? data.certificates : [];

  let isAdmin = false;
  let expanded = false;
  let editSection = null;
  const ADMIN_PASSWORD = window.__PROFILE_ADMIN_PASSWORD__ || "admin123";

  async function persist() {
    try {
      const res = await fetch(`/api/profile/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("save failed");
      showToast("SAVED");
    } catch (e) {
      showToast("SAVE FAILED");
    }
  }
  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1500);
  }
  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function setExpanded(val) {
    expanded = val;
    if (!val) editSection = null;
    document.getElementById("stage").classList.toggle("expanded", expanded);
    renderAll();
  }

  function renderAll() {
    renderHero();
    renderAdminButtons();
    renderHeader();
    renderCta();
    renderExtra();
  }

  function renderHero() {
    const layer = document.getElementById("photoLayer");
    const fallback = document.getElementById("photoFallback");
    if (data.cover) {
      layer.style.backgroundImage = `url('${data.cover}')`;
      layer.style.display = "block";
      fallback.style.display = "none";
    } else {
      layer.style.display = "none";
      fallback.style.display = "flex";
      document.getElementById("fallbackLetter").textContent = (data.name || "?").charAt(0).toUpperCase();
    }
  }
  function renderAdminButtons() {
    document.getElementById("adminBtnHero").innerHTML = isAdmin ? ICONS.lockOpen : ICONS.lockClosed;
  }
  function renderHeader() {
    document.getElementById("handleTagTop").textContent = data.handle;
    const stats = [
      { n: data.projects.length, l: "Projects" },
      { n: data.skills.length, l: "Skills" },
      { n: data.socials.length, l: "Links" }
    ];
    const editBtn = isAdmin && expanded ? `<button class="edit-fab" data-edit="header">${ICONS.pencil} EDIT</button>` : "";
    document.getElementById("sheetHeader").innerHTML = `
      <div class="p-name">${escapeHtml(data.name)}</div>
      <div class="p-handle">${escapeHtml(data.handle)}</div>
      <div class="p-quote">${escapeHtml(data.bio)}</div>
      <div class="stats-row">${stats.map((s) => `<div class="stat"><b>${s.n}</b><span>${s.l}</span></div>`).join("")}</div>
      ${editBtn ? `<div style="margin-top:12px;">${editBtn}</div>` : ""}
    `;
  }
  function renderCta() {
    const cta = document.getElementById("ctaBtn");
    cta.href = data.phone ? `tel:${data.phone.replace(/\\s+/g, "")}` : "#";
  }

  function renderExtra() {
    const el = document.getElementById("sheetExtra");
    if (!expanded) { el.innerHTML = ""; return; }

    if (editSection === "header") { el.innerHTML = headerEditForm(); bindHeaderForm(); return; }
    if (editSection === "skills") { el.innerHTML = skillsEditForm(); bindSkillsForm(); return; }
    if (editSection === "projects") { el.innerHTML = projectsEditForm(); bindProjectsForm(); return; }
    if (editSection === "experiences") { el.innerHTML = experiencesEditForm(); bindExperiencesForm(); return; }
    if (editSection === "certificates") { el.innerHTML = certificatesEditForm(); bindCertificatesForm(); return; }
    if (editSection === "contact") { el.innerHTML = contactEditForm(); bindContactForm(); return; }

    el.innerHTML = `
      <div class="section-head"><span class="section-label">SKILLS</span>${isAdmin ? `<button class="edit-fab" data-edit="skills">${ICONS.pencil} EDIT</button>` : ""}</div>
      <div class="tag-row">
        ${data.skills.length ? data.skills.map((s) => {
          const alpha = 0.10 + (Math.max(0, Math.min(100, s.level)) / 100) * 0.25;
          return `<span class="tag" style="background:rgba(255,255,255,${alpha.toFixed(2)})">#${escapeHtml((s.name || "").replace(/\\s+/g, ""))}</span>`;
        }).join("") : '<span class="empty-note">No skills added yet.</span>'}
      </div>

      <div class="section-head"><span class="section-label">PROJECTS</span>${isAdmin ? `<button class="edit-fab" data-edit="projects">${ICONS.pencil} EDIT</button>` : ""}</div>
      ${data.projects.length ? `
      <div class="project-list">
        ${data.projects.map((p) => `
          <div class="project-card">
            ${p.image ? `<img class="project-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">` : '<div class="project-image"></div>'}
            <div><div class="project-title">${escapeHtml(p.title)}</div><div class="project-desc">${escapeHtml(p.description)}</div></div>
          </div>
        `).join("")}
      </div>` : '<span class="empty-note">No projects added yet.</span>'}

      <div class="section-head"><span class="section-label">EXPERIENCES</span>${isAdmin ? `<button class="edit-fab" data-edit="experiences">${ICONS.pencil} EDIT</button>` : ""}</div>
      <div class="project-list">
        ${data.experiences.length ? data.experiences.map((item) => `
          <div class="experience-card">
            <div class="project-title">${escapeHtml(item.role)}</div>
            <div class="item-meta">${escapeHtml(item.company)}${item.period ? ` · ${escapeHtml(item.period)}` : ""}</div>
            <div class="project-desc">${escapeHtml(item.description)}</div>
          </div>
        `).join("") : '<span class="empty-note">No experiences added yet.</span>'}
      </div>

      <div class="section-head"><span class="section-label">CERTIFICATE</span>${isAdmin ? `<button class="edit-fab" data-edit="certificates">${ICONS.pencil} EDIT</button>` : ""}</div>
      <div class="project-list">
        ${data.certificates.length ? data.certificates.map((item) => `
          <div class="certificate-card">
            <div class="project-title">${escapeHtml(item.name)}</div>
            <div class="item-meta">${escapeHtml(item.issuer)}${item.year ? ` · ${escapeHtml(item.year)}` : ""}</div>
            ${item.url ? `<a class="item-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">View certificate</a>` : ""}
          </div>
        `).join("") : '<span class="empty-note">No certificates added yet.</span>'}
      </div>

      <div class="section-head"><span class="section-label">CONTACT</span>${isAdmin ? `<button class="edit-fab" data-edit="contact">${ICONS.pencil} EDIT</button>` : ""}</div>
      <div class="contact-section">
        <div class="contact-row">${ICONS.phone}<a href="tel:${escapeHtml(data.phone.replace(/\\s+/g, ""))}">${escapeHtml(data.phone)}</a></div>
        <div class="contact-row">${ICONS.mail}<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
        <div class="social-row">${data.socials.map((s) => `<a class="social-icon" href="${escapeHtml(s.url)}" target="_blank" rel="noopener" title="${escapeHtml(s.platform)}">${socialIcon(s.platform)}</a>`).join("")}</div>
      </div>
    `;
  }

  /* ---- edit forms (identical behavior to original artifact) ---- */

  function headerEditForm() {
    return `
      <label class="f-label">Cover photo URL</label>
      <input type="text" id="f-cover" value="${escapeHtml(data.cover)}" placeholder="https://...">
      <label class="f-label">Or upload image</label>
      <input type="file" id="f-cover-file" accept="image/*">
      <label class="f-label">Name</label>
      <input type="text" id="f-name" value="${escapeHtml(data.name)}">
      <label class="f-label">Handle (e.g. @yourname)</label>
      <input type="text" id="f-handle" value="${escapeHtml(data.handle)}">
      <label class="f-label">Bio</label>
      <textarea id="f-bio" placeholder="Tell people about yourself">${escapeHtml(data.bio)}</textarea>
      <div class="save-bar"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveHeader">Save</button></div>
    `;
  }
  function bindHeaderForm() {
    document.getElementById("cancelEdit").onclick = () => { editSection = null; renderExtra(); renderHeader(); };
    document.getElementById("f-cover-file").onchange = async (e) => {
      if (e.target.files[0]) document.getElementById("f-cover").value = await fileToDataUrl(e.target.files[0]);
    };
    document.getElementById("saveHeader").onclick = async () => {
      data.cover = document.getElementById("f-cover").value.trim();
      data.name = document.getElementById("f-name").value.trim() || "Unnamed";
      data.handle = document.getElementById("f-handle").value.trim();
      data.bio = document.getElementById("f-bio").value.trim();
      editSection = null;
      await persist();
      renderAll();
    };
  }

  function skillsEditForm() {
    const items = data.skills.map((s, i) => `
      <div class="mini-item">
        <div class="field-row">
          <div><label class="f-label" style="margin-top:0">Skill name</label><input type="text" data-sk-name="${i}" value="${escapeHtml(s.name)}"></div>
          <div style="max-width:88px;"><label class="f-label" style="margin-top:0">Level %</label><input type="number" min="0" max="100" data-sk-level="${i}" value="${s.level}"></div>
        </div>
        <div class="mini-item-head" style="justify-content:flex-end; margin-top:8px;"><button class="btn remove" data-rm-skill="${i}">Remove</button></div>
      </div>
    `).join("");
    return `${items}<button class="add-row-btn" id="addSkill">${ICONS.plus} Add skill</button><div class="save-bar"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveSkills">Save</button></div>`;
  }
  function bindSkillsForm() {
    document.getElementById("cancelEdit").onclick = () => { editSection = null; renderExtra(); };
    document.getElementById("addSkill").onclick = () => { data.skills.push({ name: "New Skill", level: 50 }); renderExtra(); };
    document.querySelectorAll("[data-rm-skill]").forEach((b) => b.onclick = () => { data.skills.splice(b.getAttribute("data-rm-skill"), 1); renderExtra(); });
    document.getElementById("saveSkills").onclick = async () => {
      document.querySelectorAll("[data-sk-name]").forEach((i) => { data.skills[i.getAttribute("data-sk-name")].name = i.value.trim(); });
      document.querySelectorAll("[data-sk-level]").forEach((i) => {
        let v = parseInt(i.value, 10); if (isNaN(v)) v = 0; v = Math.max(0, Math.min(100, v));
        data.skills[i.getAttribute("data-sk-level")].level = v;
      });
      editSection = null;
      await persist();
      renderAll();
    };
  }

  function projectsEditForm() {
    const items = data.projects.map((p, i) => `
      <div class="mini-item">
        <div class="mini-item-head"><label class="f-label" style="margin-top:0">Project ${i + 1}</label><button class="btn remove" data-rm-project="${i}">Remove</button></div>
        <label class="f-label">Image URL</label><input type="text" data-pj-image="${i}" value="${escapeHtml(p.image)}" placeholder="https://...">
        <label class="f-label">Or upload image</label><input type="file" accept="image/*" data-pj-image-file="${i}">
        <label class="f-label">Title</label><input type="text" data-pj-title="${i}" value="${escapeHtml(p.title)}">
        <label class="f-label">Description</label><textarea data-pj-desc="${i}">${escapeHtml(p.description)}</textarea>
      </div>
    `).join("");
    return `${items}<button class="add-row-btn" id="addProject">${ICONS.plus} Add project</button><div class="save-bar"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveProjects">Save</button></div>`;
  }
  function bindProjectsForm() {
    document.getElementById("cancelEdit").onclick = () => { editSection = null; renderExtra(); };
    document.getElementById("addProject").onclick = () => { data.projects.push({ image: "", title: "New Project", description: "Describe the project here." }); renderExtra(); };
    document.querySelectorAll("[data-rm-project]").forEach((b) => b.onclick = () => { data.projects.splice(b.getAttribute("data-rm-project"), 1); renderExtra(); });
    document.querySelectorAll("[data-pj-image-file]").forEach((inp) => {
      inp.onchange = async () => {
        if (inp.files[0]) {
          const i = inp.getAttribute("data-pj-image-file");
          const url = await fileToDataUrl(inp.files[0]);
          document.querySelector(`[data-pj-image="${i}"]`).value = url;
        }
      };
    });
    document.getElementById("saveProjects").onclick = async () => {
      document.querySelectorAll("[data-pj-title]").forEach((i) => { data.projects[i.getAttribute("data-pj-title")].title = i.value.trim(); });
      document.querySelectorAll("[data-pj-desc]").forEach((i) => { data.projects[i.getAttribute("data-pj-desc")].description = i.value.trim(); });
      document.querySelectorAll("[data-pj-image]").forEach((i) => { data.projects[i.getAttribute("data-pj-image")].image = i.value.trim(); });
      editSection = null;
      await persist();
      renderAll();
    };
  }

  function experiencesEditForm() {
    const items = data.experiences.map((item, i) => `
      <div class="mini-item">
        <div class="mini-item-head"><label class="f-label" style="margin-top:0">Experience ${i + 1}</label><button class="btn remove" data-rm-experience="${i}">Remove</button></div>
        <label class="f-label">Role</label><input type="text" data-ex-role="${i}" value="${escapeHtml(item.role)}">
        <label class="f-label">Company</label><input type="text" data-ex-company="${i}" value="${escapeHtml(item.company)}">
        <label class="f-label">Period</label><input type="text" data-ex-period="${i}" value="${escapeHtml(item.period)}" placeholder="2022 - Present">
        <label class="f-label">Description</label><textarea data-ex-description="${i}">${escapeHtml(item.description)}</textarea>
      </div>
    `).join("");
    return `${items}<button class="add-row-btn" id="addExperience">${ICONS.plus} Add experience</button><div class="save-bar"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveExperiences">Save</button></div>`;
  }
  function bindExperiencesForm() {
    document.getElementById("cancelEdit").onclick = () => { editSection = null; renderExtra(); };
    document.getElementById("addExperience").onclick = () => { data.experiences.push({ role: "New role", company: "Company", period: "", description: "Describe this experience." }); renderExtra(); };
    document.querySelectorAll("[data-rm-experience]").forEach((b) => b.onclick = () => { data.experiences.splice(b.getAttribute("data-rm-experience"), 1); renderExtra(); });
    document.getElementById("saveExperiences").onclick = async () => {
      document.querySelectorAll("[data-ex-role]").forEach((i) => { data.experiences[i.dataset.exRole].role = i.value.trim(); });
      document.querySelectorAll("[data-ex-company]").forEach((i) => { data.experiences[i.dataset.exCompany].company = i.value.trim(); });
      document.querySelectorAll("[data-ex-period]").forEach((i) => { data.experiences[i.dataset.exPeriod].period = i.value.trim(); });
      document.querySelectorAll("[data-ex-description]").forEach((i) => { data.experiences[i.dataset.exDescription].description = i.value.trim(); });
      editSection = null;
      await persist();
      renderAll();
    };
  }

  function certificatesEditForm() {
    const items = data.certificates.map((item, i) => `
      <div class="mini-item">
        <div class="mini-item-head"><label class="f-label" style="margin-top:0">Certificate ${i + 1}</label><button class="btn remove" data-rm-certificate="${i}">Remove</button></div>
        <label class="f-label">Certificate name</label><input type="text" data-cert-name="${i}" value="${escapeHtml(item.name)}">
        <label class="f-label">Issuer</label><input type="text" data-cert-issuer="${i}" value="${escapeHtml(item.issuer)}">
        <div class="field-row">
          <div><label class="f-label">Year</label><input type="text" data-cert-year="${i}" value="${escapeHtml(item.year)}"></div>
          <div><label class="f-label">Certificate URL</label><input type="text" data-cert-url="${i}" value="${escapeHtml(item.url)}" placeholder="https://..."></div>
        </div>
      </div>
    `).join("");
    return `${items}<button class="add-row-btn" id="addCertificate">${ICONS.plus} Add certificate</button><div class="save-bar"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveCertificates">Save</button></div>`;
  }
  function bindCertificatesForm() {
    document.getElementById("cancelEdit").onclick = () => { editSection = null; renderExtra(); };
    document.getElementById("addCertificate").onclick = () => { data.certificates.push({ name: "New certificate", issuer: "Issuing organization", year: "", url: "" }); renderExtra(); };
    document.querySelectorAll("[data-rm-certificate]").forEach((b) => b.onclick = () => { data.certificates.splice(b.getAttribute("data-rm-certificate"), 1); renderExtra(); });
    document.getElementById("saveCertificates").onclick = async () => {
      document.querySelectorAll("[data-cert-name]").forEach((i) => { data.certificates[i.dataset.certName].name = i.value.trim(); });
      document.querySelectorAll("[data-cert-issuer]").forEach((i) => { data.certificates[i.dataset.certIssuer].issuer = i.value.trim(); });
      document.querySelectorAll("[data-cert-year]").forEach((i) => { data.certificates[i.dataset.certYear].year = i.value.trim(); });
      document.querySelectorAll("[data-cert-url]").forEach((i) => { data.certificates[i.dataset.certUrl].url = i.value.trim(); });
      editSection = null;
      await persist();
      renderAll();
    };
  }

  function contactEditForm() {
    const rows = data.socials.map((s, i) => `
      <div class="mini-item">
        <label class="f-label" style="margin-top:0">Platform</label>
        <select data-so-platform="${i}">
          ${["github", "linkedin", "discord", "instagram", "youtube", "twitter", "website"].map((p) => `<option value="${p}" ${p === s.platform ? "selected" : ""}>${p}</option>`).join("")}
        </select>
        <label class="f-label">URL</label><input type="text" data-so-url="${i}" value="${escapeHtml(s.url)}" placeholder="https://...">
        <div class="mini-item-head" style="justify-content:flex-end; margin-top:8px;"><button class="btn remove" data-rm-social="${i}">Remove</button></div>
      </div>
    `).join("");
    return `
      <label class="f-label" style="margin-top:0">Phone number</label><input type="text" id="f-phone" value="${escapeHtml(data.phone)}">
      <label class="f-label">Email</label><input type="text" id="f-email" value="${escapeHtml(data.email)}">
      <label class="f-label">Social links</label>${rows}
      <button class="add-row-btn" id="addSocial">${ICONS.plus} Add social link</button>
      <div class="save-bar"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveContact">Save</button></div>
    `;
  }
  function bindContactForm() {
    document.getElementById("cancelEdit").onclick = () => { editSection = null; renderExtra(); };
    document.getElementById("addSocial").onclick = () => { data.socials.push({ platform: "website", url: "https://" }); renderExtra(); };
    document.querySelectorAll("[data-rm-social]").forEach((b) => b.onclick = () => { data.socials.splice(b.getAttribute("data-rm-social"), 1); renderExtra(); });
    document.getElementById("saveContact").onclick = async () => {
      data.phone = document.getElementById("f-phone").value.trim();
      data.email = document.getElementById("f-email").value.trim();
      document.querySelectorAll("[data-so-url]").forEach((i) => { data.socials[i.getAttribute("data-so-url")].url = i.value.trim(); });
      document.querySelectorAll("[data-so-platform]").forEach((i) => { data.socials[i.getAttribute("data-so-platform")].platform = i.value; });
      editSection = null;
      await persist();
      renderAll();
    };
  }

  function onAdminToggle() {
    if (isAdmin) { isAdmin = false; editSection = null; renderAll(); return; }
    showPasswordModal();
  }
  function showPasswordModal() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>Admin access</h3>
        <input type="text" id="pw-input" placeholder="Enter password" autocomplete="off">
        <p class="hint" id="pw-error">Incorrect password.</p>
        <div class="save-bar"><button class="btn" id="pw-cancel">Cancel</button><button class="btn primary" id="pw-submit">Unlock</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = document.getElementById("pw-input");
    input.focus();
    function tryUnlock() {
      if (input.value === ADMIN_PASSWORD) { isAdmin = true; overlay.remove(); renderAll(); }
      else document.getElementById("pw-error").style.display = "block";
    }
    document.getElementById("pw-submit").onclick = tryUnlock;
    document.getElementById("pw-cancel").onclick = () => overlay.remove();
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  }

  function attachStaticEvents() {
    document.getElementById("seeProfileBtn").onclick = () => setExpanded(true);
    document.getElementById("backBtn").onclick = () => setExpanded(false);
    document.getElementById("adminBtnHero").onclick = onAdminToggle;

    document.body.addEventListener("click", (e) => {
      const editBtn = e.target.closest("[data-edit]");
      if (editBtn) { editSection = editBtn.getAttribute("data-edit"); renderExtra(); renderHeader(); }
    });

    const dz = document.getElementById("dragZone");
    let startY = null;
    dz.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
    dz.addEventListener("touchend", (e) => {
      if (startY === null) return;
      const dy = startY - e.changedTouches[0].clientY;
      if (dy > 40 && !expanded) setExpanded(true);
      if (dy < -40 && expanded) setExpanded(false);
      startY = null;
    }, { passive: true });
  }

  function syncResponsiveLayout() {
    const wideViewport = window.matchMedia("(min-width: 768px)").matches;
    if (wideViewport !== expanded) setExpanded(wideViewport);
  }

  expanded = window.matchMedia("(min-width: 768px)").matches;
  attachStaticEvents();
  window.addEventListener("resize", syncResponsiveLayout);
  renderAll();
}
