import React, { useState, useEffect } from 'react';
import { Sparkles, Search, RefreshCw, Calendar, Flame } from 'lucide-react';
import { toast } from 'react-toastify';
import { eventService, EventItem } from '../services/api';
import { EventCard } from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (err: any) {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchEvents();
      return;
    }

    setIsSearching(true);
    try {
      const results = await eventService.searchEvents(searchQuery.trim());
      setEvents(results);
      toast.info(`Found ${results.length} semantically matching events.`);
    } catch (err: any) {
      toast.error('Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please log in to register for events.');
      return;
    }

    setActionLoadingId(eventId);
    try {
      await eventService.registerForEvent(eventId);
      toast.success('Successfully registered!');
      // Update local event state
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventId
            ? { ...evt, registered_count: evt.registered_count + 1, is_registered: true }
            : evt
        )
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnregister = async (eventId: number) => {
    setActionLoadingId(eventId);
    try {
      await eventService.unregisterFromEvent(eventId);
      toast.info('Registration cancelled.');
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventId
            ? { ...evt, registered_count: Math.max(0, evt.registered_count - 1), is_registered: false }
            : evt
        )
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Cancellation failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/50 via-slate-900/40 to-slate-950 p-8 md:p-12 border border-slate-800/80 shadow-2xl">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-4 w-4" /> Next-Gen Semantic Event Discovery
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            Discover Events by <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Meaning & Intent</span>
          </h1>

          <p className="text-base text-slate-400 md:text-lg">
            Powered by vector embeddings. Search naturally—say what you want to learn, do, or experience.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mx-auto mt-6 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 'AI workshop for beginners on weekends' or 'Tech networking in local area'"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 py-4 pl-12 pr-32 text-sm text-white placeholder-slate-500 shadow-xl backdrop-blur-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'AI Search'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Events Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <h2 className="text-2xl font-bold tracking-tight text-white">Upcoming Events</h2>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              fetchEvents();
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-base font-semibold text-slate-300">No events found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try refining your search query or refresh the list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
                loadingAction={actionLoadingId === evt.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
