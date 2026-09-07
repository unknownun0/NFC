export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e0e10",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
        padding: 20
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Profile Platform</h1>
        <p style={{ opacity: 0.7, marginBottom: 20 }}>
          Visit <code>/your-slug</code> to view a profile, or{" "}
          <a href="/admin" style={{ color: "#fff" }}>
            /admin
          </a>{" "}
          to create one.
        </p>
      </div>
    </div>
  );
}
