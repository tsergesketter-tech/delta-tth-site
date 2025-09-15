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

export default function SearchBar() {
  const navigate = useNavigate();
  const { setSearch, computeNights } = useSearch();

  // Form state
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [passengers, setPassengers] = useState(1);

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
  const [openList, setOpenList] = useState(false);
  const [hi, setHi] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Calendar popover state
  const [openCal, setOpenCal] = useState(false);
  const calWrapRef = useRef<HTMLDivElement | null>(null);

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

  // Close list on outside click and manage overflow class
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenList(false);
      }
      if (calWrapRef.current && !calWrapRef.current.contains(e.target as Node)) {
        setOpenCal(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Manage overflow class on hero section for dropdown visibility
  useEffect(() => {
    const heroSection = document.querySelector('.evergage-hero-section');
    if (heroSection) {
      if (openList || openCal) {
        heroSection.classList.add('dropdown-open');
      } else {
        heroSection.classList.remove('dropdown-open');
      }
    }

    return () => {
      const heroSection = document.querySelector('.evergage-hero-section');
      if (heroSection) {
        heroSection.classList.remove('dropdown-open');
      }
    };
  }, [openList, openCal]);

  // Helpers
  function buildQuery(params: Record<string, string | number | undefined>) {
    const qp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && String(v).trim() !== "") qp.set(k, String(v).trim());
    });
    return qp.toString();
  }

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

    const qs = buildQuery({
      from: fromLocation,
      to: toLocation,
      departure: departureDate,
      return: returnDate,
      passengers,
    });

    navigate(`/search?${qs}`);
  }

  // Keyboard interaction on the location input
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openList && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpenList(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = hi >= 0 && suggestions[hi] ? suggestions[hi] : fromLocation;
      if (chosen.trim()) {
        setFromLocation(chosen);
        setOpenList(false);
        setOpenCal(true);
      }
    } else if (e.key === "Escape") {
      setOpenList(false);
    }
  }

  // Display label for date button
  const dateLabel =
    range?.from && range?.to
      ? `${format(range.from, "MMM d, yyyy")} — ${format(range.to, "MMM d, yyyy")}`
      : range?.from
      ? `${format(range.from, "MMM d, yyyy")} — Pick return`
      : "Select travel dates";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-6 gap-3"
      role="search"
      aria-label="Flight search"
      style={{ position: 'relative' }}
    >
      {/* From Location */}
      <div className="relative" ref={wrapRef}>
        <label className="text-sm font-medium text-gray-700">From</label>
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Origin airport"
          value={fromLocation}
          onChange={(e) => {
            setFromLocation(e.target.value);
            setOpenList(true);
            setHi(-1);
          }}
          onFocus={() => setOpenList(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={openList}
          aria-controls="typeahead-listbox"
          role="combobox"
        />
        {openList && fromSuggestions.length > 0 && (
          <ul
            id="typeahead-listbox"
            role="listbox"
            className="absolute z-[9999] mt-2 max-h-80 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
            style={{ top: '100%', left: 0, right: 0 }}
          >
            {fromSuggestions.map((airport, idx) => (
              <li
                key={airport}
                role="option"
                aria-selected={idx === hi}
                className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${
                  idx === hi ? "bg-red-50" : "hover:bg-gray-50"
                }`}
                onMouseEnter={() => setHi(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setFromLocation(airport);
                  setOpenList(false);
                  setOpenCal(true);
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

      {/* To Location */}
      <div className="relative">
        <label className="text-sm font-medium text-gray-700">To</label>
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Destination airport"
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
        />
        {openList && suggestions.length > 0 && (
          <ul
            id="typeahead-listbox"
            role="listbox"
            className="absolute z-[9999] mt-2 max-h-80 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
            style={{ top: '100%', left: 0, right: 0 }}
          >
            {suggestions.map((city, idx) => (
              <li
                key={city}
                role="option"
                aria-selected={idx === hi}
                className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${
                  idx === hi ? "bg-indigo-50" : "hover:bg-gray-50"
                }`}
                onMouseEnter={() => setHi(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setLocation(city);
                  setOpenList(false);
                  setOpenCal(true);
                }}
              >
                <span className="mt-0.5">📍</span>
                <div>
                  <div className="font-medium text-gray-900">{city.split(",")[0]}</div>
                  <div className="text-xs text-gray-600">
                    {city.split(",").slice(1).join(",")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Date range popover */}
      <div className="relative md:col-span-2" ref={calWrapRef}>
        <label className="text-sm font-medium text-gray-700">Dates</label>
        <button
          type="button"
          onClick={() => setOpenCal((s) => !s)}
          className="mt-1 w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span className="truncate text-gray-800">{dateLabel}</span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${openCal ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
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
                day: "h-9 w-9 rounded-full hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500",
                day_selected: "bg-black text-white hover:bg-black focus:bg-black",
                day_range_start: "bg-black text-white hover:bg-black rounded-full",
                day_range_end: "bg-black text-white hover:bg-black rounded-full",
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
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                onClick={() => setOpenCal(false)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guests + submit */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Guests</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <button
          type="submit"
          className="h-10 self-end rounded-lg bg-indigo-600 px-5 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Search
        </button>
      </div>
    </form>
  );
}
