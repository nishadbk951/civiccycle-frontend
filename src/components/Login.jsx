import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './Axios';

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
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
        
        <div className="h-1.5 w-full bg-blue-700" />

        <div className="p-6 sm:p-8">
          
          <div className="pb-5 border-b border-slate-200">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Enter your registered mobile number and password to continue.
            </p>
          </div>

          
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
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3.5 rounded-l-xl border-2 border-r-0 border-slate-300 bg-slate-100 text-slate-800 text-xs font-extrabold select-none">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  maxLength="10"
                  value={details.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full px-3.5 py-2.5 border-2 rounded-r-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none ${
                    fieldErrors.phone
                      ? 'border-red-600 bg-red-50'
                      : 'border-slate-300 bg-white focus:border-blue-700'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-700 font-bold">{fieldErrors.phone}</p>
              )}
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
                  value={details.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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

            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-5 rounded-xl text-white font-extrabold text-sm tracking-wide transition-all cursor-pointer mt-2 ${
                loading
                  ? 'bg-slate-500 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 active:scale-[0.99] shadow-sm'
              }`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-blue-700 hover:text-blue-900 underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;