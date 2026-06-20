import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Phone, Building, Briefcase, FileText, CheckCircle, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

const DealerRegisterView = ({ onBackToLogin, apiBaseUrl }) => {
  const [form, setForm] = useState({
    username: '', password: '', business_name: '', owner_name: '', phone: '', email: '', gst_number: '', pan_number: '', territory_id: ''
  });
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch territories for the dropdown
    const fetchTerritories = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/territories/`);
        if (response.ok) {
          const data = await response.json();
          // Territories endpoint might return paginated or list format
          setTerritories(data.results || data || []);
        }
      } catch (err) {
        console.error("Failed to load territories:", err);
      }
    };
    fetchTerritories();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (form.gst_number.length !== 15) {
      setError('GST number must be exactly 15 characters.');
      return;
    }
    if (form.pan_number.length !== 10) {
      setError('PAN number must be exactly 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        territory_id: form.territory_id ? parseInt(form.territory_id) : null
      };
      
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register-dealer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = Object.entries(data).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n') || 'Registration failed';
        throw new Error(errorMsg);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-28 px-4 sm:px-6 lg:px-8 bg-grain-cream relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-grain-green/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-grain-gold/5 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 relative z-10"
      >
        <button 
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-grain-green uppercase tracking-wider mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>

        {success ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-grain-green" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Dealership Request Submitted!</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
              Your dealership onboarding request (Business: <strong>{form.business_name}</strong>) is successfully recorded. Our management team will verify your GSTIN/PAN and contact details within 24–48 hours for account approval.
            </p>
            <button onClick={onBackToLogin} className="btn-primary mx-auto px-8">
              Proceed to login page
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <span className="text-grain-gold font-bold uppercase tracking-widest text-xs block mb-2">Grow Your Business</span>
              <h2 className="text-3xl font-bold text-gray-900">Dealer Onboarding Form</h2>
              <p className="text-sm text-gray-500 mt-2">
                Fill the details below to submit a dealership request. Approved dealers receive territory commissions, order ledgers, and direct wholesale pricing.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="whitespace-pre-line font-medium leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">1. Account Credentials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Create username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Create password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mt-8">2. Business Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Business Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Building className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lal Traders"
                      value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Owner Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohan Lal"
                      value={form.owner_name}
                      onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Mobile number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="email@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mt-8">3. Verification & Territory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">GST Number (GSTIN)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      maxLength="15"
                      placeholder="15-character GSTIN"
                      value={form.gst_number}
                      onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">PAN Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      maxLength="10"
                      placeholder="10-character PAN"
                      value={form.pan_number}
                      onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Territory / Region</label>
                <select
                  required
                  value={form.territory_id}
                  onChange={(e) => setForm({ ...form, territory_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-grain-green outline-none transition-all"
                >
                  <option value="">Select Territory</option>
                  {territories.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.territory_name} ({t.district}, {t.state})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20 mt-4">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Submit Dealership Request'}
                <CheckCircle className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default DealerRegisterView;
