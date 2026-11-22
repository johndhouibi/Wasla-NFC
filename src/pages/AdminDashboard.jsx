import React, { useEffect, useState } from 'react';
import { Lock, Plus, ExternalLink, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [businesses, setBusinesses] = useState([]);
  const [cards, setCards] = useState([]);
  const [events, setEvents] = useState([]);

  const [newBiz, setNewBiz] = useState({
    name: '',
    slug: '',
    tagline: 'Thanks for visiting! How was your experience?',
    city: 'Sfax',
    accent_color: '#D97706',
    google_place_id: '',
    instagram_handle: '',
    whatsapp_number: '216',
  });

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
    const [{ data: bizRows }, { data: cardRows }, { data: eventRows }] = await Promise.all([
      supabase.from('businesses').select('*').order('created_at', { ascending: false }),
      supabase.from('cards').select('*, businesses(name)').order('card_code', { ascending: true }),
      supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setBusinesses(bizRows || []);
    setCards(cardRows || []);
    setEvents(eventRows || []);
  };

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    const slug =
      newBiz.slug.trim() ||
      newBiz.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const { error } = await supabase.from('businesses').insert({ ...newBiz, slug });
    if (!error) {
      setNewBiz({
        name: '',
        slug: '',
        tagline: 'Thanks for visiting! How was your experience?',
        city: 'Sfax',
        accent_color: '#D97706',
        google_place_id: '',
        instagram_handle: '',
        whatsapp_number: '216',
      });
      loadDashboardData();
    }
  };

  const handleAssignCard = async (cardId, businessId) => {
    await supabase
      .from('cards')
      .update({ business_id: businessId || null })
      .eq('id', cardId);
    loadDashboardData();
  };

  if (authLoading) {
    return <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center">Loading...</div>;
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
            className="w-full rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 text-stone-950 font-semibold py-2.5 text-sm"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  const totalTaps = events.filter((ev) => ev.event_type === 'page_view').length;
  const googleClicks = events.filter((ev) => ev.event_type === 'google_click').length;
  const privateNotes = events.filter((ev) => ev.event_type === 'private_feedback' && ev.feedback_message);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-semibold">NFC Review Control Panel</h1>
          <p className="text-xs text-stone-400 mt-1">Manage venues, reassign cards, and monitor taps</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-xs text-stone-300 bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-xl hover:bg-stone-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5">
          <p className="text-xs text-stone-400">Total Card Taps</p>
          <p className="text-3xl font-semibold mt-1">{totalTaps}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5">
          <p className="text-xs text-stone-400">Google Review Clicks</p>
          <p className="text-3xl font-semibold text-amber-400 mt-1">{googleClicks}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 border border-stone-800 p-5">
          <p className="text-xs text-stone-400">Private Manager Notes</p>
          <p className="text-3xl font-semibold mt-1">{privateNotes.length}</p>
        </div>
      </div>

      {/* Cards Assignment Table */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Cards Router (A001 – A010)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-800 text-xs text-stone-400">
                <th className="py-2.5 pr-4">Card Code</th>
                <th className="py-2.5 pr-4">Tap URL</th>
                <th className="py-2.5 pr-4">Assigned Business</th>
                <th className="py-2.5">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/70">
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="py-3 pr-4 font-mono font-semibold text-amber-400">{card.card_code}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-stone-300">/t/{card.card_code}</td>
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
                    <a
                      href={`/t/${card.card_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Business */}
      <form
        onSubmit={handleCreateBusiness}
        className="rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-semibold">Add Café or Restaurant</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            required
            placeholder="Business Name (e.g. Café Sfax)"
            value={newBiz.name}
            onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
            className="rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2 text-sm"
          />
          <input
            required
            placeholder="Google Place ID (e.g. ChIJ...)"
            value={newBiz.google_place_id}
            onChange={(e) => setNewBiz({ ...newBiz, google_place_id: e.target.value })}
            className="rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2 text-sm"
          />
          <input
            placeholder="WhatsApp (e.g. 21622123456)"
            value={newBiz.whatsapp_number}
            onChange={(e) => setNewBiz({ ...newBiz, whatsapp_number: e.target.value })}
            className="rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2 text-sm"
          />
          <input
            placeholder="Instagram handle (without @)"
            value={newBiz.instagram_handle}
            onChange={(e) => setNewBiz({ ...newBiz, instagram_handle: e.target.value })}
            className="rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2 text-sm"
          />
          <input
            placeholder="Tagline"
            value={newBiz.tagline}
            onChange={(e) => setNewBiz({ ...newBiz, tagline: e.target.value })}
            className="rounded-xl bg-stone-950 border border-stone-800 px-3.5 py-2 text-sm"
          />
          <div className="flex items-center gap-2 rounded-xl bg-stone-950 border border-stone-800 px-3 py-1.5">
            <span className="text-xs text-stone-400">Accent</span>
            <input
              type="color"
              value={newBiz.accent_color}
              onChange={(e) => setNewBiz({ ...newBiz, accent_color: e.target.value })}
              className="w-8 h-7 bg-transparent border-0 cursor-pointer"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-amber-500 text-stone-950 font-semibold px-5 py-2.5 text-sm"
        >
          Save Business
        </button>
      </form>

      {/* Private Notes Inbox */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Recent Private Manager Notes</h2>
        {privateNotes.length === 0 ? (
          <p className="text-xs text-stone-400">No private notes submitted yet.</p>
        ) : (
          <div className="space-y-2.5">
            {privateNotes.map((note) => (
              <div key={note.id} className="rounded-xl bg-stone-950 border border-stone-800 p-3.5 text-xs">
                <p className="text-stone-100">{note.feedback_message}</p>
                <p className="text-stone-500 mt-1">{new Date(note.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}