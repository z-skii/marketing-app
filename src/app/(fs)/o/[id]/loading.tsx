export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading work">
      <div className="fs-skeleton" style={{ marginTop: 8, height: 44, width: 96 }} />
      <div style={{ display: "grid", gridTemplateColumns: "184px 1fr", marginTop: 12 }}>
        <div className="fs-skeleton" style={{ width: 184, height: 327 }} />
        <div className="fs-skeleton" style={{ marginTop: 12, height: 327 }} />
      </div>
      <div className="fs-skeleton" style={{ marginTop: 12, height: 20, width: "60%" }} />
      <div className="fs-skeleton" style={{ marginTop: 32, height: 28, width: 200 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, height: 96, width: "100%" }} />
    </main>
  );
}
