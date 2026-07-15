import React from 'react';

const STATUS_STYLES = {
  approved: { text: "อนุมัติแล้ว", classes: "bg-green-100 text-green-800" },
  rejected: { text: "ปฏิเสธ", classes: "bg-red-100 text-red-800" },
  pending: { text: "รออนุมัติ", classes: "bg-yellow-100 text-yellow-800" },
};

const LeaveRequestCard = ({ request, onCardClick }) => {
  const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.pending;

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={onCardClick} 
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold text-gray-900">
          {request.name} {request.lastname}
        </h2>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.classes}`}>
          {statusStyle.text}
        </span>
      </div>
      
      <p className="text-gray-600 mb-1">
        <span className="font-medium text-gray-800">ประเภท:</span> {request.leave_type}
      </p>
      <p className="text-gray-600">
        <span className="font-medium text-gray-800">วันที่:</span> {request.start_date} - {request.end_date}
      </p>
    </div>
  );
};

export default LeaveRequestCard;