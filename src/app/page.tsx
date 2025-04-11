export default function Home() {
  return (
    <main className="flex h-screen">
      {/* الشريط الجانبي */}
      <aside className="w-60 bg-gray-800 text-white p-6 space-y-4">
        <h2 className="text-xl font-bold mb-6">القائمة</h2>
        <button className="btn w-full rounded-md">الرئيسية</button>
        <button className="btn w-full rounded-md">الطلبات</button>
        <button className="btn w-full rounded-md">المخزون</button>
        <button className="btn w-full rounded-md">العملاء</button>
        <button className="btn w-full rounded-md">التقارير</button>
        <button className="btn w-full rounded-md">الإعدادات</button>
      </aside>

      {/* المحتوى الرئيسي */}
      <section className="flex-1 bg-gray-100 p-10">
        <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">عدد الطلبات اليوم</h3>
            <p className="text-2xl font-bold text-blue-600">124</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">عدد العملاء</h3>
            <p className="text-2xl font-bold text-green-600">58</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">المنتجات منخفضة</h3>
            <p className="text-2xl font-bold text-red-600">9</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">الإيرادات هذا الشهر</h3>
            <p className="text-2xl font-bold text-purple-600">1,250 OMR</p>
          </div>
        </div>
      </section>
    </main>
  );
}
