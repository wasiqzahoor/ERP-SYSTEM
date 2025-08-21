import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiLogOut, FiMenu, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Notifications from "./Notifications";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isHrmDropdownOpen, setHrmDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileHrmOpen, setMobileHrmOpen] = useState(false);

  const dropdownRef = useRef(null);
  const hrmDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const userHasRole = (allowedRoles) => {
    if (!user || !user.roles) {
      return false;
    }
    return user.roles.some((role) =>
      role.name.toLowerCase().includes(allowedRoles)
    );
  };

  // Click outside dropdowns ko close karne ke liye useEffect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        hrmDropdownRef.current &&
        !hrmDropdownRef.current.contains(event.target)
      ) {
        setHrmDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-button')
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const navLinkStyles = ({ isActive }) => ({
    background: isActive
      ? user?.isSuperAdmin
        ? "rgba(0, 0, 0, 0.3)"
        : "rgba(255, 255, 255, 0.1)"
      : "transparent",
  });

  return (
    <nav
      className={`fixed top-0 left-0 right-0 text-white shadow-lg z-50 transition-colors duration-300 ${
        user?.isSuperAdmin ? "bg-gray-800" : "bg-indigo-700"
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center relative z-10">
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button md:hidden mr-3 text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          
          <Link
            to={user?.isSuperAdmin ? "/superadmin/dashboard" : "/dashboard"}
            className="flex items-center space-x-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/046/593/914/small/creative-logo-design-for-real-estate-company-vector.jpg"
              alt="Logo"
              className="h-8 w-8 rounded-full"
            />
            <span className="text-xl font-bold tracking-wider">
              ERP System
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
          {user?.isSuperAdmin ? (
            <>
              <NavLink
                to="/superadmin/dashboard"
                style={navLinkStyles}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/superadmin/add-company"
                style={navLinkStyles}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Add Company
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                style={navLinkStyles}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/inventory"
                style={navLinkStyles}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Inventory
              </NavLink>
              <NavLink
                to="/customers"
                style={navLinkStyles}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Customers
              </NavLink>

              {/* HRM Dropdown Menu */}
              <div
                className="relative"
                onMouseEnter={() => setHrmDropdownOpen(true)}
                onMouseLeave={() => setHrmDropdownOpen(false)}
                ref={hrmDropdownRef}
              >
                <div className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 cursor-pointer">
                  HRM
                </div>
                <AnimatePresence>
                  {isHrmDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 text-gray-800"
                    >
                      {userHasRole('admin') && (
                        <NavLink
                          to="/hrm/employees"
                          className="block px-4 py-2 text-sm hover:bg-indigo-50"
                          onClick={() => setHrmDropdownOpen(false)}
                        >
                          Employee Management
                        </NavLink>
                      )}
                      
                      <NavLink
                        to="/hrm/attendance"
                        className="block px-4 py-2 text-sm hover:bg-indigo-50"
                        onClick={() => setHrmDropdownOpen(false)}
                      >
                        Attendance Tracking
                      </NavLink>
                      
                      {userHasRole('admin') && (
                        <NavLink 
                          to="/settings/roles" 
                          className="block px-4 py-2 text-sm hover:bg-indigo-50" 
                          onClick={() => setHrmDropdownOpen(false)}
                        >
                          Role Management
                        </NavLink>
                      )}
                      
                      {userHasRole('admin') && (
                        <NavLink
                          to="/hrm/payroll"
                          className="block px-4 py-2 text-sm hover:bg-indigo-50"
                          onClick={() => setHrmDropdownOpen(false)}
                        >
                          Payroll Management
                        </NavLink>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink
                to="/sales"
                style={navLinkStyles}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Sales
              </NavLink>
              
              {userHasRole('admin') && (
                <NavLink
                  to="/auditlog"
                  style={navLinkStyles}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                >
                  AuditLog
                </NavLink>
              )}
              
              {userHasRole('admin') && (
                <NavLink
                  to="/reports"
                  style={navLinkStyles}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                >
                  Reports
                </NavLink>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Notifications />

          {/* Desktop Profile Dropdown */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-gray-700"
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                }
                alt="avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="hidden sm:block font-medium">
                {user?.username}
              </span>
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl py-1 z-50 text-gray-800"
                >
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="font-bold text-sm">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiUser className="mr-3 text-gray-500" /> My Profile
                    </Link>
                  </div>

                  <div className="border-t border-gray-200"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                  >
                    <FiLogOut className="mr-3" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu - Right Side */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="fixed top-0 left-0 h-full w-80 bg-indigo-800 shadow-lg z-50 md:hidden overflow-y-auto"
                ref={mobileMenuRef}
              >
                <div className="p-4 h-full flex flex-col">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Menu</h2>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-full hover:bg-indigo-700"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3 p-4 mb-6 bg-indigo-900 rounded-lg">
                    <img
                      src={
                        user?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                      }
                      alt="avatar"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold">{user.username}</p>
                      <p className="text-sm text-indigo-200">{user.email}</p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex-grow space-y-2 overflow-y-auto">
                    {user?.isSuperAdmin ? (
                      <>
                        <NavLink
                          to="/superadmin/dashboard"
                          style={navLinkStyles}
                          className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </NavLink>
                        <NavLink
                          to="/superadmin/add-company"
                          style={navLinkStyles}
                          className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Add Company
                        </NavLink>
                      </>
                    ) : (
                      <>
                        <NavLink
                          to="/dashboard"
                          style={navLinkStyles}
                          className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </NavLink>
                        <NavLink
                          to="/inventory"
                          style={navLinkStyles}
                          className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Inventory
                        </NavLink>
                        <NavLink
                          to="/customers"
                          style={navLinkStyles}
                          className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Customers
                        </NavLink>

                        {/* Mobile HRM Dropdown */}
                        <div className="rounded-md text-base font-medium transition-colors duration-300">
                          <button
                            onClick={() => setMobileHrmOpen(!isMobileHrmOpen)}
                            className="flex justify-between items-center w-full px-4 py-3 rounded-md bg-indigo-700 hover:bg-indigo-600"
                          >
                            <span>HRM</span>
                            {isMobileHrmOpen ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                          
                          <AnimatePresence>
                            {isMobileHrmOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="pl-6 mt-1 space-y-1 overflow-hidden"
                              >
                                {userHasRole('admin') && (
                                  <NavLink
                                    to="/hrm/employees"
                                    style={navLinkStyles}
                                    className="block px-4 py-2 rounded-md text-base font-medium transition-colors duration-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    Employee Management
                                  </NavLink>
                                )}
                                
                                <NavLink
                                  to="/hrm/attendance"
                                  style={navLinkStyles}
                                  className="block px-4 py-2 rounded-md text-base font-medium transition-colors duration-300"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  Attendance Tracking
                                </NavLink>
                                
                                {userHasRole('admin') && (
                                  <NavLink 
                                    to="/settings/roles" 
                                    style={navLinkStyles}
                                    className="block px-4 py-2 rounded-md text-base font-medium transition-colors duration-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    Role Management
                                  </NavLink>
                                )}
                                
                                {userHasRole('admin') && (
                                  <NavLink
                                    to="/hrm/payroll"
                                    style={navLinkStyles}
                                    className="block px-4 py-2 rounded-md text-base font-medium transition-colors duration-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    Payroll Management
                                  </NavLink>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <NavLink
                          to="/sales"
                          style={navLinkStyles}
                          className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sales
                        </NavLink>
                        
                        {userHasRole('admin') && (
                          <NavLink
                            to="/auditlog"
                            style={navLinkStyles}
                            className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            AuditLog
                          </NavLink>
                        )}
                        
                        {userHasRole('admin') && (
                          <NavLink
                            to="/reports"
                            style={navLinkStyles}
                            className="flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Reports
                          </NavLink>
                        )}
                      </>
                    )}
                  </div>

                  {/* Profile and Logout in Mobile Menu */}
                  <div className="mt-auto pt-4 border-t border-indigo-700 space-y-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 rounded-md text-base font-medium hover:bg-indigo-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiUser className="mr-3" /> My Profile
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-3 rounded-md text-base font-medium hover:bg-indigo-700 text-red-300"
                    >
                      <FiLogOut className="mr-3" /> Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;