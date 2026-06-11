import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useCreateLead, useLeadCustomFields } from '../../hooks/useLeads';
import { CustomFieldInput } from '../../components/ui/CustomFieldInput';
import { theme } from '../../constants/theme';

export default function NewLeadScreen() {
  const router = useRouter();
  const createLead = useCreateLead();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { data: customFields, isLoading: isLoadingCustomFields } = useLeadCustomFields('leads');

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

    createLead.mutate(
      {
        name: trimmedName,
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        email: trimmedEmail || undefined,
        phonenumber: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        lead_value: leadValue,
        description: description.trim() || undefined,
        custom_fields: Object.keys(customFieldValues).length > 0 ? { leads: customFieldValues } : undefined,
      },
      {
        onSuccess: (result) => {
          if (result?.id) router.replace(`/lead/${result.id}`);
          else router.back();
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || 'Could not create the lead. Please try again.');
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
          title: 'New Lead',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary, fontWeight: '700' },
        }}
      />
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
      >
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
          label="Company"
          value={company}
          onChangeText={setCompany}
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
        <TextInput
          label="Position / Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          outlineStyle={styles.inputOutline}
          activeOutlineColor={theme.colors.primary}
          theme={inputTheme}
          maxLength={191}
        />
        <TextInput
          label="Website"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
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
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          style={styles.input}
          outlineStyle={styles.inputOutline}
          activeOutlineColor={theme.colors.primary}
          theme={inputTheme}
          maxLength={191}
        />
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
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.multiline]}
          outlineStyle={styles.inputOutline}
          activeOutlineColor={theme.colors.primary}
          theme={inputTheme}
          maxLength={2000}
        />

        {isLoadingCustomFields ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : customFields && customFields.length > 0 ? (
          <View style={styles.customFieldsSection}>
            {customFields.map((field) => (
              <CustomFieldInput
                key={field.id}
                field={field}
                value={customFieldValues[String(field.id)] || ''}
                onChange={(text) =>
                  // The API expects custom_fields.leads keyed by numeric field ID
                  setCustomFieldValues((prev) => ({ ...prev, [String(field.id)]: text }))
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
                inputTheme={inputTheme}
              />
            ))}
          </View>
        ) : null}

        {formError && (
          <HelperText type="error" visible style={styles.errorText}>
            {formError}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={createLead.isPending}
          disabled={createLead.isPending}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        >
          Create Lead
        </Button>
        <View style={styles.bottomSpacer} />
      </KeyboardAwareScrollView>
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
