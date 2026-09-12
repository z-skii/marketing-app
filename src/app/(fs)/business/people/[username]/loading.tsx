export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 44, width: 100 }} />
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, marginTop: 12 }}>
        <div className="fs-skeleton" style={{ width: 160, height: 160 }} />
        <div><div className="fs-skeleton" style={{ height: 36, width: "70%", marginTop: 12 }} /><div className="fs-skeleton" style={{ height: 20, width: "50%", marginTop: 8 }} /></div>
      </div>
      <div className="fs-skeleton" style={{ marginTop: 24, height: 140, width: "100%" }} />
    </main>
  );
}
