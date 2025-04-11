import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  user_id: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(updateEventStatuses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;
      setEvents(data || []);
      updateEventStatuses();
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    }
  };

  const updateEventStatuses = () => {
    const now = new Date();
    setEvents(prevEvents => 
      prevEvents.map(event => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        let status: 'upcoming' | 'ongoing' | 'completed';
        if (now < startDate) {
          status = 'upcoming';
        } else if (now >= startDate && now <= endDate) {
          status = 'ongoing';
        } else {
          status = 'completed';
        }
        
        return { ...event, status };
      })
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { error: createError } = await supabase
        .from('events')
        .insert([{
          ...newEvent,
          user_id: user.id
        }]);

      if (createError) throw createError;

      setShowNewEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        start_date: '',
        end_date: ''
      });
      fetchEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-right">التقويم</h1>
        <p className="text-gray-600 text-right">إدارة المواعيد والأحداث.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowNewEventModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة حدث جديد
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-4 ${
                event.status === 'ongoing' ? 'bg-yellow-50 border-yellow-200' :
                event.status === 'completed' ? 'bg-red-50 border-red-200' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="text-right">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className="text-gray-600">{event.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">يبدأ في:</span>{' '}
                      {new Date(event.start_date).toLocaleString('ar-SA')}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">ينتهي في:</span>{' '}
                      {new Date(event.end_date).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>
                {event.status === 'completed' && (
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowNewEventModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <CalendarIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">إضافة حدث جديد</h2>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">عنوان الحدث</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">الوصف</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">تاريخ البداية</label>
                <input
                  type="datetime-local"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">تاريخ النهاية</label>
                <input
                  type="datetime-local"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الإضافة...' : 'إضافة الحدث'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}