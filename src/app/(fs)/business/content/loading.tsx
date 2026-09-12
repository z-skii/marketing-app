export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading content">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 160 }} />
      <div className="fs-skeleton" style={{ marginTop: 8, height: 20, width: 240 }} />
      <div className="fs-skeleton" style={{ marginTop: 20, height: 44, width: "100%" }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 30, width: 220 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, width: "100%", aspectRatio: "358 / 239" }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 200, width: "100%" }} />
    </main>
  );
}
