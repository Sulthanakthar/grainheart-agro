import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const CartView = ({ cart, onUpdateCartQty, onRemoveCartItem, onCheckout, onBrowseShop }) => {
  const items = cart?.items || [];
  const subtotal = cart?.total_amount || 0;
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;

  return (
    <div className="py-28 bg-grain-cream/50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-grain-gold font-bold uppercase tracking-widest text-xs">Your Purchase Bag</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Shopping Cart</h2>
          <div className="h-1.5 bg-grain-gold mx-auto w-16 rounded-full" />
        </div>

        {items.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 bg-grain-green-light rounded-full flex items-center justify-center mx-auto text-grain-green">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h3>
            <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-sm font-medium">
              Looks like you haven't added any grain varieties to your purchase list yet. Explore our high sortex collection!
            </p>
            <button onClick={onBrowseShop} className="btn-primary mx-auto px-8">
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between">
                  <div className="flex items-center gap-4 self-start sm:self-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      <img
                        src={item.product_details?.image ? item.product_details.image : 'images/toor-dal.png'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'images/toor-dal.png'; }}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">{item.product_name}</h4>
                      <p className="text-xs text-gray-400 font-semibold mt-1">SKU: {item.product_sku}</p>
                      <p className="text-sm font-bold text-grain-green mt-1">₹{item.unit_price} / kg</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Quantity modifier controls */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => onUpdateCartQty(item.product, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white text-gray-500 hover:text-gray-950 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-extrabold text-sm text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateCartQty(item.product, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white text-gray-500 hover:text-gray-950 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-gray-900">₹{item.total_price}</p>
                    </div>

                    <button
                      onClick={() => onRemoveCartItem(item.product)}
                      className="p-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary Card */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Order Summary</h3>
              
              <div className="space-y-4 text-sm font-semibold">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (5% GST)</span>
                  <span className="text-gray-900">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping & Delivery</span>
                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-bold uppercase">Free</span>
                </div>
                
                <div className="h-px bg-gray-100 my-4" />
                
                <div className="flex justify-between text-lg font-black text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-grain-green">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <button
                  onClick={onBrowseShop}
                  className="text-xs text-gray-400 hover:text-grain-green font-bold uppercase tracking-widest transition-colors"
                >
                  ← Continue Shopping
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CartView;
