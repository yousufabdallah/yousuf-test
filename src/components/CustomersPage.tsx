import React, { useState, useEffect } from 'react';
import { Plus, Search, X, User, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
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
        .from('customers')
        .insert([{
          ...newCustomer,
          user_id: user.id
        }]);

      if (createError) throw createError;

      setShowNewCustomerModal(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      fetchCustomers();
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <div className="p-6 bg-gray-50 flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-right">إدارة العملاء</h1>
        <p className="text-gray-600 text-right">إدارة وتنظيم قائمة العملاء.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة عميل جديد
          </button>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن عميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <div className="flex items-center justify-end">
                  <span className="text-gray-600">{customer.email}</span>
                  <Mail className="w-4 h-4 ml-2 text-gray-500" />
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-gray-600">{customer.phone}</span>
                  <Phone className="w-4 h-4 ml-2 text-gray-500" />
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-gray-600">{customer.address}</span>
                  <MapPin className="w-4 h-4 ml-2 text-gray-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">إضافة عميل جديد</h2>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">اسم العميل</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">رقم الهاتف</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">العنوان</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الإضافة...' : 'إضافة العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}