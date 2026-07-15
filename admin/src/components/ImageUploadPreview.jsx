import React, { useState, useEffect, useRef } from "react";

export default function ImageUploadPreview({ label, name, value, onChange }) {
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(value || "");
  }, [value]);


  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // preview ชั่วคราว
    const tempPreview = URL.createObjectURL(file);
    setPreview(tempPreview);

    if (file.size <= 1 * 1024 * 1024) {    //ถ้าไฟล์เล็ก
        onChange({ target: { name: `${name}_upload`, value: file } });
        return;
      }
    // ถ้าไฟล์ใหญ่ → ย่อด้วย canvas
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = async () => {
          const maxWidth = 800;  // ความกว้างสูงสุด
          const maxHeight = 800; // ความสูงสูงสุด
          let { width, height } = img;

          // คำนวณสัดส่วนใหม่
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(async (blob) => {
            const resizedFile = new File([blob], file.name, { type: "image/jpeg" });
            onChange({ target: { name, value: resizedFile } });
          }, "image/jpeg", 0.8);
        };
      };
    }

  const handleRemove = () => {
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    onChange({ target: { name, value: null } });

    if (preview) {
      onChange({ target: { name: `${name}_removed`, value: preview } });
    }
  };

  return (
    <div className="mb-2">
      <label className="block mb-1 font-medium">{label}</label>

      {!preview && (
        <div
          onClick={() => {
            fileInputRef.current.click() 
            setLoading(true)}}
          className="h-8 w-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer bg-white hover:bg-gray-50"
        >
          {loading ? (
            <span className="text-gray-400">กำลังอัปโหลด...</span>
          ) : (
            <span className="text-gray-500">เลือกรูป</span>
          )}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <div className="mt-2 relative inline-block">
          <span
            className="h-8 w-40 border rounded p-1 cursor-pointer bg-gray-50 text-sm overflow-hidden text-ellipsis"
            title={preview} // แสดงชื่อเต็มเวลาชี้เมาส์
            onClick={() => setIsOpen(true)}
          >
            {preview.split('/').pop()} {/* แยกชื่อไฟล์จาก path */}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-gray-50 pl-1 text-gray-400 text-lg leading-none hover:text-red-500"
            title="ลบไฟล์"
          >
            ✕
          </button>
        </div>
      )}

      {isOpen && preview && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={preview}
            alt={label}
            className="max-h-[90%] max-w-[90%] rounded shadow-lg"
          />
        </div>
      )}
    </div>
  );
}