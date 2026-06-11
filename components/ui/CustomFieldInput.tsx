import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, Menu, Chip, Text } from 'react-native-paper';
import { CustomFieldDefinition } from '../../services/leadsService';
import { theme } from '../../constants/theme';

interface Props {
  field: CustomFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  style?: object;
  outlineStyle?: object;
  inputTheme?: object;
}

/**
 * Renders a custom field with a widget that matches its declared type
 * (select/radio → menu, multiselect/checkbox → chips, textarea, number,
 * date/datetime → format-hinted input) instead of a bare text input that
 * lets users type values the CRM will reject.
 */
export function CustomFieldInput({ field, value, onChange, style, outlineStyle, inputTheme }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const label = `${field.name}${field.required === '1' ? ' *' : ''}`;
  const options = (field.options || '')
    .split(/\r?\n|,/)
    .map((o) => o.trim())
    .filter(Boolean);

  if ((field.type === 'select' || field.type === 'radio') && options.length > 0) {
    return (
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label={label}
                value={value}
                mode="outlined"
                editable={false}
                right={<TextInput.Icon icon="menu-down" />}
                style={style}
                outlineStyle={outlineStyle}
                activeOutlineColor={theme.colors.primary}
                theme={inputTheme}
              />
            </View>
          </TouchableOpacity>
        }
      >
        <Menu.Item
          onPress={() => {
            onChange('');
            setMenuVisible(false);
          }}
          title="— None —"
        />
        {options.map((opt) => (
          <Menu.Item
            key={opt}
            onPress={() => {
              onChange(opt);
              setMenuVisible(false);
            }}
            title={opt}
          />
        ))}
      </Menu>
    );
  }

  if ((field.type === 'multiselect' || field.type === 'checkbox') && options.length > 0) {
    // Perfex stores multi-values comma-separated
    const selected = value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
      onChange(next.join(','));
    };
    return (
      <View style={styles.chipFieldContainer}>
        <Text style={styles.chipFieldLabel}>{label}</Text>
        <View style={styles.chipRow}>
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <Chip
                key={opt}
                selected={isSelected}
                mode={isSelected ? 'flat' : 'outlined'}
                onPress={() => toggle(opt)}
              >
                {opt}
              </Chip>
            );
          })}
        </View>
      </View>
    );
  }

  const placeholder =
    field.type === 'date' ? 'YYYY-MM-DD' : field.type === 'datetime' ? 'YYYY-MM-DD HH:MM' : undefined;

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChange}
      mode="outlined"
      placeholder={placeholder}
      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
      multiline={field.type === 'textarea'}
      numberOfLines={field.type === 'textarea' ? 3 : 1}
      style={style}
      outlineStyle={outlineStyle}
      activeOutlineColor={theme.colors.primary}
      theme={inputTheme}
    />
  );
}

const styles = StyleSheet.create({
  chipFieldContainer: {
    marginBottom: 14,
  },
  chipFieldLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
