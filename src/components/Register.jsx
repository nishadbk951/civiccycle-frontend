import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './Axios';
import { LOCATION_DATA } from './Location';

const SERIF_FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const SANS_FONT = { fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" };

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

function CivicCycleLogo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width="36"
        height="36"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M10.5 21.5C11.8 14.4 18 9 25.5 9C32.2 9 37.9 13.4 39.8 19.5"
          stroke="#E85D2A"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M36.5 17.5L40.4 21.2L42.8 16.4"
          stroke="#E85D2A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M37.5 26.5C36.2 33.6 30 39 22.5 39C15.8 39 10.1 34.6 8.2 28.5"
          stroke="#E85D2A"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M11.5 30.5L7.6 26.8L5.2 31.6"
          stroke="#E85D2A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 14.5C19.3 14.5 15.5 18.2 15.5 22.8C15.5 28.4 24 36.2 24 36.2C24 36.2 32.5 28.4 32.5 22.8C32.5 18.2 28.7 14.5 24 14.5Z"
          fill="#3D2B1F"
        />
        <path
          d="M24 27.2C24 27.2 28.2 25.4 28.2 21.2C28.2 20.6 28.1 20.1 28 19.8C27.5 19.7 27 19.6 26.4 19.6C22.2 19.6 20.4 23.6 20.4 23.6C21.5 24.4 22.7 25.5 24 27.2Z"
          fill="#FAF8F5"
        />
        <path
          d="M21.8 25.8C23 24.1 24.7 22.6 26.7 21.3"
          stroke="#E85D2A"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>

      <span
        style={SERIF_FONT}
        className="text-xl sm:text-2xl font-bold tracking-tight leading-none text-[#3D2B1F]"
      >
        Civic<span className="text-[#E85D2A]">Cycle</span>
      </span>
    </div>
  );
}

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
    <div
      style={SANS_FONT}
      className="min-h-screen bg-[#FAF8F5] text-[#3D2B1F] flex items-center justify-center py-8 px-4 sm:px-6"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E6E0D4] shadow-[0_8px_30px_rgba(61,43,31,0.05)] overflow-hidden">
        <div className="p-6 sm:p-9">
          <div className="mb-6">
            <CivicCycleLogo />
          </div>

          <div className="pb-5 border-b border-[#EDE8DF]">
            <h1
              style={SERIF_FONT}
              className="text-2xl sm:text-3xl font-bold text-[#3D2B1F] tracking-tight inline-block"
            >
              Create an Account
              <span className="block h-1.5 w-24 bg-[#F9D548] rounded-full mt-1.5" />
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5B4E] font-medium mt-2">
              Select your role below to register as a Citizen or a Ward Collector.
            </p>
          </div>

          {message && (
            <div className="mt-5 px-4 py-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#14532D] text-sm font-semibold flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#15803D] text-white flex items-center justify-center text-xs shrink-0">
                ✓
              </span>
              <span>{message}</span>
            </div>
          )}

          {serverError && (
            <div className="mt-5 px-4 py-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-sm font-semibold flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-xs shrink-0">
                ✕
              </span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-2">
                Select Account Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('USER')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    formData.role === 'USER'
                      ? 'border-[#3D2B1F] bg-[#FFFDF8] ring-1 ring-[#3D2B1F]'
                      : 'border-[#E6E0D4] bg-[#FAF8F5] hover:border-[#C7BCAF]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      formData.role === 'USER'
                        ? 'bg-[#F9D548] text-[#3D2B1F]'
                        : 'bg-white text-[#6B5B4E] border border-[#E6E0D4]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#3D2B1F]">Citizen</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.role === 'USER' ? 'border-[#3D2B1F] bg-[#3D2B1F]' : 'border-[#C7BCAF]'
                        }`}
                      >
                        {formData.role === 'USER' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5B4E] font-medium mt-0.5">
                      Schedule doorstep waste pickups
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('COLLECTOR')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    formData.role === 'COLLECTOR'
                      ? 'border-[#3D2B1F] bg-[#FFFDF8] ring-1 ring-[#3D2B1F]'
                      : 'border-[#E6E0D4] bg-[#FAF8F5] hover:border-[#C7BCAF]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      formData.role === 'COLLECTOR'
                        ? 'bg-[#F9D548] text-[#3D2B1F]'
                        : 'bg-white text-[#6B5B4E] border border-[#E6E0D4]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#3D2B1F]">Waste Collector</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.role === 'COLLECTOR' ? 'border-[#3D2B1F] bg-[#3D2B1F]' : 'border-[#C7BCAF]'
                        }`}
                      >
                        {formData.role === 'COLLECTOR' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5B4E] font-medium mt-0.5">
                      Ward collection (ID required)
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8F80]">
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
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-medium text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none transition-colors ${
                      fieldErrors.name
                        ? 'border-[#DC2626] bg-[#FEF2F2]'
                        : 'border-[#DED6C9] bg-[#FAF8F5] focus:bg-white focus:border-[#3D2B1F]'
                    }`}
                  />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-[#B91C1C] font-semibold">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[#DED6C9] bg-[#F3EDE3] text-[#3D2B1F] text-xs font-bold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className={`w-full px-3.5 py-2.5 border rounded-r-xl text-sm font-medium text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none transition-colors ${
                      fieldErrors.phone
                        ? 'border-[#DC2626] bg-[#FEF2F2]'
                        : 'border-[#DED6C9] bg-[#FAF8F5] focus:bg-white focus:border-[#3D2B1F]'
                    }`}
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-[#B91C1C] font-semibold">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8F80]">
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
                  className={`w-full pl-10 pr-20 py-2.5 border rounded-xl text-sm font-medium text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none transition-colors ${
                    fieldErrors.password
                      ? 'border-[#DC2626] bg-[#FEF2F2]'
                      : 'border-[#DED6C9] bg-[#FAF8F5] focus:bg-white focus:border-[#3D2B1F]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#3D2B1F] bg-[#F3EDE3] hover:bg-[#E6E0D4] px-3 py-1 rounded-full cursor-pointer transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-[#B91C1C] font-semibold">{fieldErrors.password}</p>
              )}
            </div>

            {formData.role === 'COLLECTOR' && (
              <div className="bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#E6E0D4] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#E6E0D4]">
                  <span className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider">
                    Collector KYC & Jurisdiction
                  </span>
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                    Admin Approval Required
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                    Select Government ID Type
                  </label>
                  <div className="p-1 bg-[#EDE8DF] rounded-full grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleIdTypeChange('AADHAAR')}
                      className={`py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        formData.id_type === 'AADHAAR'
                          ? 'bg-[#3D2B1F] text-white shadow-2xs'
                          : 'text-[#6B5B4E] hover:text-[#3D2B1F]'
                      }`}
                    >
                      Aadhaar Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIdTypeChange('DRIVING_LICENSE')}
                      className={`py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        formData.id_type === 'DRIVING_LICENSE'
                          ? 'bg-[#3D2B1F] text-white shadow-2xs'
                          : 'text-[#6B5B4E] hover:text-[#3D2B1F]'
                      }`}
                    >
                      Driving License
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
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
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none transition-colors ${
                      fieldErrors.id_card_number
                        ? 'border-[#DC2626] bg-[#FEF2F2]'
                        : 'border-[#DED6C9] bg-white focus:border-[#3D2B1F]'
                    }`}
                  />
                  {fieldErrors.id_card_number && (
                    <p className="mt-1 text-xs text-[#B91C1C] font-semibold">{fieldErrors.id_card_number}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                      Assigned District
                    </label>
                    <select
                      name="assigned_district"
                      value={formData.assigned_district}
                      onChange={handleDistrictChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED6C9] rounded-xl text-sm font-semibold text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
                    >
                      {Object.keys(LOCATION_DATA).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                      Municipality / Local Body
                    </label>
                    <select
                      name="assigned_municipality"
                      value={formData.assigned_municipality}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED6C9] rounded-xl text-sm font-semibold text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
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
              className={`w-full py-3.5 px-6 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer ${
                loading
                  ? 'bg-[#E6E0D4] text-[#6B5B4E] cursor-not-allowed'
                  : 'bg-[#F9D548] hover:bg-[#F3C623] text-[#3D2B1F] active:scale-[0.99] shadow-xs'
              }`}
            >
              {loading
                ? 'Submitting...'
                : formData.role === 'COLLECTOR'
                ? 'Submit Collector Application'
                : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#EDE8DF] text-center">
          <p className="text-sm font-medium text-[#6B5B4E]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#E85D2A] hover:text-[#C2410C] underline underline-offset-2"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;