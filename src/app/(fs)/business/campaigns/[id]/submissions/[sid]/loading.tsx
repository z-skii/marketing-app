export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 44, width: 140 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 280 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, height: 44, width: "100%" }} />
      <div className="fs-skeleton" style={{ marginTop: 16, width: "100%", aspectRatio: "3 / 2", maxWidth: 448 }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 120, width: "100%" }} />
    </main>
  );
}
