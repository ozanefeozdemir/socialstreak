import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputRowError : undefined]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#B8B8D0"
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
