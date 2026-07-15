import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function FilterDropdown({
  label = "กรองข้อมูลตาม",       // ข้อความแสดงด้านหน้า
  options = [],                   // [{label, value}]
  value = "",                     // ค่าที่เลือกตอนนี้
  onChange = () => {},            // ฟังก์ชันเมื่อเลือกค่าใหม่
  className = "",                 // class เสริม
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ปิด dropdown เมื่อคลิกนอกกรอบ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "ทั้งหมด";

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* ปุ่มเปิด/ปิด */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 w-48 text-sm text-gray-700 hover:border-blue-400 transition"
      >
        <span>
          {label}: <span className="font-medium text-gray-900">{selectedLabel}</span>
        </span>
        <FiChevronDown
          className={`ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* เมนู Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-blue-100 ${
                opt.value === value ? "bg-blue-50 text-blue-600 font-medium" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
