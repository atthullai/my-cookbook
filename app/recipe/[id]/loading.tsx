export default function RecipeLoading() {
  return (
    <main className="container">
      <div className="skeleton-page" aria-label="Recipe is still loading">
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
