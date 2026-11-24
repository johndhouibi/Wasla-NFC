export default function Home() {
  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <span className="text-lg font-semibold tracking-tight">Wasla NFC</span>
        <a href="/admin" className="btn-ghost">
          Espace opérateur
        </a>
      </header>

      <main className="flex-1 flex items-center px-6 md:px-12 pb-20">
        <div className="w-full max-w-3xl mx-auto md:mx-0 md:ml-[max(0px,calc((100vw-72rem)/2))] space-y-7">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
            Un tap, un avis Google.
          </h1>
          <p className="text-mute text-lg leading-relaxed max-w-md">
            Des cartes NFC et des QR codes pour les cafés et restaurants. Vos clients laissent un avis en quelques
            secondes, et vous voyez ce qui marche.
          </p>
          <a href="/admin" className="btn-primary">
            Espace opérateur
          </a>
        </div>
      </main>
    </div>
  )
}
