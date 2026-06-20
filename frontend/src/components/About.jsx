import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Users, Truck, Clock } from 'lucide-react';

const About = () => {
  const features = [
    { title: 'Trusted Dealer', desc: '35+ years of excellence', icon: <Users className="w-6 h-6" /> },
    { title: 'Fresh Quality', desc: 'Direct from the fields', icon: <Star className="w-6 h-6" /> },
    { title: 'Reliable Supply', desc: 'Always in stock', icon: <Truck className="w-6 h-6" /> },
    { title: 'Fast Delivery', desc: 'Next day dispatch', icon: <Clock className="w-6 h-6" /> },
  ];

  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative z-10 grid grid-cols-2 gap-4"
            >
              <img src="images/about-grains.png" alt="Premium grain varieties displayed in our shop" className="rounded-3xl shadow-lg mt-8 object-cover h-60 w-full" loading="lazy" />
              <img src="images/about-quality.png" alt="Farmer inspecting premium quality wheat" className="rounded-3xl shadow-lg object-cover h-60 w-full" loading="lazy" />
            </motion.div>
            
            {/* Background accent */}
            <div className="absolute -top-10 -left-10 w-full h-full bg-grain-green/5 rounded-[3rem] -z-0 rotate-3"></div>
            
            {/* Experience Badge */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="absolute -bottom-6 -right-6 bg-grain-gold p-8 rounded-3xl text-white shadow-2xl z-20"
            >
              <p className="text-4xl font-bold mb-1">35+</p>
              <p className="text-sm font-semibold uppercase tracking-widest">Years of Trust</p>
            </motion.div>
          </div>

          <div>
            <span className="text-grain-gold font-bold uppercase tracking-widest text-sm">About Our Business</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-8 leading-tight">
              Leading Wholesale & Retail <br />
              <span className="text-grain-green">Grain Dealer in Tirupattur</span>
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              At Gafoor Company, we believe that every family deserves the best quality nutrition. 
              We specialize in premium sortex-cleaned pulses and wheat, sourced directly from the 
              finest farms. Our state-of-the-art cleaning technology and commitment to freshness 
              ensure you get nothing but the best.
            </p>

            <div className="grid sm:grid-cols-2 gap-8 mb-12">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-grain-green/10 rounded-xl flex items-center justify-center text-grain-green">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{f.title}</h4>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {['Sortex Technology for 100% purity', 'Budget-friendly wholesale pricing', 'Fresh stock available throughout the year'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-grain-green rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
