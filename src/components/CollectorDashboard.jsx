import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './Axios';

const BACKEND_BASE_URL = (API.defaults.baseURL || '').replace(/\/api\/?$/, '');

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

function CollectorDashboard() {
  const navigate = useNavigate();

  const [collectorName, setCollectorName] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedWard, setSelectedWard] = useState('ALL');

  const [activeActionCard, setActiveActionCard] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [submittingText, setSubmittingText] = useState('');

  const [otpInputs, setOtpInputs] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    return `${BACKEND_BASE_URL}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  const getGoogleMapsUrl = (req) => {
    if (req.latitude && req.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${req.latitude},${req.longitude}`;
    }
    const query = encodeURIComponent(`${req.house_details}, ${req.municipality}, ${req.district}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const fetchCollectorRequests = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const response = await API.get('pickups/collector/assigned/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests(Array.isArray(response.data) ? response.data : response.data.results || []);
      if (manualRefresh) {
        setStatusMessage({ type: 'success', text: '✓ Pickup queue synced with latest updates.' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 2500);
      }
    } catch (err) {
      console.error('Failed to fetch collector requests:', err);
      setStatusMessage({
        type: 'error',
        text:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to load pickup requests.',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access');
    const role = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_name') || 'Collector';

    if (!token) {
      navigate('/login');
      return;
    }

    if (role && role !== 'COLLECTOR') {
      navigate('/user-dashboard');
      return;
    }

    setCollectorName(storedName);
    fetchCollectorRequests(false);
  }, [navigate, fetchCollectorRequests]);

  const handleAcceptSubmit = async (id, remark) => {
    setActionLoadingId(id);
    setSubmittingText(remark);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const response = await API.patch(
        `pickups/collector/accept/${id}/`,
        { collector_remark: remark },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRequests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'IN_PROGRESS',
                collector_remark: remark,
                pickup_otp: response.data?.pickup_otp || item.pickup_otp,
              }
            : item
        )
      );

      setStatusMessage({
        type: 'success',
        text: response.data?.message || 'Pickup accepted! Moved to My Active Pickups.',
      });
      setActiveActionCard(null);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.detail || 'Failed to accept request.',
      });
    } finally {
      setActionLoadingId(null);
      setSubmittingText('');
    }
  };

  const handleRejectSubmit = async (id, reason) => {
    setActionLoadingId(id);
    setSubmittingText(reason);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const response = await API.patch(
        `pickups/collector/reject/${id}/`,
        { collector_remark: reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRequests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'REJECTED',
                collector_remark: reason,
              }
            : item
        )
      );

      setStatusMessage({
        type: 'success',
        text: response.data?.message || 'Pickup request rejected.',
      });
      setActiveActionCard(null);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.detail || 'Failed to reject request.',
      });
    } finally {
      setActionLoadingId(null);
      setSubmittingText('');
    }
  };

  const handleCompleteSubmit = async (id) => {
    const enteredPin = (otpInputs[id] || '').trim();
    if (!enteredPin || enteredPin.length !== 4) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter the 4-digit Pickup PIN provided by the citizen.',
      });
      return;
    }

    setActionLoadingId(id);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const response = await API.patch(
        `pickups/collector/complete/${id}/`,
        { otp: enteredPin },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRequests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'COMPLETED',
                pickup_otp: null,
              }
            : item
        )
      );

      setStatusMessage({
        type: 'success',
        text: response.data?.message || 'PIN verified! Pickup marked as completed.',
      });

      setOtpInputs((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.detail || 'Invalid Pickup PIN. Please try again.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const inProgressRequests = requests.filter((r) => r.status === 'IN_PROGRESS');
  const historyRequests = requests.filter((r) => r.status === 'COMPLETED' || r.status === 'REJECTED');

  const availableWards = [...new Set(requests.map((r) => r.ward_no))].sort((a, b) => a - b);

  const getDisplayedRequests = () => {
    let list = [];
    if (activeTab === 'PENDING') list = pendingRequests;
    else if (activeTab === 'IN_PROGRESS') list = inProgressRequests;
    else list = historyRequests;

    if (selectedWard !== 'ALL') {
      list = list.filter((r) => String(r.ward_no) === String(selectedWard));
    }
    return list;
  };

  const displayedRequests = getDisplayedRequests();
  const municipalityName = requests.length > 0 ? requests[0].municipality : 'Assigned Jurisdiction';

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-[#ECFDF5] text-[#166534] border-[#BBF7D0]';
      case 'IN_PROGRESS':
        return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';
      case 'REJECTED':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      default:
        return 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]';
    }
  };

  return (
    <div style={SANS_FONT} className="min-h-screen bg-[#FAF8F5] text-[#3D2B1F] flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#E6E0D4] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CivicCycleLogo />
            <div className="hidden sm:block h-5 w-px bg-[#E6E0D4]" />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#3D2B1F] border border-[#E6E0D4]">
                {municipalityName}
              </span>
              <p className="text-xs font-medium text-[#6B5B4E] truncate">
                Hi, <span className="text-[#3D2B1F] font-bold">{collectorName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchCollectorRequests(true)}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-full border border-[#D8CFC2] bg-[#FAF8F5] hover:bg-[#F3EDE3] text-[#3D2B1F] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              {isRefreshing ? 'Syncing...' : '↻ Refresh'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-[#D8CFC2] bg-white hover:bg-[#FAF5EE] hover:border-[#3D2B1F] text-[#3D2B1F] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 space-y-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#854D0E] block">
                Available Requests (Pending)
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#A16207] mt-1 block"
              >
                {pendingRequests.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#854D0E] font-bold text-[11px]">
              NEW
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] block">
                My Active Pickups
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#E85D2A] mt-1 block"
              >
                {inProgressRequests.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#C2410C] font-bold text-[11px]">
              ROUTE
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534] block">
                Completed / History
              </span>
              <span
                style={SERIF_FONT}
                className="text-3xl sm:text-4xl font-bold text-[#15803D] mt-1 block"
              >
                {historyRequests.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] flex items-center justify-center text-[#166534] font-bold text-[11px]">
              DONE
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6E0D4] p-4 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'PENDING', label: `Available (${pendingRequests.length})` },
              { key: 'IN_PROGRESS', label: `My Active Pickups (${inProgressRequests.length})` },
              { key: 'HISTORY', label: `History (${historyRequests.length})` },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setActiveActionCard(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3D2B1F] text-white border-[#3D2B1F]'
                      : 'bg-[#FAF8F5] text-[#6B5B4E] border-[#E6E0D4] hover:border-[#3D2B1F] hover:text-[#3D2B1F]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider">
              Filter Ward:
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-3.5 py-2 rounded-full border border-[#DED6C9] bg-[#FAF8F5] text-xs sm:text-sm font-semibold text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F]"
            >
              <option value="ALL">All Wards</option>
              {availableWards.map((ward) => (
                <option key={ward} value={ward}>
                  Ward {ward}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)]">
          {loading ? (
            <div className="py-14 text-center text-sm font-medium text-[#6B5B4E]">
              Loading pickup requests...
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="py-14 px-4 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D8CFC2]">
              <p style={SERIF_FONT} className="text-lg font-bold text-[#3D2B1F]">
                {activeTab === 'PENDING' && 'No pending pickup requests available right now'}
                {activeTab === 'IN_PROGRESS' && 'No active pickups in progress'}
                {activeTab === 'HISTORY' && 'No completed or rejected history yet'}
              </p>
              <p className="text-xs font-medium text-[#6B5B4E] mt-1.5">
                {selectedWard !== 'ALL'
                  ? `No requests found in Ward ${selectedWard}. Try selecting "All Wards".`
                  : 'Check back later or click Refresh to update.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedRequests.map((req) => {
                const fullImageUrl = getImageUrl(req.image);
                const isCardActionOpen = activeActionCard?.id === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 rounded-2xl border border-[#EDE8DF] bg-[#FAF8F5]/80 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {fullImageUrl && (
                      <div
                        onClick={() => setPreviewImage(fullImageUrl)}
                        className="relative w-full sm:w-32 h-40 sm:h-32 rounded-xl overflow-hidden border border-[#E6E0D4] bg-white shrink-0 cursor-zoom-in group"
                      >
                        <img
                          src={fullImageUrl}
                          alt={req.ai_detected_item || 'Waste'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-2.5 py-0.5 rounded-full bg-[#3D2B1F]/80 text-white text-[10px] font-bold">
                          Zoom
                        </span>
                      </div>
                    )}

                    <div className="flex-1 w-full min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#3D2B1F] bg-white px-3 py-1 rounded-full border border-[#E6E0D4]">
                            Material: <span className="text-[#E85D2A]">{req.ai_detected_item || req.waste_type || 'Recyclable Item'}</span>
                          </span>
                          <span className="text-xs font-bold text-[#3D2B1F] bg-[#F3EDE3] px-3 py-1 rounded-full">
                            Ward {req.ward_no}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${getStatusBadgeClasses(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center flex-wrap gap-2">
                        <p className="text-xs sm:text-sm font-medium text-[#6B5B4E]">
                          <strong className="font-bold text-[#3D2B1F]">Address:</strong>{' '}
                          {req.house_details}, Ward {req.ward_no}, {req.municipality}
                        </p>
                        <a
                          href={getGoogleMapsUrl(req)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#DED6C9] bg-white hover:border-[#3D2B1F] text-xs font-bold text-[#3D2B1F] transition-colors"
                        >
                          <span>{req.latitude && req.longitude ? '📍 Navigate GPS' : '🔍 Search Area on Map'}</span>
                        </a>
                      </div>

                      {req.status !== 'PENDING' && (
                        <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1.5">
                          <strong className="font-bold text-[#3D2B1F]">Citizen:</strong>{' '}
                          {req.user_name || 'Resident'}{' '}
                          {req.user_phone && (
                            <a
                              href={`tel:${req.user_phone}`}
                              className="ml-2 inline-block text-xs font-bold text-[#166534] bg-[#ECFDF5] hover:bg-[#D1FAE5] px-3 py-0.5 rounded-full border border-[#BBF7D0] transition-colors"
                            >
                              📞 Call: {req.user_phone}
                            </a>
                          )}
                        </p>
                      )}

                      {req.created_at && (
                        <p className="text-[11px] font-medium text-[#9E8F80] mt-1">
                          Requested on: {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      )}

                      {req.collector_remark && (
                        <div
                          className={`mt-2.5 p-3 rounded-xl text-xs font-medium border ${
                            req.status === 'REJECTED'
                              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                              : 'bg-white border-[#E6E0D4] text-[#3D2B1F]'
                          }`}
                        >
                          <strong className="font-bold">Your Note: </strong>
                          {req.collector_remark}
                        </div>
                      )}

                      {req.status === 'PENDING' && (
                        <div className="mt-4">
                          {!isCardActionOpen ? (
                            <div className="flex flex-wrap gap-2.5">
                              <button
                                onClick={() => setActiveActionCard({ id: req.id, type: 'ACCEPT' })}
                                className="px-5 py-2 rounded-full bg-[#F9D548] hover:bg-[#F3C623] text-[#3D2B1F] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
                              >
                                Accept Pickup
                              </button>
                              <button
                                onClick={() => setActiveActionCard({ id: req.id, type: 'REJECT' })}
                                className="px-5 py-2 rounded-full border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#B91C1C] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : activeActionCard.type === 'ACCEPT' ? (
                            <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#F9D548]">
                              <p className="text-xs font-bold text-[#3D2B1F] mb-2.5">
                                Select a message to notify the citizen:
                              </p>
                              <div className="flex flex-col gap-2">
                                {[
                                  'Accepted — Scheduled for doorstep pickup today.',
                                  'Accepted — Assigned to the next ward collection route.',
                                ].map((msg) => {
                                  const isThisBtnLoading = actionLoadingId === req.id && submittingText === msg;
                                  return (
                                    <button
                                      key={msg}
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => handleAcceptSubmit(req.id, msg)}
                                      className="w-full text-left px-4 py-2.5 rounded-xl border border-[#E6E0D4] bg-white hover:border-[#3D2B1F] text-xs font-bold text-[#3D2B1F] transition-colors cursor-pointer"
                                    >
                                      {isThisBtnLoading ? 'Confirming...' : `✓ ${msg}`}
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => setActiveActionCard(null)}
                                  className="self-start mt-1 text-xs font-semibold text-[#6B5B4E] hover:text-[#3D2B1F] underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA]">
                              <p className="text-xs font-bold text-[#7F1D1D] mb-2.5">
                                Select a reason for declining this pickup:
                              </p>
                              <div className="flex flex-col gap-2">
                                {[
                                  'Quantity too low for pickup — please collect a bit more and request again.',
                                  'Photo is unclear — please re-upload a clearer image of the items.',
                                ].map((reason) => {
                                  const isThisBtnLoading = actionLoadingId === req.id && submittingText === reason;
                                  return (
                                    <button
                                      key={reason}
                                      disabled={actionLoadingId === req.id}
                                      onClick={() => handleRejectSubmit(req.id, reason)}
                                      className="w-full text-left px-4 py-2.5 rounded-xl border border-[#FECACA] bg-white hover:bg-[#FEE2E2]/40 text-xs font-bold text-[#991B1B] transition-colors cursor-pointer"
                                    >
                                      {isThisBtnLoading ? 'Submitting...' : `✕ ${reason}`}
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => setActiveActionCard(null)}
                                  className="self-start mt-1 text-xs font-semibold text-[#6B5B4E] hover:text-[#3D2B1F] underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {req.status === 'IN_PROGRESS' && (
                        <div className="mt-4 p-4 rounded-2xl bg-[#FEF9C3]/65 border border-[#F9D548] flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <span className="text-xs font-bold text-[#3D2B1F] block">
                              Verify Doorstep Pickup
                            </span>
                            <span className="text-[11px] font-medium text-[#6B5B4E]">
                              Ask the citizen for their 4-digit Pickup PIN
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength="4"
                              placeholder="4-digit PIN"
                              value={otpInputs[req.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setOtpInputs((prev) => ({ ...prev, [req.id]: val }));
                              }}
                              className="w-28 px-3 py-2 rounded-full border border-[#DED6C9] bg-white text-sm font-bold tracking-[0.2em] text-center text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
                            />
                            <button
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleCompleteSubmit(req.id)}
                              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                                actionLoadingId === req.id
                                  ? 'bg-[#E6E0D4] text-[#6B5B4E] cursor-not-allowed'
                                  : 'bg-[#15803D] hover:bg-[#166534] text-white'
                              }`}
                            >
                              {actionLoadingId === req.id ? 'Verifying...' : 'Verify & Complete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-[#3D2B1F]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl border border-[#E6E0D4]"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#3D2B1F] hover:bg-[#E85D2A] text-white text-sm font-bold flex items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Waste Full View"
              className="max-w-[85vw] max-h-[80vh] rounded-2xl block object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectorDashboard;