import React, { useState, useEffect } from "react"
import { FiUploadCloud, FiX, FiCheckCircle } from "react-icons/fi"
import api from "../api" 

const MultiUpload = ({
  uploadType = "driver",
  userId = null,
  onUploadSuccess = null,
}) => {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // เคลียร์หน่วยความจำ Blob URLs เมื่อรายการ previews เปลี่ยนหรือ Component unmount
  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [previews])

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    // เคลียร์ URL เก่าทิ้งก่อนสร้างชุดใหม่ ป้องกัน Memory Leak
    previews.forEach((item) => URL.revokeObjectURL(item.url))

    const newPreviews = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2), // ขนาด MB
    }))

    setFiles(selected)
    setPreviews(newPreviews)
    setIsSuccess(false)
  }

  // ลบไฟล์เฉพาะรายการที่เลือก
  const handleRemoveFile = (indexToRemove) => {
    URL.revokeObjectURL(previews[indexToRemove].url)
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("กรุณาเลือกไฟล์ก่อนอัปโหลด")
      return
    }

    try {
      setLoading(true)
      setIsSuccess(false)

      const uploadData = new FormData()
      files.forEach((file) => {
        uploadData.append("files", file)
      })

      if (userId) {
        uploadData.append("userId", userId)
      }

      // ✅ ยิงผ่าน api กลาง (มี Token และ Header อัตโนมัติ)
      const res = await api.post(`/upload?Up_type=${encodeURIComponent(uploadType)}`, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setIsSuccess(true)
      alert("อัปโหลดไฟล์สำเร็จ ✅")

      if (onUploadSuccess) {
        onUploadSuccess(res.data)
      }

      // รีเซ็ตค่าหลังอัปโหลดเสร็จ
      setFiles([])
      setPreviews([])
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message)
      // แจ้งเตือนข้อผิดพลาดถ้า Interceptor ไม่ได้จับ
      const msg = error.response?.data?.message || "เกิดข้อผิดพลาดขณะอัปโหลดไฟล์"
      alert(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">
          อัปโหลดรูปภาพ / ไฟล์
        </h2>
        <p className="text-xs text-slate-500 mb-5 text-center">
          รองรับการเลือกพร้อมกันหลายไฟล์ (JPG, PNG, PDF)
        </p>

        {/* กล่อง Drag & Drop / Input Selection */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-6 cursor-pointer transition mb-4">
          <FiUploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <span className="text-sm font-semibold text-slate-700">คลิกเพื่อเลือกไฟล์</span>
          <span className="text-xs text-slate-400 mt-1">เลือกได้พร้อมกันหลายไฟล์</span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* แกลเลอรีภาพพรีวิว พร้อมปุ่มกดลบแต่ละรูป */}
        {previews.length > 0 && (
          <div className="space-y-3 mb-5">
            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>เลือกทั้งหมด {previews.length} รายการ</span>
              <button
                type="button"
                onClick={() => {
                  previews.forEach((p) => URL.revokeObjectURL(p.url))
                  setFiles([])
                  setPreviews([])
                }}
                className="text-rose-500 hover:underline"
              >
                ล้างทั้งหมด
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
              {previews.map((item, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="bg-white/90 hover:bg-rose-500 hover:text-white text-slate-700 p-1.5 rounded-full transition shadow"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {item.size} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ปุ่มอัปโหลด */}
        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl shadow-sm hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "กำลังอัปโหลด..." : `อัปโหลด ${files.length ? `(${files.length} ไฟล์)` : ""}`}
        </button>
      </div>
    </div>
  )
}

export default MultiUpload