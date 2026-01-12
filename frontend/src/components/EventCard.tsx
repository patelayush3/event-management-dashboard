import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle2, Clock } from 'lucide-react';
import { EventItem } from '../services/api';

interface EventCardProps {
  event: EventItem;
  onRegister?: (eventId: number) => void;
  onUnregister?: (eventId: number) => void;
  onEdit?: (event: EventItem) => void;
  onDelete?: (eventId: number) => void;
  isOrganizer?: boolean;
  currentUserRole?: string;
  loadingAction?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegister,
  onUnregister,
  onEdit,
  onDelete,
  isOrganizer = false,
  currentUserRole,
  loadingAction = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = mounted
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const isFull = event.registered_count >= event.capacity;
  const percentage = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-indigo-400">
            {event.title}
          </h3>
          {event.is_registered && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Registered
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-slate-300 leading-relaxed">
          {event.description}
        </p>

        <div className="mt-5 space-y-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>{mounted ? formattedDate : 'Loading date...'}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {event.registered_count} / {event.capacity} Attendees
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
        {isOrganizer ? (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="rounded-lg bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20 border border-rose-500/20"
              >
                Delete
              </button>
            )}
          </>
        ) : (
          <>
            {event.is_registered ? (
              onUnregister && (
                <button
                  onClick={() => onUnregister(event.id)}
                  disabled={loadingAction}
                  className="rounded-lg bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 border border-rose-500/30 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                >
                  Cancel Registration
                </button>
              )
            ) : (
              onRegister && (
                <button
                  onClick={() => onRegister(event.id)}
                  disabled={isFull || loadingAction}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-md transition-all ${
                    isFull
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25 active:scale-95'
                  }`}
                >
                  {isFull ? 'Event Full' : 'Register Now'}
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};
