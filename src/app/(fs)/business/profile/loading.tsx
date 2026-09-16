export default function Loading() {
  return (
    <main className="fs-phone-main" aria-busy="true" aria-label="Loading">
      <div className="fs-skeleton" style={{ marginTop: 12, height: 36, width: 160 }} />
      <div className="fs-skeleton" style={{ marginTop: 16, width: "100%", aspectRatio: "3 / 2", maxWidth: 640 }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 104, width: 104 }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 64, width: "100%", maxWidth: 400 }} />
      <div className="fs-skeleton" style={{ marginTop: 16, height: 64, width: "100%", maxWidth: 400 }} />
    </main>
  );
}
