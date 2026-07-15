import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiMenu } from "react-icons/fi";

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
  document.body.style.overflow = isSidebarOpen ? "hidden" : "auto";
}, [isSidebarOpen]);

  
  const location = useLocation(); // รู้ว่าอยู่ path ไหน

  useEffect(() => {
    // ทุกครั้งที่เปลี่ยนหน้า ให้ sidebar mobile พับ
    setSidebarOpen(false);
  }, [location.pathname]);
  
  // กำหนด title ตาม path
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case "/admin":
        return "หน้าหลัก";
      case "/booking":
        return "การจองรถ";
      case "/shipment":
        return "การสั่งงาน";
      case "/drivers":
        return "ข้อมูลคนขับ";
      case "/trucks":
        return "ข้อมูลรถบรรทุก";
      case "/attendance/time-record":
        return "ฝ่ายบุคคล";
      case "/attendance/leave-request":
        return "อนุมัติการลางาน";
      case "/service":
        return "แจ้งซ่อม";
      case "/settings":
        return "ตั้งค่า";
      default:
        return "Admin Panel";
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`shadow-lg md:block  ${isSidebarOpen ? 'fixed inset-y-0 left-0 z-30 w-64 transform translate-x-0 transition-transform duration-300 ease-in-out' : 'hidden'}`}>
        <Sidebar />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 w-full">
        {/* Header mobile */}
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-xl font-bold text-gray-800">{getHeaderTitle()}</h1>
          <button onClick={toggleSidebar} className="text-gray-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </header>

        {/* หน้าย่อยจะแสดงตรงนี้ */}
        <main className="flex flex-1 bg-gray-100 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
