import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './Axios';
import { LOCATION_DATA } from './Location';

const initialFormState = {
  name: '',
  phone: '',
  password: '',
  role: 'USER',
  id_type: 'AADHAAR',
  id_card_number: '',
  assigned_district: 'Kozhikode',
  assigned_municipality: LOCATION_DATA['Kozhikode'][0],
};

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
    setFieldErrors((prev) => ({ ...prev, id_card_number: '' }));
  };

  const handleIdTypeChange = (selectedIdType) => {
    setFormData((prev) => ({
      ...prev,
      id_type: selectedIdType,
      id_card_number: '',
    }));
    setFieldErrors((prev) => ({ ...prev, id_card_number: '' }));
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setFormData((prev) => ({
      ...prev,
      assigned_district: selectedDistrict,
      assigned_municipality: LOCATION_DATA[selectedDistrict][0],
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (formData.role === 'COLLECTOR') {
      const cleanedId = formData.id_card_number.trim().replace(/\s+/g, '');
      if (!cleanedId) {
        errors.id_card_number =
          formData.id_type === 'AADHAAR'
            ? 'Aadhaar card number is required.'
            : 'Driving license number is required.';
      } else if (formData.id_type === 'AADHAAR' && !/^[0-9]{12}$/.test(cleanedId)) {
        errors.id_card_number = 'Enter a valid 12-digit Aadhaar number.';
      } else if (formData.id_type === 'DRIVING_LICENSE' && cleanedId.length < 8) {
        errors.id_card_number = 'Enter a valid Driving License number (e.g., KL1120200012345).';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setServerError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const formattedId =
        formData.role === 'COLLECTOR'
          ? `${formData.id_type === 'AADHAAR' ? 'Aadhaar' : 'DL'}: ${formData.id_card_number.trim()}`
          : '';

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        id_card_number: formattedId,
        assigned_district: formData.assigned_district,
        assigned_municipality: formData.assigned_municipality,
      };

      await API.post('register/', payload);

      if (formData.role === 'COLLECTOR') {
        setMessage(
          'Collector application submitted! An administrator will verify your ID before activating your account.'
        );
        setFormData(initialFormState);
      } else {
        setMessage('Account created successfully! Redirecting to Sign In...');
        setFormData(initialFormState);
        setTimeout(() => navigate('/login'), 1800);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const backendFieldErrors = {};
          Object.entries(errorData).forEach(([key, val]) => {
            backendFieldErrors[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
          setFieldErrors(backendFieldErrors);
        } else {
          setServerError('Registration failed. Please check the provided information.');
        }
      } else {
        setServerError('Unable to reach server. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
        
        <div className="h-1.5 w-full bg-blue-700" />

        <div className="p-6 sm:p-8">
          
          <div className="pb-5 border-b border-slate-200">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Select your role below to register as a Citizen or a Ward Collector.
            </p>
          </div>

          
          {message && (
            <div className="mt-5 p-3.5 rounded-xl bg-teal-50 border-l-4 border-teal-700 text-teal-950 text-sm font-semibold flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs shrink-0">
                ✓
              </span>
              <span>{message}</span>
            </div>
          )}
          {serverError && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-50 border-l-4 border-red-700 text-red-950 text-sm font-semibold flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-xs shrink-0">
                ✕
              </span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Select Account Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('USER')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    formData.role === 'USER'
                      ? 'border-blue-700 bg-blue-50/70'
                      : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      formData.role === 'USER'
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">Citizen</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.role === 'USER' ? 'border-blue-700 bg-blue-700' : 'border-slate-400'
                        }`}
                      >
                        {formData.role === 'USER' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Schedule doorstep waste pickups
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('COLLECTOR')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    formData.role === 'COLLECTOR'
                      ? 'border-blue-700 bg-blue-50/70'
                      : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      formData.role === 'COLLECTOR'
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">Waste Collector</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.role === 'COLLECTOR' ? 'border-blue-700 bg-blue-700' : 'border-slate-400'
                        }`}
                      >
                        {formData.role === 'COLLECTOR' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Ward collection (ID required)
                    </p>
                  </div>
                </button>
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-3.5 py-2.5 border-2 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none ${
                      fieldErrors.name
                        ? 'border-red-600 bg-red-50'
                        : 'border-slate-300 bg-white focus:border-blue-700'
                    }`}
                  />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-red-700 font-bold">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border-2 border-r-0 border-slate-300 bg-slate-100 text-slate-800 text-xs font-extrabold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className={`w-full px-3.5 py-2.5 border-2 rounded-r-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none ${
                      fieldErrors.phone
                        ? 'border-red-600 bg-red-50'
                        : 'border-slate-300 bg-white focus:border-blue-700'
                    }`}
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-700 font-bold">{fieldErrors.phone}</p>}
              </div>
            </div>

            
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`w-full pl-10 pr-20 py-2.5 border-2 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none ${
                    fieldErrors.password
                      ? 'border-red-600 bg-red-50'
                      : 'border-slate-300 bg-white focus:border-blue-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-700 font-bold">{fieldErrors.password}</p>
              )}
            </div>

            
            {formData.role === 'COLLECTOR' && (
              <div className="bg-slate-100 p-4 sm:p-5 rounded-xl border-2 border-slate-300 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-300">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Collector KYC & Jurisdiction
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-400">
                    Admin Approval Required
                  </span>
                </div>

                
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Select Government ID Type
                  </label>
                  <div className="p-1 bg-slate-200 rounded-xl grid grid-cols-2 gap-1 border border-slate-300">
                    <button
                      type="button"
                      onClick={() => handleIdTypeChange('AADHAAR')}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        formData.id_type === 'AADHAAR'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-800 hover:bg-slate-300/60'
                      }`}
                    >
                      Aadhaar Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIdTypeChange('DRIVING_LICENSE')}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        formData.id_type === 'DRIVING_LICENSE'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-800 hover:bg-slate-300/60'
                      }`}
                    >
                      Driving License
                    </button>
                  </div>
                </div>

                
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    {formData.id_type === 'AADHAAR' ? '12-Digit Aadhaar Number' : 'Driving License Number'}
                  </label>
                  <input
                    type="text"
                    name="id_card_number"
                    maxLength={formData.id_type === 'AADHAAR' ? 14 : 20}
                    value={formData.id_card_number}
                    onChange={handleChange}
                    placeholder={
                      formData.id_type === 'AADHAAR'
                        ? 'Enter 12-digit Aadhaar number'
                        : 'e.g., KL11 20210012345'
                    }
                    className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none ${
                      fieldErrors.id_card_number
                        ? 'border-red-600 bg-red-50'
                        : 'border-slate-300 focus:border-blue-700'
                    }`}
                  />
                  {fieldErrors.id_card_number && (
                    <p className="mt-1 text-xs text-red-700 font-bold">{fieldErrors.id_card_number}</p>
                  )}
                </div>

                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Assigned District
                    </label>
                    <select
                      name="assigned_district"
                      value={formData.assigned_district}
                      onChange={handleDistrictChange}
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-700"
                    >
                      {Object.keys(LOCATION_DATA).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Municipality / Local Body
                    </label>
                    <select
                      name="assigned_municipality"
                      value={formData.assigned_municipality}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-700"
                    >
                      {LOCATION_DATA[formData.assigned_district].map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-5 rounded-xl text-white font-extrabold text-sm tracking-wide transition-all cursor-pointer ${
                loading
                  ? 'bg-slate-500 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 active:scale-[0.99] shadow-sm'
              }`}
            >
              {loading
                ? 'Submitting...'
                : formData.role === 'COLLECTOR'
                ? 'Submit Collector Application'
                : 'Register'}
            </button>
          </form>
        </div>

        
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-blue-700 hover:text-blue-900 underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;