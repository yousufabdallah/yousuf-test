import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Archive, Tag, Clock, DollarSign, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  name: string;
  type: 'physical' | 'subscription';
  stock?: number;
  purchase_price?: number;
  selling_price: number;
  subscription_details?: string;
  contract_duration?: string;
  created_at: string;
  status: 'active' | 'inactive';
  user_id: string;
}

export function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [productType, setProductType] = useState<'physical' | 'subscription'>('physical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'physical',
    stock: 0,
    purchase_price: 0,
    selling_price: 0,
    subscription_details: '',
    contract_duration: '1-month'
  });

  useEffect(() => {
    // Get the current user's ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchProducts(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const fetchProducts = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    
    // Convert numeric values
    if (['stock', 'purchase_price', 'selling_price'].includes(name)) {
      parsedValue = value === '' ? 0 : parseFloat(value);
    }

    setNewProduct(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...newProduct,
        type: productType,
        user_id: userId,
        // Only include relevant fields based on product type
        ...(productType === 'physical' ? {
          subscription_details: null,
          contract_duration: null
        } : {
          stock: null,
          purchase_price: null
        })
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      setShowNewProductModal(false);
      setNewProduct({
        name: '',
        type: 'physical',
        stock: 0,
        purchase_price: 0,
        selling_price: 0,
        subscription_details: '',
        contract_duration: '1-month'
      });
      fetchProducts(userId);
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-right">تكامل المتجر</h1>
        <p className="text-gray-600 text-right">إدارة المنتجات والمخزون والاشتراكات المتاحة.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowNewProductModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة منتج جديد
          </button>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
                <div className="flex items-center">
                  {product.type === 'physical' ? (
                    <Package className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-right">{product.name}</h3>

              {product.type === 'physical' ? (
                <div className="space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">المخزون:</span>
                    <div className="flex items-center">
                      <Archive className="w-4 h-4 ml-1 text-gray-500" />
                      <span>{product.stock}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">سعر الشراء:</span>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 ml-1 text-gray-500" />
                      <span>${product.purchase_price}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">سعر البيع:</span>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 ml-1 text-gray-500" />
                      <span>${product.selling_price}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-right">
                  <p className="text-gray-600">{product.subscription_details}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">مدة العقد:</span>
                    <span>{product.contract_duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">سعر الاشتراك:</span>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 ml-1 text-gray-500" />
                      <span>${product.selling_price}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-2 rtl:space-x-reverse">
                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md">تعديل</button>
                <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md">حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">إضافة منتج جديد</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      productType === 'physical' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                    onClick={() => setProductType('physical')}
                  >
                    منتج ملموس
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      productType === 'subscription' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                    onClick={() => setProductType('subscription')}
                  >
                    اشتراك
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">اسم المنتج</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {productType === 'physical' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">المخزون</label>
                    <input
                      type="number"
                      name="stock"
                      value={newProduct.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">سعر الشراء</label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={newProduct.purchase_price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">سعر البيع</label>
                    <input
                      type="number"
                      name="selling_price"
                      value={newProduct.selling_price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">تفاصيل الاشتراك</label>
                    <textarea
                      name="subscription_details"
                      value={newProduct.subscription_details}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">مدة العقد</label>
                    <select
                      name="contract_duration"
                      value={newProduct.contract_duration}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="1-month">شهر واحد</option>
                      <option value="3-months">3 أشهر</option>
                      <option value="6-months">6 أشهر</option>
                      <option value="1-year">سنة</option>
                      <option value="lifetime">مدى الحياة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right">سعر الاشتراك</label>
                    <input
                      type="number"
                      name="selling_price"
                      value={newProduct.selling_price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}