import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

interface Profile {
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEvents();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchEvents() {
    try {
      // Fetch created events
      const { data: created, error: createdError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user?.id)
        .order('date', { ascending: false });

      if (createdError) throw createdError;
      setCreatedEvents(created || []);

      // Fetch attending events
      const { data: attending, error: attendingError } = await supabase
        .from('attendees')
        .select('event_id, events(*)')
        .eq('user_id', user?.id)
        .eq('status', 'attending');

      if (attendingError) throw attendingError;
      setAttendingEvents(attending.map((a) => a.events) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Error updating profile');
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="text-indigo-600 hover:text-indigo-700"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={profile?.avatar_url || 'https://via.placeholder.com/150'}
                alt={profile?.username}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h2 className="text-xl font-semibold">{profile?.username}</h2>
                <p className="text-gray-600">{profile?.full_name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Events</h2>
          <div className="space-y-4">
            {createdEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white p-4 rounded-lg shadow-md"
              >
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-gray-600">{formatDate(event.date)}</p>
                <p className="text-gray-600">{event.location}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Events You're Attending</h2>
          <div className="space-y-4">
            {attendingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white p-4 rounded-lg shadow-md"
              >
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-gray-600">{formatDate(event.date)}</p>
                <p className="text-gray-600">{event.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}