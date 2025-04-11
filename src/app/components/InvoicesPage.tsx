import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Plus, X, Package, Clock, DollarSign, Tag, Archive, Trash2 } from 'lucide-react';
import { Product } from './StorePage';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface InvoiceItem {
  product: Product;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  number: string;
  customer: Customer;
  items: InvoiceItem[];
  total: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  paymentMethod: string;
}

const generateInvoiceNumber = async () => {
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  const nextNumber = (count || 0) + 1;
  const timestamp = Date.now();
  return `INV-${timestamp}-${String(nextNumber).padStart(5, '0')}`;
};

const formatPrice = (price: number) => {
  return `${price.toFixed(3)} OMR`;
};

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showNewInvoiceModal, setShowNewProductModal] = useState(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<InvoiceItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            *,
            product:products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      const transformedInvoices = invoicesData.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        customer: {
          name: invoice.customer_name,
          email: invoice.customer_email,
          phone: invoice.customer_phone,
          address: invoice.customer_address
        },
        items: invoice.invoice_items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        })),
        total: invoice.total,
        date: new Date(invoice.created_at).toISOString().split('T')[0],
        status: invoice.status,
        paymentMethod: invoice.payment_method
      }));

      setInvoices(transformedInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    }
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProducts([
        ...selectedProducts,
        { product, quantity: 1, price: product.selling_price }
      ]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...selectedProducts];
    updated[index].quantity = quantity;
    setSelectedProducts(updated);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const invoiceNumber = await generateInvoiceNumber();
      const total = calculateTotal();

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          number: invoiceNumber,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_address: customer.address,
          total,
          status: 'Completed',
          payment_method: 'Credit Card',
          user_id: user.id
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = selectedProducts.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      setShowNewProductModal(false);
      setSelectedProducts([]);
      setCustomer({ name: '', email: '', phone: '', address: '' });
      fetchInvoices();
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoiceModal(true);
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: 'Completed' | 'Pending' | 'Failed') => {
    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      setInvoices(invoices.map(inv => 
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      ));

      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError('Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .in('id', selectedInvoices);

      if (deleteError) throw deleteError;

      setSelectedInvoices([]);
      setSelectAll(false);
      fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoices:', err);
      setError('Failed to delete invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Add RESTA logo
    doc.setFontSize(24);
    doc.text('RESTA', 105, 20, { align: 'center' });
    
    // Add invoice details
    doc.setFontSize(12);
    doc.text(`رقم الفاتورة: ${invoice.number}`, 200, 40, { align: 'right' });
    doc.text(`التاريخ: ${invoice.date}`, 200, 50, { align: 'right' });
    
    // Add customer details
    doc.text('معلومات العميل:', 200, 70, { align: 'right' });
    doc.text(`الاسم: ${invoice.customer.name}`, 200, 80, { align: 'right' });
    doc.text(`البريد الإلكتروني: ${invoice.customer.email}`, 200, 90, { align: 'right' });
    doc.text(`الهاتف: ${invoice.customer.phone}`, 200, 100, { align: 'right' });
    doc.text(`العنوان: ${invoice.customer.address}`, 200, 110, { align: 'right' });
    
    // Add items
    doc.text('المنتجات:', 200, 130, { align: 'right' });
    let y = 140;
    invoice.items.forEach(item => {
      doc.text(`${item.product.name}`, 200, y, { align: 'right' });
      doc.text(`الكمية: ${item.quantity}`, 200, y + 10, { align: 'right' });
      doc.text(`السعر: ${formatPrice(item.price)}`, 200, y + 20, { align: 'right' });
      doc.text(`الإجمالي: ${formatPrice(item.quantity * item.price)}`, 200, y + 30, { align: 'right' });
      y += 40;
    });
    
    // Add total
    doc.text(`إجمالي الفاتورة: ${formatPrice(invoice.total)}`, 200, y + 10, { align: 'right' });
    doc.text(`حالة الدفع: ${invoice.status}`, 200, y + 20, { align: 'right' });
    doc.text(`طريقة الدفع: ${invoice.paymentMethod}`, 200, y + 30, { align: 'right' });
    
    // Save the PDF
    doc.save(`invoice-${invoice.number}.pdf`);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedInvoices(checked ? invoices.map(inv => inv.id) : []);
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      const newSelection = prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId];
      
      setSelectAll(newSelection.length === invoices.length);
      return newSelection;
    });
  };

  return (
    <div className="p-6 bg-gray-50 flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-right">الفواتير</h1>
        <p className="text-gray-600 text-right">إدارة المدفوعات وإنشاء الفواتير وتتبع سجل المدفوعات.</p>
      </div>

      <div className="flex justify-between mb-6">
        <div className="space-x-2 rtl:space-x-reverse">
          <button 
            onClick={handleDeleteInvoices}
            disabled={selectedInvoices.length === 0}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedInvoices.length > 0
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4 inline-block ml-2" />
            حذف المحدد ({selectedInvoices.length})
          </button>
        </div>
        <div className="space-x-2 rtl:space-x-reverse">
          <button 
            onClick={() => setShowNewProductModal(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
          >
            <Plus className="w-4 h-4 inline-block ml-2" />
            فاتورة جديدة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-right">نظرة عامة على المدفوعات</h2>
        <p className="text-sm text-gray-600 mb-6 text-right">ملخص نشاط الدفع والمعاملات الأخيرة</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold">{formatPrice(invoices.reduce((sum, inv) => sum + inv.total, 0))}</p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">المدفوعات المعلقة</p>
              <p className="text-2xl font-bold">
                {formatPrice(invoices.filter(inv => inv.status === 'Pending')
                  .reduce((sum, inv) => sum + inv.total, 0))}
              </p>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">المدفوعات المتأخرة</p>
              <p className="text-2xl font-bold">
                {formatPrice(invoices.filter(inv => inv.status === 'Failed')
                  .reduce((sum, inv) => sum + inv.total, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-right">الاشتراكات النشطة</h3>
          <div className="space-y-4">
            {invoices.filter(inv => inv.items.some(item => item.product.type === 'subscription')).map(inv => (
              <div key={inv.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="text-right">
                    <p className="font-semibold">{inv.customer.name}</p>
                    <p className="text-sm text-gray-600">
                      {inv.items.find(item => item.product.type === 'subscription')?.product.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">تاريخ الانتهاء</p>
                    <p className="font-semibold">
                      {new Date(new Date(inv.date).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">سجل المدفوعات</h2>
          </div>
          <p className="text-sm text-gray-600">عرض وإدارة سجلات المدفوعات</p>
        </div>

        <div className="p-6">
          <div className="flex justify-between mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن عميل، رقم الدفع أو رقم الفاتورة..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <select className="border border-gray-300 rounded-md px-4 py-2">
                <option>جميع الحالات</option>
                <option>مكتمل</option>
                <option>معلق</option>
                <option>فشل</option>
              </select>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Calendar className="w-4 h-4 mr-2" />
                اختر نطاق تاريخ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">طريقة الدفع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{invoice.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{invoice.customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{invoice.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatPrice(invoice.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleUpdateStatus(invoice.id, e.target.value as 'Completed' | 'Pending' | 'Failed')}
                        className={`px-2 py-1 text-xs rounded-full border-0 ${
                          invoice.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="Completed">مكتمل</option>
                        <option value="Pending">معلق</option>
                        <option value="Failed">فشل</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{invoice.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                        <button 
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          عرض
                        </button>
                        <button 
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">السابق</button>
            <span className="text-sm text-gray-600">الصفحة 1</span>
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">التالي</button>
          </div>
        </div>
      </div>

      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">إنشاء فاتورة جديدة</h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-right">بيانات العميل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">اسم العميل</label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">العنوان</label>
                    <input
                      type="text"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-right">المنتجات</h3>
                <div className="mb-4">
                  <select
                    onChange={(e) => handleAddProduct(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value=""
                  >
                    <option value="">اختر منتج...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.selling_price)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-4 rounded-md mb-2">
                    <button
                      onClick={() => handleRemoveProduct(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex-1 mx-4 text-right">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.product.type === 'subscription' ? item.product.subscription_details : ''}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}

                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">
                    الإجمالي: {formatPrice(calculateTotal())}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowViewInvoiceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">تفاصيل الفاتورة - {selectedInvoice.number}</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-right">بيانات العميل</h3>
                <div className="grid grid-cols-2 gap-4 text-right">
                  <div>
                    <p className="text-sm text-gray-600">اسم العميل</p>
                    <p className="font-medium">{selectedInvoice.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                    <p className="font-medium">{selectedInvoice.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="font-medium">{selectedInvoice.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">العنوان</p>
                    <p className="font-medium">{selectedInvoice.customer.address}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-right">المنتجات</h3>
                <div className="space-y-4">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-4 rounded-md">
                      <div className="flex-1 text-right">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.product.type === 'subscription' ? item.product.subscription_details : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <span className="text-gray-600">الكمية: {item.quantity}</span>
                        <span className="text-gray-600">السعر: {formatPrice(item.price)}</span>
                        <span className="font-medium">الإجمالي: {formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">
                    إجمالي الفاتورة: {formatPrice(selectedInvoice.total)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-right">حالة الفاتورة</h3>
                <div className="flex justify-between items-center">
                  <select
                    value={selectedInvoice.status}
                    onChange={(e) => handleUpdateStatus(selectedInvoice.id, e.target.value as 'Completed' | 'Pending' | 'Failed')}
                    className={`px-4 py-2 rounded-md ${
                      selectedInvoice.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                    disabled={loading}
                  >
                    <option value="Completed">مكتمل</option>
                    <option value="Pending">معلق</option>
                    <option value="Failed">فشل</option>
                  </select>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">تاريخ الفاتورة</p>
                    <p className="font-medium">{selectedInvoice.date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}