import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

type CorrectionType =
  | 'WRONG_ROUTE_NUMBER'
  | 'MISSING_ROUTE'
  | 'WRONG_FARE'
  | 'RANK_CLOSED'
  | 'MISSING_RANK'
  | 'ROUTE_CHANGE'
  | 'OTHER';

interface TaxiRank {
  id: string;
  name: string;
  district?: string;
  address?: string;
  routesServed?: string[];
}

interface UserLike {
  token: string;
}

interface CorrectionModalProps {
  isOpen: boolean;
  rank: TaxiRank | null;
  user: UserLike | null;
  onClose: () => void;
}

const correctionOptions: { value: CorrectionType; label: string; description: string }[] = [
  { value: 'WRONG_ROUTE_NUMBER', label: 'Wrong route number', description: 'The route number shown is incorrect.' },
  { value: 'MISSING_ROUTE', label: 'Missing route', description: 'A route is available but not listed.' },
  { value: 'WRONG_FARE', label: 'Wrong fare', description: 'The fare amount needs correcting.' },
  { value: 'ROUTE_CHANGE', label: 'Route change', description: 'A route now goes somewhere different.' },
  { value: 'RANK_CLOSED', label: 'Rank closed', description: 'This rank is no longer active.' },
  { value: 'MISSING_RANK', label: 'Missing rank', description: 'A rank should be added to the app.' },
  { value: 'OTHER', label: 'Other', description: 'Something else needs attention.' },
];

const emptyForm = {
  correctionType: 'WRONG_FARE' as CorrectionType,
  description: '',
  routeSelection: '',
  routeManual: '',
  correctedRouteSelection: '',
  correctedRouteManual: '',
  fare: '',
  name: '',
  address: '',
  district: '',
  latitude: '',
  longitude: '',
  routesServed: '',
};

const CorrectionModal: React.FC<CorrectionModalProps> = ({ isOpen, rank, user, onClose }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const routeOptions = Array.from(new Set((rank?.routesServed ?? []).filter(Boolean)));
  const OTHER_ROUTE_VALUE = '__other__';

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...emptyForm,
        name: rank?.name ?? '',
        address: rank?.address ?? '',
        district: rank?.district ?? '',
      });
    }
  }, [isOpen, rank]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resolveRouteValue = (selection: string, manual: string) => {
    if (!selection.trim()) return '';
    if (selection === OTHER_ROUTE_VALUE) {
      return manual.trim();
    }
    return selection.trim();
  };

  const renderRouteSelector = (
    selectionField: 'routeSelection' | 'correctedRouteSelection',
    manualField: 'routeManual' | 'correctedRouteManual',
    selectionPlaceholder: string,
    manualPlaceholder: string,
  ) => {
    const selectionValue = form[selectionField];
    const showManualInput = selectionValue === OTHER_ROUTE_VALUE || routeOptions.length === 0;

    return (
      <div className="space-y-2">
        {routeOptions.length > 0 ? (
          <select
            value={selectionValue}
            onChange={(e) => updateField(selectionField, e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{selectionPlaceholder}</option>
            {routeOptions.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
            <option value={OTHER_ROUTE_VALUE}>Other / not listed</option>
          </select>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-3 text-sm text-gray-500 dark:text-gray-400">
            No routes are listed for this rank yet. Please type the route name manually.
          </div>
        )}

        {showManualInput ? (
          <input
            value={form[manualField]}
            onChange={(e) => updateField(manualField, e.target.value)}
            placeholder={manualPlaceholder}
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : null}
      </div>
    );
  };

  const buildDetails = () => {
    const selectedRoute = resolveRouteValue(form.routeSelection, form.routeManual);
    const correctedRoute = resolveRouteValue(form.correctedRouteSelection, form.correctedRouteManual);

    switch (form.correctionType) {
      case 'WRONG_ROUTE_NUMBER':
        return {
          route: selectedRoute,
          correctedRoute,
        };
      case 'MISSING_ROUTE':
        return {
          route: selectedRoute,
          fare: form.fare ? Number(form.fare) : undefined,
        };
      case 'WRONG_FARE':
        return {
          route: selectedRoute,
          fare: form.fare ? Number(form.fare) : undefined,
        };
      case 'ROUTE_CHANGE':
        return {
          oldRoute: selectedRoute,
          newRoute: correctedRoute,
          fare: form.fare ? Number(form.fare) : undefined,
        };
      case 'RANK_CLOSED':
        return {};
      case 'MISSING_RANK':
        return {
          name: form.name.trim(),
          address: form.address.trim(),
          district: form.district.trim(),
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          routesServed: form.routesServed
            .split(',')
            .map((route) => route.trim())
            .filter(Boolean),
        };
      default:
        return {
          notes: form.description.trim(),
        };
    }
  };

  const submitCorrection = async () => {
    if (!user?.token) {
      toast.error('Please sign in again to submit a correction.');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Please describe what should be corrected.');
      return;
    }

    const selectedRoute = resolveRouteValue(form.routeSelection, form.routeManual);
    const correctedRoute = resolveRouteValue(form.correctedRouteSelection, form.correctedRouteManual);

    if (
      (
        form.correctionType === 'WRONG_ROUTE_NUMBER' ||
        form.correctionType === 'MISSING_ROUTE' ||
        form.correctionType === 'WRONG_FARE' ||
        form.correctionType === 'ROUTE_CHANGE'
      ) && !selectedRoute
    ) {
      toast.error('Please select a route from the dropdown, or choose Other and type it in.');
      return;
    }

    if (form.correctionType === 'WRONG_FARE' && !form.fare.trim()) {
      toast.error('Please enter the correct fare amount.');
      return;
    }

    if ((form.correctionType === 'WRONG_ROUTE_NUMBER' || form.correctionType === 'ROUTE_CHANGE') && !correctedRoute) {
      toast.error('Please select the corrected route, or choose Other and type it in.');
      return;
    }

    if (form.correctionType === 'MISSING_RANK' && (!form.name.trim() || !form.address.trim() || !form.district.trim() || !form.latitude.trim() || !form.longitude.trim())) {
      toast.error('Please fill in the missing rank details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          rankId: rank?.id ?? null,
          rankNameSnapshot: rank?.name ?? '',
          correctionType: form.correctionType,
          description: form.description.trim(),
          details: buildDetails(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit correction.');
      }

      toast.success('Correction submitted successfully.');
      setForm({ ...emptyForm, correctionType: form.correctionType });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLabel = correctionOptions.find((option) => option.value === form.correctionType)?.label ?? 'Correction';

  const renderTypeFields = () => {
    switch (form.correctionType) {
      case 'WRONG_ROUTE_NUMBER':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Wrong route</p>
              {renderRouteSelector('routeSelection', 'routeManual', 'Select the wrong route', 'Type the wrong route number')}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Correct route</p>
              {renderRouteSelector('correctedRouteSelection', 'correctedRouteManual', 'Select the correct route', 'Type the correct route number')}
            </div>
          </div>
        );
      case 'MISSING_ROUTE':
      case 'WRONG_FARE':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Route / destination</p>
              {renderRouteSelector('routeSelection', 'routeManual', 'Select a route or destination', 'Type the route or destination')}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Fare</p>
              <input
                type="number"
                step="1"
                min="0"
                value={form.fare}
                onChange={(e) => updateField('fare', e.target.value)}
                placeholder="Fare amount"
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        );
      case 'ROUTE_CHANGE':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Old route</p>
              {renderRouteSelector('routeSelection', 'routeManual', 'Select the old route', 'Type the old route')}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">New route</p>
              {renderRouteSelector('correctedRouteSelection', 'correctedRouteManual', 'Select the new route', 'Type the new route')}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Updated fare</p>
              <input
                type="number"
                step="1"
                min="0"
                value={form.fare}
                onChange={(e) => updateField('fare', e.target.value)}
                placeholder="Updated fare (optional)"
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        );
      case 'MISSING_RANK':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Rank name"
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              value={form.district}
              onChange={(e) => updateField('district', e.target.value)}
              placeholder="District"
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Address"
              className="md:col-span-2 w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => updateField('latitude', e.target.value)}
              placeholder="Latitude"
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => updateField('longitude', e.target.value)}
              placeholder="Longitude"
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <textarea
              value={form.routesServed}
              onChange={(e) => updateField('routesServed', e.target.value)}
              placeholder="Routes served, comma separated (optional)"
              className="md:col-span-2 w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[90px]"
            />
          </div>
        );
      case 'RANK_CLOSED':
        return (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
            No extra fields are needed. Tell us why the rank should be marked closed in the description.
          </div>
        );
      default:
        return (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
            Add the correction details in the description below.
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  {rank?.name ?? 'Taxi Rank'}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  Suggest a correction
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Help us keep the rank information accurate for everyone.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">
                <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedLabel}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose the type of issue and add the smallest useful detail possible.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What is wrong?</label>
                <select
                  value={form.correctionType}
                  onChange={(e) => setForm((prev) => ({ ...prev, correctionType: e.target.value as CorrectionType }))}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {correctionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {renderTypeFields()}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe the correction in a sentence or two..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitCorrection}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Correction'}
                </button>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                You can view submitted corrections from the <span className="font-semibold text-gray-700 dark:text-gray-200">Corrections</span> item in the sidebar.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CorrectionModal;
