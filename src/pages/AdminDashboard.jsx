import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Plus, ExternalLink, LogOut, QrCode, Pencil, Copy, X, Download } from 'lucide-react';
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

const inputCls = 'rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2 text-sm w-full';
const panelCls = 'rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-4';

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

  const handleDeleteCard = async (card) => {
    if (!window.confirm(`Delete card ${card.card_code}? Its link will stop working.`)) return;
    const { error } = await supabase.from('cards').delete().eq('id', card.id);
    if (error) notify('error', `Could not delete card: ${error.message}`);
    else notify('success', `Card ${card.card_code} deleted`);
    loadDashboardData();
  };

  const handleDeleteBusiness = async (biz) => {
    if (!window.confirm(`Delete "${biz.name}"? Its cards will become unassigned.`)) return;
    await supabase.from('cards').update({ business_id: null }).eq('business_id', biz.id);
    const { error } = await supabase.from('businesses').delete().eq('id', biz.id);
    if (error) notify('error', `Could not delete business: ${error.message}`);
    else notify('success', `${biz.name} deleted`);
    if (bizFilter === biz.id) setBizFilter('all');
    loadDashboardData();
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
        if (assign.error) notify('error', `Business saved, but card assignment failed: ${assign.error.message}`);
      }
    }
    setSaving(false);

    if (error) {
      notify('error', `Save failed: ${error.message}`);
      return;
    }
    notify('success', editingId ? 'Business updated' : 'Business created');
    cancelEdit();
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
    return (
      <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center">Loading...</div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-amber-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">Admin Access</span>
          </div>
          <h1 className="text-xl font-semibold">Sign in to Dashboard</h1>
          {authError && <p className="text-xs text-rose-400">{authError}</p>}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            className={inputCls}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={inputCls}
          />
          <button type="submit" className="w-full rounded-xl bg-amber-500 text-stone-950 font-semibold py-2.5 text-sm">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  // ---------- dashboard ----------
  const kpis = [
    { label: 'Card taps', value: totals.taps, tone: '' },
    { label: 'Google review clicks', value: totals.google, tone: 'text-amber-400', sub: `${totals.rate}% of taps` },
    { label: 'Instagram clicks', value: totals.instagram, tone: '' },
    { label: 'WhatsApp clicks', value: totals.whatsapp, tone: '' },
    { label: 'Private notes', value: totals.notes, tone: '' },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-semibold">
            Wasla NFC Control Panel
            <span className="ml-2 align-middle text-[10px] font-semibold text-amber-400 border border-amber-400/50 rounded-full px-2 py-0.5">v2</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">Manage venues, cards and monitor activity</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-xs text-stone-300 bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-xl hover:bg-stone-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {notice && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm shadow-xl border ${
            notice.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={bizFilter}
          onChange={(e) => setBizFilter(e.target.value)}
          className="rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-xs"
        >
          <option value="all">All businesses</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-xs"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="all">All time</option>
        </select>
        <button
          onClick={loadDashboardData}
          className="rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-xs hover:bg-stone-800"
        >
          Refresh
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-stone-900 border border-stone-800 p-5">
            <p className="text-xs text-stone-400">{k.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${k.tone}`}>{k.value}</p>
            {k.sub && <p className="text-[11px] text-stone-500 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Per-business stats */}
      <div className={panelCls}>
        <h2 className="text-lg font-semibold">Results by business</h2>
        {perBusiness.length === 0 ? (
          <p className="text-xs text-stone-400">No businesses yet. Add one below.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-800 text-xs text-stone-400">
                  <th className="py-2.5 pr-4">Business</th>
                  <th className="py-2.5 pr-4">Taps</th>
                  <th className="py-2.5 pr-4">Google</th>
                  <th className="py-2.5 pr-4">Conversion</th>
                  <th className="py-2.5 pr-4">Instagram</th>
                  <th className="py-2.5 pr-4">WhatsApp</th>
                  <th className="py-2.5 pr-4">Notes</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/70">
                {perBusiness.map(({ biz, stats }) => (
                  <tr key={biz.id}>
                    <td className="py-3 pr-4 font-medium">{biz.name}</td>
                    <td className="py-3 pr-4">{stats.taps}</td>
                    <td className="py-3 pr-4 text-amber-400">{stats.google}</td>
                    <td className="py-3 pr-4">{stats.rate}%</td>
                    <td className="py-3 pr-4">{stats.instagram}</td>
                    <td className="py-3 pr-4">{stats.whatsapp}</td>
                    <td className="py-3 pr-4">{stats.notes}</td>
                    <td className="py-3">
                      <button
                        onClick={() => startEdit(biz)}
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBusiness(biz)}
                        className="ml-3 inline-flex items-center gap-1 text-xs text-rose-400 hover:underline"
                      >
                        <X className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className={panelCls}>
        <h2 className="text-lg font-semibold">Cards &amp; QR codes</h2>
        <p className="text-xs text-stone-400">
          Each card or QR code points to a fixed link. Reassign it to another business at any time without reprinting
          or reprogramming.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-800 text-xs text-stone-400">
                <th className="py-2.5 pr-4">Code</th>
                <th className="py-2.5 pr-4">Label</th>
                <th className="py-2.5 pr-4">Assigned business</th>
                <th className="py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/70">
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="py-3 pr-4 font-mono font-semibold text-amber-400">{card.card_code}</td>
                  <td className="py-3 pr-4 text-xs text-stone-300">{card.label}</td>
                  <td className="py-3 pr-4">
                    <select
                      value={card.business_id || ''}
                      onChange={(e) => handleAssignCard(card.id, e.target.value)}
                      className="rounded-lg bg-stone-950 border border-stone-700 px-3 py-1.5 text-xs text-stone-100"
                    >
                      <option value="">Unassigned</option>
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3 text-xs text-amber-400">
                      <a
                        href={`/t/${card.card_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                      <button onClick={() => copyLink(card.card_code)} className="inline-flex items-center gap-1 hover:underline">
                        <Copy className="w-3 h-3" />
                        <span>Copy link</span>
                      </button>
                      <button onClick={() => setQrCard(card)} className="inline-flex items-center gap-1 hover:underline">
                        <QrCode className="w-3 h-3" />
                        <span>QR</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card)}
                        className="inline-flex items-center gap-1 text-rose-400 hover:underline"
                      >
                        <X className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <input
            placeholder="Label (e.g. Cashier counter)"
            value={newCardLabel}
            onChange={(e) => setNewCardLabel(e.target.value)}
            className={`${inputCls} max-w-xs`}
          />
          <button
            onClick={handleAddCard}
            className="rounded-xl bg-stone-800 border border-stone-700 px-4 py-2 text-xs font-semibold hover:bg-stone-700"
          >
            Add card {nextCardCode()}
          </button>
        </div>
      </div>

      {/* Add / edit business */}
      <form ref={formRef} onSubmit={handleSaveBusiness} className={panelCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingId ? <Pencil className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-amber-400" />}
            <h2 className="text-lg font-semibold">{editingId ? 'Edit client' : 'Add a new client (café or restaurant)'}</h2>
          </div>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs text-stone-400 hover:text-stone-100">
              Cancel edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            required
            placeholder="Business name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
          <input
            required
            placeholder="Google Place ID (ChIJ...)"
            value={form.google_place_id}
            onChange={(e) => setForm({ ...form, google_place_id: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="WhatsApp (e.g. 21622123456)"
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="Instagram handle (without @)"
            value={form.instagram_handle}
            onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
            className={inputCls}
          />
          <div className="flex items-center gap-2 rounded-xl bg-stone-950 border border-stone-800 px-3 py-1.5">
            <span className="text-xs text-stone-400">Accent color</span>
            <input
              type="color"
              value={form.accent_color}
              onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
              className="w-8 h-7 bg-transparent border-0 cursor-pointer"
            />
          </div>
          {!editingId && (
            <select
              value={assignCardId}
              onChange={(e) => setAssignCardId(e.target.value)}
              className={`${inputCls} md:col-span-3`}
            >
              <option value="">Assign a card now (optional)</option>
              {cards
                .filter((c) => !c.business_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.card_code} {c.label ? `· ${c.label}` : ''}
                  </option>
                ))}
            </select>
          )}
          <input
            placeholder="Welcome message"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className={`${inputCls} md:col-span-3`}
          />
        </div>
        <p className="text-[11px] text-stone-500">
          Find the Place ID with{' '}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline"
          >
            Google's Place ID Finder
          </a>
          . Leave Instagram or WhatsApp empty to hide that button.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-500 text-stone-950 font-semibold px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save business'}
        </button>
      </form>

      {/* Private notes */}
      <div className={panelCls}>
        <h2 className="text-lg font-semibold">Private manager notes</h2>
        {privateNotes.length === 0 ? (
          <p className="text-xs text-stone-400">No private notes in this period.</p>
        ) : (
          <div className="space-y-2.5">
            {privateNotes.map((note) => (
              <div key={note.id} className="rounded-xl bg-stone-950 border border-stone-800 p-3.5 text-xs">
                <div className="flex items-center justify-between text-stone-500 mb-1">
                  <span className="font-medium text-stone-300">
                    {bizNameById[note.business_id] || 'Unknown business'}
                    {cardCodeById[note.card_id] ? ` · ${cardCodeById[note.card_id]}` : ''}
                  </span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-stone-100">{note.feedback_message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR modal */}
      {qrCard && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setQrCard(null)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Card {qrCard.card_code}</h3>
              <button onClick={() => setQrCard(null)} className="text-stone-400 hover:text-stone-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div ref={qrRef} className="inline-block bg-white p-3 rounded-xl">
              <QRCodeCanvas value={tapUrl(qrCard.card_code)} size={240} marginSize={2} />
            </div>
            <p className="font-mono text-[11px] text-stone-400 break-all">{tapUrl(qrCard.card_code)}</p>
            <button
              onClick={downloadQr}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-stone-950 font-semibold py-2.5 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
