export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading earnings">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 160 }} />
      <div className="fs-skeleton" style={{ marginTop: 20, height: 20, width: 80 }} />
      <div className="fs-skeleton" style={{ marginTop: 8, height: 48, width: 200 }} />
      <div className="fs-skeleton" style={{ marginTop: 20, height: 48, width: "100%", maxWidth: 448 }} />
      <div className="fs-skeleton" style={{ marginTop: 32, height: 28, width: 160 }} />
      {[0, 1].map((i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 12, padding: "12px 0" }}>
          <div className="fs-skeleton" style={{ width: 40, height: 53 }} />
          <div><div className="fs-skeleton" style={{ height: 20, width: "50%" }} /><div className="fs-skeleton" style={{ marginTop: 8, height: 14, width: "70%" }} /></div>
        </div>
      ))}
    </main>
  );
}
