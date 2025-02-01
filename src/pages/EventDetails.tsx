import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  image_url: string;
  created_by: string;
  profiles: {
    username: string;
  };
}

interface Attendee {
  id: string;
  status: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAttendance, setUserAttendance] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      // Subscribe to realtime changes
      const channel = supabase
        .channel('event_details')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendees',
            filter: `event_id=eq.${id}`,
          },
          () => {
            fetchAttendees();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkUserAttendance();
    }
  }, [user, id]);

  async function fetchEventDetails() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(username)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
      fetchAttendees();
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Error loading event details');
    }
  }

  async function fetchAttendees() {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*, profiles(username, avatar_url)')
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttendees(data || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkUserAttendance() {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('status')
        .eq('event_id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserAttendance(data?.status || null);
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  }

  async function handleAttendance(status: string) {
    if (!user) {
      toast.error('Please login to RSVP');
      return;
    }

    try {
      if (userAttendance) {
        // Update existing attendance
        const { error } = await supabase
          .from('attendees')
          .update({ status })
          .eq('event_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new attendance
        const { error } = await supabase.from('attendees').insert([
          {
            event_id: id,
            user_id: user.id,
            status,
          },
        ]);

        if (error) throw error;
      }

      setUserAttendance(status);
      toast.success('RSVP updated successfully!');
    } catch (error) {
      toast.error('Error updating RSVP');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600">Event not found</h2>
      </div>
    );
  }

  const isEventPassed = new Date(event.date) < new Date();

  return (
    <div className="max-w-4xl mx-auto">
      <img
        src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3'}
        alt={event.title}
        className="w-full h-64 object-cover rounded-lg mb-8"
      />

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {isEventPassed && (
            <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
              Past Event
            </span>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-2" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-5 h-5 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-5 h-5 mr-2" />
            Organized by {event.profiles.username}
          </div>
        </div>

        <div className="prose max-w-none mb-8">
          <h2 className="text-xl font-semibold mb-2">About this event</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
        </div>

        {!isEventPassed && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">RSVP</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleAttendance('attending')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  userAttendance === 'attending'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Attending
              </button>
              <button
                onClick={() => handleAttendance('maybe')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  userAttendance === 'maybe'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Maybe
              </button>
              <button
                onClick={() => handleAttendance('not_attending')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  userAttendance === 'not_attending'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Attending
              </button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Attendees ({attendees.filter((a) => a.status === 'attending').length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {attendees
              .filter((a) => a.status === 'attending')
              .map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-md"
                >
                  <img
                    src={attendee.profiles.avatar_url || 'https://via.placeholder.com/40'}
                    alt={attendee.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-gray-700">{attendee.profiles.username}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}