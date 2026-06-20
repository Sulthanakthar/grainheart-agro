import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, MapPin, FileText, CheckCircle, ShieldCheck, Loader, ArrowLeft } from 'lucide-react';

const CheckoutView = ({ cart, user, profile, apiBaseUrl, onOrderPlaced, onBackToCart }) => {
  const [form, setForm] = useState({
    delivery_address: '',
    notes: '',
    payment_method: 'cash', // 'cash' | 'bank_cheque'
    cheque_number: '',
    bank_name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null); // Holds details after checkout success

  // Initialize address from profile if available
  useEffect(() => {
    if (profile && profile.address) {
      const fullAddress = `${profile.address}, ${profile.city}, ${profile.state}, ${profile.country}`;
      setForm(prev => ({ ...prev, delivery_address: fullAddress }));
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.delivery_address.trim()) {
      setError('Delivery address is required.');
      return;
    }

    if (form.payment_method === 'bank_cheque') {
      if (!form.cheque_number.trim() || !form.bank_name.trim()) {
        setError('Please provide cheque number and issuing bank details.');
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Concatenate bank details for transaction_reference if cheque is chosen
      let transactionReference = '';
      if (form.payment_method === 'bank_cheque') {
        transactionReference = `Cheque #: ${form.cheque_number.trim()}, Bank: ${form.bank_name.trim()}`;
      }

      const payload = {
        delivery_address: form.delivery_address,
        notes: form.notes,
        payment_method: form.payment_method,
        transaction_reference: transactionReference
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/orders/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout request failed. Please check stock levels.');
      }

      setPlacedOrder(data);
      onOrderPlaced(); // Callback to trigger app cart refresh
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart?.total_amount || 0;
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  return (
    <div className="py-28 bg-grain-cream/50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8">
        
        {placedOrder ? (
          /* SUCCESS SCREEN */
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-grain-green shadow-lg">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Order Placed Successfully!</h2>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed text-sm font-medium">
              Thank you for purchasing from Healthy Grains. Your order reference is <strong className="text-grain-green">{placedOrder.order_number}</strong>. An invoice has been generated.
            </p>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left space-y-3 max-w-md mx-auto text-sm font-semibold">
              <div className="flex justify-between text-gray-500">
                <span>Order Total:</span>
                <span className="text-gray-900 font-extrabold">₹{placedOrder.total_amount}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Payment Mode:</span>
                <span className="text-gray-900 uppercase">{placedOrder.payments?.[0]?.payment_method || form.payment_method}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Status:</span>
                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold uppercase">{placedOrder.order_status}</span>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={onOrderPlaced} // Clicking this triggers reloading of profile dashboard in App.jsx
                className="btn-primary mx-auto px-8"
              >
                Go to Order History
              </button>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM VIEW */
          <div>
            <div className="text-center mb-16">
              <span className="text-grain-gold font-bold uppercase tracking-widest text-xs">Secure Purchase</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Complete Your Order</h2>
              <div className="h-1.5 bg-grain-gold mx-auto w-16 rounded-full" />
            </div>

            <button 
              onClick={onBackToCart}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-grain-green uppercase tracking-widest mb-10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </button>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
              
              {/* Form panel */}
              <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
                
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm border border-red-100 font-medium leading-relaxed">
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Delivery Address */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-grain-green">
                      <MapPin className="w-5 h-5" />
                      <h3 className="text-base font-bold text-gray-900">1. Delivery Address</h3>
                    </div>
                    <textarea
                      required
                      rows="3"
                      placeholder="Enter full shipping address..."
                      value={form.delivery_address}
                      onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-grain-green outline-none transition-all text-sm font-semibold resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-grain-green">
                      <FileText className="w-5 h-5" />
                      <h3 className="text-base font-bold text-gray-900">2. Additional Instructions (Optional)</h3>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Leave with gate keeper, call before delivery"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-grain-green outline-none transition-all text-sm font-semibold"
                    />
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-grain-green">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="text-base font-bold text-gray-900">3. Select Payment Mode</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Cash */}
                      <label className={`p-6 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                        form.payment_method === 'cash'
                          ? 'border-grain-green bg-grain-green-light/40 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-extrabold text-sm text-gray-900">Cash Payment</span>
                          <input
                            type="radio"
                            name="payment_method"
                            value="cash"
                            checked={form.payment_method === 'cash'}
                            onChange={() => setForm({ ...form, payment_method: 'cash' })}
                            className="text-grain-green focus:ring-grain-green h-4 w-4"
                          />
                        </div>
                        <p className="text-xs text-gray-400 font-semibold leading-relaxed">Pay cash on product delivery at your location.</p>
                      </label>

                      {/* Bank Cheque */}
                      <label className={`p-6 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                        form.payment_method === 'bank_cheque'
                          ? 'border-grain-green bg-grain-green-light/40 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-extrabold text-sm text-gray-900">Bank Cheque</span>
                          <input
                            type="radio"
                            name="payment_method"
                            value="bank_cheque"
                            checked={form.payment_method === 'bank_cheque'}
                            onChange={() => setForm({ ...form, payment_method: 'bank_cheque' })}
                            className="text-grain-green focus:ring-grain-green h-4 w-4"
                          />
                        </div>
                        <p className="text-xs text-gray-400 font-semibold leading-relaxed">Cheque verification required prior to stock dispatch.</p>
                      </label>
                    </div>

                    {/* Bank Cheque detail inputs */}
                    {form.payment_method === 'bank_cheque' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gray-50 p-6 rounded-3xl border border-gray-100 grid sm:grid-cols-2 gap-4 mt-4"
                      >
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cheque Number</label>
                          <input
                            type="text"
                            required
                            placeholder="6-digit cheque number"
                            value={form.cheque_number}
                            onChange={(e) => setForm({ ...form, cheque_number: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:border-grain-green outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Issuing Bank Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. HDFC Bank, SBI"
                            value={form.bank_name}
                            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:border-grain-green outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20 mt-8"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Confirm & Place Order'}
                  </button>

                </form>

              </div>

              {/* Order total sidebar panel */}
              <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Checkout Summary</h3>
                
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {cart?.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-500">{item.product_name} (x{item.quantity})</span>
                      <span className="text-gray-900">₹{item.total_price}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-100 my-4" />

                <div className="space-y-4 text-sm font-semibold">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST Tax (5%)</span>
                    <span className="text-gray-900">₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="flex justify-between text-lg font-black text-gray-900">
                    <span>Final Amount</span>
                    <span className="text-grain-green">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutView;
