export default function AppLoading() {
  return (
    <main className="container">
      <div className="skeleton-page page-turn-in" aria-label="Cookbook page is loading">
        <div className="skeleton-line wide" />
        <div className="skeleton-line" />
        <div className="skeleton-card" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    </main>
  );
}
