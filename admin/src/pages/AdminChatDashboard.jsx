import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import { requestForToken } from '../firebase';

import ChatWindow from "../components/ChatWindow";

const API_URL = "http://localhost:5000";

export default function AdminChatDashboard() {
  const [adminId, setAdminId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  
  // โหลด token และข้อมูล admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentAdminId = decoded.id;
        setAdminId(currentAdminId);
        requestForToken(currentAdminId);
      } catch (e) {
        console.error("Invalid token:", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // สร้าง socket เมื่อ component mount
  useEffect(() => {
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ['websocket'],
    });
    setSocket(newSocket);
    setIsLoading(false);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // เชื่อม socket และฟัง event updateConversationList
  useEffect(() => {
    if (!adminId || !socket) return;

    const handleConnect = () => {
      console.log(`✅ Socket connected for admin ${adminId}`);
      socket.emit("join", adminId);
    };

    
    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);
   
    return () => {
      socket.off("connect", handleConnect);
      
    };
  }, [adminId, socket]);

  
  return (
    <div className="flex flex-1 py-1">
        <main className="flex flex-1 overflow-hidden rounded-2xl">
          {isLoading || !socket || !adminId ?(
            <div className="flex w-full items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* Chat Window */}
                <div className="flex-1">
                  <ChatWindow
                    adminId={adminId}
                    socket={socket}
                  />
                </div>

            </>
          )}
        </main>
    </div>
  );
}