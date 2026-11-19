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
        className="text-lg sm:text-2xl font-bold tracking-tight leading-none text-[#3D2B1F]"
      >
        Civic<span className="text-[#E85D2A]">Cycle</span>
      </span>
    </div>
  );
}

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
    '#E85D2A',
    '#15803D',
    '#D97706',
    '#0284C7',
    '#7C3AED',
    '#6B5B4E',
    '#0D9488',
  ];

  const sortedItems = [...items].sort((a, b) => (b[countKey] || 0) - (a[countKey] || 0));
  const total = sortedItems.reduce((sum, item) => sum + (item[countKey] || 0), 0);

  if (total === 0 || sortedItems.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-medium text-[#6B5B4E]">
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
            color: '#6B5B4E',
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
        <p className="text-[11px] font-semibold text-[#6B5B4E] -mt-2">
          Showing Top {maxSlices} on chart + {remainingItems.length} grouped under{' '}
          <button
            type="button"
            onClick={() => setHighlightOthers((prev) => !prev)}
            className="text-[#E85D2A] underline font-bold cursor-pointer"
          >
            Others
          </button>
          . Full breakdown listed below:
        </p>
      )}

      <div className="w-full rounded-2xl border border-[#E6E0D4] overflow-hidden bg-white">
        <div className="max-h-56 overflow-y-auto divide-y divide-[#EDE8DF]">
          {sortedItems.map((item, idx) => {
            const pct = Math.round(((item[countKey] || 0) / total) * 100);
            const isInOthers = hasOthers && idx >= maxSlices;
            const dotColor = isInOthers ? '#6B5B4E' : palette[idx % palette.length];

            return (
              <div
                key={`${item[labelKey]}-${idx}`}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs transition-colors ${
                  isInOthers && highlightOthers
                    ? 'bg-[#FEF9C3]/50'
                    : 'hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-[#9E8F80] w-5 shrink-0">
                    #{idx + 1}
                  </span>
                  <span
                    style={{ backgroundColor: dotColor }}
                    className="w-3 h-3 rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      title={item[labelKey]}
                      className="font-bold text-[#3D2B1F] truncate"
                    >
                      {item[labelKey]}
                      {isInOthers && (
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F3EDE3] text-[#6B5B4E]">
                          Others
                        </span>
                      )}
                    </p>
                    {subLabelKey && item[subLabelKey] && (
                      <p className="text-[11px] font-medium text-[#9E8F80] truncate">
                        {item[subLabelKey]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-[#6B5B4E]">{item[countKey]} req</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E6E0D4] text-[#3D2B1F] min-w-[44px] text-center">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#FAF8F5] border-t border-[#E6E0D4] px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#3D2B1F]">
          <span>
            {totalLabel} ({sortedItems.length} {sortedItems.length === 1 ? 'entry' : 'entries'})
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[#E85D2A]">{total} req</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#3D2B1F] text-white">100%</span>
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
        return 'bg-[#ECFDF5] text-[#166534] border-[#BBF7D0]';
      case 'IN_PROGRESS':
        return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';
      case 'REJECTED':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      case 'CANCELLED':
        return 'bg-[#F3EDE3] text-[#6B5B4E] border-[#DED6C9]';
      default:
        return 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]';
    }
  };

  const { kpis } = analytics;
  const activePickupsCount = (kpis.pending_requests || 0) + (kpis.in_progress_requests || 0);

  return (
    <div style={SANS_FONT} className="min-h-screen bg-[#FAF8F5] text-[#3D2B1F] flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#E6E0D4] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CivicCycleLogo />
            <div className="hidden sm:block h-5 w-px bg-[#E6E0D4]" />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#3D2B1F] text-white">
                Command Center
              </span>
              <p className="text-xs font-medium text-[#6B5B4E] truncate">
                Admin: <span className="text-[#3D2B1F] font-bold">{adminName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchAllAdminData(true)}
              disabled={isRefreshing}
              className="px-3.5 sm:px-4 py-2 rounded-full border border-[#D8CFC2] bg-[#FAF8F5] hover:bg-[#F3EDE3] text-[#3D2B1F] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
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
              className="px-3.5 sm:px-4 py-2 rounded-full border border-[#D8CFC2] bg-white hover:bg-[#FAF5EE] hover:border-[#3D2B1F] text-[#3D2B1F] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7 space-y-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#854D0E]">
                Pending Approvals
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                KYC
              </span>
            </div>
            <span style={SERIF_FONT} className="text-3xl sm:text-4xl font-bold text-[#A16207] mt-2">
              {kpis.pending_collector_approvals || 0}
            </span>
            <span className="text-xs font-medium text-[#6B5B4E] mt-1">
              Out of {kpis.total_collectors || 0} registered collectors
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C]">
                Active Pickups
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
                LIVE
              </span>
            </div>
            <span style={SERIF_FONT} className="text-3xl sm:text-4xl font-bold text-[#E85D2A] mt-2">
              {activePickupsCount}
            </span>
            <span className="text-xs font-medium text-[#6B5B4E] mt-1">
              {kpis.pending_requests || 0} Pending • {kpis.in_progress_requests || 0} In Progress
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                Completed Pickups
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#166534] border border-[#BBF7D0]">
                DONE
              </span>
            </div>
            <span style={SERIF_FONT} className="text-3xl sm:text-4xl font-bold text-[#15803D] mt-2">
              {kpis.completed_requests || 0}
            </span>
            <span className="text-xs font-medium text-[#6B5B4E] mt-1">
              Out of {kpis.total_requests || 0} total requests
            </span>
          </div>

          <div
            onClick={() => setActiveTab('CITIZENS')}
            className={`bg-white rounded-3xl border p-5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex flex-col justify-between cursor-pointer transition-all ${
              activeTab === 'CITIZENS'
                ? 'border-[#3D2B1F] ring-1 ring-[#3D2B1F]'
                : 'border-[#E6E0D4] hover:border-[#3D2B1F]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D2B1F]">
                Registered Citizens
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3EDE3] text-[#3D2B1F]">
                USERS ↗
              </span>
            </div>
            <span style={SERIF_FONT} className="text-3xl sm:text-4xl font-bold text-[#3D2B1F] mt-2">
              {kpis.total_citizens || 0}
            </span>
            <span className="text-xs font-bold text-[#E85D2A] mt-1">
              Click to view registered citizens
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6E0D4] p-3.5 shadow-[0_2px_10px_rgba(61,43,31,0.03)] flex flex-wrap gap-2">
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

        {activeTab === 'CITIZENS' && (
          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-6 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EDE8DF]">
              <div>
                <h2 style={SERIF_FONT} className="text-2xl font-bold text-[#3D2B1F] tracking-tight">
                  Registered Citizens Directory ({kpis.total_citizens || 0})
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1">
                  Household accounts registered on CivicCycle with contact number, join timestamp, and pickup volume.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search name or phone..."
                value={citizenSearch}
                onChange={(e) => setCitizenSearch(e.target.value)}
                className="px-4 py-2 rounded-full border border-[#DED6C9] bg-[#FAF8F5] text-xs font-semibold text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none focus:bg-white focus:border-[#3D2B1F] w-full sm:w-64"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-medium text-[#6B5B4E]">
                Loading registered citizens...
              </div>
            ) : filteredCitizens.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D8CFC2]">
                <p style={SERIF_FONT} className="text-base font-bold text-[#3D2B1F]">
                  No matching citizen accounts found.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E6E0D4]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E6E0D4] text-[#6B5B4E] font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Citizen Name</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Joined Date & Time</th>
                      <th className="py-3.5 px-4 text-right">Total Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8DF] bg-white">
                    {filteredCitizens.map((cit) => (
                      <tr key={cit.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#3D2B1F]">{cit.name}</td>
                        <td className="py-3.5 px-4 font-medium text-[#6B5B4E]">{cit.phone}</td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[#6B5B4E]">
                          {cit.joined_at}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-3 py-1 rounded-full bg-[#FAF8F5] text-[#3D2B1F] border border-[#E6E0D4] text-xs font-bold">
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
          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-6 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EDE8DF]">
              <div>
                <h2 style={SERIF_FONT} className="text-2xl font-bold text-[#3D2B1F] tracking-tight">
                  Collector KYC Verification & Roster
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1">
                  Verify Government ID numbers and municipal jurisdiction before granting field access.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!showCollectorSearch ? (
                  <button
                    onClick={() => setShowCollectorSearch(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#D8CFC2] bg-[#FAF8F5] hover:bg-[#F3EDE3] text-[#3D2B1F] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>🔍</span> Search
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white border border-[#3D2B1F] rounded-full px-3 py-1">
                    <span className="text-xs">🔍</span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search name or phone..."
                      value={collectorSearch}
                      onChange={(e) => setCollectorSearch(e.target.value)}
                      className="text-xs font-semibold text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none w-40 sm:w-52"
                    />
                    <button
                      onClick={() => {
                        setCollectorSearch('');
                        setShowCollectorSearch(false);
                      }}
                      title="Close Search"
                      className="text-xs font-bold text-[#6B5B4E] hover:text-[#B91C1C] px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {['ALL', 'PENDING', 'VERIFIED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setCollectorFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                      collectorFilter === f
                        ? 'border-[#3D2B1F] bg-[#3D2B1F] text-white'
                        : 'border-[#E6E0D4] bg-[#FAF8F5] text-[#6B5B4E] hover:border-[#3D2B1F] hover:text-[#3D2B1F]'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending Approval' : 'Verified'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-medium text-[#6B5B4E]">
                Loading collector roster...
              </div>
            ) : filteredCollectors.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D8CFC2]">
                <p style={SERIF_FONT} className="text-base font-bold text-[#3D2B1F]">
                  {collectorSearch.trim()
                    ? `No collectors matching "${collectorSearch}" found.`
                    : 'No collectors found under this filter.'}
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E6E0D4]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E6E0D4] text-[#6B5B4E] font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Collector Name</th>
                      <th className="py-3.5 px-4">Mobile</th>
                      <th className="py-3.5 px-4">Government ID Proof</th>
                      <th className="py-3.5 px-4">Jurisdiction</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8DF] bg-white">
                    {filteredCollectors.map((col) => (
                      <tr key={col.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#3D2B1F]">{col.name}</td>
                        <td className="py-3.5 px-4 font-medium text-[#6B5B4E]">{col.phone}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold bg-[#FAF8F5] text-[#3D2B1F] px-2.5 py-1 rounded-lg border border-[#E6E0D4]">
                            {col.id_card_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#3D2B1F]">
                          {col.assigned_municipality}, {col.assigned_district}
                        </td>
                        <td className="py-3.5 px-4">
                          {col.is_verified ? (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#166534] border border-[#BBF7D0]">
                              VERIFIED
                            </span>
                          ) : (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                              PENDING REVIEW
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!col.is_verified ? (
                            <button
                              disabled={actionLoadingId === col.id}
                              onClick={() => handleVerifyCollector(col.id, 'APPROVE')}
                              className="px-4 py-1.5 rounded-full bg-[#F9D548] hover:bg-[#F3C623] text-[#3D2B1F] text-xs font-bold transition-colors cursor-pointer"
                            >
                              {actionLoadingId === col.id ? 'Approving...' : 'Approve & Verify'}
                            </button>
                          ) : (
                            <button
                              disabled={actionLoadingId === col.id}
                              onClick={() => handleVerifyCollector(col.id, 'REVOKE')}
                              className="px-4 py-1.5 rounded-full border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#B91C1C] text-xs font-bold transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl border border-[#E6E0D4] p-6 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)]">
            <div className="pb-5 border-b border-[#EDE8DF]">
              <h2 style={SERIF_FONT} className="text-2xl font-bold text-[#3D2B1F] tracking-tight">
                Master Pickup Requests Explorer
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1">
                Audit pickups across all districts, municipalities, and wards. Re-open delayed IN_PROGRESS tasks if required.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-[#FAF8F5] rounded-2xl border border-[#E6E0D4]">
              <input
                type="text"
                placeholder="Search citizen, address, AI item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#DED6C9] bg-white text-xs font-medium text-[#3D2B1F] placeholder-[#9E8F80] focus:outline-none focus:border-[#3D2B1F]"
              />

              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#DED6C9] bg-white text-xs font-semibold text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
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
                className="px-3.5 py-2 rounded-xl border border-[#DED6C9] bg-white text-xs font-semibold text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
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
                className="px-3.5 py-2 rounded-xl border border-[#DED6C9] bg-white text-xs font-semibold text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
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
                className="px-3.5 py-2 rounded-xl border border-[#DED6C9] bg-white text-xs font-semibold text-[#3D2B1F] focus:outline-none focus:border-[#3D2B1F]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="mt-5 py-12 px-4 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D8CFC2]">
                <p style={SERIF_FONT} className="text-base font-bold text-[#3D2B1F]">
                  No matching pickup requests found.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {filteredRequests.map((req) => {
                  const fullImg = getImageUrl(req.image);
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-[#EDE8DF] bg-[#FAF8F5]/80 flex flex-col sm:flex-row gap-4 items-start"
                    >
                      <div
                        onClick={() => fullImg && setPreviewImage(fullImg)}
                        className={`w-full sm:w-32 h-36 sm:h-28 rounded-xl overflow-hidden border border-[#E6E0D4] bg-white shrink-0 flex items-center justify-center ${
                          fullImg ? 'cursor-zoom-in' : ''
                        }`}
                      >
                        {fullImg ? (
                          <img src={fullImg} alt="Waste" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-[#9E8F80]">No Photo</span>
                        )}
                      </div>

                      <div className="flex-1 w-full min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#3D2B1F] bg-[#F3EDE3] px-2.5 py-0.5 rounded-full">
                              #{req.id}
                            </span>
                            <span className="text-xs font-bold text-[#3D2B1F] bg-white px-3 py-0.5 rounded-full border border-[#E6E0D4]">
                              AI: <span className="text-[#E85D2A]">{req.ai_detected_item || 'Recyclable'}</span>
                            </span>
                            <span className="text-xs font-semibold text-[#6B5B4E] bg-white px-3 py-0.5 rounded-full border border-[#E6E0D4]">
                              {req.municipality} (Ward {req.ward_no})
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

                        <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-2">
                          <strong className="font-bold text-[#3D2B1F]">Address:</strong>{' '}
                          {req.house_details}, {req.district}
                        </p>

                        <p className="text-xs font-medium text-[#6B5B4E] mt-1">
                          <strong className="font-bold text-[#3D2B1F]">Citizen:</strong>{' '}
                          {req.user_name || 'N/A'} ({req.user_phone || 'N/A'})
                          {req.collector_name && (
                            <span className="ml-2 text-[#E85D2A] font-bold">
                              • Assigned Collector: {req.collector_name}
                            </span>
                          )}
                        </p>

                        {req.collector_remark && (
                          <p className="text-xs font-medium text-[#6B5B4E] mt-1.5 italic">
                            Note: "{req.collector_remark}"
                          </p>
                        )}

                        {req.status === 'IN_PROGRESS' && (
                          <div className="mt-3">
                            <button
                              disabled={actionLoadingId === req.id}
                              onClick={() => handleReopenRequest(req.id)}
                              className="px-4 py-1.5 rounded-full border border-[#FDE047] bg-[#FEF9C3] hover:bg-[#F9D548] text-[#3D2B1F] text-xs font-bold transition-colors cursor-pointer"
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
            <div className="bg-white rounded-3xl border border-[#E6E0D4] p-6 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)] overflow-hidden">
              <div className="pb-4 border-b border-[#EDE8DF]">
                <h2 style={SERIF_FONT} className="text-2xl font-bold text-[#3D2B1F] tracking-tight">
                  AI Detected Waste Breakdown
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1">
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

            <div className="bg-white rounded-3xl border border-[#E6E0D4] p-6 sm:p-7 shadow-[0_4px_20px_rgba(61,43,31,0.04)] overflow-hidden">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EDE8DF] flex-wrap">
                <div>
                  <h2 style={SERIF_FONT} className="text-2xl font-bold text-[#3D2B1F] tracking-tight">
                    {geoViewMode === 'DISTRICT'
                      ? 'District Volume Distribution'
                      : 'Municipality Volume Distribution'}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-1">
                    {geoViewMode === 'DISTRICT'
                      ? 'Pickup volume across districts.'
                      : 'Top 5 on pie chart + complete municipality ranking below.'}
                  </p>
                </div>

                <div className="p-1 bg-[#EDE8DF] rounded-full flex gap-1">
                  <button
                    onClick={() => setGeoViewMode('DISTRICT')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      geoViewMode === 'DISTRICT'
                        ? 'bg-[#3D2B1F] text-white shadow-2xs'
                        : 'text-[#6B5B4E] hover:text-[#3D2B1F]'
                    }`}
                  >
                    Districts
                  </button>
                  <button
                    onClick={() => setGeoViewMode('MUNICIPALITY')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      geoViewMode === 'MUNICIPALITY'
                        ? 'bg-[#3D2B1F] text-white shadow-2xs'
                        : 'text-[#6B5B4E] hover:text-[#3D2B1F]'
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
          <div className="max-w-lg bg-white rounded-3xl border border-[#E6E0D4] shadow-[0_4px_20px_rgba(61,43,31,0.04)] overflow-hidden">
            <div className="p-6 sm:p-7">
              <div className="pb-5 border-b border-[#EDE8DF]">
                <h2
                  style={SERIF_FONT}
                  className="text-2xl font-bold text-[#3D2B1F] tracking-tight inline-block"
                >
                  Administrator Security
                  <span className="block h-1.5 w-24 bg-[#F9D548] rounded-full mt-1.5" />
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#6B5B4E] mt-2">
                  Update your command center password. Credentials are secured with PBKDF2 hashing.
                </p>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-medium text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                    New Password (Min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-medium text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B5B4E] uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DED6C9] rounded-xl text-sm font-medium text-[#3D2B1F] focus:outline-none focus:bg-white focus:border-[#3D2B1F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className={`w-full py-3.5 px-6 rounded-full font-bold text-sm transition-all cursor-pointer mt-2 ${
                    passwordLoading
                      ? 'bg-[#E6E0D4] text-[#6B5B4E] cursor-not-allowed'
                      : 'bg-[#F9D548] hover:bg-[#F3C623] text-[#3D2B1F] active:scale-[0.99] shadow-xs'
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

export default AdminDashboard;