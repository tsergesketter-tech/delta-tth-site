import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-white text-sm">
      <div className="max-w-screen-xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-neutral-800">
        <div>
          <h4 className="font-semibold mb-4">SkyMiles</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Overview</a></li>
            <li><a href="#" className="hover:underline">Earn Miles</a></li>
            <li><a href="#" className="hover:underline">Redeem Miles</a></li>
            <li><a href="#" className="hover:underline">Status Benefits</a></li>
            <li><a href="#" className="hover:underline">Credit Cards</a></li>
            <li><a href="#" className="hover:underline">SkyMiles Marketplace</a></li>
            <li><a href="#" className="hover:underline">Partners</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Travel Services</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Flight Status</a></li>
            <li><a href="#" className="hover:underline">Check-In</a></li>
            <li><a href="#" className="hover:underline">Baggage</a></li>
            <li><a href="#" className="hover:underline">Special Services</a></li>
            <li><a href="#" className="hover:underline">Delta Vacations</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Experience</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Delta One</a></li>
            <li><a href="#" className="hover:underline">First Class</a></li>
            <li><a href="#" className="hover:underline">Delta Comfort+</a></li>
            <li><a href="#" className="hover:underline">Main Cabin</a></li>
            <li><a href="#" className="hover:underline">Delta Sky Clubs</a></li>
            <li><a href="#" className="hover:underline">Wi-Fi & Entertainment</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">About Delta</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
            <li><a href="#" className="hover:underline">Investor Relations</a></li>
            <li><a href="#" className="hover:underline">News Hub</a></li>
            <li><a href="#" className="hover:underline">Sustainability</a></li>
            <li><a href="#" className="hover:underline">Accessibility</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 grid md:grid-cols-2 items-center justify-between border-t border-neutral-800">
        <div className="mb-4 md:mb-0">
          <p className="text-xs text-neutral-400">&copy; 2025 Delta Air Lines, Inc. All rights reserved. This is a Salesforce demo site. Please do not book or reveal personal information. Thank you!</p>
        </div>
        <div className="flex space-x-4 justify-end">
          <a href="#" className="hover:opacity-75">
            <span className="sr-only">Facebook</span>
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="hover:opacity-75">
            <span className="sr-only">Instagram</span>
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="hover:opacity-75">
            <span className="sr-only">Twitter</span>
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="hover:opacity-75">
            <span className="sr-only">YouTube</span>
            <i className="fab fa-youtube"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
