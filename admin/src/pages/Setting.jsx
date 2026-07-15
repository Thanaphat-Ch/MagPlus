import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const API_URL = import.meta.env.API_URL;

const Setting = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // --- State สำหรับ Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState('');

  // --- State สำหรับฟอร์มเพิ่มผู้ใช้ (กำหนด role เป็น admin ตายตัว) ---
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    lastName: '',
    role: 'admin' // กำหนดค่าตายตัวเป็น admin
  });
  // ------------------------------------

  useEffect(() => {
    document.title = "Settings";
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        Swal.fire({ icon: "error", title: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้" });
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    Swal.fire({
      icon: "success",
      title: "ออกจากระบบเรียบร้อยแล้ว",
      showConfirmButton: false,
      timer: 1500,
    }).then(() => navigate("/"));
  };

  const openManageUsersModal = async () => {
    setIsModalOpen(true);
    setIsAddingUser(false); 
    if (userList.length === 0) {
      setLoadingUsers(true);
      setErrorUsers('');
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${API_URL}/api/readall`, { headers: { Authorization: `Bearer ${token}` } });
        setUserList(res.data);
      } catch (err) {
        setErrorUsers('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const closeManageUsersModal = () => setIsModalOpen(false);

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_URL}/api/users/${userId}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      setUserList(userList.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      Swal.fire('สำเร็จ!', 'เปลี่ยนสิทธิ์ผู้ใช้เรียบร้อยแล้ว', 'success');
    } catch (err) {
      Swal.fire('ผิดพลาด!', 'ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้', 'error');
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) {
      Swal.fire('ผิดพลาด', 'กรุณากรอก Username, Password และชื่อ', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/api/users/create`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserList([...userList, res.data.newUser]); 
      Swal.fire('สำเร็จ!', 'เพิ่ม Admin ใหม่เรียบร้อยแล้ว', 'success');
      setIsAddingUser(false);
      // Reset form กลับไปเป็นค่าเริ่มต้น (role: 'admin')
      setNewUser({ username: '', password: '', name: '', lastName: '', role: 'admin' });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'ไม่สามารถเพิ่มผู้ใช้ได้';
      Swal.fire('ผิดพลาด!', errorMessage, 'error');
    }
  };

  return (
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen p-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">การตั้งค่าบัญชี</h1>
        {user ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">ข้อมูลผู้ใช้</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">ชื่อผู้ใช้</p>
                <p className="text-lg font-medium text-gray-800">{user.name}</p>
              </div>
              <div>
                <p className="text-gray-500">ชื่อจริง</p>
                <p className="text-lg font-medium text-gray-800">{user.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">สถานะ</p>
                <p className="text-lg font-medium text-gray-800">{user.role}</p>
              </div>
            </div>

            {user && user.role === 'supervisor' && (
              <div className="pt-6 border-t mt-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">ส่วนของผู้ดูแล</h3>
                <button
                  onClick={openManageUsersModal}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition duration-200"
                >
                  จัดการสิทธิ์ผู้ใช้
                </button>
              </div>
            )}
            
            <div className="pt-6 text-right">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition duration-200"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-60">
            <div className="text-gray-500 animate-pulse">กำลังโหลด...</div>
          </div>
        )}
        {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isAddingUser ? 'เพิ่ม Admin ใหม่' : 'จัดการสิทธิ์ผู้ใช้'}
              </h2>
              <button onClick={closeManageUsersModal} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            
            {isAddingUser ? (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" name="username" value={newUser.username} onChange={handleNewUserChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" name="password" value={newUser.password} onChange={handleNewUserChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                  <input type="text" name="name" value={newUser.name} onChange={handleNewUserChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                  <input type="text" name="lastName" value={newUser.lastName} onChange={handleNewUserChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                {/* Dropdown for role is removed */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">บันทึก</button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-4 text-right">
                  <button onClick={() => setIsAddingUser(true)} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                    + เพิ่ม Admin ใหม่
                  </button>
                </div>
                {loadingUsers && <p>กำลังโหลด...</p>}
                {errorUsers && <p className="text-red-500">{errorUsers}</p>}
                {!loadingUsers && !errorUsers && (
                  <div className="overflow-y-auto max-h-96">
                    <table className="min-w-full text-left">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600">ชื่อ</th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600">Username</th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600">Role</th>
                          <th className="px-4 py-2 text-sm font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">{u.name}</td>
                            <td className="px-4 py-3">{u.username}</td>
                            <td className="px-4 py-3">{u.role}</td>
                            <td className="px-4 py-3">
                              {user.id === u.id ? (
                                <span className="text-gray-400">N/A</span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="p-1 border rounded-md text-sm"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        ))}
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

  );
};

export default Setting;