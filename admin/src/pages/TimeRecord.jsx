import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiClock, FiMenu } from "react-icons/fi";

const API_URL = import.meta.env.API_URL;

const InitialsCircle = ({ name, surname }) => {
    const initials = `${name?.charAt(0) || ''}${surname?.charAt(0) || ''}`.toUpperCase();
    
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };

    const colors = [
        'bg-blue-200 text-blue-800', 'bg-emerald-200 text-emerald-800',
        'bg-amber-200 text-amber-800', 'bg-rose-200 text-rose-800',
        'bg-violet-200 text-violet-800', 'bg-cyan-200 text-cyan-800'
    ];
    const colorClass = colors[Math.abs(hashCode(name || '')) % colors.length];

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
            {initials}
        </div>
    );
};


function TimeRecord() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/attendance`);
        setRecords(res.data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return null; 
    return new Date(dateTimeString).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
  };

  return (
    
        <main className="flex-1 p-4 md:p-8 mb-5">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 border-b-2 border-gray-200 pb-3 flex items-center">
            <FiClock className="mr-3 text-indigo-500" />
            ประวัติการลงเวลา
          </h1>

          {loading ? (
            <p className="text-center text-gray-500 animate-pulse mt-10">กำลังโหลดข้อมูล...</p>
          ) : (
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200/60">
              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full">
                  <thead className="border-b-2 border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">พนักงาน</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วันที่</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">เวลาเข้างาน</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">เวลาออกงาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.length > 0 ? (
                      records.map((record) => (
                        <tr key={record.id} className="hover:bg-indigo-50/40 transition-colors duration-150">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <InitialsCircle name={record.name} surname={record.surname} />
                              <div className="ml-4">
                                <div className="text-md font-bold text-gray-900">{record.name} {record.surname}</div>
                                <div className="text-xs text-gray-500">User ID: {record.user_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            {formatTime(record.check_in_time) ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                {formatTime(record.check_in_time)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            {formatTime(record.check_out_time) ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                {formatTime(record.check_out_time)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">ไม่มีข้อมูลการเข้างาน</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-gray-200">
                {records.length > 0 ? (
                  records.map((record) => (
                    <div key={record.id} className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-base font-bold text-indigo-700">{record.name} {record.surname}</p>
                        <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                      </div>
                      <div className="flex justify-around bg-gray-50 p-3 rounded-lg border">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">เข้างาน</p>
                          <p className="font-semibold text-green-600">{formatTime(record.check_in_time) || '-'}</p>
                        </div>
                        <div className="border-l border-gray-200"></div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">ออกงาน</p>
                          <p className="font-semibold text-red-600">{formatTime(record.check_out_time) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-10 text-center text-gray-500">ไม่มีข้อมูลการเข้างาน</p>
                )}
              </div>
            </div>
          )}
        </main>

)}

export default TimeRecord;