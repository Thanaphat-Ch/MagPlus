import React from "react";
import { FiCheckCircle, FiClock, FiXCircle, FiAlertTriangle, FiTruck, FiX, FiTool } from "react-icons/fi";
import { FaCarBurst } from "react-icons/fa6";





export function StatusBadge({ status }) {
  // let color = "bg-gray-200 text-gray-700";
  // let icon = <FiClock className="w-4 h-4" />;

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    รอตอบรับ: "bg-yellow-100 text-yellow-800",
    dispatched: "bg-blue-100 text-blue-800",
    กำลังขนส่ง: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    งานที่เสร็จสิ้น: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    งานที่ปฏิเสธ: "bg-red-100 text-red-800",

    พร้อมใช้งาน: "bg-green-100 text-green-800",
    จอด: "bg-green-100 text-green-800",
    ซ่อมบำรุง: "bg-yellow-100 text-yellow-800",
    อุบัติเหตุ: "bg-red-100 text-red-800",
  };

  const Icon = {
    pending: FiClock,
    รอตอบรับ: FiClock,
    dispatched: FiTruck,
    กำลังขนส่ง: FiTruck,
    completed: FiCheckCircle,
    งานที่เสร็จสิ้น: FiCheckCircle,
    cancelled: FiX,
    งานที่ปฏิเสธ: FiX,

    พร้อมใช้งาน: FiCheckCircle,
    จอด: FiCheckCircle,
    ซ่อมบำรุง: FiTool,
    อุบัติเหตุ: FaCarBurst,
  }[status] || FiAlertTriangle;

  return (
    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );

}
