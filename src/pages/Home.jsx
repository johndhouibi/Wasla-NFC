import { useState } from 'react'
import { Star, MessageCircle, Check } from 'lucide-react'
import { WHATSAPP_NUMBER } from '../siteConfig.js'

const Instagram = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const STRINGS = {
  fr: {
    nav: { how: 'Fonctionnement', business: 'Pour vous', personal: 'Cartes personnelles', pricing: 'Tarifs', faq: 'FAQ' },
    client: 'Espace client',
    order: 'Commander',
    heroTitle: 'Un tap, un avis Google.',
    heroText:
      'Des cartes NFC et des QR codes pour les cafés et restaurants. Vos clients laissent un avis en quelques secondes, et vous voyez ce qui marche.',
    seePricing: 'Voir les tarifs',
    previewLabel: "Aperçu de la page que vos clients voient",
    previewCta: 'Laissez-nous un avis sur Google',
    howTitle: 'Comment ça marche',
    steps: [
      ['Le client tape', "Il pose son téléphone sur la carte, ou scanne le QR code. Aucune application à installer."],
      [
        'Il choisit',
        "Une page à votre image s'ouvre : laisser un avis Google, suivre votre Instagram, vous écrire sur WhatsApp ou envoyer un message privé au manager.",
      ],
      [
        'Vous suivez',
        'Votre tableau de bord montre les taps, les clics vers Google et les messages reçus, carte par carte et équipier par équipier.',
      ],
    ],
    bizTitle: "Ce que ça change pour votre établissement",
    benefits: [
      ['Un avis en quelques secondes', "Le chemin le plus court vers votre fiche Google : un tap, puis le formulaire d'avis. Plus besoin d'expliquer comment faire."],
      ['Une ligne directe avec le manager', 'Chaque client peut aussi écrire un message privé. Vous recevez ses remarques directement dans votre espace.'],
      ['Des résultats clairs', 'Taps par jour, clics vers Google, taux de conversion. Vous savez ce qui fonctionne, et à quel endroit.'],
      ['Votre équipe impliquée', 'Associez chaque carte à un équipier et voyez qui encourage le plus ses clients à laisser un avis.'],
      ['Des cartes flexibles', "Changez l'emplacement ou le rattachement d'une carte sans la réimprimer ni la reprogrammer."],
      ['Vos réseaux au même endroit', 'Instagram et WhatsApp sont à un tap, sur la même page que votre avis Google.'],
    ],
    dashTitle: 'Un tableau de bord que votre équipe comprend',
    dashText:
      'Taps par jour, clics vers Google, conversion, résultats par équipier et messages privés. Sur téléphone comme sur ordinateur, avec un accès sécurisé pour vous seul.',
    dashLabels: ['Taps', 'Clics Google', 'Conversion'],
    dashNote: 'Exemple de tableau de bord. Chiffres fictifs, pour illustration.',
    personalBadge: 'Bientôt',
    personalTitle: 'Cartes de visite NFC personnelles',
    personalText:
      'Votre carte de visite en un tap : vos réseaux, votre WhatsApp, votre portfolio. Design personnalisé, modifiable à tout moment. En préparation.',
    personalCta: "Me prévenir à l'ouverture",
    personalMsg: "Bonjour Wasla NFC, je souhaite être prévenu(e) de l'ouverture des cartes de visite NFC personnelles.",
    pricingTitle: 'Tarifs',
    pricingText: 'Paiement unique pour les cartes et la mise en place. La première année du tableau de bord est incluse.',
    packs: [
      {
        id: 'Start',
        forWho: 'Un petit café',
        price: '99',
        features: ['3 cartes NFC avec QR code', 'Mise en place avec votre fiche Google', 'Espace client : 12 mois inclus'],
      },
      {
        id: 'Pro',
        forWho: 'Un restaurant avec des tables',
        price: '229',
        features: ['8 cartes NFC avec QR code', 'Mise en place avec votre fiche Google', 'Espace client : 12 mois inclus'],
        highlight: true,
      },
      {
        id: 'Studio',
        forWho: 'Un grand établissement ou une terrasse',
        price: '399',
        features: ['15 cartes NFC avec QR code', 'Votre logo et vos couleurs imprimés', 'Espace client : 12 mois inclus'],
      },
    ],
    chain: 'Plusieurs établissements ? Un seul tableau de bord pour tous. Demandez un devis.',
    choose: 'Choisir ce pack',
    currency: 'DT',
    notes: [
      "Après la première année : 120 DT par an et par établissement. Vos cartes continuent d'ouvrir votre page.",
      'Option 2 ans : 220 DT au lieu de 240 DT.',
      'Carte supplémentaire : 25 DT. Remplacement d\'une carte perdue : 12 DT.',
    ],
    orderTitle: 'Commander',
    orderText:
      "Remplissez ce formulaire : il ouvre WhatsApp avec votre demande déjà écrite. Nous confirmons avec vous le prix, la livraison et la mise en place.",
    fName: 'Votre nom',
    fVenue: "Nom de l'établissement",
    fCity: 'Ville',
    fPack: 'Pack',
    fChain: 'Plusieurs établissements (devis)',
    fMessage: 'Message (facultatif)',
    send: 'Envoyer sur WhatsApp',
    orderMsg: (f) =>
      `Bonjour Wasla NFC, je souhaite commander le pack ${f.pack}.\nNom : ${f.name}\nÉtablissement : ${f.venue}\nVille : ${f.city || '-'}${
        f.message ? `\nMessage : ${f.message}` : ''
      }`,
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Faut-il une application ?', "Non. Vos clients posent leur téléphone sur la carte ou scannent le QR code avec l'appareil photo. Le tap fonctionne sur la plupart des téléphones récents, et le QR code sert de solution de secours."],
      ["Garantissez-vous plus d'avis ?", "Nous ne promettons aucun nombre d'avis. Nous rendons le geste simple pour chaque client, sans le filtrer ni le récompenser, comme l'exigent les règles de Google."],
      ['Puis-je déplacer une carte vers un autre établissement ?', "Oui, par un simple changement dans l'espace de gestion. La carte physique ne change pas."],
      ['Que se passe-t-il si je ne renouvelle pas ?', "Vos cartes continuent d'ouvrir votre page. Le renouvellement concerne l'espace client et son suivi."],
      ['Comment accéder à mes résultats ?', "Nous créons pour vous un accès sécurisé à l'espace client, consultable sur téléphone ou ordinateur."],
      ['Et la livraison ?', 'Nous confirmons le délai et les frais avec vous sur WhatsApp au moment de la commande.'],
    ],
    footer: 'Cartes NFC et QR codes pour les avis Google.',
  },
  en: {
    nav: { how: 'How it works', business: 'For you', personal: 'Personal cards', pricing: 'Pricing', faq: 'FAQ' },
    client: 'Owner area',
    order: 'Order',
    heroTitle: 'One tap, one Google review.',
    heroText:
      'NFC cards and QR codes for cafés and restaurants. Your customers leave a review in seconds, and you see what works.',
    seePricing: 'See pricing',
    previewLabel: 'Preview of the page your customers see',
    previewCta: 'Review us on Google',
    howTitle: 'How it works',
    steps: [
      ['The customer taps', 'They hold their phone to the card, or scan the QR code. No app to install.'],
      [
        'They choose',
        'A page in your style opens: leave a Google review, follow your Instagram, message you on WhatsApp, or send a private note to the manager.',
      ],
      [
        'You follow',
        'Your dashboard shows taps, Google clicks and messages received, card by card and crew member by crew member.',
      ],
    ],
    bizTitle: 'What it changes for your venue',
    benefits: [
      ['A review in seconds', 'The shortest path to your Google listing: one tap, then the review form. No need to explain how.'],
      ['A direct line to the manager', 'Every customer can also write a private note. You receive their comments straight in your area.'],
      ['Clear results', 'Taps per day, Google clicks, conversion rate. You know what works, and where.'],
      ['Your team involved', 'Link each card to a crew member and see who encourages their customers most.'],
      ['Flexible cards', 'Change a card’s placement or assignment without reprinting or reprogramming it.'],
      ['Your networks in one place', 'Instagram and WhatsApp are one tap away, on the same page as your Google review.'],
    ],
    dashTitle: 'A dashboard your team understands',
    dashText:
      'Taps per day, Google clicks, conversion, results per crew member and private messages. On phone or computer, with secure access for you alone.',
    dashLabels: ['Taps', 'Google clicks', 'Conversion'],
    dashNote: 'Sample dashboard. Fictional numbers, for illustration.',
    personalBadge: 'Coming soon',
    personalTitle: 'Personal NFC business cards',
    personalText:
      'Your business card in one tap: your networks, your WhatsApp, your portfolio. Custom design, editable any time. In preparation.',
    personalCta: 'Notify me at launch',
    personalMsg: 'Hello Wasla NFC, I would like to be notified when personal NFC business cards launch.',
    pricingTitle: 'Pricing',
    pricingText: 'One payment for the cards and the setup. The first year of the dashboard is included.',
    packs: [
      {
        id: 'Start',
        forWho: 'A small café',
        price: '99',
        features: ['3 NFC cards with QR code', 'Setup with your Google listing', 'Owner area: 12 months included'],
      },
      {
        id: 'Pro',
        forWho: 'A restaurant with tables',
        price: '229',
        features: ['8 NFC cards with QR code', 'Setup with your Google listing', 'Owner area: 12 months included'],
        highlight: true,
      },
      {
        id: 'Studio',
        forWho: 'A large venue or terrace',
        price: '399',
        features: ['15 NFC cards with QR code', 'Your logo and colors printed', 'Owner area: 12 months included'],
      },
    ],
    chain: 'Several venues? One dashboard for all of them. Ask for a quote.',
    choose: 'Choose this pack',
    currency: 'TND',
    notes: [
      'After the first year: 120 TND per year per venue. Your cards keep opening your page.',
      '2-year option: 220 TND instead of 240 TND.',
      'Extra card: 25 TND. Replacement of a lost card: 12 TND.',
    ],
    orderTitle: 'Order',
    orderText:
      'Fill in this form: it opens WhatsApp with your request already written. We confirm the price, delivery and setup with you.',
    fName: 'Your name',
    fVenue: 'Venue name',
    fCity: 'City',
    fPack: 'Pack',
    fChain: 'Several venues (quote)',
    fMessage: 'Message (optional)',
    send: 'Send on WhatsApp',
    orderMsg: (f) =>
      `Hello Wasla NFC, I would like to order the ${f.pack} pack.\nName: ${f.name}\nVenue: ${f.venue}\nCity: ${f.city || '-'}${
        f.message ? `\nMessage: ${f.message}` : ''
      }`,
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Do customers need an app?', 'No. They hold their phone to the card or scan the QR code with the camera. The tap works on most recent phones, and the QR code is the backup.'],
      ['Do you guarantee more reviews?', 'We promise no number of reviews. We make the action easy for every customer, without filtering or rewarding it, as Google’s rules require.'],
      ['Can I move a card to another venue?', 'Yes, with a simple change in the management area. The physical card stays the same.'],
      ['What if I don’t renew?', 'Your cards keep opening your page. Renewal covers the owner area and its tracking.'],
      ['How do I access my results?', 'We create a secure login for you to the owner area, available on phone or computer.'],
      ['What about delivery?', 'We confirm the delay and the cost with you on WhatsApp when you order.'],
    ],
    footer: 'NFC cards and QR codes for Google reviews.',
  },
}

const detectLang = () => {
  try {
    return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

const BARS = [30, 45, 38, 60, 52, 75, 68, 90, 64, 80, 55, 70, 95, 85]

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`scroll-mt-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-12">{children}</div>
    </section>
  )
}

export default function Home() {
  const [lang, setLang] = useState(detectLang)
  const t = STRINGS[lang]
  const [form, setForm] = useState({ name: '', venue: '', city: '', pack: 'Pro', message: '' })

  const submitOrder = (e) => {
    e.preventDefault()
    window.open(waLink(t.orderMsg(form)), '_blank', 'noopener')
  }

  return (
    <div id="top" className="min-h-screen bg-page text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-page/85 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="text-lg font-semibold tracking-tight">
            Wasla NFC
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-sm text-mute">
            {Object.entries(t.nav).map(([key, label]) => (
              <a key={key} href={`#${key}`} className="hover:text-ink transition">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLang((l) => (l === 'fr' ? 'en' : 'fr'))} className="btn-ghost">
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <a href="/owner" className="btn-ghost hidden sm:inline-flex">
              {t.client}
            </a>
            <a href="#order" className="btn-primary px-4! py-2!">
              {t.order}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Section className="py-16 md:py-28">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="space-y-7">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]">{t.heroTitle}</h1>
            <p className="text-mute text-lg leading-relaxed max-w-md">{t.heroText}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#pricing" className="btn-primary">
                {t.seePricing}
              </a>
              <a href="/owner" className="btn-ghost px-5! py-2.5! text-sm!">
                {t.client}
              </a>
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <div className="panel rounded-[2rem] p-7 space-y-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold shadow-md bg-[#D97706] text-black">
                CE
              </div>
              <div>
                <p className="text-sm text-mute">Sfax</p>
                <p className="text-2xl font-semibold tracking-tight">Café Exemple</p>
              </div>
              <div className="rounded-2xl bg-ink text-paper py-4 px-5 flex flex-col items-center gap-2">
                <span className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ fill: '#D97706', color: '#D97706' }} />
                  ))}
                </span>
                <span className="text-sm font-semibold text-center">{t.previewCta}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3">
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-line py-3">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-mute text-center mt-4">{t.previewLabel}</p>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" className="py-16 md:py-24 border-t border-line">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12">{t.howTitle}</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {t.steps.map(([title, text], i) => (
            <div key={title} className="space-y-3">
              <span className="w-9 h-9 rounded-full border border-line grid place-items-center text-sm font-semibold">
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
              <p className="text-mute leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* For your business */}
      <div className="bg-soft border-y border-line">
        <Section id="business" className="py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12 max-w-2xl">{t.bizTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
            {t.benefits.map(([title, text]) => (
              <div key={title} className="border-t border-ink pt-4 space-y-2">
                <h3 className="font-semibold tracking-tight">{title}</h3>
                <p className="text-mute leading-relaxed text-sm">{text}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Dashboard preview */}
      <Section className="py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t.dashTitle}</h2>
            <p className="text-mute text-lg leading-relaxed max-w-md">{t.dashText}</p>
          </div>
          <div>
            <div className="panel space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-line p-4">
                  <p className="text-xs text-mute">{t.dashLabels[0]}</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">120</p>
                </div>
                <div className="rounded-2xl border border-line p-4">
                  <p className="text-xs text-mute">{t.dashLabels[1]}</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">70</p>
                </div>
                <div className="rounded-2xl bg-ink text-paper p-4">
                  <p className="text-xs text-paper/60">{t.dashLabels[2]}</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">58%</p>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {BARS.map((h, i) => (
                  <div key={i} className="flex-1 bg-ink rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <p className="text-xs text-mute mt-3">{t.dashNote}</p>
          </div>
        </div>
      </Section>

      {/* Personal cards */}
      <Section id="personal" className="pb-16 md:pb-24">
        <div className="rounded-3xl bg-soft border border-line p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="inline-block rounded-full bg-ink text-paper text-xs font-semibold px-3 py-1">
              {t.personalBadge}
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t.personalTitle}</h2>
            <p className="text-mute text-lg leading-relaxed">{t.personalText}</p>
          </div>
          <a href={waLink(t.personalMsg)} target="_blank" rel="noopener noreferrer" className="btn-primary self-start md:self-auto">
            {t.personalCta}
          </a>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="py-16 md:py-24 border-t border-line">
        <div className="max-w-2xl mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t.pricingTitle}</h2>
          <p className="text-mute text-lg leading-relaxed">{t.pricingText}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {t.packs.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl p-7 flex flex-col gap-6 ${
                p.highlight ? 'bg-ink text-paper' : 'bg-paper border border-line'
              }`}
            >
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{p.id}</h3>
                <p className={`text-sm mt-1 ${p.highlight ? 'text-paper/60' : 'text-mute'}`}>{p.forWho}</p>
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-5xl font-semibold tracking-tight tabular-nums">{p.price}</span>
                <span className={`text-sm ${p.highlight ? 'text-paper/60' : 'text-mute'}`}>{t.currency}</span>
              </p>
              <ul className="space-y-2.5 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#order"
                onClick={() => setForm((f) => ({ ...f, pack: p.id }))}
                className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  p.highlight
                    ? 'bg-paper text-ink hover:bg-soft'
                    : 'bg-ink text-paper hover:bg-ink-soft'
                }`}
              >
                {t.choose}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-line p-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-mute">{t.chain}</p>
          <a
            href="#order"
            onClick={() => setForm((f) => ({ ...f, pack: 'Chain' }))}
            className="btn-ghost"
          >
            {t.order}
          </a>
        </div>

        <ul className="mt-8 space-y-2 text-sm text-mute">
          {t.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Section>

      {/* Order */}
      <div className="bg-soft border-y border-line">
        <Section id="order" className="py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t.orderTitle}</h2>
              <p className="text-mute text-lg leading-relaxed max-w-md">{t.orderText}</p>
            </div>
            <form onSubmit={submitOrder} className="panel space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs text-mute">{t.fName}</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-mute">{t.fVenue}</span>
                  <input
                    required
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-mute">{t.fCity}</span>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="field"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-mute">{t.fPack}</span>
                <select
                  value={form.pack}
                  onChange={(e) => setForm({ ...form, pack: e.target.value })}
                  className="field"
                >
                  {t.packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} ({p.price} {t.currency})
                    </option>
                  ))}
                  <option value="Chain">{t.fChain}</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-mute">{t.fMessage}</span>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="field resize-none"
                />
              </label>
              <button type="submit" className="btn-primary w-full">
                {t.send}
              </button>
            </form>
          </div>
        </Section>
      </div>

      {/* FAQ */}
      <Section id="faq" className="py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">{t.faqTitle}</h2>
        <div className="max-w-3xl border-t border-line">
          {t.faq.map(([q, a]) => (
            <details key={q} className="group border-b border-line py-5">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-6 font-medium">
                <span>{q}</span>
                <span className="text-mute text-xl leading-none group-open:hidden">+</span>
                <span className="text-mute text-xl leading-none hidden group-open:inline">−</span>
              </summary>
              <p className="text-mute leading-relaxed mt-3 max-w-2xl">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-mute">
          <div>
            <p className="font-semibold text-ink">Wasla NFC</p>
            <p className="mt-1">{t.footer}</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="/owner" className="hover:text-ink transition">
              {t.client}
            </a>
            <a href={waLink('Bonjour Wasla NFC')} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition">
              WhatsApp
            </a>
          </div>
          <p>© {new Date().getFullYear()} Wasla NFC</p>
        </div>
      </footer>
    </div>
  )
}
