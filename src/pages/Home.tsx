import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Events Near You
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Join, organize, and connect with people who share your interests
        </p>
        <Link
          to="/events"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Explore Events
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <Calendar className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Create Events</h3>
          <p className="text-gray-600">
            Organize and manage your own events with powerful tools
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <Users className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect</h3>
          <p className="text-gray-600">
            Meet people who share your interests and passions
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <MapPin className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Discover</h3>
          <p className="text-gray-600">
            Find exciting events happening in your area
          </p>
        </div>
      </div>
    </div>
  );
}