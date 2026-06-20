import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Clipboard, CreditCard, Award, FileText, CheckCircle, AlertCircle, 
  Trash2, Edit, Plus, Upload, Check, X, ShieldAlert, BarChart3, Users, Settings, LogOut, Loader 
} from 'lucide-react';

const DashboardView = ({ user, profile, apiBaseUrl, onLogout, onProductChanged }) => {
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invoice Modal State
  const [invoiceHtml, setInvoiceHtml] = useState(null);
  const [viewingInvoiceNumber, setViewingInvoiceNumber] = useState('');

  // --- Customer States ---
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerProfileForm, setCustomerProfileForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: ''
  });

  // --- Dealer States ---
  const [dealerCommissions, setDealerCommissions] = useState([]);
  const [dealerAnalytics, setDealerAnalytics] = useState(null);
  const [dealerDocs, setDealerDocs] = useState([]);
  const [uploadDocForm, setUploadDocForm] = useState({ document_type: 'gst_registration', file: null });

  // --- Admin/Staff States ---
  const [adminProducts, setAdminProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [qualityGrades, setQualityGrades] = useState([]);
  const [dealersList, setDealersList] = useState([]);
  const [enquiriesList, setEnquiriesList] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  // Admin CRUD Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means "Create" mode
  const [productForm, setProductForm] = useState({
    name: '', sku: '', price: '', stock: '', weight: '', category: '', quality_grade: '', 
    short_description: '', description: '', is_featured: false, is_active: true, image: null
  });

  // Admin Dealer Approval States
  const [approvingDealerId, setApprovingDealerId] = useState(null);
  const [approvalForm, setApprovalForm] = useState({ commission_rate: '2.50', status: 'active' });

  // Admin Report Generation
  const [reportForm, setReportForm] = useState({ report_type: 'sales', start_date: '', end_date: '' });

  // Initialize role-based defaults
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        setActiveTab('orders');
        fetchCustomerOrders();
        initCustomerProfileForm();
      } else if (user.role === 'dealer') {
        setActiveTab('dealer_overview');
        fetchDealerData();
      } else {
        // Admin / Staff
        setActiveTab('admin_products');
        fetchAdminData();
      }
    }
  }, [user]);

  // Alert flash helper
  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // --- CUSTOMER API FUNCTIONS ---
  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/orders/`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCustomerOrders(data.results || data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initCustomerProfileForm = () => {
    setCustomerProfileForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || ''
    });
  };

  const handleCustomerProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customerProfileForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to update profile');
      
      // Update local storage
      const updatedUser = { ...user, first_name: data.first_name, last_name: data.last_name, email: data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (data.profile) {
        localStorage.setItem('profile', JSON.stringify(data.profile));
      }
      flashSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchInvoice = async (orderNumber) => {
    setViewingInvoiceNumber(orderNumber);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/invoices/${orderNumber}/download/`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const html = await response.text();
        setInvoiceHtml(html);
      } else {
        alert('Invoice file generation pending. Please contact admin.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- DEALER API FUNCTIONS ---
  const fetchDealerData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      // commissions
      const commRes = await fetch(`${apiBaseUrl}/api/v1/commissions/`, { headers });
      if (commRes.ok) {
        const cData = await commRes.json();
        setDealerCommissions(cData.results || cData || []);
      }
      
      // analytics
      const analRes = await fetch(`${apiBaseUrl}/api/v1/dealers/analytics/`, { headers });
      if (analRes.ok) {
        const aData = await analRes.json();
        setDealerAnalytics(aData);
      }
      
      // document list from dealer profile
      if (profile && profile.documents) {
        setDealerDocs(profile.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDealerDocUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadDocForm.file) {
      setError('Please select a file to upload.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('document_type', uploadDocForm.document_type);
      formData.append('document_file', uploadDocForm.file);

      const response = await fetch(`${apiBaseUrl}/api/v1/dealers/documents/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document.');
      }
      setDealerDocs([data, ...dealerDocs]);
      setUploadDocForm({ ...uploadDocForm, file: null });
      // Reset input element
      document.getElementById('doc-file-input').value = '';
      flashSuccess('Business document uploaded successfully. Verification pending.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ADMIN API FUNCTIONS ---
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      
      // Products
      const prodRes = await fetch(`${apiBaseUrl}/api/v1/products/`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setAdminProducts(data.results || data || []);
      }

      // Categories
      const catRes = await fetch(`${apiBaseUrl}/api/v1/categories/`);
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.results || data || []);
      }

      // Quality grades
      const qRes = await fetch(`${apiBaseUrl}/api/v1/quality-grades/`);
      if (qRes.ok) {
        const data = await qRes.json();
        setQualityGrades(data.results || data || []);
      }

      // Dealers list
      const dealerRes = await fetch(`${apiBaseUrl}/api/v1/dealers/`, { headers });
      if (dealerRes.ok) {
        const data = await dealerRes.json();
        setDealersList(data.results || data || []);
      }

      // CRM enquiries
      const enqRes = await fetch(`${apiBaseUrl}/api/v1/enquiries/`, { headers });
      if (enqRes.ok) {
        const data = await enqRes.json();
        setEnquiriesList(data.results || data || []);
      }

      // Reports list
      const reportRes = await fetch(`${apiBaseUrl}/api/v1/reports/`, { headers });
      if (reportRes.ok) {
        const data = await reportRes.json();
        setReportsList(data.results || data || []);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Product Catalog
  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('sku', productForm.sku);
      formData.append('price', productForm.price);
      formData.append('stock', productForm.stock);
      formData.append('weight', productForm.weight);
      formData.append('category', productForm.category);
      formData.append('quality_grade', productForm.quality_grade);
      formData.append('short_description', productForm.short_description);
      formData.append('description', productForm.description);
      formData.append('is_featured', productForm.is_featured);
      formData.append('is_active', productForm.is_active);
      
      if (productForm.image) {
        formData.append('image', productForm.image);
      }

      let url = `${apiBaseUrl}/api/v1/products/`;
      let method = 'POST';

      if (editingProduct) {
        url = `${apiBaseUrl}/api/v1/products/${editingProduct.slug}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        const errorDetails = Object.entries(data).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n');
        throw new Error(errorDetails || 'Catalogue operation failed');
      }

      // Refresh list
      fetchAdminData();
      onProductChanged(); // Callback to refresh landing page catalog
      setShowProductModal(false);
      flashSuccess(editingProduct ? 'Product updated in catalog!' : 'Product added to catalog!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (slug) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}/api/v1/products/${slug}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchAdminData();
        onProductChanged();
        flashSuccess('Product removed from catalog.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveDealerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}/api/v1/dealers/${approvingDealerId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: approvalForm.status,
          commission_rate: parseFloat(approvalForm.commission_rate)
        })
      });
      if (response.ok) {
        fetchAdminData();
        setApprovingDealerId(null);
        flashSuccess('Dealer status modified successfully.');
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Approval failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyDocument = async (docId, statusOption) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}/api/v1/dealers/documents/${docId}/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusOption })
      });
      if (response.ok) {
        fetchAdminData();
        flashSuccess('Document status verified.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReportSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        report_type: reportForm.report_type
      };
      if (reportForm.start_date) payload.start_date = reportForm.start_date;
      if (reportForm.end_date) payload.end_date = reportForm.end_date;

      const response = await fetch(`${apiBaseUrl}/api/v1/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Report generation failed');
      
      fetchAdminData();
      flashSuccess(`Report '${data.report_name}' generated successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openProductCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '', sku: '', price: '', stock: '', weight: '1.00', 
      category: categories[0]?.id || '', quality_grade: qualityGrades[0]?.id || '', 
      short_description: '', description: '', is_featured: false, is_active: true, image: null
    });
    setError('');
    setShowProductModal(true);
  };

  const openProductEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      price: prod.price,
      stock: prod.available_stock || prod.stock || 0,
      weight: prod.weight || '1.00',
      category: prod.category?.id || '',
      quality_grade: prod.quality_grade?.id || '',
      short_description: prod.short_description || '',
      description: prod.description || '',
      is_featured: prod.is_featured,
      is_active: prod.is_active,
      image: null
    });
    setError('');
    setShowProductModal(true);
  };

  return (
    <div className="py-28 bg-grain-cream/30 min-h-screen">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Success Alert Top */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl flex items-center gap-3 font-semibold text-sm shadow-sm"
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar Navigation */}
          <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="w-10 h-10 rounded-full bg-grain-green text-white font-bold flex items-center justify-center text-sm shadow-md">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{user.username}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.get_role_display || user.role}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5" role="tablist">
              {/* Customer navigation */}
              {user.role === 'customer' && (
                <>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'orders' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Clipboard className="w-4.5 h-4.5" /> Order History
                  </button>
                  <button
                    onClick={() => setActiveTab('profile_settings')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'profile_settings' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-4.5 h-4.5" /> Profile Settings
                  </button>
                </>
              )}

              {/* Dealer navigation */}
              {user.role === 'dealer' && (
                <>
                  <button
                    onClick={() => setActiveTab('dealer_overview')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'dealer_overview' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-4.5 h-4.5" /> Dealership Info
                  </button>
                  <button
                    onClick={() => setActiveTab('dealer_commissions')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'dealer_commissions' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4.5 h-4.5" /> Commission Ledgers
                  </button>
                  <button
                    onClick={() => setActiveTab('dealer_docs')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'dealer_docs' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-4.5 h-4.5" /> Onboarding Documents
                  </button>
                </>
              )}

              {/* Admin Navigation */}
              {user.role !== 'customer' && user.role !== 'dealer' && (
                <>
                  <button
                    onClick={() => setActiveTab('admin_products')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'admin_products' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Clipboard className="w-4.5 h-4.5" /> Catalogue Manager
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_dealers')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'admin_dealers' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4.5 h-4.5" /> Dealer Onboarding
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_crm')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'admin_crm' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" /> CRM Leads
                  </button>
                  <button
                    onClick={() => setActiveTab('admin_reports')}
                    className={`px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${
                      activeTab === 'admin_reports' ? 'bg-grain-green text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-4.5 h-4.5" /> KPI Reports
                  </button>
                </>
              )}

              <button
                onClick={onLogout}
                className="px-4 py-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 text-red-500 hover:bg-red-50 transition-all border border-transparent mt-4 hover:border-red-100"
              >
                <LogOut className="w-4.5 h-4.5" /> Log Out
              </button>
            </nav>
          </div>

          {/* RIGHT COLUMN: Tab Panel View Content */}
          <div className="lg:col-span-9 bg-white p-8 sm:p-12 rounded-[2rem] border border-gray-100 shadow-sm min-h-[500px]">
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader className="w-10 h-10 text-grain-green animate-spin" />
                <span className="text-xs font-bold text-gray-500">Retrieving details...</span>
              </div>
            )}

            {!loading && (
              <>
                {/* ======================================================== */}
                {/* 1. CUSTOMER VIEW: ORDERS */}
                {/* ======================================================== */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Your Order History</h2>
                    {customerOrders.length === 0 ? (
                      <p className="text-gray-400 italic text-sm">You haven't placed any orders yet.</p>
                    ) : (
                      <div className="space-y-6">
                        {customerOrders.map((ord) => (
                          <div key={ord.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <div className="flex flex-wrap justify-between items-center gap-3">
                              <div>
                                <p className="text-xs text-gray-400 font-bold">ORDER NUMBER</p>
                                <p className="font-extrabold text-gray-900">{ord.order_number}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 font-bold">DATE</p>
                                <p className="font-bold text-gray-700 text-sm">{new Date(ord.created_at).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 font-bold">TOTAL AMOUNT</p>
                                <p className="font-black text-grain-green">₹{ord.total_amount}</p>
                              </div>
                              <div className="flex gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  ord.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {ord.order_status.toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  ord.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  PAYMENT: {ord.payment_status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Item summaries inside this order */}
                            <div className="border-t border-gray-100 pt-3 space-y-2">
                              {ord.items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs font-semibold text-gray-600">
                                  <span>{item.product_name} (x{item.quantity})</span>
                                  <span>₹{item.total_price}</span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                              <p className="text-[11px] text-gray-400">Ship to: <strong>{ord.delivery_address}</strong></p>
                              <button 
                                onClick={() => handleFetchInvoice(ord.order_number)}
                                className="btn-outline py-2 px-4 text-xs font-bold shadow-sm"
                              >
                                View Invoice
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 2. CUSTOMER VIEW: PROFILE SETTINGS */}
                {/* ======================================================== */}
                {activeTab === 'profile_settings' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Profile Settings</h2>
                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}
                    
                    <form onSubmit={handleCustomerProfileSubmit} className="space-y-4 max-w-xl">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
                          <input
                            type="text"
                            value={customerProfileForm.first_name}
                            onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, first_name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
                          <input
                            type="text"
                            value={customerProfileForm.last_name}
                            onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, last_name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={customerProfileForm.email}
                          onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact Number</label>
                        <input
                          type="text"
                          value={customerProfileForm.phone}
                          onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Delivery Address</label>
                        <input
                          type="text"
                          value={customerProfileForm.address}
                          onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, address: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">City</label>
                          <input
                            type="text"
                            value={customerProfileForm.city}
                            onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, city: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">State</label>
                          <input
                            type="text"
                            value={customerProfileForm.state}
                            onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, state: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-primary py-3.5 px-8 font-bold">
                        Save Profile Settings
                      </button>
                    </form>
                  </div>
                )}

                {/* ======================================================== */}
                {/* 3. DEALER VIEW: OVERVIEW */}
                {/* ======================================================== */}
                {activeTab === 'dealer_overview' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Dealership Details</h2>
                    
                    <div className="grid sm:grid-cols-2 gap-6 pt-2">
                      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <p className="text-xs text-gray-400 font-bold">DEALER CODE</p>
                        <p className="font-extrabold text-lg text-gray-900">{profile?.dealer_code}</p>
                        <p className="text-xs text-gray-400 font-bold mt-4">BUSINESS NAME</p>
                        <p className="font-extrabold text-gray-900">{profile?.business_name}</p>
                        <p className="text-xs text-gray-400 font-bold mt-4">COMMISSION RATE</p>
                        <p className="font-extrabold text-grain-gold text-base">{profile?.commission_rate}% on orders</p>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <p className="text-xs text-gray-400 font-bold">ASSIGNED TERRITORY</p>
                        <p className="font-extrabold text-lg text-grain-green">{profile?.territory_name || 'Pune Region'}</p>
                        <p className="text-xs text-gray-400 font-bold mt-4">STATUS</p>
                        <span className="inline-flex text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          {profile?.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Dealer Monthly Performance */}
                    {dealerAnalytics?.monthly_performance?.length > 0 && (
                      <div className="pt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Performance Tracker</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 uppercase tracking-widest text-[10px] font-bold border-b border-gray-100">
                                <th className="p-3">Month</th>
                                <th className="p-3 text-right">Orders</th>
                                <th className="p-3 text-right">Total Sales</th>
                                <th className="p-3 text-right">Unique Clients</th>
                                <th className="p-3 text-right">Growth Rate</th>
                              </tr>
                            </thead>
                            <tbody className="font-semibold text-gray-700">
                              {dealerAnalytics.monthly_performance.map((perf) => (
                                <tr key={perf.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                  <td className="p-3">{perf.month}</td>
                                  <td className="p-3 text-right">{perf.total_orders}</td>
                                  <td className="p-3 text-right text-grain-green">₹{perf.total_sales}</td>
                                  <td className="p-3 text-right">{perf.total_customers}</td>
                                  <td className="p-3 text-right text-grain-gold">{perf.growth_percentage}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 4. DEALER VIEW: COMMISSIONS */}
                {/* ======================================================== */}
                {activeTab === 'dealer_commissions' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Commission Ledger</h2>
                    
                    {/* Summary row */}
                    {dealerAnalytics?.summary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold">TOTAL SALES</p>
                          <p className="text-lg font-black text-gray-900">₹{dealerAnalytics.summary.total_sales}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold">TOTAL EARNED</p>
                          <p className="text-lg font-black text-grain-green">₹{dealerAnalytics.summary.total_commissions}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold">PAID PAYOUTS</p>
                          <p className="text-lg font-black text-gray-700">₹{dealerAnalytics.summary.paid_payout}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-bold">PENDING PAYOUTS</p>
                          <p className="text-lg font-black text-grain-gold">₹{dealerAnalytics.summary.pending_payout}</p>
                        </div>
                      </div>
                    )}

                    {dealerCommissions.length === 0 ? (
                      <p className="text-gray-400 italic text-sm">No commissions earned yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 uppercase tracking-widest text-[10px] font-bold border-b border-gray-100">
                              <th className="p-3">Order Ref</th>
                              <th className="p-3 text-right">Sale Amount</th>
                              <th className="p-3 text-right">Rate</th>
                              <th className="p-3 text-right">Commission</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3">Payout Date</th>
                            </tr>
                          </thead>
                          <tbody className="font-semibold text-gray-700">
                            {dealerCommissions.map((comm) => (
                              <tr key={comm.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="p-3 text-gray-900">{comm.order_number}</td>
                                <td className="p-3 text-right">₹{comm.sales_amount}</td>
                                <td className="p-3 text-right text-gray-400">{comm.commission_percentage}%</td>
                                <td className="p-3 text-right text-grain-green">₹{comm.commission_amount}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    comm.payout_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {comm.payout_status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-gray-400">{comm.payout_date ? new Date(comm.payout_date).toLocaleDateString() : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 5. DEALER VIEW: DOCUMENTS */}
                {/* ======================================================== */}
                {activeTab === 'dealer_docs' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Onboarding Documents</h2>
                    
                    {error && <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

                    {/* Upload Form */}
                    <form onSubmit={handleDealerDocUploadSubmit} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 grid sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Document Type</label>
                        <select
                          value={uploadDocForm.document_type}
                          onChange={(e) => setUploadDocForm({ ...uploadDocForm, document_type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                        >
                          <option value="gst_registration">GST Registration Certificate</option>
                          <option value="pan_card">PAN Card copy</option>
                          <option value="business_permit">Trade/Business Permit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select File (PDF/Image)</label>
                        <input
                          id="doc-file-input"
                          type="file"
                          required
                          onChange={(e) => setUploadDocForm({ ...uploadDocForm, file: e.target.files[0] })}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-grain-green file:text-white hover:file:bg-grain-green-dark"
                        />
                      </div>
                      <div>
                        <button type="submit" className="w-full btn-primary py-2.5 text-sm font-bold shadow-md">
                          <Upload className="w-4 h-4" /> Upload Document
                        </button>
                      </div>
                    </form>

                    {/* List Uploaded Docs */}
                    <div className="pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Uploaded Verification Documents</h3>
                      {dealerDocs.length === 0 ? (
                        <p className="text-gray-400 italic text-sm">No files uploaded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {dealerDocs.map((doc) => (
                            <div key={doc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm text-gray-900 uppercase">{doc.document_type.replace('_', ' ')}</p>
                                <p className="text-[10px] text-gray-400">Uploaded on: {new Date(doc.uploaded_at || new Date()).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  doc.verification_status === 'verified'
                                    ? 'bg-green-100 text-green-700'
                                    : doc.verification_status === 'rejected'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {doc.verification_status.toUpperCase()}
                                </span>
                                <a 
                                  href={doc.document_file} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-grain-green hover:underline font-bold"
                                >
                                  View File
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* 6. ADMIN VIEW: CATALOGUE CRUD */}
                {/* ======================================================== */}
                {activeTab === 'admin_products' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Product Catalogue Management</h2>
                      <button onClick={openProductCreateModal} className="btn-primary py-2.5 text-xs font-bold shadow-md">
                        <Plus className="w-4 h-4" /> Add Product
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {adminProducts.map((prod) => (
                        <div key={prod.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                              <img
                                src={prod.image ? prod.image : 'images/toor-dal.png'}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'images/toor-dal.png'; }}
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">{prod.name}</h4>
                              <p className="text-[10px] text-gray-400">SKU: {prod.sku} | Stock: <strong>{prod.available_stock || prod.stock} kg</strong></p>
                              <p className="text-xs font-bold text-grain-green">₹{prod.price} / kg</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              prod.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {prod.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            
                            <button
                              onClick={() => openProductEditModal(prod)}
                              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                              title="Edit product details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.slug)}
                              className="p-2 border border-red-100 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                              title="Remove product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* 7. ADMIN VIEW: DEALER APPROVALS */}
                {/* ======================================================== */}
                {activeTab === 'admin_dealers' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Dealership Approval Onboarding</h2>
                    
                    {dealersList.length === 0 ? (
                      <p className="text-gray-400 italic text-sm">No dealers registered on the platform.</p>
                    ) : (
                      <div className="space-y-6">
                        {dealersList.map((dl) => (
                          <div key={dl.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <h3 className="font-extrabold text-base text-gray-900 leading-tight">{dl.business_name}</h3>
                                <p className="text-xs text-gray-500 mt-1">Owner: <strong>{dl.owner_name}</strong> | Email: {dl.email} | Phone: {dl.phone}</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase">GSTIN: {dl.gst_number} | PAN: {dl.pan_number}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  dl.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : dl.status === 'pending_verification' 
                                      ? 'bg-orange-100 text-orange-700' 
                                      : 'bg-red-100 text-red-700'
                                }`}>
                                  {dl.status.toUpperCase().replace('_', ' ')}
                                </span>
                                <span className="text-xs text-gray-400 font-semibold">Territory: {dl.territory_details?.territory_name || 'Pune Region'}</span>
                                <span className="text-xs text-grain-gold font-bold">Commission Rate: {dl.commission_rate}%</span>
                              </div>
                            </div>

                            {/* Verification Documents Uploaded */}
                            {dl.documents && dl.documents.length > 0 && (
                              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verification Documents</p>
                                {dl.documents.map((doc) => (
                                  <div key={doc.id} className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-gray-700 uppercase">{doc.document_type.replace('_', ' ')}</span>
                                    <div className="flex items-center gap-3">
                                      <a href={doc.document_file} target="_blank" rel="noopener noreferrer" className="text-grain-green font-bold hover:underline">View File</a>
                                      {doc.verification_status === 'pending' ? (
                                        <div className="flex gap-1.5">
                                          <button onClick={() => handleVerifyDocument(doc.id, 'verified')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve doc"><Check className="w-4 h-4" /></button>
                                          <button onClick={() => handleVerifyDocument(doc.id, 'rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject doc"><X className="w-4 h-4" /></button>
                                        </div>
                                      ) : (
                                        <span className={`text-[9px] font-bold px-2 rounded-full ${doc.verification_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{doc.verification_status.toUpperCase()}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons to Approve */}
                            <div className="flex justify-end pt-2">
                              {dl.status !== 'active' ? (
                                <button 
                                  onClick={() => { setApprovingDealerId(dl.id); setApprovalForm({ commission_rate: dl.commission_rate, status: 'active' }); }}
                                  className="btn-primary py-2 px-6 text-xs font-bold"
                                >
                                  Onboard & Approve Dealer
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { setApprovingDealerId(dl.id); setApprovalForm({ commission_rate: dl.commission_rate, status: 'suspended' }); }}
                                  className="btn-outline py-2 px-6 text-xs font-bold border-red-500 text-red-500 hover:bg-red-50"
                                >
                                  Suspend Dealer
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 8. ADMIN VIEW: CRM LEADS */}
                {/* ======================================================== */}
                {activeTab === 'admin_crm' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Wholesale Enquiry CRM Leads</h2>
                    {enquiriesList.length === 0 ? (
                      <p className="text-gray-400 italic text-sm">No wholesale enquiries received.</p>
                    ) : (
                      <div className="space-y-4">
                        {enquiriesList.map((enq) => (
                          <div key={enq.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{enq.customer_name}</h4>
                                <p className="text-xs text-gray-400">Enquiry No: {enq.enquiry_number} | Contact: {enq.phone} | {enq.email}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-grain-gold-light text-grain-gold-dark rounded-full">
                                {enq.enquiry_type?.toUpperCase() || 'WHOLESALE'}
                              </span>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 text-xs text-gray-600 leading-relaxed font-semibold">
                              <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Message:</p>
                              {enq.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 9. ADMIN VIEW: REPORTS */}
                {/* ======================================================== */}
                {activeTab === 'admin_reports' && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-50 pb-4">Key Performance KPI Reports</h2>
                    
                    {/* Generate Report Form */}
                    <form onSubmit={handleGenerateReportSubmit} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 grid sm:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Report Stream</label>
                        <select
                          value={reportForm.report_type}
                          onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                        >
                          <option value="sales">Sales & Revenue Report</option>
                          <option value="inventory">Inventory & Stock Level Report</option>
                          <option value="dealers">Dealer Commissions Report</option>
                          <option value="crm">CRM Interaction Summary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={reportForm.start_date}
                          onChange={(e) => setReportForm({ ...reportForm, start_date: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">End Date</label>
                        <input
                          type="date"
                          value={reportForm.end_date}
                          onChange={(e) => setReportForm({ ...reportForm, end_date: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <button type="submit" disabled={loading} className="w-full btn-secondary py-2.5 text-sm font-bold shadow-md">
                          Generate Report
                        </button>
                      </div>
                    </form>

                    {/* Report listing */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Completed Excel Reports</h3>
                      {reportsList.length === 0 ? (
                        <p className="text-gray-400 italic text-sm">No reports generated yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {reportsList.map((rep) => (
                            <div key={rep.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm text-gray-900">{rep.report_name}</p>
                                <p className="text-[10px] text-gray-400">Stream: {rep.report_type.toUpperCase()} | Generated by: {rep.generated_by_username}</p>
                              </div>
                              
                              {/* Open link to download report */}
                              <a
                                href={`${apiBaseUrl}/api/v1/reports/download/${rep.id}/?signature=${rep.signature || 'dev'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-grain-gold hover:underline font-extrabold flex items-center gap-1"
                              >
                                Download Excel
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* INVOICE PREVIEW MODAL */}
      {/* ======================================================== */}
      {invoiceHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-extrabold text-gray-900">HTML Invoice Details</h3>
                <p className="text-xs text-gray-400">Invoice reference for Order Ref: {viewingInvoiceNumber}</p>
              </div>
              <button 
                onClick={() => { setInvoiceHtml(null); setViewingInvoiceNumber(''); }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-950"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Embed HTML Content using srcdoc */}
            <iframe 
              title="Invoice"
              srcDoc={invoiceHtml} 
              className="flex-1 w-full border-0"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN EDIT/CREATE PRODUCT MODAL */}
      {/* ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 sm:p-12 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowProductModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingProduct ? `Edit Catalog: ${editingProduct.name}` : 'Add New Product to Catalog'}
            </h3>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}

            <form onSubmit={handleProductFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toor Dal"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">SKU Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TD-PREM-001"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price (₹/kg)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="120.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Stock Weight (kg)</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bag Weight (kg)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={productForm.weight}
                    onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white"
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quality Grade</label>
                  <select
                    value={productForm.quality_grade}
                    onChange={(e) => setProductForm({ ...productForm, quality_grade: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white"
                  >
                    {qualityGrades.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Short Description</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize product features..."
                  value={productForm.short_description}
                  onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Detailed Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Enter full description, farm details, sorting info..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Image (File)</label>
                <input
                  type="file"
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.files[0] })}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-grain-green file:text-white hover:file:bg-grain-green-dark"
                />
              </div>

              <div className="flex gap-6 items-center pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                    className="text-grain-green focus:ring-grain-green h-4 w-4 rounded"
                  />
                  Feature this product on homepage
                </label>
                
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="text-grain-green focus:ring-grain-green h-4 w-4 rounded"
                  />
                  Mark as active (visible to buyers)
                </label>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-grain-green/20 mt-4">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : editingProduct ? 'Update Catalogue Product' : 'Add Catalogue Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN DEALER APPROVAL OVERLAY FORM MODAL */}
      {/* ======================================================== */}
      {approvingDealerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 sm:p-12 shadow-2xl relative border border-gray-100">
            <button 
              onClick={() => setApprovingDealerId(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-6">Modify Dealership Status</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

            <form onSubmit={handleApproveDealerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Action Status</label>
                <select
                  value={approvalForm.status}
                  onChange={(e) => setApprovalForm({ ...approvalForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white"
                >
                  <option value="active">Approve & Make Active</option>
                  <option value="suspended">Suspend Dealership</option>
                  <option value="rejected">Reject Dealership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Commission Rate Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2.50"
                  value={approvalForm.commission_rate}
                  onChange={(e) => setApprovalForm({ ...approvalForm, commission_rate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3 text-sm font-bold shadow-md mt-4">
                Confirm Status Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;
