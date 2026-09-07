import { useState, useEffect } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [slugs, setSlugs] = useState([]);

  async function loadList(s) {
    const res = await fetch(`/api/admin/list?secret=${encodeURIComponent(s)}`);
    if (res.ok) {
      const json = await res.json();
      setSlugs(json.slugs || []);
    }
  }

  function unlock() {
    setUnlocked(true);
    loadList(secret);
  }

  async function createProfile(e) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, slug: slug.trim().toLowerCase(), name: name.trim() })
    });
    const json = await res.json();
    if (res.ok) {
      setMessage(`Created! Live at: /${json.slug}`);
      setSlug("");
      setName("");
      loadList(secret);
    } else {
      setMessage(json.error || "Something went wrong");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Admin</h1>

        {!unlocked ? (
          <>
            <label style={styles.label}>Admin secret</label>
            <input
              style={styles.input}
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
            />
            <button style={styles.btnPrimary} onClick={unlock}>
              Unlock
            </button>
          </>
        ) : (
          <>
            <form onSubmit={createProfile}>
              <label style={styles.label}>New profile slug</label>
              <input
                style={styles.input}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. jane-doe"
              />
              <label style={styles.label}>Display name (optional)</label>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
              <button style={styles.btnPrimary} type="submit">
                Create profile
              </button>
            </form>
            {message && <p style={styles.message}>{message}</p>}

            <h2 style={styles.h2}>Existing profiles</h2>
            <ul style={styles.list}>
              {slugs.map((s) => (
                <li key={s} style={styles.listItem}>
                  <a href={`/${s}`} target="_blank" rel="noopener noreferrer" style={styles.link}>
                    /{s}
                  </a>
                </li>
              ))}
              {slugs.length === 0 && <li style={{ color: "#888" }}>No profiles yet.</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0e0e10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    color: "#fff",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#17171a",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 28
  },
  h1: { fontSize: 22, fontWeight: 800, marginBottom: 20 },
  h2: { fontSize: 15, fontWeight: 700, marginTop: 28, marginBottom: 10 },
  label: { display: "block", fontSize: 12, fontWeight: 700, opacity: 0.6, margin: "14px 0 6px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    outline: "none"
  },
  btnPrimary: {
    marginTop: 18,
    width: "100%",
    padding: 12,
    borderRadius: 100,
    border: "none",
    background: "#fff",
    color: "#0b0b0c",
    fontWeight: 700,
    cursor: "pointer"
  },
  message: { marginTop: 14, fontSize: 13, color: "#5fe3a1" },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: { padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.1)" },
  link: { color: "#fff", textDecoration: "underline" }
};
