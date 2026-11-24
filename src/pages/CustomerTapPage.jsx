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
    code: 'Code',
    review: 'Laissez-nous un avis sur Google',
    noteToggle: 'Envoyer un message privé au manager',
    notePlaceholder: 'Une remarque ou une suggestion pour le manager...',
    send: 'Envoyer le message',
    sending: 'Envoi...',
    thanks: "Merci ! Votre message a été transmis à l'équipe.",
    greeting: 'Bonjour',
  },
  en: {
    loading: 'Loading...',
    inactive: 'This NFC card is not active yet.',
    code: 'Code',
    review: 'Review us on Google',
    noteToggle: 'Send a private note to the manager',
    notePlaceholder: 'Share a quick thought or suggestion with the manager...',
    send: 'Send private note',
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

// Relative luminance of a #rrggbb color, used to keep text readable on any brand color.
const luminance = (hex) => {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return 0.5;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
      <div className="min-h-screen bg-page text-mute flex items-center justify-center text-sm">{t.loading}</div>
    );
  }

  if (errorMsg || !cardData) {
    return (
      <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-semibold tracking-tight">{t.inactive}</p>
        <p className="text-xs text-mute mt-2">
          {t.code} <span className="font-mono">{cardCode}</span>
        </p>
      </div>
    );
  }

  const biz = cardData.businesses;
  const accent = biz.accent_color || '#D97706';
  const tileText = luminance(accent) > 0.4 ? '#000000' : '#ffffff';
  const starColor = luminance(accent) > 0.2 ? accent : '#ffffff';

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
    <div className="min-h-screen bg-page text-ink flex items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-md rounded-[2rem] p-7 space-y-7 relative">
        <button
          type="button"
          onClick={() => setLang((l) => (l === 'fr' ? 'en' : 'fr'))}
          className="btn-ghost absolute top-5 right-5 px-3! py-1!"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>

        {/* Header */}
        <div className="space-y-3 pt-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-semibold shadow-md"
            style={{ backgroundColor: accent, color: tileText }}
          >
            {biz.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            {biz.city && <p className="text-sm text-mute">{biz.city}</p>}
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">{biz.name}</h1>
          </div>
          {biz.tagline && <p className="text-mute leading-relaxed">{biz.tagline}</p>}
        </div>

        {/* Primary action: Google review */}
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent(biz.id, cardData.id, 'google_click')}
          className="w-full rounded-2xl bg-ink text-paper py-5 px-5 flex flex-col items-center gap-2 transition hover:bg-ink-soft active:scale-[0.99]"
        >
          <span className="flex items-center gap-1">
            {[...Array(5)].map((_, idx) => (
              <Star key={idx} className="w-4 h-4" style={{ fill: starColor, color: starColor }} />
            ))}
          </span>
          <span className="text-base font-semibold tracking-tight text-center">{t.review}</span>
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
                className="flex items-center justify-center gap-2 rounded-2xl bg-paper border border-line py-3.5 px-4 text-sm font-medium transition hover:border-ink"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>
            )}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(biz.id, cardData.id, 'whatsapp_click')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-paper border border-line py-3.5 px-4 text-sm font-medium transition hover:border-ink"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}

        {/* Private note */}
        <div className="border-t border-line pt-4">
          <button
            type="button"
            onClick={() => {
              setNoteOpen((prev) => !prev);
              setNoteSent(false);
            }}
            className="w-full flex items-center justify-between text-sm text-mute hover:text-ink transition py-1"
          >
            <span>{t.noteToggle}</span>
            {noteOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {noteOpen && (
            <div className="mt-3">
              {noteSent ? (
                <div className="flex items-center gap-2 text-sm bg-soft rounded-xl p-3.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.thanks}</span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t.notePlaceholder}
                    className="field resize-none"
                  />
                  <button type="submit" disabled={submittingNote || !noteText.trim()} className="btn-primary w-full">
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingNote ? t.sending : t.send}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-mute">
          <span>Wasla NFC</span>
          <span className="font-mono">{cardData.card_code}</span>
        </div>
      </div>
    </div>
  );
}
