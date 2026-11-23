export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <p className="text-[11px] uppercase tracking-[0.25em] text-amber-400">NFC · QR · Google Reviews</p>
        <h1 className="text-4xl font-semibold tracking-tight">Wasla NFC</h1>
        <p className="text-stone-300 leading-relaxed">
          Plus d'avis Google pour votre café ou restaurant, en un seul tap.
        </p>
        <a
          href="/admin"
          className="inline-block rounded-xl bg-amber-500 text-stone-950 font-semibold px-6 py-3 text-sm hover:bg-amber-400 transition"
        >
          Espace opérateur
        </a>
      </div>
    </div>
  )
}
