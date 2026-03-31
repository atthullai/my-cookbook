export default function AboutPage() {
  return (
    <main className="container">
      <h1>About Me</h1>
      <div className="card">
        <p>
          This cookbook is my private, living recipe book. Some recipes are mine, some are family recipes from my mom, dad,
          or granny, and some are dishes I learned from cooks and writers whose work taught me something important.
        </p>
        <p>
          The goal is not just to save ingredients and steps, but to preserve memory, technique, and context in both English
          and German.
        </p>
      </div>
    </main>
  );
}

export const metadata = {
  title: "About Me",
};
