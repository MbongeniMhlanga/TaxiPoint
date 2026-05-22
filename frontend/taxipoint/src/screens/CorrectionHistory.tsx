import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

type CorrectionType =
  | 'WRONG_ROUTE_NUMBER'
  | 'MISSING_ROUTE'
  | 'WRONG_FARE'
  | 'RANK_CLOSED'
  | 'MISSING_RANK'
  | 'ROUTE_CHANGE'
  | 'OTHER';

interface CorrectionSubmission {
  id: string;
  rankId?: string | null;
  rankNameSnapshot?: string | null;
  correctionType: CorrectionType;
  description: string;
  details?: Record<string, any> | null;
  status: string;
  confirmationsCount: number;
  rejectionsCount: number;
  autoApproved: boolean;
  reviewedByEmail?: string | null;
  reviewNotes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface User {
  token: string;
}

interface CorrectionHistoryProps {
  user: User;
}

const formatCorrectionType = (type: string) => {
  const labels: Record<string, string> = {
    WRONG_ROUTE_NUMBER: 'Wrong route number',
    MISSING_ROUTE: 'Missing route',
    WRONG_FARE: 'Wrong fare',
    RANK_CLOSED: 'Rank closed',
    MISSING_RANK: 'Missing rank',
    ROUTE_CHANGE: 'Route change',
    OTHER: 'Other',
  };

  return labels[type] ?? type;
};

const formatStatus = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

const formatDate = (value?: string | null) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatFare = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return `R${Math.round(amount)}`;
};

const CorrectionHistory: React.FC<CorrectionHistoryProps> = ({ user }) => {
  const [submissions, setSubmissions] = useState<CorrectionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [browsingRanks, setBrowsingRanks] = useState(false);
  const navigate = useNavigate();

  const loadHistory = async (showSpinner = true) => {
    if (!user?.token) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/mine`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        setSubmissions([]);
        return;
      }

      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load correction history:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.token]);

  const counts = submissions.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'APPROVED') acc.approved += 1;
      if (item.status === 'REJECTED') acc.rejected += 1;
      if (item.status === 'PENDING' || item.status === 'UNDER_REVIEW') acc.pending += 1;
      return acc;
    },
    { total: 0, approved: 0, rejected: 0, pending: 0 }
  );

  const renderDetails = (item: CorrectionSubmission) => {
    const details = item.details ?? {};
    const entries: Array<{ label: string; value: string }> = [];

    if (item.rankNameSnapshot) entries.push({ label: 'Rank', value: item.rankNameSnapshot });
    if (details.route) entries.push({ label: 'Route', value: String(details.route) });
    if (details.oldRoute) entries.push({ label: 'Old route', value: String(details.oldRoute) });
    if (details.newRoute) entries.push({ label: 'New route', value: String(details.newRoute) });
    if (details.correctedRoute) entries.push({ label: 'Correct route', value: String(details.correctedRoute) });

    const fareValue = formatFare(details.fare);
    if (fareValue) entries.push({ label: 'Fare', value: fareValue });

    if (details.name) entries.push({ label: 'Rank name', value: String(details.name) });
    if (details.address) entries.push({ label: 'Address', value: String(details.address) });
    if (details.district) entries.push({ label: 'District', value: String(details.district) });

    return entries;
  };

  const statusTone = (status: string) => {
    if (status === 'APPROVED') return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    if (status === 'REJECTED') return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    if (status === 'FLAGGED') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
  };

  const browseTaxiRanks = async () => {
    setBrowsingRanks(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`);
      if (!res.ok) {
        throw new Error('Failed to load taxi ranks.');
      }

      const data = await res.json();
      const ranks = data.content || (Array.isArray(data) ? data : []);
      navigate('/taxi-ranks', { state: { preloadedTaxiRanks: ranks } });
    } catch (err) {
      console.error('Failed to prefetch taxi ranks:', err);
      navigate('/taxi-ranks');
    } finally {
      setBrowsingRanks(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <History size={14} />
                  Commuter tools
                </p>
                <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Correction History
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
                  Track every correction you’ve submitted, see how the community voted, and follow the review status from one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadHistory(false)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Total</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Pending</p>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{counts.pending}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Approved</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{counts.approved}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Rejected</p>
                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{counts.rejected}</p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid gap-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse"
                >
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
                  <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
                  <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                  <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : submissions.length > 0 ? (
            <div className="grid gap-4">
              {submissions.map((item) => {
                const details = renderDetails(item);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusTone(item.status)}`}>
                            {formatStatus(item.status)}
                          </span>
                          {item.autoApproved ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                              <CheckCircle2 size={14} />
                              Auto-approved
                            </span>
                          ) : null}
                          {item.status === 'FLAGGED' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                              <ShieldAlert size={14} />
                              Needs review
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {item.rankNameSnapshot ?? 'Taxi rank'}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatCorrectionType(item.correctionType)} • {formatDate(item.createdAt)}
                          </p>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="min-w-[220px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock3 size={16} />
                          Community feedback
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            {item.confirmationsCount} confirmations
                          </span>
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                            {item.rejectionsCount} rejections
                          </span>
                        </div>
                        {item.reviewedByEmail ? (
                          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Reviewed by {item.reviewedByEmail}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {details.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {details.map((entry) => (
                          <span
                            key={`${item.id}-${entry.label}`}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60"
                          >
                            <span className="text-gray-400 dark:text-gray-500">{entry.label}:</span>
                            <span className="text-gray-900 dark:text-white">{entry.value}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {item.reviewNotes ? (
                      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                          Review notes
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{item.reviewNotes}</p>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <History size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No corrections yet</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                When you submit a correction from a taxi rank detail page, it will show up here with its review status and community votes.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={browseTaxiRanks}
                  disabled={browsingRanks}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition disabled:opacity-70"
                >
                  {browsingRanks ? 'Loading ranks...' : 'Browse taxi ranks'}
                </button>
                <Link
                  to="/landing"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Go home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorrectionHistory;
