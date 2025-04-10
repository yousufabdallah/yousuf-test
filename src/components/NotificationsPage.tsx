import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Subscription {
  id: string;
  invoice_number: string;
  customer_name: string;
  product_name: string;
  contract_start_date: string;
  contract_end_date: string;
  status: 'active' | 'expiring_soon' | 'expired';
  days_remaining: number;
}

export function NotificationsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    // Refresh data every minute to keep status current
    const interval = setInterval(fetchSubscriptions, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data: invoiceItemsData, error: invoicesError } = await supabase
        .from('invoice_items')
        .select(`
          id,
          contract_start_date,
          contract_end_date,
          invoice:invoices (
            number,
            customer_name,
            status
          ),
          product:products (
            name,
            type,
            subscription_details
          )
        `)
        .eq('invoice.user_id', user.id)
        .eq('invoice.status', 'Completed')
        .eq('product.type', 'subscription')
        .not('contract_end_date', 'is', null)
        .order('contract_end_date', { ascending: true });

      if (invoicesError) throw invoicesError;

      const now = new Date();
      const processedSubscriptions = (invoiceItemsData || [])
        .filter(item => item.invoice && item.product)
        .map(item => {
          const endDate = new Date(item.contract_end_date);
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: 'active' | 'expiring_soon' | 'expired';
          if (daysRemaining < 0) {
            status = 'expired';
          } else if (daysRemaining <= 7) {
            status = 'expiring_soon';
          } else {
            status = 'active';
          }

          return {
            id: item.id,
            invoice_number: item.invoice.number,
            customer_name: item.invoice.customer_name,
            product_name: item.product.name,
            contract_start_date: item.contract_start_date,
            contract_end_date: item.contract_end_date,
            status,
            days_remaining: daysRemaining
          };
        });

      setSubscriptions(processedSubscriptions);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-right">تنبيهات الاشتراكات</h1>
        <p className="text-gray-600 text-right">متابعة حالة الاشتراكات وتواريخ انتهائها.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">جاري تحميل الاشتراكات...</div>
      ) : (
        <div className="space-y-6">
          {/* Expiring Soon Subscriptions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-lg font-semibold text-yellow-800">اشتراكات على وشك الانتهاء</h2>
            </div>
            <div className="space-y-4">
              {subscriptions
                .filter(sub => sub.status === 'expiring_soon')
                .map(subscription => (
                  <div key={subscription.id} className="bg-white border border-yellow-100 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div className="text-right">
                        <h3 className="font-semibold">{subscription.customer_name}</h3>
                        <p className="text-sm text-gray-600">{subscription.product_name}</p>
                        <p className="text-sm text-yellow-600 mt-2">
                          متبقي {subscription.days_remaining} يوم
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          تاريخ الانتهاء: {new Date(subscription.contract_end_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              {subscriptions.filter(sub => sub.status === 'expiring_soon').length === 0 && (
                <p className="text-center text-gray-600">لا توجد اشتراكات على وشك الانتهاء</p>
              )}
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">الاشتراكات النشطة</h2>
            </div>
            <div className="space-y-4">
              {subscriptions
                .filter(sub => sub.status === 'active')
                .map(subscription => (
                  <div key={subscription.id} className="bg-white border border-green-100 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <Bell className="w-5 h-5 text-green-600" />
                      <div className="text-right">
                        <h3 className="font-semibold">{subscription.customer_name}</h3>
                        <p className="text-sm text-gray-600">{subscription.product_name}</p>
                        <p className="text-sm text-green-600 mt-2">
                          متبقي {subscription.days_remaining} يوم
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          تاريخ الانتهاء: {new Date(subscription.contract_end_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              {subscriptions.filter(sub => sub.status === 'active').length === 0 && (
                <p className="text-center text-gray-600">لا توجد اشتراكات نشطة</p>
              )}
            </div>
          </div>

          {/* Expired Subscriptions */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">الاشتراكات المنتهية</h2>
            </div>
            <div className="space-y-4">
              {subscriptions
                .filter(sub => sub.status === 'expired')
                .map(subscription => (
                  <div key={subscription.id} className="bg-white border border-red-100 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div className="text-right">
                        <h3 className="font-semibold">{subscription.customer_name}</h3>
                        <p className="text-sm text-gray-600">{subscription.product_name}</p>
                        <p className="text-sm text-red-600 mt-2">
                          انتهى منذ {Math.abs(subscription.days_remaining)} يوم
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          تاريخ الانتهاء: {new Date(subscription.contract_end_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              {subscriptions.filter(sub => sub.status === 'expired').length === 0 && (
                <p className="text-center text-gray-600">لا توجد اشتراكات منتهية</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}