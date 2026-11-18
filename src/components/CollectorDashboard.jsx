import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './Axios';

const BACKEND_BASE_URL = (API.defaults.baseURL || '').replace(/\/api\/?$/, '');

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
        return 'bg-teal-50 text-teal-900 border-teal-300';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-900 border-red-300';
      default:
        return 'bg-amber-50 text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                  Civic<span className="text-blue-700">Cycle</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                  Collector Portal
                </span>
                <span className="hidden md:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  {municipalityName}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
                Welcome, <span className="text-slate-900 font-bold">{collectorName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchCollectorRequests(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              {isRefreshing ? 'Syncing...' : '↻ Refresh'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border-2 border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 block">
                Available Requests (Pending)
              </span>
              <span className="text-3xl sm:text-4xl font-black text-amber-700 mt-1.5 block">
                {pendingRequests.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800 font-extrabold text-xs">
              NEW
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 block">
                My Active Pickups
              </span>
              <span className="text-3xl sm:text-4xl font-black text-blue-700 mt-1.5 block">
                {inProgressRequests.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-300 flex items-center justify-center text-blue-800 font-extrabold text-xs">
              ROUTE
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-teal-300 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900 block">
                Completed / History
              </span>
              <span className="text-3xl sm:text-4xl font-black text-teal-700 mt-1.5 block">
                {historyRequests.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-300 flex items-center justify-center text-teal-800 font-extrabold text-xs">
              DONE
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
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
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Filter Ward:
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-700"
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

        <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-600">
              Loading pickup requests...
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <p className="text-sm font-extrabold text-slate-800">
                {activeTab === 'PENDING' && 'No pending pickup requests available right now'}
                {activeTab === 'IN_PROGRESS' && 'No active pickups in progress'}
                {activeTab === 'HISTORY' && 'No completed or rejected history yet'}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">
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
                    className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {fullImageUrl && (
                      <div
                        onClick={() => setPreviewImage(fullImageUrl)}
                        className="relative w-full sm:w-32 h-40 sm:h-32 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0 cursor-zoom-in group"
                      >
                        <img
                          src={fullImageUrl}
                          alt={req.ai_detected_item || 'Waste'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-extrabold">
                          Click to Zoom
                        </span>
                      </div>
                    )}

                    <div className="flex-1 w-full min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-300">
                            Verified Material: {req.ai_detected_item || req.waste_type || 'Recyclable Item'}
                          </span>
                          <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            Ward {req.ward_no}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center flex-wrap gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">
                          <strong className="font-extrabold text-slate-900">Address:</strong>{' '}
                          {req.house_details}, Ward {req.ward_no}, {req.municipality}
                        </p>
                        <a
                          href={getGoogleMapsUrl(req)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 text-xs font-extrabold text-blue-800 transition-colors shadow-2xs"
                        >
                          <span>{req.latitude && req.longitude ? '📍 Navigate GPS' : '🔍 Search Area on Map'}</span>
                        </a>
                      </div>

                      {req.status !== 'PENDING' && (
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1.5">
                          <strong className="font-extrabold text-slate-900">Citizen:</strong>{' '}
                          {req.user_name || 'Resident'}{' '}
                          {req.user_phone && (
                            <a
                              href={`tel:${req.user_phone}`}
                              className="ml-2 inline-block text-xs font-extrabold text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-300 transition-colors"
                            >
                              📞 Call: {req.user_phone}
                            </a>
                          )}
                        </p>
                      )}

                      {req.created_at && (
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">
                          Requested on: {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      )}

                      {req.collector_remark && (
                        <div
                          className={`mt-2.5 p-2.5 rounded-xl text-xs font-semibold border ${
                            req.status === 'REJECTED'
                              ? 'bg-red-50 border-red-300 text-red-900'
                              : 'bg-blue-50 border-blue-200 text-blue-950'
                          }`}
                        >
                          <strong className="font-extrabold">Your Note: </strong>
                          {req.collector_remark}
                        </div>
                      )}

                      {req.status === 'PENDING' && (
                        <div className="mt-3.5">
                          {!isCardActionOpen ? (
                            <div className="flex flex-wrap gap-2.5">
                              <button
                                onClick={() => setActiveActionCard({ id: req.id, type: 'ACCEPT' })}
                                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer shadow-2xs"
                              >
                                Accept Pickup
                              </button>
                              <button
                                onClick={() => setActiveActionCard({ id: req.id, type: 'REJECT' })}
                                className="px-4 py-2 rounded-xl border-2 border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : activeActionCard.type === 'ACCEPT' ? (
                            <div className="p-3.5 rounded-xl bg-blue-50/80 border-2 border-blue-300">
                              <p className="text-xs font-extrabold text-blue-950 mb-2">
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
                                      className="w-full text-left px-3.5 py-2.5 rounded-xl border border-blue-300 bg-white hover:bg-blue-100/70 text-xs font-extrabold text-slate-900 transition-colors cursor-pointer"
                                    >
                                      {isThisBtnLoading ? 'Confirming...' : `✓ ${msg}`}
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => setActiveActionCard(null)}
                                  className="self-start mt-1 text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-xl bg-red-50/80 border-2 border-red-300">
                              <p className="text-xs font-extrabold text-red-950 mb-2">
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
                                      className="w-full text-left px-3.5 py-2.5 rounded-xl border border-red-300 bg-white hover:bg-red-100/70 text-xs font-extrabold text-red-900 transition-colors cursor-pointer"
                                    >
                                      {isThisBtnLoading ? 'Submitting...' : `✕ ${reason}`}
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => setActiveActionCard(null)}
                                  className="self-start mt-1 text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {req.status === 'IN_PROGRESS' && (
                        <div className="mt-3.5 p-3.5 rounded-xl bg-blue-50 border-2 border-blue-600 flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <span className="text-xs font-extrabold text-blue-950 block">
                              Verify Doorstep Pickup
                            </span>
                            <span className="text-[11px] font-semibold text-blue-800">
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
                              className="w-28 px-3 py-2 rounded-xl border-2 border-blue-400 bg-white text-sm font-extrabold tracking-[0.2em] text-center text-slate-900 focus:outline-none focus:border-blue-700"
                            />
                            <button
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleCompleteSubmit(req.id)}
                              className={`px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
                                actionLoadingId === req.id
                                  ? 'bg-slate-500 cursor-not-allowed'
                                  : 'bg-teal-700 hover:bg-teal-800'
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-2xl p-3 shadow-2xl"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold flex items-center justify-center shadow-md cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Waste Full View"
              className="max-w-[85vw] max-h-[80vh] rounded-xl block object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectorDashboard;