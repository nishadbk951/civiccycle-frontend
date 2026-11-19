import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './Axios';
import { LOCATION_DATA } from './Location';

const BACKEND_BASE_URL = (API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const SERIF_FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const SANS_FONT = { fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" };

const compressImage = (file, maxWidth = 1024, quality = 0.75) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          const cleanName = (file.name || 'waste_photo').replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load selected image'));
    };

    img.src = objectUrl;
  });

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function CivicCycleLogo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width="38"
        height="38"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Top Recycling Arc + Arrow (Terracotta) */}
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

        {/* Bottom Recycling Arc + Arrow (Terracotta) */}
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

        {/* Doorstep Location Pin (Deep Espresso) */}
        <path
          d="M24 14.5C19.3 14.5 15.5 18.2 15.5 22.8C15.5 28.4 24 36.2 24 36.2C24 36.2 32.5 28.4 32.5 22.8C32.5 18.2 28.7 14.5 24 14.5Z"
          fill="#3D2B1F"
        />

        {/* Leaf inside Pin (Warm Terracotta) */}
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
  const [compressingPhoto, setCompressingPhoto] = useState(false);

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

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

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
      if (!document.hidden) {
        fetchMyRequests(false);
      }
    }, 30000);

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

    const onSuccess = (position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      setCoords({ latitude: lat, longitude: lng });
      setGpsStatus('PINNED');
      setGpsMessage(`Doorstep Location Pinned (${lat}, ${lng})`);
    };

    const onFinalError = (error) => {
      console.error('Geolocation error:', error);
      setGpsStatus('ERROR');
      if (error.code === 1) {
        setGpsMessage('Location permission denied. Proceeding with House Name & Ward details.');
      } else {
        setGpsMessage('Unable to detect GPS indoors. Proceeding with House Name & Ward details.');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (error.code === 1) {
          onFinalError(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompressingPhoto(true);
    try {
      const optimizedFile = await compressImage(file, 1024, 0.75);
      setPhoto(optimizedFile);
      setPhotoPreview(URL.createObjectURL(optimizedFile));
    } catch (err) {
      console.error('Compression fallback to original file:', err);
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setCompressingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showAlert = (type, text) => {
    setStatusMessage({ type, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.house_details.trim()) {
      showAlert('error', 'Please enter your House Name or Landmark.');
      return;
    }

    if (!photo) {
      showAlert('error', 'Please capture a live photo of the recyclable items.');
      return;
    }

    if ((coords.latitude === null || coords.longitude === null) && gpsStatus !== 'ERROR') {
      showAlert(
        'error',
        'Please pin your doorstep GPS location so the collector can navigate accurately.'
      );
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const submissionData = new FormData();
      submissionData.append('district', formData.district);
      submissionData.append('municipality', formData.municipality);
      submissionData.append('ward_no', formData.ward_no);
      submissionData.append('house_details', formData.house_details.trim());
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
      showAlert(
        'success',
        detectedItem
          ? `Pickup scheduled! Verified Recyclable Material: ${detectedItem}`
          : 'Pickup request submitted successfully!'
      );

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
      let errorText =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to submit request. Please try again.';

      if (err.code === 'ECONNABORTED') {
        errorText = 'Request timed out. The server may be waking up—please try again.';
      } else if (!err.response) {
        errorText = 'Unable to reach server. Please check your connection and try again.';
      }

      showAlert('error', errorText);
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
        return 'bg-[#ECFDF5] text-[#166534] border-[#BBF7D0]';
      case 'IN_PROGRESS':
      case 'ACCEPTED':
        return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      default:
        return 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]';
    }
  };

  return (
    <div style={SANS_FONT} className="min-h-screen bg-[#FAF8F5] text-[#3D2B1F] flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#E6E0D4] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CivicCycleLogo />
            <div className="hidden sm:block h-5 w-px bg-[#E6E0D4]" />
            <p className="hidden sm:block text-sm font-medium text-[#6B5B4E]">
              Welcome, <span className="text-[#3D2B1F] font-bold">{userName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="sm:hidden text-xs font-semibold text-[#6B5B4E]">
              Hi, <span className="text-[#3D2B1F] font-bold">{userName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-full border border-[#D8CFC2] bg-white hover:bg-[#FAF5EE] hover:border-[#3D2B1F] text-[#3D2B1F] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* Status Alert */}
        {statusMessage.text && (
          <div
            className={`px-5 py-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#14532D]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage({ type: '', text: '' })}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer px-1.5 py-0.5 rounded-full"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B5B4E] block">
                Total Requests
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#3D2B1F] mt-1 block"
              >
                {totalCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center text-[#3D2B1F] font-bold text-xs">
              ALL
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#854D0E] block">
                Pending
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#A16207] mt-1 block"
              >
                {pendingCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#854D0E] font-bold text-[11px]">
              WAIT
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] block">
                In Progress
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#E85D2A] mt-1 block"
              >
                {inProgressCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#C2410C] font-bold text-[11px]">
              LIVE
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534] block">
                Completed
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#15803D] mt-1 block"
              >
                {completedCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] flex items-center justify-center text-[#166534] font-bold text-[11px]">
              DONE
            </div>
          </div>
        </div>

        {/* How It Works & Accepted Materials */}
        <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 sm:p-6 shadow-[0_2px_12px_rgba(61,43,31,0.03)] flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Pin & Snap', desc: 'Pin your doorstep GPS location and capture a live photo of the dry waste.' },
              { step: '02', title: 'Instant Material Check', desc: 'Captured items are automatically verified for dry-waste recycling.' },
              { step: '03', title: 'PIN Handover', desc: 'Share your 4-digit Pickup PIN with the collector upon collection.' },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-[#FAF8F5] border border-[#EDE8DF] rounded-2xl p-4 flex items-start gap-3.5"
              >
                <span className="text-xs font-extrabold w-8 h-8 rounded-full bg-[#F9D548] text-[#3D2B1F] flex items-center justify-center shrink-0">
                  {s.step}
                </span>
                <div>
                  <h3 style={SERIF_FONT} className="text-base font-bold text-[#3D2B1F]">
                    {s.title}
                  </h3>
                  <p className="text-xs font-medium text-[#6B5B4E] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#EDE8DF] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#3D2B1F] mr-1">What we take:</span>
              {['Plastic', 'E-Waste', 'Metal', 'Paper & Cardboard', 'Wood / Furniture', 'Glass'].map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full bg-[#FAF8F5] text-[#3D2B1F] border border-[#E6E0D4] font-semibold text-[11px]"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
            <span className="text-xs font-bold text-[#B91C1C]">
              ✕ Food / Wet & Medical Waste Not Accepted
            </span>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Schedule Pickup Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6E0D4] shadow-[0_4px_20px_rgba(61,43,31,0.04)] overflow-hidden">
            <div className="p-6 sm:p-7">
              <div className="pb-5 border-b border-[#EDE8DF]">
                <h2
                  style={SERIF_FONT}
                  className="text-2xl font-bold text-[#3D2B1F] tracking-tight inline-block relative"
                >
                  Schedule Doorstep Pickup
                  <span className="block h-1.5 w-28 bg-[#F9D548] rounded-full mt-1.5" />
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-2">
                  Pin your exact location and capture a live photo for instant material verification.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                      District
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleDistrictChange}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-semibold text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F] transition-colors"
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
                      Local Body
                    </label>
                    <select
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-semibold text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F] transition-colors"
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

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                      Ward No
                    </label>
                    <input
                      type="number"
                      name="ward_no"
                      value={formData.ward_no}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-semibold text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F] transition-colors"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                      House / Landmark
                    </label>
                    <input
                      type="text"
                      name="house_details"
                      value={formData.house_details}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Green Villa, Near Junction"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-medium text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none focus:bg-white focus:border-[#3D2B1F] transition-colors"
                    />
                  </div>
                </div>

                {/* GPS Location Box */}
                <div
                  className={`p-4 rounded-2xl border transition-colors ${
                    gpsStatus === 'PINNED'
                      ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                      : 'bg-[#FAF8F5] border-[#E6E0D4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-xs font-bold text-[#3D2B1F] block">
                        Doorstep GPS Coordinates <span className="text-[#E85D2A]">*</span>
                      </span>
                      <span className="text-[11px] font-medium text-[#6B5B4E]">
                        Required for collector Google Maps routing
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureLocation}
                      disabled={gpsStatus === 'LOADING'}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        gpsStatus === 'PINNED'
                          ? 'bg-[#15803D] text-white hover:bg-[#166534]'
                          : 'bg-[#3D2B1F] text-white hover:bg-[#2A1D15]'
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
                      className={`mt-2.5 text-xs font-semibold ${
                        gpsStatus === 'ERROR' ? 'text-[#B91C1C]' : 'text-[#166534]'
                      }`}
                    >
                      {gpsMessage}
                    </p>
                  )}
                </div>

                {/* Live Waste Photo */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                    Live Waste Photo <span className="text-[#E85D2A]">*</span>
                  </label>

                  {!photoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-[#D8CFC2] hover:border-[#E85D2A] rounded-2xl bg-[#FAF8F5] hover:bg-[#FFFBF7] cursor-pointer transition-all">
                      <div className="w-11 h-11 rounded-full bg-[#F9D548] text-[#3D2B1F] flex items-center justify-center mb-2.5 shadow-2xs">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-[#3D2B1F]">
                        {compressingPhoto
                          ? 'Optimizing photo for fast upload...'
                          : 'Open Camera & Capture Live Photo'}
                      </span>
                      <span className="text-[11px] font-medium text-[#6B5B4E] mt-1 text-center">
                        Direct camera capture required for authentic waste verification
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        disabled={compressingPhoto}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative mt-2 w-full rounded-2xl border border-[#E6E0D4] overflow-hidden bg-[#FAF8F5]">
                      <img
                        src={photoPreview}
                        alt="Captured Waste Preview"
                        className="w-full h-44 object-contain"
                      />
                      <div className="p-3 bg-white border-t border-[#EDE8DF] flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#6B5B4E] truncate">
                          {photo?.name || 'Captured Photo'}
                          {photo?.size ? ` (${formatFileSize(photo.size)})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3.5 py-1.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <span>✕</span> Remove & Retake
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Pill CTA */}
                <button
                  type="submit"
                  disabled={loading || compressingPhoto}
                  className={`w-full py-3.5 px-6 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer ${
                    loading || compressingPhoto
                      ? 'bg-[#E6E0D4] text-[#6B5B4E] cursor-not-allowed'
                      : 'bg-[#F9D548] hover:bg-[#F3C623] text-[#3D2B1F] active:scale-[0.99] shadow-xs'
                  }`}
                >
                  {compressingPhoto
                    ? 'Optimizing Photo...'
                    : loading
                    ? 'Uploading & Verifying with AI...'
                    : 'Submit Pickup Request'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: My Pickup Requests */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E6E0D4] p-6 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)]">
            <div className="flex items-center justify-between gap-3 pb-5 border-b border-[#EDE8DF]">
              <div>
                <h2 style={SERIF_FONT} className="text-2xl font-bold text-[#3D2B1F] tracking-tight">
                  My Pickup Requests
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1">
                  Track active pickups, handover PINs, and recycling history
                </p>
              </div>
              <button
                onClick={() => fetchMyRequests(true)}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-full border border-[#D8CFC2] bg-[#FAF8F5] hover:bg-[#F3EDE3] text-[#3D2B1F] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {isRefreshing ? 'Syncing...' : '↻ Refresh'}
              </button>
            </div>

            {/* Filter Pills */}
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
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3D2B1F] text-white border-[#3D2B1F]'
                        : 'bg-[#FAF8F5] text-[#6B5B4E] border-[#E6E0D4] hover:border-[#3D2B1F] hover:text-[#3D2B1F]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {fetchingRequests ? (
              <div className="py-14 text-center text-sm font-medium text-[#6B5B4E]">
                Loading your pickup requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="mt-5 py-14 px-4 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D8CFC2]">
                <p style={SERIF_FONT} className="text-lg font-bold text-[#3D2B1F]">
                  {requests.length === 0
                    ? 'No pickup requests yet'
                    : `No ${requestFilter.toLowerCase()} requests found`}
                </p>
                <p className="text-xs font-medium text-[#6B5B4E] mt-1.5">
                  {requests.length === 0
                    ? 'Pin your location and capture a recyclable waste photo on the left to start.'
                    : 'Switch filter tabs above to view your other requests.'}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {filteredRequests.map((req) => {
                  const fullImageUrl = getImageUrl(req.image);
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-[#EDE8DF] bg-[#FAF8F5]/80 flex flex-col sm:flex-row gap-4 items-start"
                    >
                      {fullImageUrl && (
                        <div className="w-full sm:w-24 h-36 sm:h-24 rounded-xl overflow-hidden border border-[#E6E0D4] bg-white shrink-0">
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
                          <span className="text-xs font-bold text-[#3D2B1F] bg-white px-3 py-1 rounded-full border border-[#E6E0D4]">
                            Material: <span className="text-[#E85D2A]">{req.ai_detected_item || req.waste_type || 'Recyclable'}</span>
                          </span>
                          <span
                            className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${getStatusBadgeClasses(
                              req.status
                            )}`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-2.5">
                          <span className="font-bold text-[#3D2B1F]">Address:</span>{' '}
                          {req.house_details}, Ward {req.ward_no}, {req.municipality}
                          {req.latitude && req.longitude && (
                            <span className="ml-2 inline-block text-[11px] font-bold text-[#166534] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                              📍 GPS Pinned
                            </span>
                          )}
                        </p>

                        {req.created_at && (
                          <p className="text-[11px] font-medium text-[#9E8F80] mt-1">
                            Submitted: {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        )}

                        {req.status === 'IN_PROGRESS' && req.pickup_otp && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-[#FEF9C3]/70 border border-[#F9D548] flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-xs font-bold text-[#3D2B1F] block">
                                Doorstep Handover PIN
                              </span>
                              <span className="text-[11px] font-medium text-[#6B5B4E]">
                                Share with collector only after handover
                              </span>
                            </div>
                            <span
                              style={SERIF_FONT}
                              className="text-xl font-bold tracking-[0.25em] text-[#3D2B1F] bg-white px-4 py-1 rounded-full border border-[#E6E0D4]"
                            >
                              {req.pickup_otp}
                            </span>
                          </div>
                        )}

                        {req.collector_remark && (
                          <div
                            className={`mt-2.5 p-3 rounded-xl text-xs font-medium border ${
                              req.status === 'REJECTED'
                                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                                : 'bg-white border-[#E6E0D4] text-[#3D2B1F]'
                            }`}
                          >
                            <strong className="font-bold">Collector Note: </strong>
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