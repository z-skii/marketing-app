export default function Loading() {
  return (
    <main className="fs-phone-main fs-narrow" aria-busy="true" aria-label="Loading activity">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 160 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, height: 44, width: "100%" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 12, padding: "12px 0" }}>
          <div className="fs-skeleton" style={{ width: 56, height: 75 }} />
          <div><div className="fs-skeleton" style={{ height: 16, width: "40%" }} /><div className="fs-skeleton" style={{ marginTop: 8, height: 20, width: "80%" }} /><div className="fs-skeleton" style={{ marginTop: 8, height: 14, width: "55%" }} /></div>
        </div>
      ))}
    </main>
  );
}
