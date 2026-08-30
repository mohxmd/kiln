import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-100 antialiased font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-8 flex items-center justify-center">
          <img
            src="/kiln-logo.png"
            alt="Kiln Logo"
            className="h-24 w-24 drop-shadow-[0_0_24px_rgba(249,115,22,0.3)]"
          />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
          Compiled Native Binary
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
          TanStack Start + Kiln
        </h1>

        <p className="mt-4 max-w-lg text-base text-zinc-400 sm:text-lg">
          This TanStack Start application, powered by Nitro and React 19, is running directly from a single native standalone executable binary.
        </p>

        <div className="mt-8 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
            <h3 className="font-semibold text-white">⚡ Nitro SSR + Bun.serve</h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Zero-copy static asset delivery paired with full server-side React 19 rendering.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
            <h3 className="font-semibold text-white">📦 Zero Host Setup</h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Run standalone across any Linux, macOS, or Windows environment with zero dependencies.
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
            href="https://tanstack.com/start"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            TanStack Start
          </a>
        </div>
      </main>
    </div>
  )
}