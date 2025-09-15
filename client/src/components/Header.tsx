import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./LoginCard"; // adjust path if needed

const base = "hover:text-red-600 transition-colors";
const navClass = ({ isActive }: { isActive: boolean }) =>
  `${base} ${isActive ? "text-red-600" : ""}`;

export default function Header() {
  const { state, logout } = useAuth();

  return (
    <header className="w-full bg-red-600 text-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Left: Logo */}
      <div className="flex items-center">
        <Link to="/" aria-label="Delta Home">
          <div className="text-2xl font-bold text-white">DELTA</div>
        </Link>
      </div>

      {/* Center: Nav Links */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium">
        <NavLink to="/" end className={navClass}>
          Book Flights
        </NavLink>
        <NavLink to="/destination-type" className={navClass}>
          Destinations
        </NavLink>
        <NavLink to="/promotions" className={navClass}>
          Deals
        </NavLink>
        <NavLink to="/credit-cards" className={navClass}>
          SkyMiles Cards
        </NavLink>
        <NavLink to="/member" className={navClass}>
          My Account
        </NavLink>
      </nav>

      {/* Right: Utility + Auth */}
      <div className="hidden md:flex space-x-4 text-sm items-center">
        <a href="#" className={base}>
          Help
        </a>
        <a href="#" className={base}>
          English
        </a>

        {state.status === "authenticated" ? (
          <button
            onClick={logout}
            className="text-sm font-medium hover:text-red-200 transition-colors"
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/login"
            className="text-sm font-medium hover:text-red-200 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}


