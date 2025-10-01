import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./LoginCard"; // adjust path if needed

const base = "hover:text-red-600 transition-colors pb-1 border-b-2";
const navClass = ({ isActive }: { isActive: boolean }) =>
  `${base} ${isActive ? "border-red-600" : "border-transparent"}`;

export default function Header() {
  const { state, logout } = useAuth();

  return (
    <header className="w-full bg-slate-900 text-white shadow-md">
      {/* Top Bar */}
      <div className="px-6 py-3 flex items-center border-b border-slate-700" style={{ minHeight: '4.6875rem' }}>
        {/* Left: Logo */}
        <div className="flex items-center mr-12 ml-16">
          <Link to="/" aria-label="Delta Home" className="flex items-center space-x-3">
            <img src="/images/delta-logo.svg" alt="Delta" className="h-6 w-auto" />
            <img src="/images/logosidebyside.svg" alt="Delta Medallion" className="h-6 w-auto" />
          </Link>
        </div>

        {/* Center: Primary Nav Links */}
        <nav className="hidden md:flex space-x-8 text-sm font-bold flex-1">
          <NavLink to="/" end className={navClass}>
            BOOK
          </NavLink>
          <NavLink to="/member" className={navClass}>
            MY PROFILE
          </NavLink>
          <NavLink to="/member" className={navClass}>
            MY TRIPS
          </NavLink>
          <NavLink to="/promotions" className={navClass}>
            OFFERS
          </NavLink>
          <NavLink to="/info" className={navClass}>
            Travel Info
          </NavLink>
          <NavLink to="/credit-cards" className={navClass}>
            SkyMiles
          </NavLink>
          <NavLink to="/agent" className={navClass}>
            DIGITAL AGENT
          </NavLink>
          <NavLink to="/help" className={navClass}>
            Need Help?
          </NavLink>
        </nav>

        {/* Right: Auth */}
        <div className="hidden md:flex space-x-4 text-sm items-center ml-auto">
          {state.status === "authenticated" ? (
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-1 text-sm font-medium hover:bg-red-700"
            >
              LOG OUT
            </button>
          ) : (
            <>
              <Link
                to="/signup"
                className="text-white hover:text-gray-300 font-medium"
              >
                SIGN UP
              </Link>
              <Link
                to="/login"
                className="bg-red-600 text-white px-4 py-1 text-sm font-medium hover:bg-red-700"
              >
                LOG IN
              </Link>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
