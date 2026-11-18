import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './Axios';
import { LOCATION_DATA } from './Location';

const BACKEND_BASE_URL = (API.defaults.baseURL || '').replace(/\/api\/?$/, '');

function UserDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [userName, setUserName] = useState('');

  const [formData, setFormData] = useState({
    district: 'Kozhikode',
    municipality: LOCATION_DATA['Kozhikode'] ? LOCATION_DATA['Kozhikode'][0] : '',
    ward_no: '1',
    house_details: '',
  });

  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsMessage, setGpsMessage] = useState('');

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const [requests, setRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState('ALL');

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    return `${BACKEND_BASE_URL}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  const fetchMyRequests = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const response = await API.get('pickups/my-requests/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests(Array.isArray(response.data) ? response.data : response.data.results || []);
      if (manualRefresh) {
        setStatusMessage({ type: 'success', text: '✓ Pickup history synced with latest updates.' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 2500);
      }
    } catch (err) {
      console.error('Failed to fetch user requests:', err);
    } finally {
      setFetchingRequests(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem('user_name') || 'Citizen';
    setUserName(storedName);

    const token = localStorage.getItem('access_token') || localStorage.getItem('access');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchMyRequests(false);

    const interval = setInterval(() => {
      fetchMyRequests(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [navigate, fetchMyRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setFormData((prev) => ({
      ...prev,
      district: selectedDistrict,
      municipality: LOCATION_DATA[selectedDistrict] ? LOCATION_DATA[selectedDistrict][0] : '',
    }));
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      setGpsMessage('GPS unavailable on this device. You can proceed with House Name & Ward.');
      return;
    }

    setGpsStatus('LOADING');
    setGpsMessage('Acquiring doorstep GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setCoords({ latitude: lat, longitude: lng });
        setGpsStatus('PINNED');
        setGpsMessage(`Doorstep Location Pinned (${lat}, ${lng})`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGpsStatus('ERROR');
        setGpsMessage('Location permission denied. Proceeding with House Name & Ward details.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photo) {
      setStatusMessage({ type: 'error', text: 'Please capture a live photo of the recyclable items.' });
      return;
    }

    if ((coords.latitude === null || coords.longitude === null) && gpsStatus !== 'ERROR') {
      setStatusMessage({
        type: 'error',
        text: 'Please pin your doorstep GPS location so the collector can navigate accurately.',
      });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const submissionData = new FormData();
      submissionData.append('district', formData.district);
      submissionData.append('municipality', formData.municipality);
      submissionData.append('ward_no', formData.ward_no);
      submissionData.append('house_details', formData.house_details);
      submissionData.append('image', photo);

      if (coords.latitude !== null && coords.longitude !== null) {
        submissionData.append('latitude', coords.latitude);
        submissionData.append('longitude', coords.longitude);
      }

      const token = localStorage.getItem('access_token') || localStorage.getItem('access');

      const response = await API.post('pickups/request/', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const detectedItem = response.data?.ai_detected_item || response.data?.data?.ai_detected_item;
      setStatusMessage({
        type: 'success',
        text: detectedItem
          ? `Pickup scheduled! Verified Recyclable Material: ${detectedItem}`
          : 'Pickup request submitted successfully!',
      });

      setFormData({
        district: 'Kozhikode',
        municipality: LOCATION_DATA['Kozhikode'] ? LOCATION_DATA['Kozhikode'][0] : '',
        ward_no: '1',
        house_details: '',
      });
      setCoords({ latitude: null, longitude: null });
      setGpsStatus('');
      setGpsMessage('');
      handleRemovePhoto();

      fetchMyRequests(false);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.detail || 'Failed to submit request.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED').length;
  const activeCount = pendingCount + inProgressCount;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length;

  const filteredRequests = requests.filter((req) => {
    if (requestFilter === 'ACTIVE') {
      return req.status === 'PENDING' || req.status === 'IN_PROGRESS' || req.status === 'ACCEPTED';
    }
    if (requestFilter === 'COMPLETED') {
      return req.status === 'COMPLETED';
    }
    if (requestFilter === 'REJECTED') {
      return req.status === 'REJECTED' || req.status === 'CANCELLED';
    }
    return true;
  });

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-teal-50 text-teal-900 border-teal-300';
      case 'IN_PROGRESS':
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-50 text-red-900 border-red-300';
      default:
        return 'bg-amber-50 text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                  Civic<span className="text-blue-700">Cycle</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Citizen Portal
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                Welcome, <span className="text-slate-900 font-bold">{userName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border-2 border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {statusMessage.text && (
          <div
            className={`p-4 rounded-xl border-l-4 text-sm font-bold flex items-center justify-between gap-3 shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-teal-50 border-teal-700 text-teal-950'
                : 'bg-red-50 border-red-700 text-red-950'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage({ type: '', text: '' })}
              className="text-xs font-extrabold opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                Total Requests
              </span>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 mt-1.5 block">
                {totalCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 font-extrabold text-sm">
              ALL
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 block">
                Pending
              </span>
              <span className="text-3xl sm:text-4xl font-black text-amber-700 mt-1.5 block">
                {pendingCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800 font-extrabold text-xs">
              WAIT
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800 block">
                In Progress
              </span>
              <span className="text-3xl sm:text-4xl font-black text-blue-700 mt-1.5 block">
                {inProgressCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-800 font-extrabold text-xs">
              LIVE
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-teal-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 block">
                Completed
              </span>
              <span className="text-3xl sm:text-4xl font-black text-teal-700 mt-1.5 block">
                {completedCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-300 flex items-center justify-center text-teal-800 font-extrabold text-xs">
              DONE
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-5 shadow-2xs flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              { step: '01', title: 'Pin & Snap', desc: 'Pin your doorstep GPS location and capture a live photo of the dry waste.' },
              { step: '02', title: 'Instant Material Check', desc: 'Captured items are automatically verified for dry-waste recycling.' },
              { step: '03', title: 'PIN Handover', desc: 'Share your 4-digit Pickup PIN with the collector upon collection.' },
            ].map((s) => (
              <div key={s.step} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-700 text-white shrink-0">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{s.title}</h3>
                  <p className="text-xs font-medium text-slate-600 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-extrabold text-slate-800 mr-1">Accepted Materials:</span>
              {['Plastic', 'E-Waste', 'Metal', 'Paper & Cardboard', 'Wood / Furniture', 'Glass'].map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-300 font-bold text-[11px]"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
            <span className="text-xs font-extrabold text-red-700">
              ✕ Food / Wet & Medical Waste Not Accepted
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-blue-700" />
            <div className="p-5 sm:p-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Schedule Doorstep Pickup
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Pin your exact location and capture a live photo for instant material verification.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      District
                    </label>
                    <select
                      name="district"
                      value={formData.district}
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
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      Local Body
                    </label>
                    <select
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-700"
                    >
                      {LOCATION_DATA[formData.district] &&
                        LOCATION_DATA[formData.district].map((municipality) => (
                          <option key={municipality} value={municipality}>
                            {municipality}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      Ward No
                    </label>
                    <input
                      type="number"
                      name="ward_no"
                      value={formData.ward_no}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      House / Landmark
                    </label>
                    <input
                      type="text"
                      name="house_details"
                      value={formData.house_details}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Green Villa, Near Junction"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border-2 transition-colors ${
                    gpsStatus === 'PINNED'
                      ? 'bg-teal-50/70 border-teal-600'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Doorstep GPS Coordinates <span className="text-red-600">*</span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">
                        Required for collector Google Maps routing
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureLocation}
                      disabled={gpsStatus === 'LOADING'}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                        gpsStatus === 'PINNED'
                          ? 'bg-teal-700 text-white hover:bg-teal-800'
                          : 'bg-blue-700 text-white hover:bg-blue-800'
                      }`}
                    >
                      {gpsStatus === 'LOADING'
                        ? 'Detecting GPS...'
                        : gpsStatus === 'PINNED'
                        ? '✓ Location Pinned'
                        : '📍 Pin Current Location'}
                    </button>
                  </div>

                  {gpsMessage && (
                    <p
                      className={`mt-2 text-xs font-bold ${
                        gpsStatus === 'ERROR' ? 'text-red-700' : 'text-teal-800'
                      }`}
                    >
                      {gpsMessage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Live Waste Photo <span className="text-red-600">*</span>
                  </label>

                  {!photoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full p-5 border-2 border-dashed border-blue-400 hover:border-blue-700 rounded-xl bg-blue-50/40 cursor-pointer transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center mb-2 shadow-2xs">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-extrabold text-blue-800">
                        📷 Open Camera & Capture Live Photo
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 mt-0.5 text-center">
                        Direct camera capture required for authentic waste verification
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative mt-2 w-full rounded-xl border-2 border-slate-300 overflow-hidden bg-slate-100">
                      <img
                        src={photoPreview}
                        alt="Captured Waste Preview"
                        className="w-full h-44 object-contain"
                      />
                      <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700 truncate">
                          {photo?.name || 'Captured Photo'}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          <span>✕</span> Remove & Retake
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-5 rounded-xl text-white font-extrabold text-sm tracking-wide transition-all cursor-pointer ${
                    loading
                      ? 'bg-slate-500 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-800 active:scale-[0.99] shadow-sm'
                  }`}
                >
                  {loading ? 'Verifying & Scheduling...' : 'Submit Pickup Request'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  My Pickup Requests
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Filter by status to track active pickups, PINs, and history
                </p>
              </div>
              <button
                onClick={() => fetchMyRequests(true)}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer"
              >
                {isRefreshing ? 'Syncing...' : '↻ Refresh'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: `All (${totalCount})` },
                { key: 'ACTIVE', label: `Active (${activeCount})` },
                { key: 'COMPLETED', label: `Completed (${completedCount})` },
                { key: 'REJECTED', label: `Rejected (${rejectedCount})` },
              ].map((tab) => {
                const isSelected = requestFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setRequestFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                        : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {fetchingRequests ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-600">
                Loading your pickup requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <p className="text-sm font-extrabold text-slate-800">
                  {requests.length === 0
                    ? 'No pickup requests yet'
                    : `No ${requestFilter.toLowerCase()} requests found`}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  {requests.length === 0
                    ? 'Pin your location and capture a recyclable waste photo on the left to start.'
                    : 'Switch filter tabs above to view your other requests.'}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
                {filteredRequests.map((req) => {
                  const fullImageUrl = getImageUrl(req.image);
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-4 items-start"
                    >
                      {fullImageUrl && (
                        <div className="w-full sm:w-24 h-36 sm:h-24 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0">
                          <img
                            src={fullImageUrl}
                            alt={req.ai_detected_item || 'Waste'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex-1 w-full min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            Verified Material: {req.ai_detected_item || req.waste_type || 'Recyclable'}
                          </span>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(
                              req.status
                            )}`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-2">
                          <span className="font-extrabold text-slate-900">Address:</span>{' '}
                          {req.house_details}, Ward {req.ward_no}, {req.municipality}
                          {req.latitude && req.longitude && (
                            <span className="ml-2 inline-block text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-300">
                              📍 GPS Pinned
                            </span>
                          )}
                        </p>

                        {req.created_at && (
                          <p className="text-[11px] font-semibold text-slate-500 mt-1">
                            Submitted: {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        )}

                        {req.status === 'IN_PROGRESS' && req.pickup_otp && (
                          <div className="mt-3 p-3 rounded-xl bg-blue-50 border-2 border-blue-600 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-xs font-extrabold text-blue-950 block">
                                Doorstep Handover PIN
                              </span>
                              <span className="text-[11px] font-semibold text-blue-800">
                                Share with collector only after handover
                              </span>
                            </div>
                            <span className="text-lg font-extrabold tracking-[0.25em] text-blue-950 bg-white px-3.5 py-1 rounded-lg border-2 border-blue-300">
                              {req.pickup_otp}
                            </span>
                          </div>
                        )}

                        {req.collector_remark && (
                          <div
                            className={`mt-2.5 p-2.5 rounded-lg text-xs font-semibold border ${
                              req.status === 'REJECTED'
                                ? 'bg-red-50 border-red-300 text-red-900'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            <strong className="font-extrabold">Collector Note: </strong>
                            {req.collector_remark}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;