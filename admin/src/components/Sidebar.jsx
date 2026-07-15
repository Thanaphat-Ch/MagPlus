import React, { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { FaTachometerAlt, FaCar, FaClipboardList, FaUserShield, FaUsers, FaFileInvoiceDollar, FaCog, FaTruck, FaChevronDown, FaChevronUp, FaCalendarAlt, FaComments} from "react-icons/fa"
import { FaArrowRightToBracket, FaAnglesLeft, FaAnglesRight } from "react-icons/fa6"
import { FiChevronsLeft, FiChevronsRight , FiTruck, FiTool } from "react-icons/fi"
import { GoSidebarExpand, GoSidebarCollapse  } from "react-icons/go"
import { MdManageAccounts   } from "react-icons/md"
import { FaRegUser    } from "react-icons/fa"
import { BiSidebar} from "react-icons/bi"
import { IoIosNotifications } from "react-icons/io";

const Sidebar = () => {
  const location = useLocation()
  const [openManagementMenu, setOpenManagementMenu] = useState(false)
  const [openSubMenu, setOpenSubMenu] = useState(false)
  const [openHR, setOpenHR] = useState(false)
  const [openServiceMenu, setOpenServiceMenu] = useState(false)

  // ✅ อ่านค่าจาก localStorage ตั้งแต่เริ่มต้นเลย
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true"
    }
    return false
  })

  // ✅ บันทึกค่าทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString())
  }, [collapsed])

useEffect(() => {
  const handleResize = () => {
    const saved = localStorage.getItem("sidebarCollapsed") === "true"
    if (window.innerWidth < 768) {
      // ถ้าเป็นจอมือถือ ให้เปิดเต็มเสมอ
      setCollapsed(false)
    } else {
      setCollapsed(saved)
    }
  }
  window.addEventListener("resize", handleResize)
  handleResize()
  return () => window.removeEventListener("resize", handleResize)
}, [])



  const menuDashboard = [{ to: "/admin", label: "หน้าหลัก", icon: <FaTachometerAlt /> },]
  const menuItems = [
    { to: "/adminChatDashboard", label: "แชท", icon: <FaComments /> },
    // { to: "/service", label: "แจ้งซ่อม", icon: <FaFileInvoiceDollar /> },
    // { to: "/notification", label: "แจ้งเตือน", icon: <IoIosNotifications /> },
  ]
  
  const ServiceMenu = [
    { to: "/service", label: "ใบแจ้งซ่อม", icon: <FaFileInvoiceDollar /> },
    { to: "/addAsset", label: "เพิ่มทรัพย์สิน", icon: <FaFileInvoiceDollar /> },
    { to: "/service", label: "ใบเบิก", icon: <FaFileInvoiceDollar /> },
    { to: "/tranferAsset", label: "โอนย้าย", icon: <FaFileInvoiceDollar /> },

  ]
  const SubMenu = [
    { to: "/booking", label: "การจองรถ", icon: <FaCar /> },
    { to: "/shipment", label: "การสั่งงาน", icon: <FaClipboardList /> },
  ]
  const HRSubMenu = [
    { to: "/attendance/leave-request", label: "อนุมัติการลางาน", icon: <FaCalendarAlt /> },
    { to: "/attendance/time-record", label: "เวลาเข้า / ออก", icon: <FaArrowRightToBracket /> },
  ]
  const managementSubMenu = [
    { to: "/drivers", label: "ข้อมูลคนขับ", icon: <FaUsers /> },
    { to: "/trucks", label: "ข้อมูลรถบรรทุก", icon: <FaTruck /> },
  ]
  

  return (
    <div
      className={`h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-2xl transition-all duration-300
      ${collapsed ? "w-20 p-4" : "w-64 p-4 "}`}
    >
      <div className="flex items-center justify-center mb-5">
        {!collapsed && <h2 className="w-40 text-xl font-bold tracking-wide my-2 mr-4">🗂️ Admin Panel</h2>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-50 text-2xl hidden md:block rounded-lg p-1 hover:text-gray-400">
          {/* {collapsed ? <FiChevronsRight size={24} /> : <FiChevronsLeft size={24} />} */}
          {collapsed ? <GoSidebarCollapse  size={24} /> : <GoSidebarExpand size={24} />}
          {/* <BiSidebar size={24} /> */}
        </button>
      </div>
      <div className={`w-44 m-3 border-b border-2 rounded-2xl border-white ${collapsed ? "hidden" : ""}`}></div>

      <ul className="space-y-2">
        {menuDashboard.map((item, index) => {
          const isActive = location.pathname === item.to
          return (
            <li key={index}>
              <Link to={item.to} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            </li>
          )
        })}
        {collapsed ? (
          SubMenu.map((item, index) => {
            const isActive = location.pathname === item.to
            return (
              <li key={index}>
                <Link to={item.to} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          })
        ) : (
          <li>
            <button onClick={() => setOpenSubMenu(!openSubMenu)} className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  <FiTruck  />
                </span>
                {!collapsed && <span className="text-sm">การสั่งงาน</span>}
              </div>
              {!collapsed && (openSubMenu ? <FaChevronUp /> : <FaChevronDown />)}
            </button>

            {openSubMenu && !collapsed && (
              <ul className="ml-8 mt-1 space-y-1">
                {SubMenu.map((sub, subIndex) => {
                  const isSubActive = location.pathname === sub.to
                  return (
                    <li key={subIndex}>
                      <Link to={sub.to} className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isSubActive ? "bg-blue-700 font-bold" : "hover:bg-blue-500"}`}>
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        )}
        {collapsed ? (
          ServiceMenu.map((item, index) => {
            const isActive = location.pathname === item.to
            return (
              <li key={index}>
                <Link to={item.to} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          })
        ) : (
          <li>
            <button onClick={() => setOpenServiceMenu(!openServiceMenu)} className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  <FiTool  />
                </span>
                {!collapsed && <span className="text-sm">Fleet management</span>}
              </div>
              {!collapsed && (openServiceMenu ? <FaChevronUp /> : <FaChevronDown />)}
            </button>

            {openServiceMenu && !collapsed && (
              <ul className="ml-8 mt-1 space-y-1">
                {ServiceMenu.map((sub, subIndex) => {
                  const isSubActive = location.pathname === sub.to
                  return (
                    <li key={subIndex}>
                      <Link to={sub.to} className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isSubActive ? "bg-blue-700 font-bold" : "hover:bg-blue-500"}`}>
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        )}
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.to
          return (
            <li key={index}>
              <Link to={item.to} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            </li>
          )
        })}
        {collapsed ? (
          HRSubMenu.map((item, index) => {
            const isActive = location.pathname === item.to
            return (
              <li key={index}>
                <Link to={item.to} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          })
        ) : (
          <li>
            <button onClick={() => setOpenHR(!openHR)} className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  <FaRegUser  />
                </span>
                {!collapsed && <span className="text-sm">ฝ่ายบุคคล</span>}
              </div>
              {!collapsed && (openHR ? <FaChevronUp /> : <FaChevronDown />)}
            </button>

            {openHR && !collapsed && (
              <ul className="ml-8 mt-1 space-y-1">
                {HRSubMenu.map((sub, subIndex) => {
                  const isSubActive = location.pathname === sub.to
                  return (
                    <li key={subIndex}>
                      <Link to={sub.to} className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isSubActive ? "bg-blue-700 font-bold" : "hover:bg-blue-500"}`}>
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        )}
        {collapsed ? (
          managementSubMenu.map((item, index) => {
            const isActive = location.pathname === item.to
            return (
              <li key={index}>
                <Link to={item.to} className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          })
        ) : (
          <li>
            <button onClick={() => setOpenManagementMenu(!openManagementMenu)} className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  <MdManageAccounts  />
                </span>
                {!collapsed && <span className="text-sm">จัดการข้อมูล</span>}
              </div>
              {!collapsed && (openManagementMenu ? <FaChevronUp /> : <FaChevronDown />)}
            </button>

            {openManagementMenu && !collapsed && (
              <ul className="ml-8 mt-1 space-y-1">
                {managementSubMenu.map((sub, subIndex) => {
                  const isSubActive = location.pathname === sub.to
                  return (
                    <li key={subIndex}>
                      <Link to={sub.to} className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isSubActive ? "bg-blue-700 font-bold" : "hover:bg-blue-500"}`}>
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        )}

        {/* Settings */}
        <li>
          <Link to="/settings" className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${location.pathname === "/settings" ? "bg-blue-700 font-bold shadow-md" : "hover:bg-blue-600 hover:shadow-sm"}`}>
            <span className="text-lg">
              <FaCog />
            </span>
            {!collapsed && <span className="text-sm">ตั้งค่า</span>}
          </Link>
        </li>
      </ul>
    </div>
  )
}

export default Sidebar
