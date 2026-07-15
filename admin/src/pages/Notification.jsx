import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import io from "socket.io-client";
import axios from "axios";

const SOCKET_URL = "http://localhost:5000";

const Notification = () => {
  const [socket, setSocket] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    // ฟัง event forgot_user
    s.on("forgot_user", (data) => {
      setRequests((prev) => [
        ...prev,
        { id: Date.now(), username: data.username, confirmed: false },
      ]);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleConfirm = (req) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  if (socket) {
    // socket.emit("sendMessage_admin", {
    //   message: `รหัสรีเซ็ตของผู้ใช้ ${req.username} คือ ${code}`,
    //   username: req.username
    // });
    axios.post("http://localhost:5000/api/sendMessage", {
      message: `${code}`
    });
  }
  
  setRequests((prev) =>
    prev.map((r) =>
      r.id === req.id ? { ...r, confirmed: true, code } : r
    )
  );
};



  const handleDelete = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-3xl font-bold mb-6">คำขอเปลี่ยนรหัสผ่าน</h1>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {requests.length === 0 ? (
            <p className="text-gray-500">ยังไม่มีคำขอเข้ามา</p>
          ) : (
            <ul className="space-y-4">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      ผู้ใช้: {req.username}
                    </p>
                    {req.confirmed ? (
                      <p className="text-green-600 text-sm">
                        ✅ ส่งรหัสชั่วคราวแล้ว: <b>{req.code}</b>
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        รอการยืนยันจากแอดมิน
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!req.confirmed && (
                      <button
                        onClick={() => handleConfirm(req)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                      >
                        ยืนยัน
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notification;
