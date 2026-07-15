import { useState } from "react"
import axios from "axios"
import { FiUploadCloud, FiFileText, FiX } from "react-icons/fi";

const API_URL = import.meta.env.API_URL;

const ImagePreviewModal = ({ src, field, onClose }) => {

  const dowloads_img = async (imgPath) => {
    try {
      // ตัด prefix url ออก เหลือเฉพาะ relative path เช่น "driver/3/D_3-xxxx.png"
      const relativePath = imgPath.replace(`${API_URL}/uploads/`, "")

      const response = await axios.post(
        `${API_URL}/download-pdf`,
        { images: [relativePath] }, // ส่งเป็น array
        { responseType: "blob" }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "image.pdf")
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Download failed", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative">
        {/* ปุ่มดาวน์โหลด */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            dowloads_img(src)
          }}
          className="absolute top-2 right-2 text-gray-300 hover:text-white p-2 rounded-full transition-colors z-10"
          title="ดาวน์โหลดเป็น PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v1.125c0 .621.504 1.125 1.125 1.125h15.75c.621 0 1.125-.504 1.125-1.125V16.5m-4.5-6L12 15m0 0L8.25 10.5M12 15V3" />
          </svg>
        </button>

        {/* รูปภาพ */}
        <img src={src} alt={field} className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  )
}

// Component สำหรับโชว์ชื่อไฟล์และเปิด modal
export const ImagePreview = ({ imgPath, fieldName }) => {
  const [open, setOpen] = useState(false)

  if (!imgPath) return <span>ไม่มีรูป</span>

  // const imgPath = imgPath; // เพิ่ม prefix ถ้าต้องการ

  return (
    <>
      <span
        className="flex items-center gap-0.5 w-full max-w-70 border rounded px-2 py-0.5
             cursor-pointer bg-gray-50 text-sm sm:text-base 
             overflow-hidden text-ellipsis whitespace-nowrap 
             hover:bg-gray-100 transition"
        title={imgPath}
        onClick={() => setOpen(true)}
      >
        {imgPath.split("/").pop()}
      </span>

      {open && <ImagePreviewModal src={imgPath} field={fieldName} onClose={() => setOpen(false)} />}
    </>
  )
}

export function InputField({ label, name, value, onChange, pattern, type = "text", maxLength, readOnly = false, className = "", ...props }) {
  return (
    <div>
      <label className="block mb-0.5 text-sm font-medium overflow-hidden">{label}</label>
      <input type={type} name={name} value={value || ""} onChange={onChange} pattern={pattern} maxLength={maxLength} readOnly={readOnly} className={`bg-white w-full border px-2 py-1.5 rounded text-sm shadow-md ${className}`} {...props} />
    </div>
  )
}




export function FileUploadPDF({ label, name, value, onChange, readOnly = false }) {
  const [fileName, setFileName] = useState(value ? value.split("/").pop() : "")

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      setFileName(file.name)
      onChange({ target: { name, value: file } })
    } else {
      alert("กรุณาเลือกไฟล์ PDF เท่านั้น")
    }
  }

  const handleRemove = () => {
    setFileName("")
    onChange({ target: { name, value: "" } })
  }

  return (
    <div className="flex flex-col">
      <label className="block mb-1 text-sm font-medium">{label}</label>
      {readOnly ? (
        value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 underline">
            <FiFileText /> {fileName || "ดูไฟล์ PDF"}
          </a>
        ) : (
          <span className="text-gray-500">ไม่มีไฟล์</span>
        )
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center hover:border-blue-400 transition">
          {fileName ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm truncate flex items-center gap-2">
                <FiFileText /> {fileName}
              </span>
              <button type="button" onClick={handleRemove} className="text-red-500 hover:text-red-700">
                <FiX />
              </button>
            </div>
          ) : (
            <>
              
              <p className="text-sm text-gray-600"></p>
              <input type="file"  accept="application/pdf" name={name} onChange={handleFileChange} className="opacity-50  w-full h-full cursor-pointer" />
              <div>
                <FiUploadCloud className="text-gray-400 w-8 h-8 mb-2" />
                <label className="block mb-0.5 text-sm font-medium overflow-hidden">{label}</label>
                <input type={file} name={name} value={value || ""} onChange={onChange} pattern={pattern} maxLength={maxLength} readOnly={readOnly} className={`bg-white w-full border px-2 py-1.5 rounded text-sm shadow-md ${className}`} {...props} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}






const FilePreviewModal = ({ fileUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg w-[90vw] h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/80 text-gray-700 p-1.5 rounded-full shadow hover:bg-gray-200"
          title="ปิด"
        >
          <FiX size={20} />
        </button>

        <iframe
          src={fileUrl}
          title="PDF Preview"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  )
}

export function FileUploadPreviewPDF({
  label,
  name,
  value,
  onChange,
  readOnly = false,
}) {
  const [fileName, setFileName] = useState(value ? value.split("/").pop() : "")
  const [openPreview, setOpenPreview] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      setFileName(file.name)
      onChange({ target: { name, value: file } })
    } else {
      alert("กรุณาเลือกไฟล์ PDF เท่านั้น")
    }
  }

  const fileUrl =
    value instanceof File
      ? URL.createObjectURL(value)
      : value?.startsWith("http")
      ? value
      : value
      ? `${API_URL}/uploads/${value}`
      : null

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>

      {!readOnly && (
        <label
          className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-gray-50"
        >
          <FiUploadCloud className="text-gray-400" size={22} />
          <span className="text-sm text-gray-600 mt-1">คลิกเพื่ออัปโหลด PDF</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {fileName && (
        <div
          className="mt-1 flex items-center justify-between bg-gray-50 border rounded px-2 py-1 text-sm"
        >
          <div className="flex items-center gap-1 overflow-hidden text-ellipsis">
            <FiFileText className="text-gray-500 flex-shrink-0" />
            <span className="truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>

          {fileUrl && (
            <button
              type="button"
              onClick={() => setOpenPreview(true)}
              className="text-blue-600 hover:underline text-xs"
            >
              ดูไฟล์
            </button>
          )}
        </div>
      )}

      {openPreview && (
        <FilePreviewModal fileUrl={fileUrl} onClose={() => setOpenPreview(false)} />
      )}
    </div>
  )
}