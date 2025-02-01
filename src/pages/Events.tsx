import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  image_url: string;
  attendee_count: number;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents();
    // Subscribe to realtime changes
    const channel = supabase
      .channel('events_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, timeFilter, searchQuery]);

  async function fetchEvents() {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          attendees:attendees(count)
        `);

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply time filter
      const now = new Date().toISOString();
      if (timeFilter === 'upcoming') {
        query = query.gte('date', now);
      } else if (timeFilter === 'past') {
        query = query.lt('date', now);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      // Order by date
      query = query.order('date', { ascending: timeFilter === 'upcoming' });

      const { data, error } = await query;
      
      if (error) throw error;
      
      const eventsWithCounts = data.map(event => ({
        ...event,
        attendee_count: event.attendees?.[0]?.count || 0
      }));
      
      setEvents(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    'all',
    'conference',
    'workshop',
    'social',
    'sports',
    'music',
    'other',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">Events</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          
          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Time filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All Events</option>
          </select>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600">No events found</h2>
          <p className="text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3'}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {event.attendee_count} attending
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded">
                      {event.category}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}