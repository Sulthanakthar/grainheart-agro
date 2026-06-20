import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import heroBg from '../assets/hero-bg.png';
import productsHero from '../assets/products-hero.png';

const WHATSAPP_NUMBER = '919944550063';

const Hero = () => {
  const handleScrollToSection = useCallback((href) => {
    const target = document.querySelector(href);
    if (target) {
      const navHeight = 80;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Wheat fields" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-grain-green/10 rounded-full text-grain-green font-bold text-sm mb-6">
              <span className="w-2 h-2 bg-grain-green rounded-full animate-pulse"></span>
              Fresh Stock Available Now
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Healthy Grains, <br />
              <span className="text-grain-green italic">Happy Families</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
              Experience the purity of premium Sortex-quality pulses and wheat. 
              Farm-fresh goodness delivered from our trusted wholesale dealer shop 
              at budget-friendly prices.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button 
                id="hero-view-products-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
                onClick={() => handleScrollToSection('#products')}
                aria-label="View our grain products"
              >
                View Products
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </motion.button>
              
              <motion.a
                id="hero-whatsapp-btn"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20want%20to%20place%20an%20order.`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline border-grain-gold text-grain-gold hover:bg-grain-gold hover:text-white flex items-center gap-2"
                aria-label="Order via WhatsApp"
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                WhatsApp Order
              </motion.a>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-grain-green">15+</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">Years Trust</span>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-grain-green">50+</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">Grain Varieties</span>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-grain-green">10k+</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">Happy Clients</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src={productsHero} 
                alt="Premium Pulses" 
                className="w-full h-auto transform hover:scale-110 transition-transform duration-700"
              />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-grain-gold/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-grain-green/10 rounded-full blur-3xl"></div>
            
            {/* Quality Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-6 top-1/4 bg-white p-4 rounded-2xl shadow-xl z-20 border border-gray-100 flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-grain-gold rounded-full flex items-center justify-center">
                <span className="text-white font-bold">100%</span>
              </div>
              <div>
                <p className="font-bold text-gray-800 leading-none">Sortex Quality</p>
                <p className="text-xs text-gray-500">Premium Assurance</p>
              </div>
            </motion.div>

            {/* Price Badge */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-6 bottom-1/4 bg-white p-4 rounded-2xl shadow-xl z-20 border border-gray-100 flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-grain-green rounded-full flex items-center justify-center">
                <span className="text-white font-bold">₹</span>
              </div>
              <div>
                <p className="font-bold text-gray-800 leading-none">Wholesale Prices</p>
                <p className="text-xs text-gray-500">Save up to 30%</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-24 text-grain-cream fill-current">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58,117.26,163,121.54,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
