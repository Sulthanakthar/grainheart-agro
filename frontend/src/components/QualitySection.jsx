import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Zap, Award } from 'lucide-react';
import sortexImg from '../assets/sortex-quality.png';

const QualitySection = () => {
  const qualities = [
    {
      title: 'High Sortex',
      description: 'The pinnacle of purity. Zero impurities, uniform grain size, and 100% color consistency.',
      icon: <Award className="w-8 h-8 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50',
      tag: 'Premium Choice'
    },
    {
      title: 'Sortex Quality',
      description: 'Standard export-quality cleaning. High purity levels with minimal variation.',
      icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50',
      tag: 'Best Seller'
    },
    {
      title: 'Fine Quality',
      description: 'Fresh, nutritious grains cleaned using traditional and modern methods for daily use.',
      icon: <Zap className="w-8 h-8 text-grain-green" />,
      color: 'border-green-200 bg-green-50',
      tag: 'Budget Friendly'
    }
  ];

  return (
    <section id="quality" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-grain-cream/30 -skew-x-12 transform translate-x-20"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-grain-gold font-bold uppercase tracking-widest text-sm">Quality Assurance</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-8">
              Sortex Technology for <span className="text-grain-green">100% Purity</span>
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              We use advanced Sortex color sorting technology to ensure every single grain 
              that reaches your kitchen is pure, healthy, and free from impurities. 
              Our commitment to quality is what makes us a trusted name among thousands of families.
            </p>

            <div className="space-y-6">
              {qualities.map((item, index) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className={`p-6 rounded-2xl border-2 ${item.color} flex gap-6 hover:shadow-md transition-all group`}
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-white rounded border border-gray-100 text-gray-500">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white rotate-3 hover:rotate-0 transition-all duration-500">
              <img 
                src={sortexImg} 
                alt="Sortex Machine Result" 
                className="w-full h-auto"
              />
            </div>
            
            {/* Overlay Info Card */}
            <div className="absolute -bottom-8 -left-8 bg-grain-green p-8 rounded-3xl text-white shadow-2xl max-w-xs">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle className="w-10 h-10 text-grain-gold" />
                <h4 className="text-xl font-bold">Trusted by Retailers</h4>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                "Gafoor Company provides the most consistent sortex quality in the market. 
                Our customers always ask for their brand."
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                <div>
                  <p className="text-xs font-bold">Rajesh Kumar</p>
                  <p className="text-[10px] text-white/60">Retailer, Tirupattur</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QualitySection;
