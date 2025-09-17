// src/pages/ReturnFlights.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

type Flight = {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    time: string;
    airport: string;
    code: string;
  };
  arrival: {
    time: string;
    airport: string;
    code: string;
  };
  duration: string;
  aircraft: string;
  stops: number;
  prices: {
    main: number;
    comfort: number;
    business: number;
    first: number;
  };
  amenities: string[];
};

type FareClass = 'main' | 'comfort' | 'business' | 'first';

const sampleReturnFlights: Flight[] = [
  {
    id: "DL2891",
    airline: "Delta",
    flightNumber: "DL2891",
    departure: { time: "7:45am", airport: "Atlanta", code: "ATL" },
    arrival: { time: "9:35am", airport: "Indianapolis", code: "IND" },
    duration: "1h 50m",
    aircraft: "Airbus A320",
    stops: 0,
    prices: { main: 565, comfort: 765, business: 1265, first: 1865 },
    amenities: ["Free Wi-Fi for SkyMiles Members", "Live TV", "Power Outlets"]
  },
  {
    id: "DL1567",
    airline: "Delta",
    flightNumber: "DL1567",
    departure: { time: "11:20am", airport: "Atlanta", code: "ATL" },
    arrival: { time: "1:15pm", airport: "Indianapolis", code: "IND" },
    duration: "1h 55m",
    aircraft: "Boeing 737-800",
    stops: 0,
    prices: { main: 525, comfort: 725, business: 1225, first: 1825 },
    amenities: ["Free Wi-Fi for SkyMiles Members", "Complimentary Snacks", "Power Outlets"]
  },
  {
    id: "DL3342",
    airline: "Delta",
    flightNumber: "DL3342",
    departure: { time: "3:15pm", airport: "Atlanta", code: "ATL" },
    arrival: { time: "5:10pm", airport: "Indianapolis", code: "IND" },
    duration: "1h 55m",
    aircraft: "Boeing 737-900",
    stops: 0,
    prices: { main: 645, comfort: 845, business: 1345, first: 1945 },
    amenities: ["Free Wi-Fi for SkyMiles Members", "Live TV", "Premium Snacks"]
  },
  {
    id: "DL4789",
    airline: "Delta",
    flightNumber: "DL4789",
    departure: { time: "6:30pm", airport: "Atlanta", code: "ATL" },
    arrival: { time: "8:25pm", airport: "Indianapolis", code: "IND" },
    duration: "1h 55m",
    aircraft: "Airbus A321",
    stops: 0,
    prices: { main: 605, comfort: 805, business: 1305, first: 1905 },
    amenities: ["Free Wi-Fi for SkyMiles Members", "Live TV", "Power Outlets", "Extra Legroom Available"]
  }
];

const fareClassLabels = {
  main: 'Main',
  comfort: 'Comfort+',
  business: 'Business',
  first: 'First'
};

export default function ReturnFlights() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [flights] = useState<Flight[]>(sampleReturnFlights);

  const from = useMemo(() => params.get("from") || "ATL", [params]);
  const to = useMemo(() => params.get("to") || "IND", [params]);
  const departure = useMemo(() => params.get("departure") || "Sep 25, 2025", [params]);
  const returnDate = useMemo(() => params.get("return") || "Sep 16, 2025", [params]);
  const passengers = useMemo(() => params.get("passengers") || "1", [params]);

  // Outbound flight details
  const outboundFlight = useMemo(() => params.get("outboundFlight") || "", [params]);
  const outboundFareClass = useMemo(() => params.get("outboundFareClass") || "main", [params]);
  const outboundPrice = useMemo(() => params.get("outboundPrice") || "0", [params]);

  const handleReturnFlightSelection = (flight: Flight, fareClass: FareClass) => {
    // Navigate to checkout with both flight selections
    const searchParamsObj = {
      outboundFlight,
      outboundFareClass,
      outboundPrice,
      inboundFlight: flight.id,
      inboundFareClass: fareClass,
      inboundPrice: flight.prices[fareClass].toString(),
      passengers,
      totalPrice: (parseInt(outboundPrice) + flight.prices[fareClass]).toString()
    };

    const queryString = new URLSearchParams(searchParamsObj).toString();
    navigate(`/checkout?${queryString}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with search summary */}
      <div className="bg-slate-900 text-white px-6 py-4">
        <div className="fresh-air-container flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-bold">{to} - {from}</span>
            <span>Round Trip</span>
            <span>{departure}</span>
            <span>{passengers} Passenger{passengers !== '1' ? 's' : ''}</span>
            <button className="bg-slate-700 px-4 py-2 text-xs uppercase font-bold hover:bg-slate-600">
              MODIFY
            </button>
          </div>
        </div>
      </div>

      <div className="fresh-air-container py-6">
        {/* Flight results header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inbound</h1>
              <p className="text-lg text-gray-700">{from} • {to}</p>
              <p className="text-sm text-gray-600">Thu, Sep 25, 2025</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Show Price In</p>
                <div className="flex gap-2 mt-1">
                  <button className="px-3 py-1 text-sm font-bold border-b-2 border-red-600 text-red-600">$USD</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Miles</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Miles + Cash</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
                </svg>
                <span className="text-sm font-bold">Sort & Filter</span>
              </div>
            </div>
          </div>

          {/* Selected outbound flight summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-bold">Outbound Flight Selected</span>
            </div>
            <div className="text-sm text-green-700">
              {outboundFlight} • {fareClassLabels[outboundFareClass as FareClass]} • ${outboundPrice}
            </div>
          </div>

        </div>

        {/* Flight results */}
        <div className="space-y-6">
          {flights.map((flight) => (
            <div key={flight.id} className="space-y-3">
              {/* Flight cards row */}
              <div className="flex">
                {/* Flight Details Card - Left */}
                <div className="w-[440px] bg-white border border-gray-200 rounded-lg overflow-hidden mr-4">
                  <div className="p-4">
                    {/* Badges at top of box */}
                    <div className="flex items-center gap-1 mb-6 flex-nowrap">
                      <span className="px-3 py-1 text-white font-bold rounded-sm whitespace-nowrap" style={{backgroundColor: 'rgb(189, 89, 30)', fontSize: '12px', lineHeight: '16px'}}>Best Value</span>
                      <span className="px-3 py-1 text-white font-bold rounded-sm whitespace-nowrap" style={{backgroundColor: 'rgb(74, 120, 74)', fontSize: '12px', lineHeight: '16px'}}>Nonstop</span>
                      <span className="px-3 py-1 text-white font-bold rounded-sm whitespace-nowrap" style={{backgroundColor: 'rgb(51, 121, 142)', fontSize: '12px', lineHeight: '16px'}}>Free Wi-Fi for SkyMiles Members</span>
                    </div>

                    {/* Header with Delta logo and flight info */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <img src="/images/Delta-Partner-Logo.png" alt="Delta" className="h-4" />
                        <span className="text-blue-600 font-bold text-sm">{flight.flightNumber}</span>
                      </div>
                      <span className="text-gray-600 text-sm">{flight.duration}</span>
                    </div>

                    {/* Flight times and route */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="font-bold text-gray-900" style={{fontSize: '24px', lineHeight: '30px'}}>{flight.departure.time}</div>
                        <div className="w-2 h-2 bg-gray-900 rounded-full mx-auto mt-2"></div>
                        <div className="text-sm font-bold text-gray-900 mt-1">{flight.departure.code}</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <div className="w-12 h-0.5 bg-gray-400"></div>
                          <img src="/images/flight_logo.svg" alt="plane" className="w-4 h-4 mx-1" />
                          <div className="w-12 h-0.5 bg-gray-400"></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Nonstop</div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-gray-900" style={{fontSize: '24px', lineHeight: '30px'}}>{flight.arrival.time}</div>
                        <div className="w-2 h-2 bg-gray-900 rounded-full mx-auto mt-2"></div>
                        <div className="text-sm font-bold text-gray-900 mt-1">{flight.arrival.code}</div>
                      </div>
                    </div>

                    {/* Details and amenities */}
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <button className="text-blue-600 hover:underline">Details</button>
                        <button className="text-blue-600 hover:underline">Seats</button>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Cards - Right - Stretch to fill remaining space */}
                <div className="flex-1 flex" style={{minHeight: '280px'}}>
                  {/* Main Price Card */}
                  <button
                    onClick={() => handleReturnFlightSelection(flight, 'main')}
                    className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer mr-2 flex flex-col group"
                    style={{
                      background: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right bottom, rgb(27, 60, 119), rgb(78, 103, 213))';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = 'inherit';
                    }}>
                    <div className="text-white p-3 text-center" style={{background: 'linear-gradient(to right bottom, rgb(27, 60, 119), rgb(78, 103, 213))'}}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                        <span className="font-bold text-sm">Main</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 text-center flex flex-col justify-center">
                      <div className="text-xs mb-2 text-gray-600 group-hover:text-white transition-colors">From</div>
                      <div className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-white transition-colors">${flight.prices.main}</div>
                      <div className="text-xs text-gray-600 group-hover:text-white transition-colors">Round Trip</div>
                    </div>
                  </button>

                  {/* Comfort+ Price Card */}
                  <button
                    onClick={() => handleReturnFlightSelection(flight, 'comfort')}
                    className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer mr-2 flex flex-col group"
                    style={{
                      background: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right bottom, rgb(21, 71, 131), rgb(8, 121, 207))';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = 'inherit';
                    }}>
                    <div className="text-white p-3 text-center" style={{background: 'linear-gradient(to right bottom, rgb(21, 71, 131), rgb(8, 121, 207))'}}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                        <span className="font-bold text-sm">Comfort+</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 text-center flex flex-col justify-center">
                      <div className="text-xs mb-2 text-gray-600 group-hover:text-white transition-colors">From</div>
                      <div className="text-2xl font-bold mb-1 text-gray-900 group-hover:text-white transition-colors">${flight.prices.comfort}</div>
                      <div className="text-xs mb-1 text-gray-600 group-hover:text-white transition-colors">Round Trip</div>
                      <div className="text-xs text-orange-600 font-bold group-hover:text-white transition-colors">3 left</div>
                    </div>
                  </button>

                  {/* First Price Card */}
                  <button
                    onClick={() => handleReturnFlightSelection(flight, 'first')}
                    className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col group"
                    style={{
                      background: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right bottom, rgb(130, 29, 74), rgb(217, 16, 91))';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = 'inherit';
                    }}>
                    <div className="text-white p-3 text-center" style={{background: 'linear-gradient(to right bottom, rgb(130, 29, 74), rgb(217, 16, 91))'}}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                        <span className="font-bold text-sm">First</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 text-center flex flex-col justify-center">
                      <div className="text-xs mb-2 text-gray-600 group-hover:text-white transition-colors">From</div>
                      <div className="text-2xl font-bold mb-1 text-gray-900 group-hover:text-white transition-colors">${flight.prices.first}</div>
                      <div className="text-xs mb-1 text-gray-600 group-hover:text-white transition-colors">Round Trip</div>
                      <div className="text-xs text-orange-600 font-bold group-hover:text-white transition-colors">2 left</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Flight details row */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <button className="text-blue-600 hover:underline">Details</button>
                  <button className="text-blue-600 hover:underline">Seats</button>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4">
                    {flight.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}