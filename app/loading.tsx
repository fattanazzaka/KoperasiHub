export default function Loading() {
  return (
    <main className="route-loading" role="status" aria-live="polite">
      <span className="route-loading__progress" aria-hidden="true" />
      <div className="route-loading__content">
        <span className="route-loading__eyebrow">KoperasiHub</span>
        <strong>Menyiapkan halaman</strong>
        <span>Data terbaru sedang dimuat.</span>
      </div>
    </main>
  );
}
