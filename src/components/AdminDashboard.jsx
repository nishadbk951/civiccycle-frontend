import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './Axios';

const BACKEND_BASE_URL = (API.defaults.baseURL || '').replace(/\/api\/?$/, '');

function CakePieChart({
  items,
  labelKey,
  subLabelKey = null,
  countKey = 'count',
  maxSlices = 5,
  totalLabel = 'Total Requests',
}) {
  const [highlightOthers, setHighlightOthers] = useState(false);

  const palette = [
    '#0284C7',
    '#0D9488',
    '#D97706',
    '#7C3AED',
    '#E11D48',
    '#475569',
    '#16A34A',
  ];

  const sortedItems = [...items].sort((a, b) => (b[countKey] || 0) - (a[countKey] || 0));
  const total = sortedItems.reduce((sum, item) => sum + (item[countKey] || 0), 0);

  if (total === 0 || sortedItems.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-semibold text-slate-500">
        No data available yet.
      </div>
    );
  }

  const hasOthers = sortedItems.length > maxSlices;
  const topItems = hasOthers ? sortedItems.slice(0, maxSlices) : sortedItems;
  const remainingItems = hasOthers ? sortedItems.slice(maxSlices) : [];
  const othersCount = remainingItems.reduce((sum, item) => sum + (item[countKey] || 0), 0);

  const chartSlices = [
    ...topItems.map((item, idx) => ({
      key: `${item[labelKey]}-${idx}`,
      label: item[labelKey],
      count: item[countKey] || 0,
      color: palette[idx % palette.length],
      isOthers: false,
    })),
    ...(hasOthers
      ? [
          {
            key: 'others-slice',
            label: `Others (${remainingItems.length})`,
            count: othersCount,
            color: '#475569',
            isOthers: true,
          },
        ]
      : []),
  ];

  const formatSliceLabel = (str) => {
    if (!str) return '';
    const cleaned = str
      .replace(/\bMunicipality\b/gi, 'Mun.')
      .replace(/\bCorporation\b/gi, 'Corp.')
      .replace(/\bGrama Panchayat\b/gi, 'GP')
      .trim();
    return cleaned.length > 14 ? `${cleaned.slice(0, 12)}..` : cleaned;
  };

  let cumulativeAngle = -Math.PI / 2;

  return (
    <div className="mt-5 flex flex-col items-center gap-5 w-full overflow-hidden">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 shrink-0 select-none">
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full drop-shadow-xs">
          {chartSlices.length === 1 ? (
            <g>
              <circle cx="0" cy="0" r="1" fill={chartSlices[0].color} stroke="#ffffff" strokeWidth="0.025" />
              <text
                x="0"
                y="-0.05"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="0.11"
                fontWeight="800"
              >
                {formatSliceLabel(chartSlices[0].label)}
              </text>
              <text
                x="0"
                y="0.11"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="0.13"
                fontWeight="900"
              >
                100%
              </text>
            </g>
          ) : (
            chartSlices.map((slice) => {
              const fraction = slice.count / total;
              const sliceAngle = fraction * 2 * Math.PI;
              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + sliceAngle;
              const midAngle = startAngle + sliceAngle / 2;
              cumulativeAngle = endAngle;

              const startX = Math.cos(startAngle);
              const startY = Math.sin(startAngle);
              const endX = Math.cos(endAngle);
              const endY = Math.sin(endAngle);
              const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L 0 0`,
                'Z',
              ].join(' ');

              const pct = Math.round(fraction * 100);
              const labelRadius = pct >= 25 ? 0.56 : 0.64;
              const labelX = Math.cos(midAngle) * labelRadius;
              const labelY = Math.sin(midAngle) * labelRadius;

              return (
                <g
                  key={slice.key}
                  onClick={() => slice.isOthers && setHighlightOthers((prev) => !prev)}
                  className={slice.isOthers ? 'cursor-pointer' : ''}
                >
                  <path
                    d={pathData}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="0.025"
                    className="transition-opacity hover:opacity-90"
                  />

                  {pct >= 9 && (
                    <g transform={`translate(${labelX}, ${labelY})`}>
                      <text
                        x="0"
                        y="-0.035"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={pct >= 20 ? '0.092' : '0.078'}
                        fontWeight="800"
                      >
                        {formatSliceLabel(slice.label)}
                      </text>
                      <text
                        x="0"
                        y="0.085"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={pct >= 20 ? '0.105' : '0.088'}
                        fontWeight="900"
                      >
                        {pct}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {hasOthers && (
        <p className="text-[11px] font-bold text-slate-600 -mt-2">
          Showing Top {maxSlices} on chart + {remainingItems.length} grouped under{' '}
          <button
            type="button"
            onClick={() => setHighlightOthers((prev) => !prev)}
            className="text-blue-700 underline font-extrabold cursor-pointer"
          >
            Others
          </button>
          . Full breakdown listed below:
        </p>
      )}

      <div className="w-full rounded-xl border border-slate-300 overflow-hidden bg-white">
        <div className="max-h-56 overflow-y-auto divide-y divide-slate-200">
          {sortedItems.map((item, idx) => {
            const pct = Math.round(((item[countKey] || 0) / total) * 100);
            const isInOthers = hasOthers && idx >= maxSlices;
            const dotColor = isInOthers ? '#475569' : palette[idx % palette.length];

            return (
              <div
                key={`${item[labelKey]}-${idx}`}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors ${
                  isInOthers && highlightOthers
                    ? 'bg-amber-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[11px] font-extrabold text-slate-400 w-5 shrink-0">
                    #{idx + 1}
                  </span>
                  <span
                    style={{ backgroundColor: dotColor }}
                    className="w-3 h-3 rounded-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      title={item[labelKey]}
                      className="font-extrabold text-slate-900 truncate"
                    >
                      {item[labelKey]}
                      {isInOthers && (
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          Others
                        </span>
                      )}
                    </p>
                    {subLabelKey && item[subLabelKey] && (
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        {item[subLabelKey]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-slate-600">{item[countKey]} req</span>
                  <span className="font-black px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 min-w-[44px] text-center">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-100 border-t-2 border-slate-300 px-3 py-2.5 flex items-center justify-between text-xs font-black text-slate-900">
          <span>
            {totalLabel} ({sortedItems.length} {sortedItems.length === 1 ? 'entry' : 'entries'})
          </span>
          <div className="flex items-center gap-2">
            <span className="text-blue-800">{total} req</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white">100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState('Super Admin');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const [activeTab, setActiveTab] = useState('COLLECTORS');
  const [geoViewMode, setGeoViewMode] = useState('DISTRICT');

  const [collectors, setCollectors] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [analytics, setAnalytics] = useState({
    kpis: {
      total_citizens: 0,
      total_collectors: 0,
      pending_collector_approvals: 0,
      total_requests: 0,
      pending_requests: 0,
      in_progress_requests: 0,
      completed_requests: 0,
      rejected_requests: 0,
    },
    waste_categories: [],
    district_breakdown: [],
    municipality_breakdown: [],
    citizens_list: [],
  });

  const [collectorFilter, setCollectorFilter] = useState('ALL');
  const [showCollectorSearch, setShowCollectorSearch] = useState(false);
  const [collectorSearch, setCollectorSearch] = useState('');

  const [citizenSearch, setCitizenSearch] = useState('');

  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterMunicipality, setFilterMunicipality] = useState('ALL');
  const [filterWard, setFilterWard] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    return `${BACKEND_BASE_URL}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  const fetchAllAdminData = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const headers = { Authorization: `Bearer ${token}` };

      const [collectorsRes, requestsRes, analyticsRes] = await Promise.all([
        API.get('admin/collectors/', { headers }),
        API.get('pickups/admin/all-requests/', { headers }),
        API.get('pickups/admin/analytics/', { headers }),
      ]);

      setCollectors(Array.isArray(collectorsRes.data) ? collectorsRes.data : []);
      setAllRequests(
        Array.isArray(requestsRes.data) ? requestsRes.data : requestsRes.data.results || []
      );
      if (analyticsRes.data) {
        setAnalytics({
          kpis: analyticsRes.data.kpis || {},
          waste_categories: analyticsRes.data.waste_categories || [],
          district_breakdown: analyticsRes.data.district_breakdown || [],
          municipality_breakdown: analyticsRes.data.municipality_breakdown || [],
          citizens_list: analyticsRes.data.citizens_list || [],
        });
      }

      if (manualRefresh) {
        setStatusMessage({ type: 'success', text: '✓ Command Center synced with latest system data.' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 2500);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || err.response?.data?.error || 'Failed to load admin data.',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access');
    const role = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_name') || 'Super Admin';

    if (!token || role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setAdminName(storedName);
    fetchAllAdminData(false);
  }, [navigate, fetchAllAdminData]);

  const handleVerifyCollector = async (profileId, action) => {
    setActionLoadingId(profileId);
    setStatusMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const res = await API.patch(
        `admin/collectors/${profileId}/verify/`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage({
        type: 'success',
        text: res.data?.message || `Collector ${action.toLowerCase()}d successfully.`,
      });
      await fetchAllAdminData(false);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update collector status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReopenRequest = async (requestId) => {
    setActionLoadingId(requestId);
    setStatusMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const res = await API.patch(
        `pickups/admin/reopen/${requestId}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'Request re-opened to PENDING.',
      });
      await fetchAllAdminData(false);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to re-open request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (passwordForm.new_password.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setStatusMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const res = await API.post(
        'admin/change-password/',
        {
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'Admin password updated successfully.',
      });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredCollectors = collectors.filter((c) => {
    if (collectorFilter === 'PENDING' && c.is_verified) return false;
    if (collectorFilter === 'VERIFIED' && !c.is_verified) return false;

    if (collectorSearch.trim()) {
      const q = collectorSearch.toLowerCase().trim();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  const filteredCitizens = (analytics.citizens_list || []).filter((cit) => {
    if (!citizenSearch.trim()) return true;
    const q = citizenSearch.toLowerCase().trim();
    return (
      (cit.name || '').toLowerCase().includes(q) ||
      (cit.phone || '').toLowerCase().includes(q)
    );
  });

  const uniqueDistricts = [...new Set(allRequests.map((r) => r.district).filter(Boolean))];
  const uniqueMunicipalities = [...new Set(allRequests.map((r) => r.municipality).filter(Boolean))];
  const uniqueWards = [...new Set(allRequests.map((r) => r.ward_no).filter(Boolean))].sort((a, b) => a - b);

  const filteredRequests = allRequests.filter((r) => {
    if (filterDistrict !== 'ALL' && r.district !== filterDistrict) return false;
    if (filterMunicipality !== 'ALL' && r.municipality !== filterMunicipality) return false;
    if (filterWard !== 'ALL' && String(r.ward_no) !== String(filterWard)) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.user_name || '').toLowerCase().includes(q);
      const matchPhone = (r.user_phone || '').toLowerCase().includes(q);
      const matchAddress = (r.house_details || '').toLowerCase().includes(q);
      const matchItem = (r.ai_detected_item || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchAddress && !matchItem) return false;
    }
    return true;
  });

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-teal-50 text-teal-900 border-teal-300';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-900 border-red-300';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-amber-50 text-amber-900 border-amber-300';
    }
  };

  const { kpis } = analytics;
  const activePickupsCount = (kpis.pending_requests || 0) + (kpis.in_progress_requests || 0);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                  Civic<span className="text-blue-700">Cycle</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
                  Command Center
                </span>
                <span className="hidden md:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  System Admin
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5 truncate">
                <span className="sm:hidden">Admin: </span>
                <span className="hidden sm:inline">Administrator: </span>
                <span className="text-slate-900 font-bold">{adminName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => fetchAllAdminData(true)}
              disabled={isRefreshing}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
              title="Sync Data"
            >
              {isRefreshing ? (
                'Syncing...'
              ) : (
                <>
                  <span>↻ Sync</span>
                  <span className="hidden sm:inline"> Data</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                Pending Approvals
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                KYC
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black text-amber-700 mt-2">
              {kpis.pending_collector_approvals || 0}
            </span>
            <span className="text-xs font-semibold text-slate-600 mt-1">
              Out of {kpis.total_collectors || 0} registered collectors
            </span>
          </div>

          <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                Active Pickups
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-950 border border-blue-300">
                LIVE
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black text-blue-700 mt-2">
              {activePickupsCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 mt-1">
              {kpis.pending_requests || 0} Pending • {kpis.in_progress_requests || 0} In Progress
            </span>
          </div>

          <div className="bg-white rounded-2xl border-2 border-teal-300 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                Completed Pickups
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-100 text-teal-950 border border-teal-300">
                DONE
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black text-teal-700 mt-2">
              {kpis.completed_requests || 0}
            </span>
            <span className="text-xs font-semibold text-slate-600 mt-1">
              Out of {kpis.total_requests || 0} total requests
            </span>
          </div>

          <div
            onClick={() => setActiveTab('CITIZENS')}
            className={`bg-white rounded-2xl border-2 p-5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
              activeTab === 'CITIZENS'
                ? 'border-blue-700 ring-2 ring-blue-200'
                : 'border-slate-300 hover:border-blue-600 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Registered Citizens
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-900 border border-slate-300">
                USERS ↗
              </span>
            </div>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              {kpis.total_citizens || 0}
            </span>
            <span className="text-xs font-semibold text-blue-700 mt-1">
              Click to view registered citizens
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 p-3 shadow-2xs flex flex-wrap gap-2">
          {[
            { key: 'COLLECTORS', label: `Collector Verification (${collectors.length})` },
            { key: 'REQUESTS', label: `Master Request Explorer (${allRequests.length})` },
            { key: 'ANALYTICS', label: 'AI Waste Analytics' },
            { key: 'SECURITY', label: 'Admin Security' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all cursor-pointer ${
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

        {activeTab === 'CITIZENS' && (
          <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Registered Citizens Directory ({kpis.total_citizens || 0})
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Household accounts registered on CivicCycle with contact number, join timestamp, and pickup volume.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search name or phone..."
                value={citizenSearch}
                onChange={(e) => setCitizenSearch(e.target.value)}
                className="px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700 w-full sm:w-64"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-600">
                Loading registered citizens...
              </div>
            ) : filteredCitizens.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <p className="text-sm font-extrabold text-slate-800">
                  No matching citizen accounts found.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Citizen Name</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Joined Date & Time</th>
                      <th className="py-3.5 px-4 text-right">Total Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredCitizens.map((cit) => (
                      <tr key={cit.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{cit.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{cit.phone}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                          {cit.joined_at}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-black">
                            {cit.total_requests} Requests
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'COLLECTORS' && (
          <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Collector KYC Verification & Roster
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Verify Government ID numbers and municipal jurisdiction before granting field access.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!showCollectorSearch ? (
                  <button
                    onClick={() => setShowCollectorSearch(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>🔍</span> Search
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white border-2 border-blue-700 rounded-lg px-2.5 py-1 shadow-2xs">
                    <span className="text-xs">🔍</span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search name or phone..."
                      value={collectorSearch}
                      onChange={(e) => setCollectorSearch(e.target.value)}
                      className="text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none w-40 sm:w-52"
                    />
                    <button
                      onClick={() => {
                        setCollectorSearch('');
                        setShowCollectorSearch(false);
                      }}
                      title="Close Search"
                      className="text-xs font-extrabold text-slate-500 hover:text-red-600 px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {['ALL', 'PENDING', 'VERIFIED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setCollectorFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 transition-colors cursor-pointer ${
                      collectorFilter === f
                        ? 'border-blue-700 bg-blue-50 text-blue-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending Approval' : 'Verified'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-600">
                Loading collector roster...
              </div>
            ) : filteredCollectors.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <p className="text-sm font-extrabold text-slate-800">
                  {collectorSearch.trim()
                    ? `No collectors matching "${collectorSearch}" found.`
                    : 'No collectors found under this filter.'}
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Collector Name</th>
                      <th className="py-3.5 px-4">Mobile</th>
                      <th className="py-3.5 px-4">Government ID Proof</th>
                      <th className="py-3.5 px-4">Jurisdiction</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredCollectors.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{col.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{col.phone}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-900 px-2.5 py-1 rounded-md border border-slate-300">
                            {col.id_card_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {col.assigned_municipality}, {col.assigned_district}
                        </td>
                        <td className="py-3.5 px-4">
                          {col.is_verified ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-900 border border-teal-300">
                              VERIFIED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                              PENDING REVIEW
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!col.is_verified ? (
                            <button
                              disabled={actionLoadingId === col.id}
                              onClick={() => handleVerifyCollector(col.id, 'APPROVE')}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold transition-colors cursor-pointer"
                            >
                              {actionLoadingId === col.id ? 'Approving...' : 'Approve & Verify'}
                            </button>
                          ) : (
                            <button
                              disabled={actionLoadingId === col.id}
                              onClick={() => handleVerifyCollector(col.id, 'REVOKE')}
                              className="px-3.5 py-1.5 rounded-lg border-2 border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-extrabold transition-colors cursor-pointer"
                            >
                              {actionLoadingId === col.id ? 'Updating...' : 'Suspend / Revoke'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'REQUESTS' && (
          <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Master Pickup Requests Explorer
              </h2>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Audit pickups across all districts, municipalities, and wards. Re-open delayed IN_PROGRESS tasks if required.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 bg-slate-100 rounded-xl border border-slate-300">
              <input
                type="text"
                placeholder="Search citizen, address, AI item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
              />

              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">All Districts</option>
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={filterMunicipality}
                onChange={(e) => setFilterMunicipality(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">All Municipalities</option>
                {uniqueMunicipalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">All Wards</option>
                {uniqueWards.map((w) => (
                  <option key={w} value={w}>
                    Ward {w}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <p className="text-sm font-extrabold text-slate-800">No matching pickup requests found.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3.5">
                {filteredRequests.map((req) => {
                  const fullImg = getImageUrl(req.image);
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-4 items-start"
                    >
                      <div
                        onClick={() => fullImg && setPreviewImage(fullImg)}
                        className={`w-full sm:w-32 h-36 sm:h-28 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0 flex items-center justify-center ${
                          fullImg ? 'cursor-zoom-in' : ''
                        }`}
                      >
                        {fullImg ? (
                          <img src={fullImg} alt="Waste" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">No Photo</span>
                        )}
                      </div>

                      <div className="flex-1 w-full min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                              #{req.id}
                            </span>
                            <span className="text-xs font-extrabold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-300">
                              AI: {req.ai_detected_item || 'Recyclable'}
                            </span>
                            <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                              {req.municipality} (Ward {req.ward_no})
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

                        <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-2">
                          <strong className="font-extrabold text-slate-900">Address:</strong>{' '}
                          {req.house_details}, {req.district}
                        </p>

                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          <strong className="font-extrabold text-slate-900">Citizen:</strong>{' '}
                          {req.user_name || 'N/A'} ({req.user_phone || 'N/A'})
                          {req.collector_name && (
                            <span className="ml-3 text-blue-800 font-extrabold">
                              - Assigned Collector: {req.collector_name}
                            </span>
                          )}
                        </p>

                        {req.collector_remark && (
                          <p className="text-xs font-medium text-slate-600 mt-1.5 italic">
                            Note: "{req.collector_remark}"
                          </p>
                        )}

                        {req.status === 'IN_PROGRESS' && (
                          <div className="mt-3">
                            <button
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleReopenRequest(req.id)}
                              className="px-3.5 py-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-extrabold transition-colors cursor-pointer"
                            >
                              {actionLoadingId === req.id
                                ? 'Re-opening...'
                                : '↺ Re-open Stuck Request to Pending'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm overflow-hidden">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  AI Detected Waste Breakdown
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Material classification distribution verified by Vision AI.
                </p>
              </div>

              <CakePieChart
                items={analytics.waste_categories}
                labelKey="ai_detected_item"
                maxSlices={7}
                totalLabel="Total Categorized Pickups"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 flex-wrap">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {geoViewMode === 'DISTRICT'
                      ? 'District Volume Distribution'
                      : 'Municipality Volume Distribution'}
                  </h2>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    {geoViewMode === 'DISTRICT'
                      ? 'Pickup volume across districts.'
                      : 'Top 5 on pie chart + complete municipality ranking below.'}
                  </p>
                </div>

                <div className="p-1 bg-slate-200 rounded-xl flex gap-1 border border-slate-300">
                  <button
                    onClick={() => setGeoViewMode('DISTRICT')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      geoViewMode === 'DISTRICT'
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'text-slate-800 hover:bg-slate-300/60'
                    }`}
                  >
                    Districts
                  </button>
                  <button
                    onClick={() => setGeoViewMode('MUNICIPALITY')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      geoViewMode === 'MUNICIPALITY'
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'text-slate-800 hover:bg-slate-300/60'
                    }`}
                  >
                    Municipalities
                  </button>
                </div>
              </div>

              {geoViewMode === 'DISTRICT' ? (
                <CakePieChart
                  items={analytics.district_breakdown || []}
                  labelKey="district"
                  maxSlices={5}
                  totalLabel="Total District Pickups"
                />
              ) : (
                <CakePieChart
                  items={analytics.municipality_breakdown || []}
                  labelKey="municipality"
                  subLabelKey="district"
                  maxSlices={5}
                  totalLabel="Total Municipality Pickups"
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="max-w-lg bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-blue-700" />
            <div className="p-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Administrator Security Settings
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Update your command center password. Credentials are secured with PBKDF2 hashing.
                </p>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    New Password (Min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-sm transition-colors cursor-pointer mt-2 ${
                    passwordLoading
                      ? 'bg-slate-500 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-800 shadow-sm'
                  }`}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Admin Password'}
                </button>
              </form>
            </div>
          </div>
        )}
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

export default AdminDashboard;