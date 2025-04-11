// App.jsx أو page.jsx
import React, { useState } from 'react';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('customers');

  const renderSection = () => {
    switch (activeSection) {
      case 'customers':
        return <Section title="إدارة العملاء" text="أضف، عدل، أو احذف بيانات العملاء." />;
      case 'invoices':
        return <Section title="الفواتير" text="عرض وإنشاء الفواتير." />;
      case 'finance':
        return <Section title="السجلات المالية" text="عرض الدخل والمصروفات." />;
      case 'inventory':
        return <Section title="المخزن" text="إدارة المنتجات والمخزون." />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100" dir="rtl">
      {/* الشريط الجانبي */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <h2 className="text-2xl font-bold text-center py-6 border-b border-gray-600">لوحة التحكم</h2>
        <nav className="flex-1">
          <ul>
            <SidebarItem label="إدارة العملاء" id="customers" setActive={setActiveSection} />
            <SidebarItem label="الفواتير" id="invoices" setActive={setActiveSection} />
            <SidebarItem label="السجلات المالية" id="finance" setActive={setActiveSection} />
            <SidebarItem label="المخزن" id="inventory" setActive={setActiveSection} />
          </ul>
        </nav>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-8">{renderSection()}</main>
    </div>
  );
}

function SidebarItem({ label, id, setActive }) {
  return (
    <li
      onClick={() => setActive(id)}
      className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700"
    >
      {label}
    </li>
  );
}

function Section({ title, text }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-700">{text}</p>
    </div>
  );
}
