import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { InvoicesPage } from './components/InvoicesPage';
import { StorePage } from './components/StorePage';
import { CalendarPage } from './components/CalendarPage';
import { CustomersPage } from './components/CustomersPage';
import { NotificationsPage } from './components/NotificationsPage';
import { LogOut, Bell, Home, Users, Database, ShoppingCart, LineChart, Calendar, Settings } from 'lucide-react';

function Dashboard({ session }: { session: Session }) {
  const [currentPage, setCurrentPage] = useState('overview');

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">Subscription Manager</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm rounded-md hover:bg-gray-100">English</button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-500 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              متصل
            </span>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center text-gray-600 hover:text-gray-800">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200">
          <nav className="space-y-1 px-2 py-4">
            <button
              onClick={() => setCurrentPage('overview')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'overview' ? 'bg-gray-100' : ''
              }`}
            >
              <Home className="w-5 h-5 mr-3" />
              نظرة عامة
            </button>
            <button
              onClick={() => setCurrentPage('customers')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'customers' ? 'bg-gray-100' : ''
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              إدارة العملاء
            </button>
            <button
              onClick={() => setCurrentPage('invoices')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'invoices' ? 'bg-gray-100' : ''
              }`}
            >
              <Database className="w-5 h-5 mr-3" />
              الفواتير
            </button>
            <button
              onClick={() => setCurrentPage('store')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'store' ? 'bg-gray-100' : ''
              }`}
            >
              <ShoppingCart className="w-5 h-5 mr-3" />
              المخزن
            </button>
            <button
              onClick={() => setCurrentPage('analytics')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'analytics' ? 'bg-gray-100' : ''
              }`}
            >
              <LineChart className="w-5 h-5 mr-3" />
              التحليلات المالية
            </button>
            <button
              onClick={() => setCurrentPage('calendar')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'calendar' ? 'bg-gray-100' : ''
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              المواعيد
            </button>
            <button
              onClick={() => setCurrentPage('notifications')}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md ${
                currentPage === 'notifications' ? 'bg-gray-100' : ''
              }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              تنبيهات الاشتراك
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        {currentPage === 'invoices' ? (
          <InvoicesPage />
        ) : currentPage === 'store' ? (
          <StorePage />
        ) : currentPage === 'calendar' ? (
          <CalendarPage />
        ) : currentPage === 'customers' ? (
          <CustomersPage />
        ) : currentPage === 'notifications' ? (
          <NotificationsPage />
        ) : (
          <main className="flex-1 bg-gray-50 p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 text-right">RESTA SOFTWARE</h1>
              <p className="text-gray-600 text-right">إدارة ومراقبة جميع اشتراكات العملاء.</p>
              <p className="text-gray-600 text-right">برمجة وتطوير يوسف البهلولي.</p>
              <button className='btu'> YOUSUF </button>
            </div>
            {/* سطر 126 نظرة عامة */}
          </main>
        )}
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {session ? (
        <Dashboard session={session} />
      ) : (
        <div className="flex justify-center">
          <Auth />
        </div>
      )}
    </div>
  );
}

export default App;