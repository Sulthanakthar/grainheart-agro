import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Mail, MapPin, MessageCircle, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const WHATSAPP_NUMBER = '919944550063';

const PRODUCTS = [
  'Select Product',
  'Toor Dal (Pigeon Peas)',
  'Chana Dal (Bengal Gram)',
  'Moong Dal (Yellow Moong)',
  'Urad Dal (Black Gram)',
  'Premium Sharbati Wheat',
  'Lokwan Wheat',
  'Mix Bulk Order',
];

const initialFormState = {
  fullName: '',
  email: '',
  mobile: '',
  businessName: '',
  product: '',
  message: '',
};

const WholesaleForm = () => {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s/g, ''))) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!form.product || form.product === 'Select Product') {
      newErrors.product = 'Please select a product.';
    }

    if (!form.message.trim()) {
      newErrors.message = 'Please describe your requirements.';
    } else if (form.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters.';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(`form-${firstErrorKey}`);
      if (el) el.focus();
      return;
    }

    setSubmitState('loading');
    setErrors({});

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/v1/enquiries/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: form.fullName,
          email: form.email,
          phone: form.mobile,
          enquiry_type: 'wholesale',
          subject: `Wholesale Enquiry: ${form.product}`,
          message: form.businessName
            ? `Business: ${form.businessName}\nProduct: ${form.product}\nRequirements: ${form.message}`
            : `Product: ${form.product}\nRequirements: ${form.message}`,
          source: 'web',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit enquiry');
      }

      setSubmitState('success');
      setForm(initialFormState);
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      setSubmitState('error');
    }
  };

  const handleWhatsApp = () => {
    const { fullName, mobile, product, message } = form;
    const text = [
      '🌾 *Wholesale Enquiry - Gafoor Company*',
      '',
      `👤 Name: ${fullName || 'N/A'}`,
      `📱 Mobile: ${mobile || 'N/A'}`,
      form.businessName ? `🏪 Business: ${form.businessName}` : '',
      `📦 Product: ${product && product !== 'Select Product' ? product : 'N/A'}`,
      `📝 Requirements: ${message || 'N/A'}`,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const inputClass = (field) => `w-full px-6 py-4 rounded-2xl transition-all outline-none text-sm ${
    errors[field]
      ? 'bg-red-50 border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'bg-gray-50 border border-gray-100 focus:border-grain-green focus:bg-white focus:ring-2 focus:ring-grain-green/10'
  }`;

  return (
    <section id="contact" className="py-24 bg-grain-cream/50 overflow-hidden relative" aria-labelledby="contact-heading">
      {/* Decorative background shape */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="contact-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#contact-grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="grid lg:grid-cols-5">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 bg-grain-green p-12 text-white flex flex-col justify-between">
              <div>
                <span className="text-grain-gold font-bold uppercase tracking-widest text-xs block mb-3">Wholesale & Retail</span>
                <h2 id="contact-heading" className="text-3xl font-bold mb-6 leading-tight">Grow Your Business With Us</h2>
                <p className="text-white/80 mb-10 leading-relaxed text-sm">
                  We offer special pricing for wholesale buyers, retailers, and restaurants. 
                  Fill the form and our team will get back to you within 24 hours.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
                      <Phone className="w-6 h-6 text-grain-gold" />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">Call Us</p>
                      <a href="tel:+919944550063" id="contact-phone-link" className="text-xl font-bold hover:text-grain-gold transition-colors">
                        +91 99445 50063
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
                      <Mail className="w-6 h-6 text-grain-gold" />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">Email</p>
                      <a href="mailto:mohammedsulthan2004@gmail.com" id="contact-email-link" className="text-lg font-bold hover:text-grain-gold transition-colors break-all">
                        mohammedsulthan2004@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
                      <MapPin className="w-6 h-6 text-grain-gold" />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">Visit Shop</p>
                      <p className="text-base font-semibold leading-tight">
                        14, Big Bazaar Street, <br/>Tirupattur, Tamil Nadu
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white/10 rounded-3xl border border-white/10">
                <p className="text-sm italic mb-4 text-white/80 leading-relaxed">
                  "Best wholesale prices for bulk orders. Trusted supplier since 2008. Their sortex quality is unmatched."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-grain-gold flex items-center justify-center font-bold text-white" aria-hidden="true">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-sm">Mohammed Sulthan</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Managing Director</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-3 p-8 sm:p-12 lg:p-16">
              <span className="text-grain-gold font-bold uppercase tracking-widest text-xs mb-3 block">Inquiry Form</span>
              <h3 className="text-3xl font-bold text-gray-900 mb-10">Send Wholesale Enquiry</h3>
              
              <AnimatePresence mode="wait">
                {submitState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-grain-green" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">Enquiry Sent!</h4>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                      Thank you! Our team will contact you within 24 hours with pricing details.
                    </p>
                    <button
                      id="form-reset-btn"
                      onClick={() => setSubmitState('idle')}
                      className="btn-primary px-8"
                    >
                      Send Another Enquiry
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    id="wholesale-enquiry-form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-6"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label htmlFor="form-fullName" className="text-sm font-semibold text-gray-700 ml-1">
                          Full Name <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input 
                          id="form-fullName"
                          type="text" 
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className={inputClass('fullName')}
                          aria-required="true"
                          aria-describedby={errors.fullName ? 'err-fullName' : undefined}
                          autoComplete="name"
                        />
                        {errors.fullName && (
                          <p id="err-fullName" className="text-red-500 text-xs ml-1 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="space-y-2">
                        <label htmlFor="form-email" className="text-sm font-semibold text-gray-700 ml-1">
                          Email Address <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input 
                          id="form-email"
                          type="email" 
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className={inputClass('email')}
                          aria-required="true"
                          aria-describedby={errors.email ? 'err-email' : undefined}
                          autoComplete="email"
                        />
                        {errors.email && (
                          <p id="err-email" className="text-red-500 text-xs ml-1 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Mobile Number */}
                      <div className="space-y-2">
                        <label htmlFor="form-mobile" className="text-sm font-semibold text-gray-700 ml-1">
                          Mobile Number <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <input 
                          id="form-mobile"
                          type="tel" 
                          name="mobile"
                          value={form.mobile}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className={inputClass('mobile')}
                          aria-required="true"
                          aria-describedby={errors.mobile ? 'err-mobile' : undefined}
                          autoComplete="tel"
                        />
                        {errors.mobile && (
                          <p id="err-mobile" className="text-red-500 text-xs ml-1 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.mobile}
                          </p>
                        )}
                      </div>

                      {/* Business Name */}
                      <div className="space-y-2">
                        <label htmlFor="form-businessName" className="text-sm font-semibold text-gray-700 ml-1">
                          Business Name <span className="text-gray-400 text-xs font-normal">(optional)</span>
                        </label>
                        <input 
                          id="form-businessName"
                          type="text" 
                          name="businessName"
                          value={form.businessName}
                          onChange={handleChange}
                          placeholder="Shop or Restaurant Name"
                          className={inputClass('businessName')}
                          autoComplete="organization"
                        />
                      </div>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-2">
                      <label htmlFor="form-product" className="text-sm font-semibold text-gray-700 ml-1">
                        Product Selection <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <div className="relative">
                        <select 
                          id="form-product"
                          name="product"
                          value={form.product}
                          onChange={handleChange}
                          className={`${inputClass('product')} appearance-none pr-10`}
                          aria-required="true"
                          aria-describedby={errors.product ? 'err-product' : undefined}
                        >
                          {PRODUCTS.map((p) => (
                            <option key={p} value={p === 'Select Product' ? '' : p} disabled={p === 'Select Product'}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.product && (
                        <p id="err-product" className="text-red-500 text-xs ml-1 flex items-center gap-1" role="alert">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.product}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label htmlFor="form-message" className="text-sm font-semibold text-gray-700 ml-1">
                        Message / Requirements <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <textarea 
                        id="form-message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows="4" 
                        placeholder="Tell us about your requirement (e.g. 500kg Toor Dal, monthly delivery needed)"
                        className={`${inputClass('message')} resize-none`}
                        aria-required="true"
                        aria-describedby={errors.message ? 'err-message' : undefined}
                      />
                      <div className="flex justify-between items-center">
                        {errors.message ? (
                          <p id="err-message" className="text-red-500 text-xs ml-1 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.message}
                          </p>
                        ) : <span />}
                        <span className="text-xs text-gray-400">{form.message.length} chars</span>
                      </div>
                    </div>

                    {/* Error state */}
                    {submitState === 'error' && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3" role="alert">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-600 text-sm font-medium">
                          Something went wrong. Please try again or use WhatsApp below.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 pt-4">
                      <motion.button 
                        id="form-submit-btn"
                        whileHover={{ scale: submitState === 'loading' ? 1 : 1.02 }}
                        whileTap={{ scale: submitState === 'loading' ? 1 : 0.98 }}
                        className="btn-primary px-10 disabled:opacity-60 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={submitState === 'loading'}
                        aria-busy={submitState === 'loading'}
                      >
                        {submitState === 'loading' ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" aria-hidden="true" />
                            Send Enquiry
                          </>
                        )}
                      </motion.button>
                      
                      <motion.button 
                        id="form-whatsapp-btn"
                        type="button"
                        onClick={handleWhatsApp}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50 transition-all"
                        aria-label="Open WhatsApp to chat about your order"
                      >
                        <MessageCircle className="w-6 h-6" aria-hidden="true" />
                        Chat on WhatsApp
                      </motion.button>
                    </div>

                    <p className="text-xs text-gray-400 ml-1">
                      <span aria-hidden="true">*</span> Required fields. We respond within 24 hours.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WholesaleForm;
