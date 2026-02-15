import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            ShardDen <span className="text-slate-500">砾穴</span>
          </h1>
          <p className="text-xl text-slate-600">
            A modular developer toolkit platform
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <ToolCard
            href="/tools/json-extractor"
            title="JSON Extractor"
            description="Extract fields from JSON using path syntax"
            icon="🗂️"
          />
          {/* Future tools */}
          <ComingSoonCard title="CSV Parser" description="Parse and transform CSV files" />
          <ComingSoonCard title="Base64" description="Encode/decode Base64" />
        </div>

        <footer className="mt-16 text-center text-slate-400 text-sm">
          <p>Web: Stateless • WASM Powered</p>
        </footer>
      </div>
    </main>
  );
}

function ToolCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-600">{description}</p>
    </Link>
  );
}

function ComingSoonCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="block p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
      <div className="text-3xl mb-3 opacity-50">🚧</div>
      <h2 className="text-xl font-semibold text-slate-400 mb-2">{title}</h2>
      <p className="text-slate-400">{description}</p>
      <span className="inline-block mt-3 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
        Coming Soon
      </span>
    </div>
  );
}
