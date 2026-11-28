import React, { useEffect, useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STRINGS = {
  fr: {
    title: 'Espace client',
    signInSub: 'Connectez-vous avec les identifiants envoyés par Wasla.',
    email: 'Email',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    signOut: 'Déconnexion',
    loading: 'Chargement...',
    noBusiness: "Aucun établissement n'est lié à ce compte. Contactez Wasla.",
    allVenues: 'Tous les établissements',
    d7: '7 derniers jours',
    d30: '30 derniers jours',
    dAll: 'Depuis le début',
    refresh: 'Actualiser',
    taps: 'Taps sur les cartes',
    google: 'Clics vers Google',
    instagram: 'Clics Instagram',
    whatsapp: 'Clics WhatsApp',
    conversion: 'Conversion avis',
    conversionSub: 'des taps ouvrent Google',
    chartTitle: 'Taps par jour',
    cardsTitle: 'Vos cartes',
    cardsSub: 'Indiquez où chaque carte est placée et qui la porte.',
    code: 'Code',
    placement: 'Emplacement',
    holder: 'Portée par',
    tapsShort: 'Taps',
    googleShort: 'Google',
    lastTap: 'Dernier tap',
    save: 'Enregistrer',
    never: 'Aucun',
    saved: 'Carte mise à jour',
    saveError: "Échec de l'enregistrement",
    crewTitle: 'Résultats par équipier',
    crewEmpty: 'Indiquez qui porte chaque carte pour voir les résultats par personne.',
    crewMember: 'Équipier',
    cardsCol: 'Cartes',
    conv: 'Conversion',
    notesTitle: 'Messages privés',
    notesEmpty: 'Aucun message sur cette période.',
    accountTitle: 'Compte',
    newPassword: 'Nouveau mot de passe',
    changePassword: 'Changer le mot de passe',
    passwordChanged: 'Mot de passe modifié',
    passwordShort: '8 caractères minimum',
    loadError: 'Impossible de charger les données',
    unknownCard: 'Carte inconnue',
  },
  en: {
    title: 'Owner area',
    signInSub: 'Sign in with the login Wasla sent you.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signOut: 'Sign out',
    loading: 'Loading...',
    noBusiness: 'No venue is linked to this account. Contact Wasla.',
    allVenues: 'All venues',
    d7: 'Last 7 days',
    d30: 'Last 30 days',
    dAll: 'All time',
    refresh: 'Refresh',
    taps: 'Card taps',
    google: 'Google clicks',
    instagram: 'Instagram clicks',
    whatsapp: 'WhatsApp clicks',
    conversion: 'Review conversion',
    conversionSub: 'of taps open Google',
    chartTitle: 'Taps per day',
    cardsTitle: 'Your cards',
    cardsSub: 'Say where each card is placed and who carries it.',
    code: 'Code',
    placement: 'Placement',
    holder: 'Held by',
    tapsShort: 'Taps',
    googleShort: 'Google',
    lastTap: 'Last tap',
    save: 'Save',
    never: 'None',
    saved: 'Card updated',
    saveError: 'Could not save',
    crewTitle: 'Results by crew member',
    crewEmpty: 'Name who holds each card to see results per person.',
    crewMember: 'Crew member',
    cardsCol: 'Cards',
    conv: 'Conversion',
    notesTitle: 'Private messages',
    notesEmpty: 'No messages in this period.',
    accountTitle: 'Account',
    newPassword: 'New password',
    changePassword: 'Change password',
    passwordChanged: 'Password changed',
    passwordShort: 'At least 8 characters',
    loadError: 'Could not load data',
    unknownCard: 'Unknown card',
  },
};

const detectLang = () => {
  try {
    return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
};

const summarize = (list) => {
  const count = (type) => list.filter((e) => e.event_type === type).length;
  const taps = count('page_view');
  const google = count('google_click');
  return {
    taps,
    google,
    instagram: count('instagram_click'),
    whatsapp: count('whatsapp_click'),
    rate: taps ? Math.round((google / taps) * 100) : 0,
  };
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-mute">{label}</span>
      {children}
    </label>
  );
}

export default function OwnerDashboard() {
  const [lang, setLang] = useState(detectLang);
  const t = STRINGS[lang];
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [cards, setCards] = useState([]);
  const [events, setEvents] = useState([]);
  const [holders, setHolders] = useState({});

  const [bizFilter, setBizFilter] = useState('all');
  const [range, setRange] = useState('30');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState(null);

  const notify = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const own = await supabase.from('business_owners').select('business_id');
    if (own.error) {
      notify('error', `${t.loadError}: ${own.error.message}`);
      setLoading(false);
      return;
    }
    const ids = [...new Set((own.data || []).map((r) => String(r.business_id)))];
    if (ids.length === 0) {
      setBusinesses([]);
      setCards([]);
      setEvents([]);
      setHolders({});
      setLoading(false);
      return;
    }

    const [biz, crd, evt] = await Promise.all([
      supabase.from('businesses').select('*').in('id', ids),
      supabase.from('cards').select('id, card_code, label, business_id').in('business_id', ids).order('card_code'),
      supabase
        .from('analytics_events')
        .select('*')
        .in('business_id', ids)
        .order('created_at', { ascending: false })
        .limit(5000),
    ]);
    const firstError = biz.error || crd.error || evt.error;
    if (firstError) notify('error', `${t.loadError}: ${firstError.message}`);

    const cardList = crd.data || [];
    let holderMap = {};
    if (cardList.length) {
      const hol = await supabase
        .from('card_holders')
        .select('card_id, holder_name')
        .in('card_id', cardList.map((c) => String(c.id)));
      holderMap = Object.fromEntries(
        (hol.data || []).filter((r) => r.holder_name).map((r) => [String(r.card_id), r.holder_name])
      );
    }

    setBusinesses(biz.data || []);
    setCards(cardList);
    setEvents(evt.data || []);
    setHolders(holderMap);
    setLoading(false);
  };

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify('error', t.passwordShort);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) notify('error', error.message);
    else {
      notify('success', t.passwordChanged);
      setNewPassword('');
    }
  };

  // ---------- derived data ----------
  const inBiz = (bizId) => bizFilter === 'all' || String(bizId) === String(bizFilter);
  const cardsScoped = useMemo(() => cards.filter((c) => inBiz(c.business_id)), [cards, bizFilter]);
  const eventsBiz = useMemo(() => events.filter((e) => inBiz(e.business_id)), [events, bizFilter]);
  const eventsRange = useMemo(() => {
    if (range === 'all') return eventsBiz;
    const since = Date.now() - Number(range) * 86400000;
    return eventsBiz.filter((e) => new Date(e.created_at).getTime() >= since);
  }, [eventsBiz, range]);

  const totals = summarize(eventsRange);

  const chart = useMemo(() => {
    const n = range === '7' ? 7 : 30;
    const counts = {};
    eventsBiz
      .filter((e) => e.event_type === 'page_view')
      .forEach((e) => {
        const key = new Date(e.created_at).toLocaleDateString('en-CA');
        counts[key] = (counts[key] || 0) + 1;
      });
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toLocaleDateString('en-CA'),
        label: d.toLocaleDateString(locale, { day: '2-digit', month: 'short' }),
        count: counts[d.toLocaleDateString('en-CA')] || 0,
      });
    }
    return days;
  }, [eventsBiz, range, locale]);
  const maxCount = Math.max(1, ...chart.map((d) => d.count));

  const cardRows = cardsScoped.map((c) => {
    const rangeEv = eventsRange.filter((e) => String(e.card_id) === String(c.id));
    const allEv = eventsBiz.filter((e) => String(e.card_id) === String(c.id));
    const s = summarize(rangeEv);
    const last = allEv.find((e) => e.event_type === 'page_view');
    return { card: c, taps: s.taps, google: s.google, last: last ? last.created_at : null };
  });

  const crewRows = useMemo(() => {
    const groups = {};
    cardRows.forEach((r) => {
      const name = holders[String(r.card.id)];
      if (!name) return;
      const g = (groups[name] = groups[name] || { name, cards: [], taps: 0, google: 0 });
      g.cards.push(r.card.card_code);
      g.taps += r.taps;
      g.google += r.google;
    });
    return Object.values(groups).sort((a, b) => b.taps - a.taps);
  }, [cardRows, holders]);

  const cardById = Object.fromEntries(cards.map((c) => [String(c.id), c]));
  const notes = eventsRange.filter((e) => e.event_type === 'private_feedback' && e.feedback_message);

  const draftOf = (c) => drafts[c.id] ?? { label: c.label || '', holder: holders[String(c.id)] || '' };
  const isDirty = (c) => {
    const d = drafts[c.id];
    return !!d && (d.label !== (c.label || '') || d.holder !== (holders[String(c.id)] || ''));
  };
  const setDraft = (c, patch) =>
    setDrafts((prev) => ({
      ...prev,
      [c.id]: { ...(prev[c.id] ?? { label: c.label || '', holder: holders[String(c.id)] || '' }), ...patch },
    }));

  const saveCard = async (c) => {
    const d = drafts[c.id];
    if (!d) return;
    setSavingId(c.id);
    const { error } = await supabase.rpc('owner_set_card_details', {
      p_card_id: String(c.id),
      p_holder: d.holder,
      p_label: d.label,
    });
    setSavingId(null);
    if (error) {
      notify('error', `${t.saveError}: ${error.message}`);
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[c.id];
      return next;
    });
    notify('success', t.saved);
    loadData();
  };

  const fmt = (iso) => new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });

  const langButton = (
    <button type="button" onClick={() => setLang((l) => (l === 'fr' ? 'en' : 'fr'))} className="btn-ghost">
      {lang === 'fr' ? 'EN' : 'FR'}
    </button>
  );

  // ---------- screens ----------
  if (authLoading) {
    return <div className="min-h-screen bg-page text-mute flex items-center justify-center text-sm">{t.loading}</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-page text-ink flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="panel w-full max-w-sm space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-tight">Wasla NFC</p>
            {langButton}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
            <p className="text-sm text-mute mt-1">{t.signInSub}</p>
          </div>
          {authError && <p className="text-sm text-danger">{authError}</p>}
          <Field label={t.email}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
            />
          </Field>
          <Field label={t.password}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              autoComplete="current-password"
            />
          </Field>
          <button type="submit" className="btn-primary w-full">
            {t.signIn}
          </button>
        </form>
      </div>
    );
  }

  const kpis = [
    { label: t.taps, value: totals.taps },
    { label: t.google, value: totals.google },
    { label: t.instagram, value: totals.instagram },
    { label: t.whatsapp, value: totals.whatsapp },
  ];

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {businesses.length === 1 ? businesses[0].name : t.title}
            </h1>
            <p className="text-sm text-mute mt-1">{session.user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {businesses.length > 1 && (
              <select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="field-sm">
                <option value="all">{t.allVenues}</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <select value={range} onChange={(e) => setRange(e.target.value)} className="field-sm">
              <option value="7">{t.d7}</option>
              <option value="30">{t.d30}</option>
              <option value="all">{t.dAll}</option>
            </select>
            <button onClick={loadData} className="btn-ghost">
              {t.refresh}
            </button>
            {langButton}
            <button onClick={() => supabase.auth.signOut()} className="btn-ghost">
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </header>

        {notice && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 text-sm font-medium shadow-xl ${
              notice.type === 'error' ? 'bg-paper border border-danger text-danger' : 'bg-ink text-paper'
            }`}
          >
            {notice.text}
          </div>
        )}

        {!loading && businesses.length === 0 ? (
          <div className="panel text-sm text-mute">{t.noBusiness}</div>
        ) : (
          <>
            {/* Key numbers */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {kpis.map((k) => (
                <div key={k.label} className="panel p-5">
                  <p className="text-sm text-mute">{k.label}</p>
                  <p className="text-4xl font-semibold tracking-tight tabular-nums mt-2">{k.value}</p>
                </div>
              ))}
              <div className="col-span-2 lg:col-span-1 rounded-3xl bg-ink text-paper p-5">
                <p className="text-sm text-paper/60">{t.conversion}</p>
                <p className="text-4xl font-semibold tracking-tight tabular-nums mt-2">{totals.rate}%</p>
                <p className="text-xs text-paper/60 mt-1">{t.conversionSub}</p>
              </div>
            </section>

            {/* Chart */}
            <section className="panel space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">{t.chartTitle}</h2>
              <div className="flex items-end gap-1 h-32">
                {chart.map((d) => (
                  <div key={d.key} className="flex-1 flex flex-col justify-end h-full" title={`${d.label}: ${d.count}`}>
                    <div
                      className={`rounded-t ${d.count ? 'bg-ink' : 'bg-line'}`}
                      style={{ height: d.count ? `${Math.max(6, (d.count / maxCount) * 100)}%` : '2px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-mute">
                <span>{chart[0]?.label}</span>
                <span>{chart[chart.length - 1]?.label}</span>
              </div>
            </section>

            {/* Cards and crew */}
            <section className="panel space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{t.cardsTitle}</h2>
                <p className="text-sm text-mute mt-1">{t.cardsSub}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="th">{t.code}</th>
                      <th className="th">{t.placement}</th>
                      <th className="th">{t.holder}</th>
                      <th className="th">{t.tapsShort}</th>
                      <th className="th">{t.googleShort}</th>
                      <th className="th">{t.lastTap}</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {cardRows.map(({ card, taps, google, last }) => {
                      const d = draftOf(card);
                      return (
                        <tr key={card.id}>
                          <td className="py-3 pr-4 font-mono font-medium">{card.card_code}</td>
                          <td className="py-3 pr-4">
                            <input
                              value={d.label}
                              onChange={(e) => setDraft(card, { label: e.target.value })}
                              className="field-sm w-full min-w-[8rem]"
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <input
                              value={d.holder}
                              onChange={(e) => setDraft(card, { holder: e.target.value })}
                              className="field-sm w-full min-w-[8rem]"
                            />
                          </td>
                          <td className="py-3 pr-4 tabular-nums">{taps}</td>
                          <td className="py-3 pr-4 tabular-nums">{google}</td>
                          <td className="py-3 pr-4 text-mute whitespace-nowrap">{last ? fmt(last) : t.never}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => saveCard(card)}
                              disabled={!isDirty(card) || savingId === card.id}
                              className="btn-ghost disabled:opacity-40"
                            >
                              {t.save}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-6 items-start">
              <section className="panel space-y-4">
                <h2 className="text-lg font-semibold tracking-tight">{t.crewTitle}</h2>
                {crewRows.length === 0 ? (
                  <p className="text-sm text-mute">{t.crewEmpty}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="th">{t.crewMember}</th>
                        <th className="th">{t.cardsCol}</th>
                        <th className="th">{t.tapsShort}</th>
                        <th className="th">{t.conv}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {crewRows.map((g) => (
                        <tr key={g.name}>
                          <td className="py-3 pr-4 font-medium">{g.name}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-mute">{g.cards.join(', ')}</td>
                          <td className="py-3 pr-4 tabular-nums">{g.taps}</td>
                          <td className="py-3 tabular-nums">{g.taps ? Math.round((g.google / g.taps) * 100) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="panel space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">{t.notesTitle}</h2>
                  <span className="text-xs font-semibold bg-ink text-paper rounded-full px-2.5 py-0.5 tabular-nums">
                    {notes.length}
                  </span>
                </div>
                {notes.length === 0 ? (
                  <p className="text-sm text-mute">{t.notesEmpty}</p>
                ) : (
                  <div className="space-y-2.5">
                    {notes.map((n) => {
                      const c = cardById[String(n.card_id)];
                      const who = c ? holders[String(c.id)] : '';
                      return (
                        <div key={n.id} className="rounded-2xl bg-soft border border-line p-4 text-sm">
                          <div className="flex items-center justify-between gap-3 text-xs text-mute mb-1.5">
                            <span className="font-medium text-ink">
                              {c ? c.card_code : t.unknownCard}
                              {who && <span className="text-mute font-normal ml-2">{who}</span>}
                            </span>
                            <span>{fmt(n.created_at)}</span>
                          </div>
                          <p>{n.feedback_message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Account */}
            <section className="panel space-y-4 max-w-md">
              <h2 className="text-lg font-semibold tracking-tight">{t.accountTitle}</h2>
              <form onSubmit={handlePassword} className="space-y-3">
                <Field label={t.newPassword}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="field"
                    autoComplete="new-password"
                  />
                </Field>
                <button type="submit" className="btn-primary">
                  {t.changePassword}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
