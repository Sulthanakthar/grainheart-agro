import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const products = [
  {
    id: 1,
    name: 'Toor Dal (Pigeon Peas)',
    description: 'Premium quality protein-rich pulses, perfectly polished and sortex cleaned.',
    price: 165,
    oldPrice: 180,
    category: 'Pulses',
    quality: 'High Sortex',
    isSortex: true,
    discount: 10,
    image: 'images/toor-dal.png'
  },
  {
    id: 2,
    name: 'Chana Dal (Bengal Gram)',
    description: 'Farm-fresh yellow lentils, rich in fiber and taste. Best for authentic dishes.',
    price: 95,
    oldPrice: 110,
    category: 'Pulses',
    quality: 'Sortex',
    isSortex: true,
    image: 'images/chana-dal.png'
  },
  {
    id: 3,
    name: 'Moong Dal (Yellow Moong)',
    description: 'Easy-to-digest yellow lentils. Triple-cleaned for maximum purity.',
    price: 120,
    oldPrice: 135,
    category: 'Pulses',
    quality: 'Fine Quality',
    isSortex: false,
    image: 'images/moong-dal.png'
  },
  {
    id: 4,
    name: 'Urad Dal (Black Gram)',
    description: 'Superior quality black gram, ideal for idli and dosa batter.',
    price: 145,
    oldPrice: 160,
    category: 'Pulses',
    quality: 'High Sortex',
    isSortex: true,
    discount: 5,
    image: 'images/urad-dal.png'
  },
  {
    id: 5,
    name: 'Premium Sharbati Wheat',
    description: 'Finest wheat from the fields of MP. Pure, clean, and nutritious.',
    price: 45,
    category: 'Wheat',
    quality: 'High Sortex',
    isSortex: true,
    image: 'images/sharbati-wheat.png'
  },
  {
    id: 6,
    name: 'Lokwan Wheat',
    description: 'Trusted variety for soft rotis. Properly sortex-cleaned stock.',
    price: 38,
    category: 'Wheat',
    quality: 'Sortex',
    isSortex: true,
    image: 'images/lokwan-wheat.png'
  }
];


const ProductShowcase = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Pulses', 'Wheat', 'Premium Pulses'];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory || (activeCategory === 'Premium Pulses' && p.quality === 'High Sortex'));

  return (
    <section id="products" className="py-24 bg-grain-cream/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-grain-gold font-bold uppercase tracking-widest text-sm"
          >
            Our Grain Collection
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6"
          >
            Premium Products at <span className="text-grain-green">Budget Prices</span>
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            className="h-1.5 bg-grain-gold mx-auto rounded-full mb-10"
          ></motion.div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ${
                  activeCategory === cat 
                  ? 'bg-grain-green text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-grain-green/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <button className="btn-outline border-grain-gold text-grain-gold hover:bg-grain-gold hover:text-white px-10">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
