import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: isDark ? colors.card : '#F8F8FE',
            borderColor: error ? '#FFB8B8' : colors.border,
          },
          error && (isDark ? { backgroundColor: '#3A1C1C', borderColor: '#772525' } : styles.inputRowError),
        ]}
      >
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B80',
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EDEDF5',
    borderRadius: 16,
    backgroundColor: '#F8F8FE',
    paddingHorizontal: 16,
    gap: 10,
  },
  inputRowError: {
    borderColor: '#FFB8B8',
    backgroundColor: '#FFF8F8',
  },
  icon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D2D3A',
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },
});
