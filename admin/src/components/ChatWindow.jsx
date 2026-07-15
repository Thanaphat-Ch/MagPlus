import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = "https://app.magnitudetms.com";

export default function ChatWindow({ adminId, socket }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/messages/group/general_2`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Failed to fetch messages:", err));

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("newMessage", handleMessage);

    return () => {
      socket.off("newMessage", handleMessage);
    };
  }, [socket]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const messageData = {
      from_user: adminId,
      message: input,
    };
    socket.emit("sendMessage", messageData);
    setInput("");
  };

  

  return (
    <div className="flex flex-col h-full bg-white">
      {/* [แก้ไข] Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-bold">แชท</h1>
            <p className="text-sm text-gray-600">
              Admin, Supervisor และ Driver ทั้งหมด
            </p>
          </div>
        </div>
      </div>
      {/* Chat Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
        {messages.map((msg, index) => {
          const isMe = msg.from_user === adminId;

          return (
            <div
              key={index}
              className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col max-w-[80%] relative">
                {/* [สำคัญ] แสดงชื่อผู้ส่ง */}
                {!isMe && (
                  <span className="text-xs text-gray-500 mb-1 ml-2">
                    {/* ใช้ senderName ที่มาจาก Backend */}
                    {msg.senderName || "Unknown User"}
                  </span>
                )}
                {/* กล่องข้อความ */}
                <div
                  className={`relative p-3 rounded-2xl shadow-sm ${
                    isMe ? "bg-blue-100 text-black" : "bg-white text-black"
                  }`}
                >
                 
                  <p className="whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Chat Input (เหมือนเดิม) */}
      <div className="p-2 bg-white border-t border-gray-200">
        
        <form
          onSubmit={handleSend}
          className="flex items-center p-2 rounded-full border border-gray-300 bg-gray-50"
        >
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 h-10 px-4 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            className="ml-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full"
          >
            ส่ง
          </button>
        </form>
      </div>
    </div>
  );
}