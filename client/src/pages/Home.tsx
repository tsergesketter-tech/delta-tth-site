import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import AvailableOffers from '../components/profile/AvailableOffers';
import Destinations from '../components/Destinations';
import DeltaExperience from '../components/DeltaExperience';


function Home() {
  return (
    <>
      <Hero />
      <DeltaExperience />
      <Destinations />
      <AvailableOffers />
    </>
  );
}

export default Home;