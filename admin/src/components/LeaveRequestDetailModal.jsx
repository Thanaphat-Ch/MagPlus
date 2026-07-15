import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const LeaveRequestDetailModal = ({ request, onClose, onUpdateStatus }) => {
  const [modalImage, setModalImage] = useState(null);
  const [updating, setUpdating] = useState(false);
  const images = useMemo(() => (request.images ? JSON.parse(request.images) : []), [request.images]);

  const handleAction = async (status) => {
    const result = await MySwal.fire({
      title: `คุณแน่ใจหรือไม่?`,
      text: `คุณต้องการ "${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}" คำขอนี้หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      setUpdating(true);
      try {
        await onUpdateStatus(request.id, status);
        await MySwal.fire({
          title: 'สำเร็จ!',
          text: `อัปเดตสถานะ: ${status}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        onClose();
      } catch (err) {
        console.error(err);
        await MySwal.fire({
          title: 'ผิดพลาด!',
          text: 'อัปเดตสถานะไม่สำเร็จ ลองใหม่อีกครั้ง',
          icon: 'error',
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  return (
    <div>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">รายละเอียดคำขอลา</h2>
          <div className="space-y-3 text-gray-700 mb-6">
            <p><strong>ชื่อ-นามสกุล:</strong> {request.name} {request.lastname}</p>
            <p><strong>ประเภทการลา:</strong> {request.leave_type}</p>
            <p><strong>ช่วงวันที่ลา:</strong> {request.start_date} ถึง {request.end_date}</p>
            <div>
              <strong>เหตุผล:</strong>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg border">{request.reason}</p>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">เอกสารแนบ</h3>
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
                <p className="text-gray-500">ไม่มีเอกสารแนบ</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-4 border-t pt-6">
            <button
              onClick={() => handleAction('rejected')}
              disabled={updating || request.status === 'rejected'}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                updating || request.status === 'rejected'
                  ? 'bg-red-200 text-red-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              ปฏิเสธ
            </button>
            <button
              onClick={() => handleAction('approved')}
              disabled={updating || request.status === 'approved'}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                updating || request.status === 'approved'
                  ? 'bg-green-300 text-green-100 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              อนุมัติ
            </button>
          </div>
        </div>
      </div>
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/90 bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <img src={modalImage} alt="full-view" className="max-h-[90%] max-w-[90%] rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default LeaveRequestDetailModal;
