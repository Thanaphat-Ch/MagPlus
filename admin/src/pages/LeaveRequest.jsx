// import React, { useEffect, useState, useCallback } from "react";
// import LeaveRequestCard from "../components/LeaveRequestCard";
// import LeaveRequestDetailModal from "../components/LeaveRequestDetailModal";

// const API_URL = import.meta.env.API_URL;

// const FILTER_TEXTS = {
//   all: "ทั้งหมด",
//   pending: "รออนุมัติ",
//   approved: "อนุมัติแล้ว",
//   rejected: "ปฏิเสธ",
// };

// function LeaveRequest() {
//   const [leaveRequests, setLeaveRequests] = useState([]);
//   const [filter, setFilter] = useState("all");
//   const [selectedRequest, setSelectedRequest] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchLeaveRequests = useCallback(() => {
//     setLoading(true);
//     setError(null);
//     fetch(`${API_URL}/api/leave`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         return res.json();
//       })
//       .then((data) => setLeaveRequests(data))
//       .catch((err) => {
//         console.error("❌ ERROR fetching leave:", err);
//         setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   useEffect(() => {
//     fetchLeaveRequests();
//   }, [fetchLeaveRequests]);

//   const handleUpdateStatus = async (id, status) => {
//     try {
//         const res = await fetch(`${API_URL}/api/leave/${id}/status`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ status }),
//         });

//         // พยายามอ่าน response body ทุกครั้ง
//         const responseData = await res.json(); 

//         if (!res.ok) {
//             // โยน Error ที่มีรายละเอียดจาก Server
//             throw new Error(responseData.error || `Server responded with status ${res.status}`);
//         }

//         // ... (โค้ดสำหรับอัปเดต state เมื่อสำเร็จ) ...
//         setLeaveRequests((prevRequests) =>
//             prevRequests.map((req) => (req.id === id ? responseData : req))
//         );
//         setSelectedRequest(null);
        
//     } catch (err) {
//         // ✅ แสดงข้อความ Error ที่ชัดเจน
//         console.error("❌ ERROR updating status:", err);
//         alert(`อัปเดตสถานะไม่สำเร็จ: ${err.message || "โปรดตรวจสอบการเชื่อมต่อ Server"}`);
//     }
// };

//   const filteredRequests = leaveRequests.filter((req) =>
//     filter === "all" ? true : req.status === filter
//   );

//   return (
//         <main className="flex-1 p-4 sm:p-6 lg:p-8">
//           {/* Title desktop */}
//           <h1 className="hidden md:block text-3xl font-extrabold mb-6 text-gray-800">
//             ระบบอนุมัติการลางาน
//           </h1>

//           {/* Filter buttons */}
//           <div className="mb-6 flex flex-wrap gap-3">
//             {Object.keys(FILTER_TEXTS).map((f) => (
//               <button
//                 key={f}
//                 onClick={() => setFilter(f)}
//                 className={`px-5 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
//                   filter === f
//                     ? "bg-blue-600 text-white shadow-lg"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {FILTER_TEXTS[f]}
//               </button>
//             ))}
//           </div>

//           {/* Requests */}
//           {loading ? (
//             <p className="text-gray-500">⏳ กำลังโหลดข้อมูล...</p>
//           ) : error ? (
//             <p className="text-red-500">{error}</p>
//           ) : filteredRequests.length === 0 ? (
//             <p className="text-gray-500">ไม่มีคำขอลางาน</p>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredRequests.map((req) => (
//                 <LeaveRequestCard
//                   key={req.id}
//                   request={req}
//                   onCardClick={() => setSelectedRequest(req)}
//                 />
//               ))}
//             </div>
//           )}
//       {/* Modal */}
//       {selectedRequest && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/10 to-black/30 backdrop-blur-xl">
//           <div className="animate-fadeInUp">
//             <LeaveRequestDetailModal
//               request={selectedRequest}
//               onClose={() => setSelectedRequest(null)}
//               onUpdateStatus={handleUpdateStatus}
//             />
//           </div>
//         </div>
//       )}
//     </main>
//   )}


// export default LeaveRequest;

import React, { useEffect, useState, useCallback, useMemo } from "react"; 
import LeaveRequestCard from "../components/LeaveRequestCard";
import LeaveRequestDetailModal from "../components/LeaveRequestDetailModal";

const API_URL = import.meta.env.API_URL;

const FILTER_TEXTS = {
  all: "ทั้งหมด",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

const ICONS = {
  pending: "🕒",
  approved: "✔️",
  rejected: "❌",
  total: "📊",
};


function StatCard({ title, value, type, loading }) {
  const colors = {
    pending: "border-yellow-500",
    approved: "border-green-500",
    rejected: "border-red-500",
    total: "border-blue-500",
  };

  return (
    <div
      className={`bg-white p-5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl border-l-4 ${
        colors[type] || "border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className="text-3xl opacity-80">{ICONS[type]}</div>
      </div>
    </div>
  );
}

function LeaveRequest() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchLeaveRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/leave`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setLeaveRequests(data))
      .catch((err) => {
        console.error("❌ ERROR fetching leave:", err);
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleUpdateStatus = async (id, status) => {
    try {
        const res = await fetch(`${API_URL}/api/leave/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        const responseData = await res.json(); 
        if (!res.ok) {
              throw new Error(responseData.error || `Server responded with status ${res.status}`);
        }
        setLeaveRequests((prevRequests) =>
            prevRequests.map((req) => (req.id === id ? responseData : req))
        );
        setSelectedRequest(null);

    } catch (err) {
        console.error("❌ ERROR updating status:", err);
        alert(`อัปเดตสถานะไม่สำเร็จ: ${err.message || "โปรดตรวจสอบการเชื่อมต่อ Server"}`);
    }
  };

  const stats = useMemo(() => {
    return {
      pending: leaveRequests.filter((r) => r.status === "pending").length,
      approved: leaveRequests.filter((r) => r.status === "approved").length,
      rejected: leaveRequests.filter((r) => r.status === "rejected").length,
      total: leaveRequests.length,
    };
  }, [leaveRequests]);

  const filteredRequests = leaveRequests.filter((req) =>
    filter === "all" ? true : req.status === filter
  );

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">แดชบอร์ดระบบการลางาน</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="รออนุมัติ"
          value={stats.pending}
          type="pending"
          loading={loading}
        />
        <StatCard
          title="อนุมัติแล้ว"
          value={stats.approved}
          type="approved"
          loading={loading}
        />
        <StatCard
          title="ปฏิเสธ"
          value={stats.rejected}
          type="rejected"
          loading={loading}
        />
        <StatCard
          title="คำขอทั้งหมด"
          value={stats.total}
          type="total"
          loading={loading}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          รายการคำขอลางาน
        </h2>

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

        {loading && filteredRequests.length === 0 ? (
          <p className="text-gray-500 py-4">⏳ กำลังโหลดข้อมูล...</p>
        ) : error ? (
          <p className="text-red-500 py-4">{error}</p>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
                🎉 ไม่มีคำขอลางานในหมวดหมู่นี้
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((req) => (
              <LeaveRequestCard
                key={req.id}
                request={req}
                onCardClick={() => setSelectedRequest(req)}
              />
            ))}
          </div>
        )}
      </div> 

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/10 to-black/30 backdrop-blur-xl">
          <div className="animate-fadeInUp">
            <LeaveRequestDetailModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              nUpdateStatus={handleUpdateStatus}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default LeaveRequest;