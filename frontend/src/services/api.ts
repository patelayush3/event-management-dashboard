import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'organizer';
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  capacity: number;
  organizer_id: number;
  created_at?: string;
  registered_count: number;
  is_registered?: boolean;
}

export const eventService = {
  getEvents: async (): Promise<EventItem[]> => {
    const res = await api.get('/events');
    return res.data;
  },
  getEventById: async (id: number): Promise<EventItem> => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },
  searchEvents: async (query: string, top_k: number = 10): Promise<EventItem[]> => {
    const res = await api.post('/events/search', { query, top_k });
    return res.data;
  },
  getMyRegistrations: async (): Promise<EventItem[]> => {
    const res = await api.get('/events/my-registrations');
    return res.data;
  },
  getMyEvents: async (): Promise<EventItem[]> => {
    const res = await api.get('/events/my-events');
    return res.data;
  },
  createEvent: async (data: Partial<EventItem>): Promise<EventItem> => {
    const res = await api.post('/events', data);
    return res.data;
  },
  updateEvent: async (id: number, data: Partial<EventItem>): Promise<EventItem> => {
    const res = await api.put(`/events/${id}`, data);
    return res.data;
  },
  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
  registerForEvent: async (id: number): Promise<void> => {
    await api.post(`/events/${id}/register`);
  },
  unregisterFromEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}/register`);
  },
};
