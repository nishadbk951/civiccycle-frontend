import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './Axios';

const SERIF_FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const SANS_FONT = { fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" };

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

function Login() {
  const navigate = useNavigate();

  const [details, setDetails] = useState({
    phone: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!details.phone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!/^[0-9]{10}$/.test(details.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!details.password) {
      errors.password = 'Password is required.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phone: details.phone.trim(),
        password: details.password,
      };

      const res = await API.post('login/', payload);

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user_role', res.data.role);

      if (res.data.name) {
        localStorage.setItem('user_name', res.data.name);
      }

      if (res.data.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (res.data.role === 'COLLECTOR') {
        navigate('/collector-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const backendError = err.response.data.detail || err.response.data.error;
        setServerError(backendError || 'Invalid mobile number or password.');
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
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E0D4] shadow-[0_8px_30px_rgba(61,43,31,0.05)] overflow-hidden">
        <div className="p-6 sm:p-9">
          <div className="mb-6">
            <CivicCycleLogo />
          </div>

          <div className="pb-5 border-b border-[#EDE8DF]">
            <h1
              style={SERIF_FONT}
              className="text-2xl sm:text-3xl font-bold text-[#3D2B1F] tracking-tight inline-block"
            >
              Sign In
              <span className="block h-1.5 w-16 bg-[#F9D548] rounded-full mt-1.5" />
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5B4E] font-medium mt-2">
              Enter your registered mobile number and password to continue.
            </p>
          </div>

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
                  value={details.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full px-3.5 py-2.5 border rounded-r-xl text-sm font-medium text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none transition-colors ${
                    fieldErrors.phone
                      ? 'border-[#DC2626] bg-[#FEF2F2]'
                      : 'border-[#DED6C9] bg-[#FAF8F5] focus:bg-white focus:border-[#3D2B1F]'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-[#B91C1C] font-semibold">{fieldErrors.phone}</p>
              )}
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
                  value={details.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer mt-2 ${
                loading
                  ? 'bg-[#E6E0D4] text-[#6B5B4E] cursor-not-allowed'
                  : 'bg-[#F9D548] hover:bg-[#F3C623] text-[#3D2B1F] active:scale-[0.99] shadow-xs'
              }`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#EDE8DF] text-center">
          <p className="text-sm font-medium text-[#6B5B4E]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#E85D2A] hover:text-[#C2410C] underline underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;