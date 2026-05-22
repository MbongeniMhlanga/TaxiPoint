import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getErrorMessage } from '@/utils/errorMessage';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  isVisible: boolean;
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

export default function CorrectionModal({ isVisible, rank, user, onClose }: CorrectionModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [pickerField, setPickerField] = useState<'routeSelection' | 'correctedRouteSelection' | null>(null);

  const routeOptions = useMemo(() => Array.from(new Set((rank?.routesServed ?? []).filter(Boolean))), [rank?.routesServed]);
  const otherRouteValue = '__other__';

  useEffect(() => {
    if (isVisible) {
      setForm({
        ...emptyForm,
        name: rank?.name ?? '',
        address: rank?.address ?? '',
        district: rank?.district ?? '',
      });
      setPickerField(null);
    }
  }, [isVisible, rank]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resolveRouteValue = (selection: string, manual: string) => {
    if (!selection.trim()) return '';
    if (selection === otherRouteValue) return manual.trim();
    return selection.trim();
  };

  const selectedLabel =
    correctionOptions.find((option) => option.value === form.correctionType)?.label ?? 'Correction';

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

  const validate = () => {
    const selectedRoute = resolveRouteValue(form.routeSelection, form.routeManual);
    const correctedRoute = resolveRouteValue(form.correctedRouteSelection, form.correctedRouteManual);

    if (!form.description.trim()) {
      Alert.alert('Missing details', 'Please describe what should be corrected.');
      return false;
    }

    if (
      (
        form.correctionType === 'WRONG_ROUTE_NUMBER' ||
        form.correctionType === 'MISSING_ROUTE' ||
        form.correctionType === 'WRONG_FARE' ||
        form.correctionType === 'ROUTE_CHANGE'
      ) && !selectedRoute
    ) {
      Alert.alert('Missing route', 'Please select a route from the dropdown, or choose Other and type it in.');
      return false;
    }

    if (form.correctionType === 'WRONG_FARE' && !form.fare.trim()) {
      Alert.alert('Missing fare', 'Please enter the correct fare amount.');
      return false;
    }

    if ((form.correctionType === 'WRONG_ROUTE_NUMBER' || form.correctionType === 'ROUTE_CHANGE') && !correctedRoute) {
      Alert.alert('Missing corrected route', 'Please select the corrected route, or choose Other and type it in.');
      return false;
    }

    if (form.correctionType === 'MISSING_RANK' && (!form.name.trim() || !form.address.trim() || !form.district.trim() || !form.latitude.trim() || !form.longitude.trim())) {
      Alert.alert('Missing fields', 'Please fill in the missing rank details.');
      return false;
    }

    return true;
  };

  const submitCorrection = async () => {
    if (!user?.token) {
      Alert.alert('Not signed in', 'Please sign in again to submit a correction.');
      return;
    }

    if (!validate()) return;

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
        throw new Error(getErrorMessage(res.status, await res.text(), 'admin'));
      }

      Alert.alert('Success', 'Correction submitted successfully.');
      setForm({ ...emptyForm, correctionType: form.correctionType });
      onClose();
    } catch (error) {
      Alert.alert('Report Failed', error instanceof Error ? error.message : 'Failed to submit correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRouteSelector = (
    selectionField: 'routeSelection' | 'correctedRouteSelection',
    manualField: 'routeManual' | 'correctedRouteManual',
    placeholder: string,
    manualPlaceholder: string,
  ) => {
    const currentSelection = form[selectionField];
    const showManualInput = currentSelection === otherRouteValue || routeOptions.length === 0;

    return (
      <View style={{ gap: 8 }}>
        {routeOptions.length > 0 ? (
          <Pressable
            onPress={() => setPickerField(selectionField)}
            style={[styles.selectField, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}
          >
            <Text style={{ color: currentSelection ? colors.text : colors.textSecondary }}>
              {currentSelection && currentSelection !== otherRouteValue ? currentSelection : placeholder}
            </Text>
            <Feather name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={[styles.noRoutesBox, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              No listed routes yet. Type the route manually.
            </Text>
          </View>
        )}

        {showManualInput ? (
          <TextInput
            value={form[manualField]}
            onChangeText={(value) => updateField(manualField, value)}
            placeholder={manualPlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
          />
        ) : null}
      </View>
    );
  };

  const renderTypeFields = () => {
    switch (form.correctionType) {
      case 'WRONG_ROUTE_NUMBER':
        return (
          <View style={styles.gridTwo}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Wrong route</Text>
              {renderRouteSelector('routeSelection', 'routeManual', 'Select wrong route', 'Type wrong route number')}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Correct route</Text>
              {renderRouteSelector('correctedRouteSelection', 'correctedRouteManual', 'Select corrected route', 'Type correct route number')}
            </View>
          </View>
        );
      case 'MISSING_ROUTE':
      case 'WRONG_FARE':
        return (
          <View style={styles.gridTwo}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Route / destination</Text>
              {renderRouteSelector('routeSelection', 'routeManual', 'Select a route or destination', 'Type the route or destination')}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Fare</Text>
              <TextInput
                value={form.fare}
                onChangeText={(value) => updateField('fare', value)}
                placeholder="Fare amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
          </View>
        );
      case 'ROUTE_CHANGE':
        return (
          <View style={styles.gridTwo}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Old route</Text>
              {renderRouteSelector('routeSelection', 'routeManual', 'Select old route', 'Type old route')}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>New route</Text>
              {renderRouteSelector('correctedRouteSelection', 'correctedRouteManual', 'Select new route', 'Type new route')}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Updated fare</Text>
              <TextInput
                value={form.fare}
                onChangeText={(value) => updateField('fare', value)}
                placeholder="Updated fare (optional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
          </View>
        );
      case 'MISSING_RANK':
        return (
          <View style={styles.gridTwo}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Rank name</Text>
              <TextInput
                value={form.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Rank name"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>District</Text>
              <TextInput
                value={form.district}
                onChangeText={(value) => updateField('district', value)}
                placeholder="District"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
              <TextInput
                value={form.address}
                onChangeText={(value) => updateField('address', value)}
                placeholder="Address"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Latitude</Text>
              <TextInput
                value={form.latitude}
                onChangeText={(value) => updateField('latitude', value)}
                placeholder="Latitude"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Longitude</Text>
              <TextInput
                value={form.longitude}
                onChangeText={(value) => updateField('longitude', value)}
                placeholder="Longitude"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Routes served</Text>
              <TextInput
                value={form.routesServed}
                onChangeText={(value) => updateField('routesServed', value)}
                placeholder="Comma separated routes"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
              />
            </View>
          </View>
        );
      case 'RANK_CLOSED':
        return (
          <View style={[styles.noteBox, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
            <Text style={{ color: colors.textSecondary }}>
              No extra fields are needed. Tell us why the rank should be marked closed in the description.
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.noteBox, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
            <Text style={{ color: colors.textSecondary }}>
              Add the correction details in the description below.
            </Text>
          </View>
        );
    }
  };

  return (
    <>
      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kicker, { color: colors.tint }]}>{rank?.name ?? 'Taxi Rank'}</Text>
                  <Text style={[styles.title, { color: colors.text }]}>Suggest a correction</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Help us keep the rank information accurate for everyone.
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.secondaryBackground }]}>
                  <Feather name="x" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.banner, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF', borderColor: colors.border }]}>
                  <Feather name="alert-triangle" size={18} color={colors.tint} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bannerTitle, { color: colors.text }]}>{selectedLabel}</Text>
                    <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                      Choose the type of issue and add the smallest useful detail possible.
                    </Text>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>What is wrong?</Text>
                  <View style={[styles.picker, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => setPickerField(null)}
                      style={{ flex: 1 }}
                      activeOpacity={0.9}
                    >
                      <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {correctionOptions.find((option) => option.value === form.correctionType)?.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.pickerGrid, { gap: 8 }]}>
                    {correctionOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setForm((prev) => ({ ...prev, correctionType: option.value }))}
                        style={[
                          styles.typeChip,
                          {
                            backgroundColor: form.correctionType === option.value ? colors.tint : colors.secondaryBackground,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: form.correctionType === option.value ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '600' }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {renderTypeFields()}

                <View style={styles.fieldBlock}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(value) => updateField('description', value)}
                    placeholder="Describe the correction in a sentence or two..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    style={[styles.textArea, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                  />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.secondaryButton, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitCorrection}
                    disabled={submitting}
                    style={[styles.primaryButton, { backgroundColor: colors.tint, opacity: submitting ? 0.7 : 1 }]}
                  >
                    {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Submit Correction</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={pickerField !== null} transparent animationType="fade" onRequestClose={() => setPickerField(null)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose a route</Text>
              <TouchableOpacity onPress={() => setPickerField(null)}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {routeOptions.map((route) => (
                <TouchableOpacity
                  key={route}
                  onPress={() => {
                    if (pickerField) {
                      updateField(pickerField, route);
                    }
                    setPickerField(null);
                  }}
                  style={[styles.pickerOption, { borderBottomColor: colors.border }]}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{route}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  if (pickerField) {
                    updateField(pickerField, otherRouteValue);
                  }
                  setPickerField(null);
                }}
                style={[styles.pickerOption, { borderBottomColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>Other / not listed</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 110,
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  noteBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectField: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  picker: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noRoutesBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 16,
  },
  pickerSheet: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '65%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
});
