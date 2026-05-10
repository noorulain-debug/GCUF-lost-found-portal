import React from 'react'
import Browse from '../components/Browse/browse'
import Navbar from '../components/Navebar/navbar'
import Footer from '../components/Footer/footer'
import { Suspense } from 'react';

export const dynamic = "force-dynamic";

export default function BrowsePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="text-center py-5">Loading...</div>}>
        <Browse />
      </Suspense>
      <Footer />
    </>
  );
}