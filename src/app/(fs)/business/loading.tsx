export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 260 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, height: 44, width: "100%" }} />
      <div style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 12, marginTop: 16 }}>
        <div className="fs-skeleton" style={{ width: 176, height: 220 }} />
        <div><div className="fs-skeleton" style={{ width: 104, height: 130, marginTop: 12 }} /><div className="fs-skeleton" style={{ height: 28, width: "70%", marginTop: 8 }} /></div>
      </div>
      <div className="fs-skeleton" style={{ marginTop: 24, height: 28, width: 180 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, width: "100%", aspectRatio: "3 / 2" }} />
    </main>
  );
}
