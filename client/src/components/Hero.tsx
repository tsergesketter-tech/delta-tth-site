import React from 'react';
import SearchBar from './SearchBar';

const Hero = () => {
  // Handle background image updates from Evergage
  const handleEvergageBackgroundUpdate = (imageUrl: string) => {
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.style.backgroundImage = `url('${imageUrl}')`;
    }
  };

  // Expose function globally for Evergage to call
  React.useEffect(() => {
    (window as any).updateHeroBackground = handleEvergageBackgroundUpdate;
    return () => {
      delete (window as any).updateHeroBackground;
    };
  }, []);

  // Watch for Evergage changes and auto-update background
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Check if personalization zone was modified
          const personalizationZone = document.getElementById('hero-personalizable-zone');
          if (personalizationZone) {
            // Look for background image data attribute
            const bgImage = personalizationZone.getAttribute('data-bg-image');
            if (bgImage) {
              handleEvergageBackgroundUpdate(bgImage);
            }

            // Also check for a hidden element with the background URL
            const bgElement = personalizationZone.querySelector('[data-background-url]');
            if (bgElement) {
              const bgUrl = bgElement.getAttribute('data-background-url');
              if (bgUrl) {
                handleEvergageBackgroundUpdate(bgUrl);
              }
            }
          }
        }
      });
    });

    // Observe the entire hero section for changes
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      observer.observe(heroSection, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-bg-image', 'data-background-url']
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full">
      {/* Search Bar Section */}
      <section className="pt-0 pb-6 bg-white">
        <SearchBar showTabs={true} />
      </section>

      {/* Hero Banner Section */}
      <section
        id="hero-section"
        className="relative w-full bg-cover bg-center evergage-hero-section"
        style={{
          backgroundImage: "url('/images/kauai.png')",
          height: '500px'
        }}
      >
        {/* Background overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        {/* Credit Card Offer Banner */}
        <div className="relative z-10 flex items-end h-full">
          <div className="w-full max-w-screen-xl mx-auto px-8 pb-12">
            <div className="max-w-lg">
              {/* Card Image */}
              <div className="mb-6 relative">
                <div className="relative w-40 h-25 rounded-lg shadow-lg overflow-hidden">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-50"></div>
                  {/* Delta Gold Card Image */}
                  <img
                    src="/images/delta_gold_card.png"
                    alt="Delta Gold American Express Card"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>

              {/* Limited Time Offer Badge */}
              <div className="mb-4">
                <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                  LIMITED TIME OFFER
                </span>
              </div>

              {/* Headline */}
              <div className="mb-4">
                <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">
                  <span className="text-white">
                    EARN
                  </span>{' '}
                  <span className="relative">
                    <span className="text-white text-3xl md:text-4xl relative">
                      70,000
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-white transform rotate-12"></span>
                      </span>
                    </span>
                    <span className="ml-2 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                      125,000
                    </span>
                  </span>
                </h1>
              </div>

              {/* Bonus Miles Text */}
              <div className="mb-2">
                <p className="text-white text-lg font-semibold">
                  BONUS MILES*
                </p>
              </div>

              {/* Subheading - Desktop Only */}
              <div className="hidden md:block mb-6">
                <p className="text-white text-base">
                  Plus, receive $2,500 MQDs each Medallion Qualification Year with MQD Headstart.
                </p>
              </div>

              {/* CTA Button */}
              <div className="mb-6">
                <a
                  href="https://apply.americanexpress.com/en-us/delta-lto-sep25/page/25"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-red-600 text-white font-bold px-6 py-3 hover:bg-red-700 transition-colors text-sm uppercase tracking-wide"
                >
                  EXPLORE OFFER
                  <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

              {/* Terms and Conditions */}
              <div className="text-white text-xs opacity-80">
                <p>
                  *Offer ends October 29, 2025.
                  <br />
                  Minimum purchase required. Terms apply.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evergage injection point for custom content */}
        <div
          id="evergage-custom-content"
          className="evergage-zone"
          style={{ display: 'none' }}
        ></div>
      </section>
    </div>
  );
};

export default Hero;