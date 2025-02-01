import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, LogIn, LogOut, PlusCircle, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-xl">EventHub</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/events" className="text-gray-700 hover:text-indigo-600">
              Events
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/create-event"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Event</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}