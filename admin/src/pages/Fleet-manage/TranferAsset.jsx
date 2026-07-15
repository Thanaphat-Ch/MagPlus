import React, { useEffect, useState } from "react"
import ImageUploadPreview from "../../components/ImageUploadPreview"
import { FiEdit, FiSearch } from "react-icons/fi"
import FilterDropdown from "../../components/FilterDropdown"
import { InputField } from "../../components/InputField"

import { FiAlertCircle, FiTrash2 } from "react-icons/fi"

export default function TranferAsset() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState("")
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [assets, setAssets] = useState([])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentAssets = assets.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(assets.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const [filter, setFilter] = useState("")
  const [filter2, setFilter2] = useState("")
  const [filter3, setFilter3] = useState("")

  const userTypeOptions = [
    { label: "ทั้งหมด", value: "" },
    { label: "คนขับ", value: "driver" },
    { label: "ลูกค้า", value: "customer" },
    { label: "ผู้ดูแลระบบ", value: "admin" },
  ]
  const userType2Options = [
    { label: "ทั้งหมด", value: "" },
    { label: "คนขับ", value: "driver" },
    { label: "ลูกค้า", value: "customer" },
    { label: "ผู้ดูแลระบบ", value: "admin" },
  ]
  const userType3Options = [
    { label: "รออนุมัติ", value: "" },
    { label: "อนุมัติแล้ว", value: "driver" },
    { label: "ไม่อนุมัติ", value: "customer" },
  ]

  const ErrorState = ({ error }) => (
    <div className="text-center m-auto text-red-500">
      <FiAlertCircle className="w-16 h-16 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h3>
      <p className="text-gray-600 mt-2">{error}</p>
    </div>
  )

  useEffect(() => {
    const mockAssets = [
      { id: 1, name: "รถบรรทุก 6 ล้อ", plate: "1กข 1234", qty: 2, lot: "LOT-2025A", date: "12/5/68", status: "อนุมัติ" },
      { id: 2, name: "รถกระบะ", plate: "2ขค 5678", qty: 1, lot: "LOT-2025A", date: "12/5/68", status: "รออนุมัติ" },
      { id: 3, name: "รถตู้ VIP", plate: "3งจ 9988", qty: 3, lot: "LOT-2025B", date: "12/5/68", status: "ไม่อนุมัติ" },
      { id: 4, name: "เครื่องจักรขุดดิน", plate: "N/A", qty: 1, lot: "LOT-2025B", date: "12/5/68", status: "อนุมัติ" },
      { id: 5, name: "โฟล์คลิฟท์", plate: "N/A", qty: 4, lot: "LOT-2025C", date: "12/5/68", status: "รออนุมัติ" },
    ]
    setAssets(mockAssets)
  }, [])

  return (
    <main className="flex-1 m-4 md:m-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold hidden md:block">ทรัพย์สินทั้งหมด</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2">
            <div className="relative flex-1 w-1/2">
              <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือเบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <FilterDropdown label="หมวด" options={userTypeOptions} value={filter} onChange={setFilter} />
            <FilterDropdown label="ประเภท" options={userType2Options} value={filter2} onChange={setFilter2} />
            
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex bg-white p-4 h-[80vh] md:h-[85vh] text-center rounded-lg shadow-md">
          <p className="text-center py-6 justify-center">กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="flex bg-white p-4 h-[80vh] md:h-[85vh] text-center rounded-lg shadow-md text-red-600">
          <ErrorState error={error} />
        </div>
      ) : (
        <div className="bg-white flex flex-col h-[80vh] md:h-[85vh] p-1 shadow-md rounded-lg ">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider"> ID </th>
                  <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider"> ชื่อสินทรัพย์ </th>
                  <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider"> ทะเบียนรถ </th>
                  <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> จำนวน </th>
                  <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> ล็อต </th>
                  <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> วันที่ </th>
                  <th className="pl-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider"> อนุมัติ </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAssets.map((a, index) => (
                  <tr
                    key={a.id || index}
                    className="hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setFormData(a), setSelectedUser(a), setIsAddModalOpen(true), setIsViewOnly(true)
                    }}
                  >
                    {/* <td className="py-2 w-24 text-sm text-center text-gray-500">{indexOfFirstItem + index + 1}</td> */}
                    <td className="py-2 w-24 text-sm text-center text-gray-500">{a.id}</td>
                    <td className="pl-4 py-2 w-48 text-sm font-semibold text-gray-800">{a.name}</td>
                    <td className="pl-4 py-2 w-48 text-sm font-semibold text-gray-800">{a.plate}</td>
                    <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">{a.qty}</td>
                    <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">{a.lot}</td>
                    <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">{a.date}</td>
                    <td className="pl-4 py-2 text-center">
                      <button className="p-1 bg-blue-500 text-white rounded-lg hover:bg-blue-300">โอนย้าย</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex justify-center items-center gap-2 p-3">
            <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="w-22 px-3 py-1 rounded bg-white hover:bg-blue-300 disabled:opacity-50">
              ก่อนหน้า
            </button>
            <span className="px-4">
              {" "}
              หน้า {currentPage} / {totalPages}
            </span>
            <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="w-22 px-3 py-1 rounded bg-white hover:bg-blue-300 disabled:opacity-50">
              ถัดไป
            </button>
          </footer>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="flex flex-col bg-gray-100 p-4 md:p-6 rounded-lg shadow-lg w-[90%] h-[70vh] max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{isViewOnly ? "ข้อมูลสินทรัพย์" : selectedUser ? "แก้ไขข้อมูลสินทรัพย์" : "เพิ่มสินทรัพย์"}</h2>
            {/* <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hidden"> */}
            <form className="flex-1 overflow-y-auto scrollbar-hidden">
              <div className="bg-white p-1 flex flex-col gap-y-4 rounded shadow-md">
                <div className="w-[100%] grid grid-cols-1">
                  <InputField label="ID" type="text" name="D_ID" maxLength={3} readOnly={true} className="max-w-24 text-center" />
                </div>
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FilterDropdown label="หมวด" options={userTypeOptions} value={filter} onChange={setFilter} />
                  <FilterDropdown label="ประเภท" options={userType2Options} value={filter2} onChange={setFilter2} />
                </div> */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="ชื่อ" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  {/* <InputField label="ต้นทุน" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} /> */}
                  <InputField label="ล็อต" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  <InputField label="จำนวน" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="วันที่" type="date" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  <InputField label="ทะเบียนรถ" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  <ImageUploadPreview label="รูป" name="img_id" />
                </div>
                  <InputField label="สาเหตุการโอน" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                <div>
                  <text>ย้ายไป</text>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="ทะเบียนรถใหม่" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  <InputField label="ชื่อ" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  <InputField label="วันที่โอนย้าย" type="date" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                  <InputField label="จำนวน" type="text" name="D_Name" maxLength={80} readOnly={isViewOnly} />
                </div>
                {isViewOnly ? (
                  <></>
                ) : (
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false), setSelectedUser(null), setFormData({})
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                    >
                      ยกเลิก
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded" disabled={loadingSubmit}>
                      {loadingSubmit ? "กำลังบันทึก..." : selectedUser ? "บันทึกการแก้ไข" : "เพิ่ม"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
