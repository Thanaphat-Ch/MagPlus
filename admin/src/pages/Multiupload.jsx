import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.API_URL;

const MultiUpload = () => {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = [...e.target.files];
    setFiles(selected);

    // สร้าง preview ของรูป
    const previews = selected.map((file) => URL.createObjectURL(file));
    setPreview(previews);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("กรุณาเลือกไฟล์ก่อน");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uploadData = new FormData();

      files.forEach((file) => {
        uploadData.append("files", file);
      });

      uploadData.append("userId", "123");

      const res = await axios.post(
        `${API_URL}/api/upload?Up_type=driver`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("API Response:", res.data);

      if (res.data.files) {
        res.data.files.forEach((f, i) => {
          console.log(`File ${i + 1} URL:`, f.url);
        });
      }

      alert("อัปโหลดสำเร็จ ✅");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      alert("เกิดข้อผิดพลาดขณะอัปโหลด ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
          อัปโหลดหลายไฟล์
        </h2>

        {/* File Input */}
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 mb-4"
        />

        {/* Preview Images */}
        {preview.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {preview.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`preview-${idx}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "กำลังอัปโหลด..." : "อัปโหลด"}
        </button>
      </div>
    </div>
  );
};

export default MultiUpload;
