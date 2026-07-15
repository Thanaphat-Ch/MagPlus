import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import SettingsPage from "./pages/Setting";
import Driver from "./pages/Driver";
import Booking from "./pages/Shipment/Booking";
import Shipment from "./pages/Shipment/Shipment";
import Truck from "./pages/Truck";
import TimeRecord from "./pages/TimeRecord";
import LeaveRequest from "./pages/LeaveRequest";
import Service from "./pages/Service";
import MultiUpload from "./pages/Multiupload";
import AdminChatDashboard from "./pages/AdminChatDashboard"
import Notification from "./pages/Notification"
import AddAsset from "./pages/Fleet-manage/AddAsset"
import TranferAsset from "./pages/Fleet-manage/TranferAsset"


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard/>} />
          <Route path="/drivers" element={<Driver/>} />
          <Route path="/settings" element={<SettingsPage/>} />
          <Route path="/booking" element={<Booking/>} />
          <Route path="/shipment" element={<Shipment/>} />
          <Route path="/trucks" element={<Truck/>} />
          <Route path="/attendance/time-record" element={<TimeRecord/>} />
          <Route path="/attendance/leave-request" element={<LeaveRequest/>} />
          <Route path="/service" element={<Service/>} />
          <Route path="/multiUpload" element={<MultiUpload/>} />
          <Route path="/adminChatDashboard" element={<AdminChatDashboard/>} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/addAsset" element={<AddAsset />} />
          <Route path="/tranferAsset" element={<TranferAsset />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;