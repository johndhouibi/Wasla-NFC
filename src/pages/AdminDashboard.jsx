import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ExternalLink, LogOut, QrCode, Pencil, Copy, X, Download, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';

const EMPTY_BIZ = {
  name: '',
  tagline: 'Merci de votre visite ! Comment était votre expérience ?',
  city: 'Sfax',
  accent_color: '#D97706',
  google_place_id: '',
  instagram_handle: '',
  whatsapp_number: '216',
};

const SWATCHES = ['#D97706', '#000000', '#9a3412', '#166534', '#1d4ed8'];

const summarize = (list) => {
  const count = (type) => list.filter((e) => e.event_type === type).length;
  const taps = count('page_view');
  const google = count('google_click');
  return {
    taps,
    google,
    instagram: count('instagram_click'),
    whatsapp: count('whatsapp_click'),
    notes: list.filter((e) => e.event_type === 'private_feedback' && e.feedback_message).length,
    rate: taps ? Math.round((google / taps) * 100) : 0,
  };
};

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-mute">{label}</span>
      {children}
    </label>
  );
}

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [businesses, setBusinesses] = useState([]);
  const [cards, setCards] = useState([]);
  const [events, setEvents] = useState([]);

  const [bizFilter, setBizFilter] = useState('all');
  const [range, setRange] = useState('30');

  const [form, setForm] = useState(EMPTY_BIZ);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('');
  const [qrCard, setQrCard] = useState(null);
  const [assignCardId, setAssignCardId] = useState('');
  const [notice, setNotice] = useState(null);

  const formRef = useRef(null);
  const qrRef = useRef(null);

  const notify = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadDashboardData = async () => {
    const [biz, crd, evt] = await Promise.all([
      supabase.from('businesses').select('*').order('created_at', { ascending: false }),
      supabase.from('cards').select('*, businesses(name)').order('card_code', { ascending: true }),
      supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(5000),
    ]);
    const firstError = biz.error || crd.error || evt.error;
    if (firstError) notify('error', `Could not load data: ${firstError.message}`);
    setBusinesses(biz.data || []);
    setCards(crd.data || []);
    setEvents(evt.data || []);
  };

  useEffect(() => {
    if (session) loadDashboardData();
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  // ---------- derived data ----------
  const bizNameById = useMemo(() => Object.fromEntries(businesses.map((b) => [b.id, b.name])), [businesses]);
  const cardCodeById = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c.card_code])), [cards]);

  const rangeEvents = useMemo(() => {
    if (range === 'all') return events;
    const since = Date.now() - Number(range) * 86400000;
    return events.filter((e) => new Date(e.created_at).getTime() >= since);
  }, [events, range]);

  const scoped = useMemo(
    () => (bizFilter === 'all' ? rangeEvents : rangeEvents.filter((e) => e.business_id === bizFilter)),
    [rangeEvents, bizFilter]
  );

  const totals = summarize(scoped);
  const privateNotes = scoped.filter((e) => e.event_type === 'private_feedback' && e.feedback_message);

  const perBusiness = businesses.map((b) => ({
    biz: b,
    stats: summarize(rangeEvents.filter((e) => e.business_id === b.id)),
  }));

  const tapUrl = (code) => `${window.location.origin}/t/${code}`;

  const nextCardCode = () => {
    const nums = cards
      .map((c) => parseInt((c.card_code || '').replace(/\D/g, ''), 10))
      .filter((n) => Number.isFinite(n));
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return `A${String(n).padStart(3, '0')}`;
  };

  // ---------- actions ----------
  const startEdit = (biz) => {
    setEditingId(biz.id);
    setForm({
      name: biz.name || '',
      tagline: biz.tagline || '',
      city: biz.city || '',
      accent_color: biz.accent_color || '#D97706',
      google_place_id: biz.google_place_id || '',
      instagram_handle: biz.instagram_handle || '',
      whatsapp_number: biz.whatsapp_number || '',
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_BIZ);
    setAssignCardId('');
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      city: form.city.trim(),
      accent_color: form.accent_color,
      google_place_id: form.google_place_id.trim(),
      instagram_handle: form.instagram_handle.trim().replace(/^@/, ''),
      whatsapp_number: form.whatsapp_number.replace(/\D/g, ''),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('businesses').update(payload).eq('id', editingId));
    } else {
      const slug = payload.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const res = await supabase.from('businesses').insert({ ...payload, slug }).select('id').single();
      error = res.error;
      if (!error && assignCardId && res.data?.id) {
        const assign = await supabase.from('cards').update({ business_id: res.data.id }).eq('id', assignCardId);
        if (assign.error) notify('error', `Client saved, but card assignment failed: ${assign.error.message}`);
      }
    }
    setSaving(false);

    if (error) {
      notify('error', `Save failed: ${error.message}`);
      return;
    }
    notify('success', editingId ? 'Client updated' : 'Client created');
    cancelEdit();
    loadDashboardData();
  };

  const handleDeleteBusiness = async (biz) => {
    if (!window.confirm(`Delete "${biz.name}"? Its cards will become unassigned.`)) return;
    await supabase.from('cards').update({ business_id: null }).eq('business_id', biz.id);
    const { error } = await supabase.from('businesses').delete().eq('id', biz.id);
    if (error) notify('error', `Could not delete client: ${error.message}`);
    else notify('success', `${biz.name} deleted`);
    if (bizFilter === biz.id) setBizFilter('all');
    loadDashboardData();
  };

  const handleAssignCard = async (cardId, businessId) => {
    const { error } = await supabase
      .from('cards')
      .update({ business_id: businessId || null })
      .eq('id', cardId);
    if (error) notify('error', `Could not assign card: ${error.message}`);
    else notify('success', 'Card assignment saved');
    loadDashboardData();
  };

  const handleAddCard = async () => {
    const code = nextCardCode();
    const { error } = await supabase
      .from('cards')
      .insert({ card_code: code, label: newCardLabel.trim() || 'New card' });
    if (error) {
      notify('error', `Could not add card: ${error.message}`);
      return;
    }
    setNewCardLabel('');
    notify('success', `Card ${code} added`);
    loadDashboardData();
  };

  const handleDeleteCard = async (card) => {
    if (!window.confirm(`Delete card ${card.card_code}? Its link will stop working.`)) return;
    const { error } = await supabase.from('cards').delete().eq('id', card.id);
    if (error) notify('error', `Could not delete card: ${error.message}`);
    else notify('success', `Card ${card.card_code} deleted`);
    loadDashboardData();
  };

  const copyLink = async (code) => {
    try {
      await navigator.clipboard.writeText(tapUrl(code));
      notify('success', 'Link copied');
    } catch {
      notify('error', 'Could not copy, select the link manually');
    }
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas || !qrCard) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${qrCard.card_code}.png`;
    a.click();
  };

  // ---------- auth screens ----------
  if (authLoading) {
    return <div className="min-h-screen bg-page text-mute flex items-center justify-center text-sm">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-page text-ink flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="panel w-full max-w-sm space-y-5">
          <p className="text-sm font-semibold tracking-tight">Wasla NFC</p>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Operator sign in</h1>
            <p className="text-sm text-mute mt-1">Manage your clients, cards and results.</p>
          </div>
          {authError && <p className="text-sm text-danger">{authError}</p>}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
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
            Sign in
          </button>
        </form>
      </div>
    );
  }

  // ---------- dashboard ----------
  const kpis = [
    { label: 'Card taps', value: totals.taps },
    { label: 'Google review clicks', value: totals.google },
    { label: 'Instagram clicks', value: totals.instagram },
    { label: 'WhatsApp clicks', value: totals.whatsapp },
  ];

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-8 space-y-8">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wasla NFC Control Panel</h1>
            <p className="text-sm text-mute mt-1">Manage clients, cards and monitor taps</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="field-sm">
              <option value="all">All clients</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select value={range} onChange={(e) => setRange(e.target.value)} className="field-sm">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <button onClick={loadDashboardData} className="btn-ghost">
              Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="btn-ghost">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Toast */}
        {notice && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 text-sm font-medium shadow-xl ${
              notice.type === 'error' ? 'bg-paper border border-danger text-danger' : 'bg-ink text-paper'
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Key numbers */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="panel p-5">
              <p className="text-sm text-mute">{k.label}</p>
              <p className="text-4xl font-semibold tracking-tight tabular-nums mt-2">{k.value}</p>
            </div>
          ))}
          <div className="col-span-2 lg:col-span-1 rounded-3xl bg-ink text-paper p-5">
            <p className="text-sm text-paper/60">Review conversion</p>
            <p className="text-4xl font-semibold tracking-tight tabular-nums mt-2">{totals.rate}%</p>
            <p className="text-xs text-paper/60 mt-1">of taps opened Google</p>
          </div>
        </section>

        {/* Results by client */}
        <section className="panel space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Results by client</h2>
          {perBusiness.length === 0 ? (
            <p className="text-sm text-mute">No clients yet. Add your first one with the form below.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="th">Client</th>
                    <th className="th">Taps</th>
                    <th className="th">Google</th>
                    <th className="th">Conversion</th>
                    <th className="th">Instagram</th>
                    <th className="th">WhatsApp</th>
                    <th className="th">Notes</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {perBusiness.map(({ biz, stats }) => (
                    <tr key={biz.id} className="hover:bg-soft">
                      <td className="py-3 pr-4">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle border border-line"
                          style={{ backgroundColor: biz.accent_color || '#000' }}
                        />
                        <span className="font-medium align-middle">{biz.name}</span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{stats.taps}</td>
                      <td className="py-3 pr-4 tabular-nums">{stats.google}</td>
                      <td className="py-3 pr-4 tabular-nums">{stats.rate}%</td>
                      <td className="py-3 pr-4 tabular-nums">{stats.instagram}</td>
                      <td className="py-3 pr-4 tabular-nums">{stats.whatsapp}</td>
                      <td className="py-3 pr-4 tabular-nums">{stats.notes}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button onClick={() => startEdit(biz)} className="link-action">
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteBusiness(biz)} className="link-danger ml-4">
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Cards */}
          <section className="panel space-y-4 lg:col-span-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Cards and QR codes</h2>
              <p className="text-sm text-mute mt-1">
                Each card or QR code has a fixed link. Assign it to another client any time, without reprinting or
                rewriting it.
              </p>
            </div>

            {cards.length === 0 ? (
              <p className="text-sm text-mute">No cards yet. Add card {nextCardCode()} below.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="th">Code</th>
                      <th className="th">Placement</th>
                      <th className="th">Client</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {cards.map((card) => (
                      <tr key={card.id} className="hover:bg-soft">
                        <td className="py-3 pr-4 font-mono font-medium">{card.card_code}</td>
                        <td className="py-3 pr-4 text-mute">{card.label}</td>
                        <td className="py-3 pr-4">
                          <select
                            value={card.business_id || ''}
                            onChange={(e) => handleAssignCard(card.id, e.target.value)}
                            className="field-sm"
                          >
                            <option value="">Unassigned</option>
                            {businesses.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <a
                            href={`/t/${card.card_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-action"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </a>
                          <button onClick={() => copyLink(card.card_code)} className="link-action ml-3">
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                          <button onClick={() => setQrCard(card)} className="link-action ml-3">
                            <QrCode className="w-3 h-3" />
                            <span>QR</span>
                          </button>
                          <button onClick={() => handleDeleteCard(card)} className="link-danger ml-3">
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
              <input
                placeholder="Placement (e.g. Cashier counter)"
                value={newCardLabel}
                onChange={(e) => setNewCardLabel(e.target.value)}
                className="field max-w-xs"
              />
              <button onClick={handleAddCard} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Add card {nextCardCode()}</span>
              </button>
            </div>
          </section>

          {/* Client form + notes */}
          <div className="lg:col-span-2 space-y-6">
            <form ref={formRef} onSubmit={handleSaveBusiness} className="panel space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">
                  {editingId ? 'Edit client' : 'Add a new client'}
                </h2>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="text-xs text-mute hover:text-ink">
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Business name">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label="City">
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label="Welcome message" className="col-span-2">
                  <input
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label="Google Place ID" className="col-span-2">
                  <input
                    required
                    value={form.google_place_id}
                    onChange={(e) => setForm({ ...form, google_place_id: e.target.value })}
                    className="field font-mono text-xs"
                    placeholder="ChIJ..."
                  />
                </Field>
                <Field label="Instagram (without @)">
                  <input
                    value={form.instagram_handle}
                    onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label="WhatsApp number">
                  <input
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    className="field"
                    placeholder="21622123456"
                  />
                </Field>
              </div>

              <div>
                <span className="mb-1.5 block text-xs text-mute">Brand color</span>
                <div className="flex items-center gap-2.5">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Brand color ${c}`}
                      onClick={() => setForm({ ...form, accent_color: c })}
                      className={`w-7 h-7 rounded-full border border-line transition ${
                        form.accent_color.toLowerCase() === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="w-7 h-7 p-0 bg-transparent border-0 cursor-pointer rounded-full"
                    aria-label="Custom brand color"
                  />
                </div>
              </div>

              {!editingId && (
                <Field label="Card for this client (optional)">
                  <select value={assignCardId} onChange={(e) => setAssignCardId(e.target.value)} className="field">
                    <option value="">No card yet</option>
                    {cards
                      .filter((c) => !c.business_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.card_code} {c.label ? `(${c.label})` : ''}
                        </option>
                      ))}
                  </select>
                </Field>
              )}

              <p className="text-xs text-mute">
                Find the Place ID with{' '}
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline underline-offset-4"
                >
                  Google's Place ID Finder
                </a>
                . Leave Instagram or WhatsApp empty to hide that button.
              </p>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save client'}
              </button>
            </form>

            <section className="panel space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Private notes</h2>
                <span className="text-xs font-semibold bg-ink text-paper rounded-full px-2.5 py-0.5 tabular-nums">
                  {privateNotes.length}
                </span>
              </div>
              {privateNotes.length === 0 ? (
                <p className="text-sm text-mute">No private notes in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {privateNotes.map((note) => (
                    <div key={note.id} className="rounded-2xl bg-soft border border-line p-4 text-sm">
                      <div className="flex items-center justify-between gap-3 text-xs text-mute mb-1.5">
                        <span className="font-medium text-ink">
                          {bizNameById[note.business_id] || 'Unknown client'}
                          {cardCodeById[note.card_id] && (
                            <span className="font-mono text-mute ml-2">{cardCodeById[note.card_id]}</span>
                          )}
                        </span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p>{note.feedback_message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* QR modal */}
      {qrCard && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setQrCard(null)}
        >
          <div className="panel w-full max-w-sm space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold tracking-tight">
                Card <span className="font-mono">{qrCard.card_code}</span>
              </h3>
              <button onClick={() => setQrCard(null)} className="text-mute hover:text-ink" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div ref={qrRef} className="inline-block bg-white p-3 rounded-2xl border border-line">
              <QRCodeCanvas value={tapUrl(qrCard.card_code)} size={240} marginSize={2} />
            </div>
            <p className="font-mono text-xs text-mute break-all">{tapUrl(qrCard.card_code)}</p>
            <button onClick={downloadQr} className="btn-primary w-full">
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
