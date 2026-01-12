import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Calendar, AlertCircle, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { eventService, EventItem, User } from '../services/api';
import { EventCard } from '../components/EventCard';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    capacity: 10,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      loadDashboardData(parsedUser.role);
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const loadDashboardData = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'organizer') {
        const data = await eventService.getMyEvents();
        setEvents(data);
      } else {
        // Attendee: Fetch registered events from /api/events/my-registrations
        const data = await eventService.getMyRegistrations();
        setEvents(data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to fetch dashboard events.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      date: '',
      capacity: 50,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEvent(event);
    const dateFormatted = new Date(event.date).toISOString().slice(0, 16);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      date: dateFormatted,
      capacity: event.capacity,
    });
    setShowModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date: new Date(formData.date).toISOString(),
          capacity: Number(formData.capacity),
        });
        toast.success('Event updated successfully!');
      } else {
        await eventService.createEvent({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date: new Date(formData.date).toISOString(),
          capacity: Number(formData.capacity),
        });
        toast.success('Event created successfully!');
      }
      setShowModal(false);
      if (user) loadDashboardData(user.role);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.deleteEvent(eventId);
      toast.success('Event deleted.');
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Delete failed.');
    }
  };

  const handleUnregister = async (eventId: number) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      toast.info('Registration cancelled.');
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Cancellation failed.');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {user.role === 'organizer' ? 'Organizer Dashboard' : 'My Registered Events'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {user.role === 'organizer'
              ? 'Manage your created events, track capacity, and view live registrations.'
              : 'View and manage all upcoming events you have registered for.'}
          </p>
        </div>

        {user.role === 'organizer' && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Create Event
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium text-slate-400">Loading registered events...</p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center space-y-4">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <p className="text-sm font-semibold text-rose-300">{error}</p>
          <button
            onClick={() => user && loadDashboardData(user.role)}
            className="rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/30"
          >
            Try Again
          </button>
        </div>
      ) : events.length === 0 ? (
        /* Empty Registration State */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
          <Calendar className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300">
            {user.role === 'organizer' ? 'No created events yet' : 'No event registrations found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {user.role === 'organizer'
              ? 'Click "Create Event" above to publish your first event on EventPulse AI.'
              : 'Browse our upcoming events on the explore page and register for your first event!'}
          </p>
          {user.role !== 'organizer' && (
            <button
              onClick={() => router.push('/')}
              className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-500"
            >
              Explore Events
            </button>
          )}
        </div>
      ) : (
        /* Events Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              isOrganizer={user.role === 'organizer'}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteEvent}
              onUnregister={handleUnregister}
            />
          ))}
        </div>
      )}

      {/* Organizer Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. AI & Machine Learning Summit"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Detailed event summary for vector embeddings discovery..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. San Francisco, CA or Online (Zoom)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingEvent ? 'Update Event' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
