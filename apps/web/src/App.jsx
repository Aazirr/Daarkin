import { APPLICATION_STATUSES } from "@jat/shared";

const STATUS_LABELS = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default function App() {
  return (
    <div className="min-h-screen bg-oat px-4 py-10 text-ink">
      <main className="mx-auto max-w-4xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Phase 0</p>
          <h1 className="text-3xl font-bold md:text-4xl">Job Application Tracker</h1>
          <p className="max-w-2xl text-sm leading-6 text-black/70 md:text-base">
            Frontend foundation is ready with React, Vite, and Tailwind. Next phases will add
            application CRUD, notes, and search.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-black/10 bg-oat/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Configured Stack</h2>
            <ul className="mt-3 space-y-2 text-sm text-black/75">
              <li>React 18 + Vite 5</li>
              <li>Tailwind CSS</li>
              <li>Shared contracts package</li>
              <li>API-ready frontend shell</li>
            </ul>
          </article>

          <article className="rounded-xl border border-black/10 bg-oat/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Status Contract</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((status) => (
                <span
                  key={status}
                  className="rounded-full border border-moss/30 bg-moss/10 px-3 py-1 text-xs font-medium text-moss"
                >
                  {STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
