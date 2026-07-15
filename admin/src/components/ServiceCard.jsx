import React from "react";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_TEXTS = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

export default function ServiceCard({ request, onCardClick }) {
  const statusColor = STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800";
  const statusText = STATUS_TEXTS[request.status] || "ไม่ระบุ";
  const title = request.title || request.issue;
  const description = request.description || request.issue;

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-l-4 border-blue-500"
      onClick={() => onCardClick(request)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
          {statusText}
        </span>
      </div>
      <p className="text-gray-600 mb-4 truncate">{description}</p>
      <div className="text-sm text-gray-500 space-y-1">
        <p>
          <strong className="font-medium">ผู้แจ้ง:</strong> {request.name}
        </p>
        <p>
          <strong className="font-medium">วันที่:</strong>{" "}
          {new Date(request.created_at).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}