import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import api from "../api" 

const Setting = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userList, setUserList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [errorUsers, setErrorUsers] = useState("")

  const [isAddingUser, setIsAddingUser] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    lastName: "",
    role: "admin",
  })

  useEffect(() => {
    document.title = "Account Settings"

    const fetchProfile = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/")
        return
      }

      try {
        const res = await api.get("/user/profile", { silent: true })
        setUser(res.data)
      } catch (err) {
        console.error("Error fetching profile:", err)
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
          confirmButtonColor: "#2563EB",
        })
      }
    }

    fetchProfile()
  }, [navigate])

  const handleLogout = () => {
    Swal.fire({
      title: "ออกจากระบบหรือไม่?",
      text: "คุณต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อเข้าถึงข้อมูล",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token")
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบเรียบร้อยแล้ว",
          showConfirmButton: false,
          timer: 1200,
        }).then(() => navigate("/"))
      }
    })
  }

  const openManageUsersModal = async () => {
    setIsModalOpen(true)
    setIsAddingUser(false)
    if (userList.length === 0) {
      setLoadingUsers(true)
      setErrorUsers("")
      try {
        const res = await api.get("/readall", { silent: true })
        setUserList(res.data || [])
      } catch (err) {
        setErrorUsers("ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้ได้")
      } finally {
        setLoadingUsers(false)
      }
    }
  }

  const closeManageUsersModal = () => {
    setIsModalOpen(false)
    setIsAddingUser(false)
    setNewUser({ username: "", password: "", name: "", lastName: "", role: "admin" })
  }

  const handleRoleChange = async (targetUser, newRole) => {
    const confirm = await Swal.fire({
      title: "ยืนยันการเปลี่ยนสิทธิ์?",
      text: `ต้องการเปลี่ยนสิทธิ์ของ "${targetUser.name}" เป็น "${newRole}" ใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563EB",
    })

    if (!confirm.isConfirmed) return

    try {
      await api.put(`/users/${targetUser.id}/role`, { role: newRole })
      setUserList((prev) => prev.map((u) => (String(u.id) === String(targetUser.id) ? { ...u, role: newRole } : u)))
      Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: "เปลี่ยนสิทธิ์ผู้ใช้เรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด!",
        text: err.response?.data?.message || "ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้",
      })
    }
  }

  const handleNewUserChange = (e) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) {
      Swal.fire("ข้อมูลไม่ครบถ้วน", "กรุณากรอก Username, Password และชื่อ", "warning")
      return
    }

    setLoadingSubmit(true)
    try {
      const res = await api.post("/users/create", newUser)
      const createdUser = res.data?.newUser || res.data

      setUserList((prev) => [...prev, createdUser])
      Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: "เพิ่ม Admin ใหม่เรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      })

      setIsAddingUser(false)
      setNewUser({ username: "", password: "", name: "", lastName: "", role: "admin" })
    } catch (err) {
      const errorMessage = err.response?.data?.message || "ไม่สามารถเพิ่มผู้ใช้ได้"
      Swal.fire("เกิดข้อผิดพลาด", errorMessage, "error")
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div className="flex flex-1 min-h-screen bg-slate-50">
      <main className="flex-1 p-6 md:p-10 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">การตั้งค่าบัญชี</h1>
          <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลส่วนตัวและสิทธิ์การเข้าถึงระบบ</p>
        </div>

        {user ? (
          <div className="bg-white mx-auto rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 max-w-3xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-800">ข้อมูลผู้ใช้งานปัจจุบัน</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">ชื่อจริง</p>
                <p className="text-base font-semibold text-slate-800">{user.name || "-"}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">นามสกุล</p>
                <p className="text-base font-semibold text-slate-800">{user.lastName || "-"}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">ชื่อบัญชีผู้ใช้ (Username)</p>
                <p className="text-base font-semibold text-slate-800 font-mono">{user.username || "-"}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">สิทธิ์การใช้งาน (Role)</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-800">{user.role}</span>
              </div>
            </div>

            {user.role === "supervisor" && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">จัดการสิทธิ์ผู้ดูแลระบบ</h3>
                  <p className="text-xs text-slate-500">ปรับเปลี่ยนสิทธิ์หรือเพิ่ม Admin เข้าระบบ</p>
                </div>
                <button onClick={openManageUsersModal} className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm">
                  จัดการสิทธิ์ผู้ใช้
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-sm font-medium px-5 py-2.5 rounded-xl transition">
                ออกจากระบบ
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 max-w-3xl shadow-sm">
            <div className="text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลโปรไฟล์...</div>
          </div>
        )}


        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={closeManageUsersModal}>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-xl font-bold text-slate-800">{isAddingUser ? "เพิ่ม Admin บัญชีใหม่" : "จัดการสิทธิ์ผู้ใช้งาน"}</h2>
                <button onClick={closeManageUsersModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">
                  ✕
                </button>
              </div>

              {isAddingUser ? (
                <form onSubmit={handleCreateUser} className="space-y-4 overflow-y-auto pr-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input type="text" name="username" value={newUser.username} onChange={handleNewUserChange} className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="password" name="password" value={newUser.password} onChange={handleNewUserChange} className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ</label>
                      <input type="text" name="name" value={newUser.name} onChange={handleNewUserChange} className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">นามสกุล</label>
                      <input type="text" name="lastName" value={newUser.lastName} onChange={handleNewUserChange} className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition">
                      ยกเลิก
                    </button>
                    <button type="submit" disabled={loadingSubmit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {loadingSubmit ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <span className="text-xs text-slate-500">ทั้งหมด {userList.length} บัญชี</span>
                    <button onClick={() => setIsAddingUser(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition shadow-sm">
                      + เพิ่ม Admin ใหม่
                    </button>
                  </div>

                  {loadingUsers && <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลดรายชื่อ...</div>}

                  {errorUsers && <div className="py-8 text-center text-rose-500 text-sm">{errorUsers}</div>}

                  {!loadingUsers && !errorUsers && (
                    <div className="overflow-y-auto max-h-96 border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                          <tr>
                            <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                            <th className="px-4 py-3">Username</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 text-center">สิทธิ์การใช้งาน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userList.map((u) => {
                            const isSelf = String(user?.id) === String(u.id)

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                                <td className="px-4 py-3 font-medium text-slate-800">
                                  {u.name} {u.lastName || ""}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-600 text-xs">{u.username}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${u.role === "supervisor" ? "bg-purple-100 text-purple-700" : u.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{u.role}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isSelf ? (
                                    <span className="text-xs text-slate-400 italic">บัญชีปัจจุบัน</span>
                                  ) : (
                                    <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                      <option value="user">User</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Setting
