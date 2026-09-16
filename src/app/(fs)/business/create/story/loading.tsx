export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 44, width: 120 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 240 }} />
      <div className="fs-skeleton" style={{ marginTop: 12, width: 176, aspectRatio: "9 / 16" }} />
      <div className="fs-skeleton" style={{ marginTop: 24, height: 20, width: 100 }} />
      <div className="fs-skeleton" style={{ marginTop: 8, height: 28, width: 260 }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 48, width: "100%" }} />
    </main>
  );
}
