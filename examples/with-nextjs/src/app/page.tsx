import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-100 antialiased font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-8 flex items-center justify-center">
          <Image
            src="/kiln-logo.png"
            alt="Kiln Logo"
            width={96}
            height={96}
            className="drop-shadow-[0_0_24px_rgba(255,100,50,0.3)]"
            priority
          />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
          Compiled Native Binary
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
          Next.js 16 + Kiln
        </h1>

        <p className="mt-4 max-w-lg text-base text-zinc-400 sm:text-lg">
          This application exercises App Router SSR, Route Handlers, and static
          assets inside a single self-contained native executable binary.
        </p>

        <div className="mt-8 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
            <h3 className="font-semibold text-white">⚡ Sub-10ms Cold Start</h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Deterministic build stamps skip extraction on restarts for instant
              server boots.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
            <h3 className="font-semibold text-white">📦 Zero Dependencies</h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              No node_modules or Node.js runtime installation needed on the
              target host.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/mohxmd/kiln"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
          >
            Kiln GitHub
          </a>
          <a
            href="http://localhost:4321"
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Kiln Docs
          </a>
          <a
            href="/ssr"
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Request-time SSR
          </a>
        </div>
      </main>
    </div>
  );
}
