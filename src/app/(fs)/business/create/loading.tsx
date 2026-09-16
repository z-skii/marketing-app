export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 260 }} />
      <div className="fs-skeleton" style={{ marginTop: 8, height: 20, width: 300 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 12, marginTop: i === 0 ? 24 : 32 }}>
          <div className="fs-skeleton" style={{ width: 120, height: 213 }} />
          <div><div className="fs-skeleton" style={{ height: 28, width: "70%", marginTop: 12 }} /><div className="fs-skeleton" style={{ height: 20, width: "90%", marginTop: 8 }} /></div>
        </div>
      ))}
    </main>
  );
}
