import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function ServiceDetailModal({ request, onClose, onUpdateStatus }) {
  if (!request) return null;

  const [modalImage, setModalImage] = useState(null);
  const [updating, setUpdating] = useState(false);

  const images = useMemo(() => {
    try {
      return request.images ? JSON.parse(request.images) : [];
    } catch (e) {
      console.error("Failed to parse images JSON:", e);
      return [];
    }
  }, [request.images]);

  const handleAction = async (status) => {
    const result = await MySwal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: `คุณต้องการ "${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}" คำขอซ่อมนี้ใช่ไหม?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      setUpdating(true);
      try {
        await onUpdateStatus(request.id, status);
        await MySwal.fire({
          title: 'สำเร็จ!',
          text: `คำขอซ่อมได้ถูก "${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}" แล้ว`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        onClose();
      } catch (err) {
        console.error("Update status failed:", err);
        await MySwal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง',
          icon: 'error',
          timer: 2500,
          showConfirmButton: false,
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-40 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">รายละเอียดคำขอซ่อม</h2>
          
          <div className="space-y-4 text-gray-700 mb-6">
            <p><strong>ผู้แจ้ง:</strong> {request.name || 'N/A'}</p>
            <p><strong>ประเภท:</strong> {request.type || 'N/A'}</p>
            <p><strong>วันที่แจ้ง:</strong> {new Date(request.created_at).toLocaleString("th-TH")}</p>
            <div>
              <strong>เรื่อง/อาการ:</strong>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg border text-gray-800">{request.issue || 'ไม่มีรายละเอียด'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">รูปภาพประกอบ</h3>
            <div className="flex flex-wrap gap-3">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`https://app.magnitudetms.com${img}`}
                    alt={`attachment-${idx}`}
                    className="w-28 h-28 object-cover rounded-lg cursor-pointer border hover:opacity-80 transition-opacity"
                    onClick={() => setModalImage(`https://app.magnitudetms.com${img}`)}
                  />
                ))
              ) : (
                <p className="text-gray-500 italic">ไม่มีรูปภาพแนบ</p>
              )}
            </div>
          </div>
          
          {request.status === "pending" && (
            <div className="flex justify-end gap-4 border-t pt-6">
              <button
                onClick={() => handleAction('rejected')}
                disabled={updating}
                className="px-6 py-2 rounded-lg font-semibold transition-colors bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? 'กำลังโหลด...' : 'ปฏิเสธ'}
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={updating}
                className="px-6 py-2 rounded-lg font-semibold transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? 'กำลังโหลด...' : 'อนุมัติ'}
              </button>
            </div>
          )}
        </div>
      </div>
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <img src={modalImage} alt="full-view" className="max-h-[90%] max-w-[90%] rounded-lg" />
        </div>
      )}
    </>
  );
}