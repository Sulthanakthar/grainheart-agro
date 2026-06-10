import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import ProductShowcase from './components/ProductShowcase';
import QualitySection from './components/QualitySection';
import WholesaleForm from './components/WholesaleForm';
import Footer from './components/Footer';
import { MessageCircle } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-grain-cream selection:bg-grain-green selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        <About />
        <ProductShowcase />
        <QualitySection />
        
        {/* Why Choose Us - Quick Stats */}
        <section className="py-16 bg-grain-green text-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Sortex Quality', val: '100%' },
                { label: 'Happy Families', val: '10k+' },
                { label: 'Years Experience', val: '15+' },
                { label: 'Grain Varieties', val: '50+' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="text-4xl md:text-5xl font-black text-grain-gold">{stat.val}</h3>
                  <p className="text-sm uppercase tracking-widest text-white/70 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WholesaleForm />
      </main>

      <Footer />

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919876543210" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce hover:animate-none"
        title="Order on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="absolute -top-2 -left-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-white text-[#25D366] text-[10px] font-bold items-center justify-center">1</span>
        </span>
      </a>
    </div>
  );
}

export default App;
