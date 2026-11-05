// Komponen UI bersama agar konsisten dan ringkas di seluruh layar.
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { colors, controls, typography, screen } from '../theme';

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const base =
    variant === 'outline'
      ? controls.buttonOutline
      : variant === 'danger'
        ? controls.buttonDanger
        : controls.button;
  const text =
    variant === 'outline' ? controls.buttonTextOutline : controls.buttonText;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[base, (loading || disabled) && { opacity: 0.6 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#FFF'} />
      ) : (
        <Text style={text}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[controls.card, style]}>{children}</View>;
}

export function Field({ label, value, onChangeText, ...props }) {
  return (
    <View>
      {label ? <Text style={typography.label}>{label}</Text> : null}
      <TextInput style={controls.input} value={value} onChangeText={onChangeText} {...props} />
    </View>
  );
}

export function SectionHeader({ title, right }) {
  return (
    <View style={[screen.row, { marginBottom: 8, alignItems: 'center' }]}>
      <Text style={typography.section}>{title}</Text>
      {right}
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[controls.chip, active && controls.chipActive]}
    >
      <Text style={[controls.chipText, active && controls.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ text, color = colors.muted }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: color + '22', marginRight: 6, marginBottom: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <View style={[screen.center, { padding: 30 }]}>
      <Text style={[typography.section, { textAlign: 'center' }]}>{title}</Text>
      {subtitle ? <Text style={[typography.muted, { textAlign: 'center', marginTop: 6, marginBottom: 16 }]}>{subtitle}</Text> : null}
      {action}
    </View>
  );
}

export function Loading({ label }) {
  return (
    <View style={screen.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[typography.muted, { marginTop: 10 }]}>{label}</Text> : null}
    </View>
  );
}

export function Screen({ children, scroll = true, style }) {
  if (!scroll) return <View style={[screen.container, style]}>{children}</View>;
  return (
    <ScrollView style={screen.container} contentContainerStyle={[screen.content, style]}>
      {children}
    </ScrollView>
  );
}
