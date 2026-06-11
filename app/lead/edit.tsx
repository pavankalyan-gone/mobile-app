import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, HelperText, ActivityIndicator, Menu } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useUpdateLead, useLead, useLeadCustomFields, useLeadSources, useStaffs } from '../../hooks/useLeads';
import { CustomFieldInput } from '../../components/ui/CustomFieldInput';
import { theme } from '../../constants/theme';

export default function EditLeadScreen() {
  const router = useRouter();
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const leadId = Number(id);

  const { data: lead, isLoading: isLoadingLead } = useLead(leadId);
  const updateLead = useUpdateLead();
  const { data: sources, isLoading: isLoadingSources } = useLeadSources();
  const { data: staffs, isLoading: isLoadingStaffs } = useStaffs();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [address, setAddress] = useState('');
  const [addedOn, setAddedOn] = useState('');
  
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [assignedId, setAssignedId] = useState<number | null>(null);
  
  const [sourceMenuVisible, setSourceMenuVisible] = useState(false);
  const [assignedMenuVisible, setAssignedMenuVisible] = useState(false);

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { data: customFields, isLoading: isLoadingCustomFields } = useLeadCustomFields('leads');

  // Hydrate once per lead — background refetches (e.g. after a cache
  // invalidation) produce a new `lead` object and must not wipe what the
  // user is currently typing.
  const hydratedLeadIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (lead && hydratedLeadIdRef.current !== lead.id) {
      hydratedLeadIdRef.current = lead.id;
      setName(lead.name || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setValue(lead.value != null ? String(lead.value) : '');
      setAddress(lead.address || '');
      setAddedOn(lead.date_added ? new Date(lead.date_added).toLocaleDateString() : '');
      setSourceId(lead.source_id ? Number(lead.source_id) : null);
      setAssignedId(lead.assigned_id ? Number(lead.assigned_id) : null);

      // Populate custom fields if any exist
      if (lead.custom_field_values) {
        setCustomFieldValues(lead.custom_field_values);
      }
    }
  }, [lead]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    const leadValue = value.trim() ? Number(value.replace(/[^0-9.]/g, '')) : undefined;
    if (value.trim() && (leadValue == null || isNaN(leadValue))) {
      setFormError('Lead value must be a number.');
      return;
    }
    setFormError(null);

    // The hydrated map carries both slug- and id-keyed entries; the API only
    // accepts custom_fields.leads keyed by the numeric field ID.
    const customFieldsById = Object.fromEntries(
      Object.entries(customFieldValues).filter(([key]) => /^\d+$/.test(key))
    );

    updateLead.mutate(
      {
        id: leadId,
        payload: {
          // The API only updates fields present in the body, so cleared
          // fields must be sent as empty strings (and "Unassigned" as 0) —
          // omitting them would silently keep the old values.
          name: trimmedName,
          email: trimmedEmail,
          phonenumber: phone.trim(),
          lead_value: leadValue,
          address: address.trim(),
          source: sourceId || undefined,
          assigned: assignedId ?? 0,
          custom_fields: Object.keys(customFieldsById).length > 0 ? { leads: customFieldsById } : undefined,
        }
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || 'Could not update the lead. Please try again.');
        },
      }
    );
  };

  const inputTheme = { colors: { background: theme.colors.surface } };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: section ? `Edit ${section}` : 'Edit Lead',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary, fontWeight: '700' },
        }}
      />
      {isLoadingLead ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={styles.container}
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid
        >
        {(!section || section === 'Contact') && (
          <>
            <TextInput
              label="Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor={theme.colors.primary}
              theme={inputTheme}
              maxLength={191}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor={theme.colors.primary}
              theme={inputTheme}
              maxLength={191}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor={theme.colors.primary}
              theme={inputTheme}
              maxLength={32}
            />
          </>
        )}
        {(!section || section === 'Details') && (
          <>
            <View style={styles.input}>
              <Menu
                visible={sourceMenuVisible}
                onDismiss={() => setSourceMenuVisible(false)}
                style={{ marginTop: 50, width: '90%' }}
                anchor={
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setSourceMenuVisible(true);
                    }}
                  >
                    <View pointerEvents="none">
                      <TextInput
                        label="Source"
                        value={
                          sourceId
                            ? sources?.find((s) => s.id === sourceId)?.name || 'Loading...'
                            : lead?.source || 'N/A'
                        }
                        mode="outlined"
                        outlineStyle={styles.inputOutline}
                        theme={inputTheme}
                        right={
                          isLoadingSources ? (
                            <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
                          ) : (
                            <TextInput.Icon icon="menu-down" />
                          )
                        }
                      />
                    </View>
                  </TouchableOpacity>
                }
              >
                {sources?.map((s) => (
                  <Menu.Item
                    key={s.id}
                    onPress={() => {
                      setSourceId(s.id);
                      setSourceMenuVisible(false);
                    }}
                    title={s.name}
                  />
                ))}
              </Menu>
            </View>

            <View style={styles.input}>
              <Menu
                visible={assignedMenuVisible}
                onDismiss={() => setAssignedMenuVisible(false)}
                style={{ marginTop: 50, width: '90%' }}
                anchor={
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setAssignedMenuVisible(true);
                    }}
                  >
                    <View pointerEvents="none">
                      <TextInput
                        label="Assigned to"
                        value={
                          assignedId
                            ? staffs?.find((s) => String(s.id) === String(assignedId))?.full_name || lead?.assigned_to || 'Unknown'
                            : 'Unassigned'
                        }
                        mode="outlined"
                        outlineStyle={styles.inputOutline}
                        theme={inputTheme}
                        right={
                          isLoadingStaffs ? (
                            <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
                          ) : (
                            <TextInput.Icon icon="menu-down" />
                          )
                        }
                      />
                    </View>
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setAssignedId(null);
                    setAssignedMenuVisible(false);
                  }}
                  title="Unassigned"
                />
                {staffs?.map((s) => (
                  <Menu.Item
                    key={s.id}
                    onPress={() => {
                      setAssignedId(Number(s.id));
                      setAssignedMenuVisible(false);
                    }}
                    title={s.full_name}
                  />
                ))}
              </Menu>
            </View>

            <TextInput
              label="Lead value (₹)"
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor={theme.colors.primary}
              theme={inputTheme}
              maxLength={12}
            />
            <TextInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor={theme.colors.primary}
              theme={inputTheme}
              maxLength={200}
            />
          </>
        )}

        {(!section || section === 'Custom Fields') && (
          <>
            {isLoadingCustomFields ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (customFields && customFields.length > 0) || (lead?.custom_fields && lead.custom_fields.length > 0) ? (
              <View style={styles.customFieldsSection}>
                {(customFields && customFields.length > 0 ? customFields : (lead?.custom_fields || [])).map((field) => {
                  const val = customFieldValues[field.slug || ''] || 
                              customFieldValues[field.name || ''] || 
                              customFieldValues[String(field.id)] || '';
                  return (
                    <CustomFieldInput
                      key={field.id}
                      field={field}
                      value={val}
                      onChange={(text) =>
                        setCustomFieldValues((prev) => ({ ...prev, [String(field.id)]: text }))
                      }
                      style={styles.input}
                      outlineStyle={styles.inputOutline}
                      inputTheme={inputTheme}
                    />
                  );
                })}
              </View>
            ) : null}
          </>
        )}

        {formError && (
          <HelperText type="error" visible style={styles.errorText}>
            {formError}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={updateLead.isPending}
          disabled={updateLead.isPending}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        >
          Save Changes
        </Button>
        <View style={styles.bottomSpacer} />
      </KeyboardAwareScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.gapMd,
  },
  input: {
    marginBottom: theme.spacing.gapMd,
  },
  multiline: {
    minHeight: 96,
  },
  inputOutline: {
    borderRadius: theme.roundness.xl,
    borderColor: theme.colors.borderSubtle,
    borderWidth: 1,
  },
  errorText: {
    color: theme.colors.errorRed,
    paddingHorizontal: 0,
    marginBottom: theme.spacing.gapSm,
  },
  button: {
    borderRadius: theme.roundness.xl,
    marginTop: theme.spacing.gapSm,
    height: 56,
    justifyContent: 'center',
  },
  buttonContent: {
    height: 56,
  },
  bottomSpacer: {
    height: theme.spacing.gapLg,
  },
  customFieldsSection: {
    marginTop: theme.spacing.gapSm,
  },
});
