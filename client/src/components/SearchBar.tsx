// src/components/SearchBar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, startOfToday, addDays, isBefore } from "date-fns";
import { useSearch } from "../context/SearchContext";

// Airport destinations for Delta flights
const AIRPORT_OPTIONS = [
  "Atlanta, GA (ATL) - Hartsfield-Jackson",
  "New York, NY (JFK) - John F. Kennedy",
  "Los Angeles, CA (LAX) - Los Angeles International",
  "Chicago, IL (ORD) - O'Hare International",
  "Miami, FL (MIA) - Miami International",
  "Seattle, WA (SEA) - Seattle-Tacoma",
  "Boston, MA (BOS) - Logan International",
  "San Francisco, CA (SFO) - San Francisco International",
];

type SearchBarProps = {
  showTabs?: boolean;
};

export default function SearchBar({ showTabs = false }: SearchBarProps) {
  const navigate = useNavigate();
  const { setSearch, computeNights } = useSearch();

  // Tab state
  const [activeTab, setActiveTab] = useState("flights");

  // Form state
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState("Round Trip");

  // Date range state (departure and return dates)
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfToday(),
    to: addDays(startOfToday(), 7),
  });

  // Derived ISO strings for URL/context (departure and return dates)
  const departureDate = range?.from ? range.from.toISOString().slice(0, 10) : "";
  const returnDate = range?.to
    ? range.to.toISOString().slice(0, 10)
    : range?.from
    ? addDays(range.from, 7).toISOString().slice(0, 10)
    : "";

  // Typeahead state
  const [openFromList, setOpenFromList] = useState(false);
  const [openToList, setOpenToList] = useState(false);
  const [fromHi, setFromHi] = useState<number>(-1);
  const [toHi, setToHi] = useState<number>(-1);
  const fromWrapRef = useRef<HTMLDivElement | null>(null);
  const toWrapRef = useRef<HTMLDivElement | null>(null);

  // Calendar popover state
  const [openCal, setOpenCal] = useState(false);
  const calWrapRef = useRef<HTMLDivElement | null>(null);

  // Passenger dropdown state
  const [openPassengers, setOpenPassengers] = useState(false);
  const passengersWrapRef = useRef<HTMLDivElement | null>(null);

  // Trip type dropdown state
  const [openTripType, setOpenTripType] = useState(false);
  const tripTypeWrapRef = useRef<HTMLDivElement | null>(null);

  // Suggestions for from/to airports
  const fromSuggestions = useMemo(() => {
    const q = fromLocation.trim().toLowerCase();
    if (!q) return AIRPORT_OPTIONS.slice(0, 8);
    return AIRPORT_OPTIONS.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [fromLocation]);

  const toSuggestions = useMemo(() => {
    const q = toLocation.trim().toLowerCase();
    if (!q) return AIRPORT_OPTIONS.slice(0, 8);
    return AIRPORT_OPTIONS.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [toLocation]);

  // Close list on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (fromWrapRef.current && !fromWrapRef.current.contains(e.target as Node)) {
        setOpenFromList(false);
      }
      if (toWrapRef.current && !toWrapRef.current.contains(e.target as Node)) {
        setOpenToList(false);
      }
      if (calWrapRef.current && !calWrapRef.current.contains(e.target as Node)) {
        setOpenCal(false);
      }
      if (passengersWrapRef.current && !passengersWrapRef.current.contains(e.target as Node)) {
        setOpenPassengers(false);
      }
      if (tripTypeWrapRef.current && !tripTypeWrapRef.current.contains(e.target as Node)) {
        setOpenTripType(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Submit handler (stores flight search context, navigates with params)
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nights = computeNights(departureDate || undefined, returnDate || undefined);

    setSearch({
      city: `${fromLocation} to ${toLocation}` || undefined,
      checkIn: departureDate || undefined,
      checkOut: returnDate || undefined,
      guests: passengers,
      nights,
    });

    const qs = new URLSearchParams({
      from: fromLocation,
      to: toLocation,
      departure: departureDate,
      return: returnDate,
      passengers: passengers.toString(),
    }).toString();

    navigate(`/search?${qs}`);
  }

  // Keyboard interaction on the from location input
  function onFromKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openFromList && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpenFromList(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFromHi((i: number) => Math.min(i + 1, fromSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFromHi((i: number) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = fromHi >= 0 && fromSuggestions[fromHi] ? fromSuggestions[fromHi] : fromLocation;
      if (chosen.trim()) {
        setFromLocation(chosen);
        setOpenFromList(false);
      }
    } else if (e.key === "Escape") {
      setOpenFromList(false);
    }
  }

  // Keyboard interaction on the to location input
  function onToKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openToList && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpenToList(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setToHi((i: number) => Math.min(i + 1, toSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setToHi((i: number) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = toHi >= 0 && toSuggestions[toHi] ? toSuggestions[toHi] : toLocation;
      if (chosen.trim()) {
        setToLocation(chosen);
        setOpenToList(false);
      }
    } else if (e.key === "Escape") {
      setOpenToList(false);
    }
  }

  // Extract airport code from selected location
  const extractAirportCode = (location: string) => {
    const match = location.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : "";
  };

  const extractCityName = (location: string) => {
    const parts = location.split("(");
    return parts[0].trim();
  };

  // Display label for date button
  const dateLabel =
    range?.from && range?.to
      ? `${format(range.from, "MMM d")} — ${format(range.to, "MMM d")}`
      : range?.from
      ? `${format(range.from, "MMM d")} — Pick return`
      : "Select travel dates";

  const tabs = [
    { id: "flights", label: "Flights", icon: "✈️" },
    { id: "cars", label: "Cars", icon: "🚗" },
    { id: "stays", label: "Stays", icon: "🏨" },
    { id: "cruises", label: "Cruises", icon: "🚢" },
    { id: "vacations", label: "Vacations", icon: "🏝️" },
  ];

  return (
    <div className="w-full">
      {/* Full-width Tabs */}
      {showTabs && (
        <div style={{ backgroundColor: '#0F172A' }} className="w-full">
          <div className="fresh-air-container pt-4">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-gray-800 shadow-sm border-t border-l border-r border-gray-200"
                      : "bg-slate-600 text-white hover:bg-slate-500"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Form Container */}
      <div className="fresh-air-container">
        <div className="bg-white rounded-bl-lg" style={{ position: 'relative' }}>
          <form
        onSubmit={onSubmit}
        className="flex items-center gap-6 p-8"
        role="search"
        aria-label="Flight search"
      >
        {/* From and To Location with Arrow */}
        <div className="flex items-center gap-4">
          {/* From Location */}
          <div className="relative" ref={fromWrapRef}>
            <div className="flex flex-col text-center">
              <div className="font-light text-gray-900" style={{ fontSize: '3.5rem', lineHeight: '3.125rem' }}>
                {extractAirportCode(fromLocation) || "IND"}
              </div>
              <div className="text-gray-600" style={{ display: 'block', paddingTop: '0.75rem', fontSize: '0.75rem', lineHeight: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                {extractCityName(fromLocation) || "Indianapolis, IN"}
              </div>
            </div>
            <input
              className="absolute inset-0 w-full h-full bg-transparent border-0 border-b-2 border-transparent focus:border-b-2 focus:outline-none text-transparent"
              style={{
                borderBottomColor: '#778194',
                borderBottomWidth: '0.5px',
                color: extractAirportCode(fromLocation) ? 'transparent' : 'black'
              }}
              placeholder=""
              value={fromLocation}
              onChange={(e) => {
                setFromLocation(e.target.value);
                setOpenFromList(true);
                setFromHi(-1);
              }}
              onFocus={() => setOpenFromList(true)}
              onKeyDown={onFromKeyDown}
              aria-autocomplete="list"
              aria-expanded={openFromList}
              aria-controls="from-typeahead-listbox"
              role="combobox"
            />
            {openFromList && fromSuggestions.length > 0 && (
              <ul
                id="from-typeahead-listbox"
                role="listbox"
                className="absolute z-[9999] mt-2 max-h-80 w-80 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
                style={{ top: '100%', left: 0 }}
              >
                {fromSuggestions.map((airport, idx) => (
                  <li
                    key={airport}
                    role="option"
                    aria-selected={idx === fromHi}
                    className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${
                      idx === fromHi ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setFromHi(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFromLocation(airport);
                      setOpenFromList(false);
                    }}
                  >
                    <span className="mt-0.5">✈️</span>
                    <div>
                      <div className="font-medium text-gray-900">{airport.split(" - ")[0]}</div>
                      <div className="text-xs text-gray-600">
                        {airport.split(" - ")[1]}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center w-8 h-8 mb-1">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>

          {/* To Location */}
          <div className="relative" ref={toWrapRef}>
            <div className="flex flex-col text-center">
              <div className="font-light text-gray-900" style={{ fontSize: '3.5rem', lineHeight: '3.125rem' }}>
                {extractAirportCode(toLocation) || "To"}
              </div>
              <div className="text-gray-600" style={{ display: 'block', paddingTop: '0.75rem', fontSize: '0.75rem', lineHeight: '0.875rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                {extractCityName(toLocation) || "Your Destination"}
              </div>
            </div>
            <input
              className="absolute inset-0 w-full h-full bg-transparent border-0 border-b-2 border-transparent focus:border-b-2 focus:outline-none text-transparent"
              style={{
                borderBottomColor: '#778194',
                borderBottomWidth: '0.5px',
                color: extractAirportCode(toLocation) ? 'transparent' : 'black'
              }}
              placeholder=""
              value={toLocation}
              onChange={(e) => {
                setToLocation(e.target.value);
                setOpenToList(true);
                setToHi(-1);
              }}
              onFocus={() => setOpenToList(true)}
              onKeyDown={onToKeyDown}
              aria-autocomplete="list"
              aria-expanded={openToList}
              aria-controls="to-typeahead-listbox"
              role="combobox"
            />
            {openToList && toSuggestions.length > 0 && (
              <ul
                id="to-typeahead-listbox"
                role="listbox"
                className="absolute z-[9999] mt-2 max-h-80 w-80 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
                style={{ top: '100%', left: 0 }}
              >
                {toSuggestions.map((airport, idx) => (
                  <li
                    key={airport}
                    role="option"
                    aria-selected={idx === toHi}
                    className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${
                      idx === toHi ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setToHi(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setToLocation(airport);
                      setOpenToList(false);
                    }}
                  >
                    <span className="mt-0.5">✈️</span>
                    <div>
                      <div className="font-medium text-gray-900">{airport.split(" - ")[0]}</div>
                      <div className="text-xs text-gray-600">
                        {airport.split(" - ")[1]}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Trip Type Dropdown */}
        <div className="relative" ref={tripTypeWrapRef}>
          <button
            type="button"
            onClick={() => setOpenTripType(!openTripType)}
            className="flex items-center justify-between px-4 py-2 text-left focus:outline-none border-b border-gray-300"
            style={{ borderBottomColor: '#778194', borderBottomWidth: '0.5px' }}
          >
            <span className="font-medium text-gray-900" style={{ padding: '0.125rem 1.5rem 0.1875rem 0', lineHeight: '1.4rem' }}>{tripType}</span>
            <svg className="ml-2 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>

          {openTripType && (
            <ul className="absolute z-[9999] mt-2 w-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
                style={{ top: '100%', left: 0 }}>
              {["Round Trip", "One Way", "Multi-City"].map((type) => (
                <li
                  key={type}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setTripType(type);
                    setOpenTripType(false);
                  }}
                >
                  {type}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date range popover */}
        <div className="relative" ref={calWrapRef}>
          <button
            type="button"
            onClick={() => setOpenCal((s) => !s)}
            className="flex items-center justify-between px-4 py-2 text-left focus:outline-none border-b border-gray-300"
            style={{ borderBottomColor: '#778194', borderBottomWidth: '0.5px' }}
          >
            <span className="font-medium text-gray-900" style={{ padding: '0.125rem 1.5rem 0.1875rem 0', lineHeight: '1.4rem' }}>{dateLabel}</span>
            <svg
              className="ml-2 h-4 w-4 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {openCal && (
            <div className="absolute z-[9999] mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl right-0 md:right-auto md:left-0">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={(r) => {
                  if (r?.from && r?.to && isBefore(r.to, r.from)) {
                    setRange({ from: r.to, to: r.from });
                  } else {
                    setRange(r);
                  }
                }}
                defaultMonth={range?.from ?? startOfToday()}
                disabled={{ before: startOfToday() }}
                numberOfMonths={1}
                weekStartsOn={0}
                classNames={{
                  caption: "flex justify-between items-center px-1 py-2",
                  nav: "flex items-center gap-2",
                  nav_button_previous: "p-1 rounded hover:bg-gray-100",
                  nav_button_next: "p-1 rounded hover:bg-gray-100",
                  months: "flex gap-4",
                  table: "w-full border-collapse",
                  head_row: "grid grid-cols-7 gap-1 text-xs text-gray-500 px-1",
                  head_cell: "text-center py-1",
                  row: "grid grid-cols-7 gap-1 px-1",
                  cell: "text-center",
                  day: "h-9 w-9 rounded-full hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500",
                  day_selected: "bg-red-600 text-white hover:bg-red-600 focus:bg-red-600",
                  day_range_start: "bg-red-600 text-white hover:bg-red-600 rounded-full",
                  day_range_end: "bg-red-600 text-white hover:bg-red-600 rounded-full",
                  day_range_middle: "bg-gray-200 text-black hover:bg-gray-200",
                }}
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setRange(undefined)}
                  className={`underline ${range ? "text-gray-700" : "text-gray-300 cursor-default"}`}
                  disabled={!range}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="bg-red-600 px-3 py-1.5 text-white font-bold text-xs uppercase hover:bg-red-700"
                  style={{ backgroundColor: '#E51937' }}
                  onClick={() => setOpenCal(false)}
                >
                  DONE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Passengers */}
        <div className="relative" ref={passengersWrapRef}>
          <button
            type="button"
            onClick={() => setOpenPassengers(!openPassengers)}
            className="flex items-center justify-between px-4 py-2 text-left focus:outline-none border-b border-gray-300"
            style={{ borderBottomColor: '#778194', borderBottomWidth: '0.5px' }}
          >
            <span className="font-medium text-gray-900" style={{ padding: '0.125rem 1.5rem 0.1875rem 0', lineHeight: '1.4rem' }}>{passengers} Passenger{passengers !== 1 ? 's' : ''}</span>
            <svg className="ml-2 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>

          {openPassengers && (
            <ul className="absolute z-[9999] mt-2 w-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
                style={{ top: '100%', left: 0 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <li
                  key={num}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setPassengers(num);
                    setOpenPassengers(false);
                  }}
                >
                  {num} Passenger{num !== 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="px-8 py-3 text-white font-bold text-lg uppercase hover:opacity-90 focus:outline-none"
          style={{ backgroundColor: '#E51937' }}
        >
          SEARCH
        </button>
      </form>

      {/* Search Options Row */}
      <div className="flex flex-wrap items-center gap-6 px-6 pb-4">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">SEARCH OPTIONS</span>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-gray-700">Shop with Miles</span>
        </label>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-gray-700">Refundable Fares Only</span>
        </label>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-gray-700">My dates are flexible</span>
        </label>
        <button type="button" className="text-sm font-bold uppercase hover:underline" style={{ color: '#E51937' }}>
          Advanced Search
        </button>
      </div>
        </div>
      </div>
    </div>
  );
}