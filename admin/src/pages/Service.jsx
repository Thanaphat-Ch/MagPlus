import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ServiceCard from "../components/ServiceCard";
import ServiceDetailModal from "../components/ServiceDetailModal";
import { io } from "socket.io-client";

const API_URL = "https://app.magnitudetms.com";

const FILTER_TEXTS = {
  all: "ทั้งหมด",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

export default function Service() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchServiceRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/service`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setServiceRequests(data))
      .catch((err) => {
        console.error("❌ ERROR fetching service requests:", err);
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = io(API_URL);

    fetchServiceRequests();

    socket.on("newRepairRequest", (req) => {
      setServiceRequests((prev) => [req, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchServiceRequests]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/service-request/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const updatedRequest = await res.json();

      setServiceRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, ...updatedRequest } : req))
      );
      setSelectedRequest(null);
    } catch (err) {
      console.error("❌ ERROR updating status:", err);
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  const filteredRequests = serviceRequests.filter((req) =>
    filter === "all" ? true : req.status === filter
  );

  return (
    
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="hidden md:block text-3xl font-extrabold mb-6 text-gray-800">
            ระบบอนุมัติการซ่อม
          </h1>
          <div className="mb-6 flex flex-wrap gap-3">
            {Object.keys(FILTER_TEXTS).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {FILTER_TEXTS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-gray-500">⏳ กำลังโหลดข้อมูล...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-gray-500">ไม่มีคำขอซ่อม</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((req) => (
                <ServiceCard
                  key={req.id}
                  request={req}
                  onCardClick={() => setSelectedRequest(req)}
                />
              ))}
            </div>
          )}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/10 to-black/30 backdrop-blur-xl">
          <div className="animate-fadeInUp">
            <ServiceDetailModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      )}
        </main>


  );
}