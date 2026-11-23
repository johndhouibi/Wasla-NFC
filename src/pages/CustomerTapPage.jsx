import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MessageCircle, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

// lucide-react no longer ships brand icons, so Instagram is defined here.
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
);

const STRINGS = {
  fr: {
    loading: 'Chargement...',
    inactive: "Cette carte n'est pas encore activée.",
    notFound: 'Carte introuvable',
    code: 'Code',
    review: 'Laissez-nous un avis sur Google',
    noteToggle: 'Envoyer un message privé au manager',
    notePlaceholder: 'Une remarque ou une suggestion pour le manager...',
    send: 'Envoyer le message',
    sending: 'Envoi...',
    thanks: 'Merci ! Votre message a été transmis à l\'équipe.',
    greeting: 'Bonjour',
  },
  en: {
    loading: 'Loading...',
    inactive: 'This NFC card is not active yet.',
    notFound: 'Card not found',
    code: 'Code',
    review: 'Review Us on Google',
    noteToggle: 'Send a private note to the manager',
    notePlaceholder: 'Share a quick thought or suggestion with the manager...',
    send: 'Send Private Note',
    sending: 'Sending...',
    thanks: 'Thank you. Your message was sent to the team.',
    greeting: 'Hello',
  },
};

const detectLang = () => {
  try {
    return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
};

export default function CustomerTapPage() {
  const { cardCode } = useParams();
  const [lang, setLang] = useState(detectLang);
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSent, setNoteSent] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const t = STRINGS[lang];

  const trackEvent = async (businessId, cardId, eventType, feedbackMessage = null) => {
    if (!businessId) return;
    try {
      await supabase.from('analytics_events').insert({
        business_id: businessId,
        card_id: cardId,
        event_type: eventType,
        feedback_message: feedbackMessage,
      });
    } catch (err) {
      console.warn('tracking failed', err);
    }
  };

  useEffect(() => {
    async function loadCard() {
      setLoading(true);
      const code = (cardCode || '').trim().toUpperCase();

      const { data: card, error } = await supabase
        .from('cards')
        .select('id, card_code, label, businesses(*)')
        .eq('card_code', code)
        .single();

      if (error || !card || !card.businesses) {
        setErrorMsg(true);
        setLoading(false);
        return;
      }

      setCardData(card);
      setLoading(false);

      // Count one page view per card per browser session (avoids reload spam).
      let alreadyCounted = false;
      try {
        const key = `viewed:${card.id}`;
        alreadyCounted = sessionStorage.getItem(key) === '1';
        if (!alreadyCounted) sessionStorage.setItem(key, '1');
      } catch {
        /* storage unavailable, count anyway */
      }
      if (!alreadyCounted) trackEvent(card.businesses.id, card.id, 'page_view');
    }

    loadCard();
  }, [cardCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center text-sm tracking-wide">
        {t.loading}
      </div>
    );
  }

  if (errorMsg || !cardData) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-medium">{t.inactive}</p>
        <p className="text-xs text-stone-400 mt-2">
          {t.code}: {cardCode}
        </p>
      </div>
    );
  }

  const biz = cardData.businesses;
  const accent = biz.accent_color || '#D97706';
  const googleReviewUrl = biz.google_place_id
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(biz.google_place_id)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${biz.name} ${biz.city || ''}`.trim())}`;
  const igUrl = biz.instagram_handle
    ? `https://instagram.com/${biz.instagram_handle.replace(/^@/, '')}`
    : null;
  const cleanPhone = (biz.whatsapp_number || '').replace(/\D/g, '');
  const waUrl =
    cleanPhone.length > 3
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`${t.greeting} ${biz.name},`)}`
      : null;

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    await trackEvent(biz.id, cardData.id, 'private_feedback', noteText.trim());
    setSubmittingNote(false);
    setNoteSent(true);
    setNoteText('');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-6 relative">
        {/* Language toggle */}
        <button
          type="button"
          onClick={() => setLang((l) => (l === 'fr' ? 'en' : 'fr'))}
          className="absolute top-4 right-4 text-[11px] font-semibold text-stone-400 hover:text-stone-100 border border-stone-700 rounded-full px-2.5 py-1 transition"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-semibold text-stone-950 shadow-md"
            style={{ backgroundColor: accent }}
          >
            {biz.name.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 pt-2">{biz.city}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{biz.name}</h1>
          <p className="text-sm text-stone-300 leading-relaxed">{biz.tagline}</p>
        </div>

        {/* Primary CTA: Google Review */}
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent(biz.id, cardData.id, 'google_click')}
          style={{ backgroundColor: accent }}
          className="w-full rounded-2xl py-4 px-5 text-stone-950 font-semibold flex flex-col items-center justify-center gap-1.5 shadow-lg active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, idx) => (
              <Star key={idx} className="w-4 h-4 fill-stone-950 text-stone-950" />
            ))}
          </div>
          <span className="text-base tracking-tight text-center">{t.review}</span>
        </a>

        {/* Secondary actions */}
        {(igUrl || waUrl) && (
          <div className={`grid gap-3 ${igUrl && waUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(biz.id, cardData.id, 'instagram_click')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-stone-800/90 hover:bg-stone-800 border border-stone-700/70 py-3.5 px-4 text-sm font-medium text-stone-100 transition"
              >
                <Instagram className="w-4 h-4 text-amber-400" />
                <span>Instagram</span>
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(biz.id, cardData.id, 'whatsapp_click')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-stone-800/90 hover:bg-stone-800 border border-stone-700/70 py-3.5 px-4 text-sm font-medium text-stone-100 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}

        {/* Private note */}
        <div className="border-t border-stone-800 pt-4">
          <button
            type="button"
            onClick={() => {
              setNoteOpen((prev) => !prev);
              setNoteSent(false);
            }}
            className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition py-1"
          >
            <span>{t.noteToggle}</span>
            {noteOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {noteOpen && (
            <div className="mt-3">
              {noteSent ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.thanks}</span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t.notePlaceholder}
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-stone-600"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !noteText.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-stone-950 py-2.5 text-xs font-semibold disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingNote ? t.sending : t.send}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-stone-500">Powered by Wasla NFC · {cardData.card_code}</p>
      </div>
    </div>
  );
}
