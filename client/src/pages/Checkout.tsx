// src/pages/Checkout.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";

import { DEMO_MEMBER } from "../constants/loyalty";

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

const fareClassLabels = {
  main: 'Main',
  comfort: 'Comfort+',
  business: 'Business',
  first: 'First'
};

// Sample flight data for demo (in real app, this would come from API)
const sampleFlights: Flight[] = [
  {
    id: "DL3134",
    airline: "Delta",
    flightNumber: "DL3134",
    departure: { time: "4:40pm", airport: "Indianapolis", code: "IND" },
    arrival: { time: "6:25pm", airport: "Atlanta", code: "ATL" },
    duration: "1h 45m",
    aircraft: "Airbus A320",
    stops: 0,
    prices: { main: 545, comfort: 745, business: 1245, first: 1845 },
    amenities: ["Free Wi-Fi for SkyMiles Members", "Live TV", "Power Outlets"]
  },
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
  }
];

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Flight booking parameters from URL
  const outboundFlight = useMemo(() => params.get("outboundFlight") || "", [params]);
  const outboundFareClass = useMemo(() => params.get("outboundFareClass") || "main", [params]);
  const outboundPrice = useMemo(() => Number(params.get("outboundPrice")) || 0, [params]);
  const inboundFlight = useMemo(() => params.get("inboundFlight") || "", [params]);
  const inboundFareClass = useMemo(() => params.get("inboundFareClass") || "main", [params]);
  const inboundPrice = useMemo(() => Number(params.get("inboundPrice")) || 0, [params]);
  const passengers = useMemo(() => params.get("passengers") || "1", [params]);
  const totalPrice = useMemo(() => Number(params.get("totalPrice")) || (outboundPrice + inboundPrice), [params, outboundPrice, inboundPrice]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get flight details from sample data (in real app, would fetch from API)
  const outboundFlightData = useMemo(() =>
    sampleFlights.find(f => f.id === outboundFlight),
    [outboundFlight]
  );
  const inboundFlightData = useMemo(() =>
    sampleFlights.find(f => f.id === inboundFlight),
    [inboundFlight]
  );

  // Validate required flight data
  useEffect(() => {
    if (!outboundFlight || !inboundFlight || !outboundFlightData || !inboundFlightData) {
      setError("Missing flight selection data");
    } else {
      setError(null);
    }
  }, [outboundFlight, inboundFlight, outboundFlightData, inboundFlightData]);

  const currency = "USD";
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency });

  const price = useMemo(() => {
    const subtotal = outboundPrice + inboundPrice;
    const taxesPct = 0.08; // 8% taxes for flights
    const taxes = +(subtotal * taxesPct).toFixed(2);
    const total = +(subtotal + taxes).toFixed(2);

    return {
      outboundPrice,
      inboundPrice,
      subtotal,
      taxesPct,
      taxes,
      total,
    };
  }, [outboundPrice, inboundPrice]);

  // For simplicity, we'll just use the base flight price
  const finalTotal = price.total;


  if (loading)
    return <div className="mx-auto max-w-4xl p-6">Loading checkout…</div>;

  if (error || !outboundFlightData || !inboundFlightData) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-red-50 p-6 text-red-700 shadow">
          {error || "Flight selection not found"}
        </div>
        <div className="mt-4">
          <Link to="/search" className="text-indigo-600 hover:underline">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Ensure we have flight data before proceeding
    if (!outboundFlightData || !inboundFlightData) {
      setError("Missing flight data. Please restart your booking.");
      return;
    }

    let bookingId = `FL-${Date.now()}`;

    // 1. Create flight booking in your local system
    try {
      const res = await fetch("/api/flight-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalTransactionNumber: bookingId,
          membershipNumber: DEMO_MEMBER.MEMBERSHIP_NUMBER,
          channel: "Web",
          posa: "US",
          bookingDate: new Date().toISOString().slice(0, 10),
          passengers: Number(passengers),
          outboundFlight: {
            flightNumber: outboundFlightData.flightNumber,
            departure: outboundFlightData.departure,
            arrival: outboundFlightData.arrival,
            fareClass: outboundFareClass,
            price: outboundPrice
          },
          inboundFlight: {
            flightNumber: inboundFlightData.flightNumber,
            departure: inboundFlightData.departure,
            arrival: inboundFlightData.arrival,
            fareClass: inboundFareClass,
            price: inboundPrice
          },
          pricing: {
            subtotal: price.subtotal,
            taxes: price.taxes,
            total: finalTotal
          }
        }),
      });
      if (res.ok) {
        const json = await res.json();
        bookingId = json.bookingId || bookingId;
      }
    } catch (err) {
      console.warn("Flight booking API failed:", err);
      // Still proceed to confirmation for demo purposes
    }

    // 2. Navigate to confirmation page
    const confirmationParams = new URLSearchParams({
      booking: bookingId,
      outboundFlight,
      outboundFareClass,
      outboundPrice: outboundPrice.toString(),
      inboundFlight,
      inboundFareClass,
      inboundPrice: inboundPrice.toString(),
      passengers,
      total: finalTotal.toString()
    });

    navigate(`/confirmation?${confirmationParams.toString()}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Demo Site Disclaimer */}
      <div className="mb-6 rounded-xl bg-amber-50 border-2 border-amber-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="text-2xl">⚠️</div>
          </div>
          <div>
            <h3 className="font-bold text-amber-800 text-lg">Demo Site - Do Not Enter Real Information</h3>
            <p className="text-amber-700 text-sm mt-1">
              This is a <strong>Salesforce demo application</strong> for demonstration purposes only. 
              Please do not enter real credit card numbers, personal information, or payment details. 
              Use test data only.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Flight booking summary */}
        <aside className="md:col-span-1">
          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="font-semibold text-gray-900 mb-4">Flight Summary</div>

            {/* Outbound Flight */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-2">Outbound</div>
              <div className="text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span>{outboundFlightData.flightNumber}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{fareClassLabels[outboundFareClass as FareClass]}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {outboundFlightData.departure.time} {outboundFlightData.departure.code} → {outboundFlightData.arrival.time} {outboundFlightData.arrival.code}
                </div>
                <div className="mt-1 text-xs text-gray-500">{outboundFlightData.duration} • Nonstop</div>
              </div>
            </div>

            {/* Inbound Flight */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-2">Inbound</div>
              <div className="text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span>{inboundFlightData.flightNumber}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{fareClassLabels[inboundFareClass as FareClass]}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {inboundFlightData.departure.time} {inboundFlightData.departure.code} → {inboundFlightData.arrival.time} {inboundFlightData.arrival.code}
                </div>
                <div className="mt-1 text-xs text-gray-500">{inboundFlightData.duration} • Nonstop</div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="mt-4 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Outbound flight</span>
                <span>{fmt(price.outboundPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inbound flight</span>
                <span>{fmt(price.inboundPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(price.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees ({(price.taxesPct * 100).toFixed(1)}%)</span>
                <span>{fmt(price.taxes)}</span>
              </div>
              <div className="mt-2 border-t pt-2 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{fmt(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Passengers: {passengers}
            </div>
          </div>
        </aside>

      {/* Passenger & payment form */}
      <section className="md:col-span-2 rounded-2xl bg-white p-5 shadow">
        <div className="mb-4 text-lg font-semibold text-gray-900">
          Passenger Details
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">First name *</label>
              <input
                name="firstName"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Last name *</label>
              <input
                name="lastName"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Email *</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Phone number</label>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter phone number"
            />
          </div>

          <div className="mt-6 text-lg font-semibold text-gray-900">Payment</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">Card number *</label>
              <input
                name="cardNumber"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">
                Expiry (MM/YY) *
              </label>
              <input
                name="expiry"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="MM/YY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">CVC *</label>
              <input
                name="cvc"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Postal code *</label>
              <input
                name="postal"
                required
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="12345"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Complete Booking • {fmt(finalTotal)}
          </button>

          <div className="mt-3 text-center">
            <Link
              to="/return-flights"
              className="text-indigo-600 hover:underline text-sm"
            >
              ← Back to flight selection
            </Link>
          </div>
        </form>
      </section>
      </div>
    </div>
  );
}

