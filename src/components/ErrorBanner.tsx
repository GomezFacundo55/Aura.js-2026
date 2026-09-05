import { StyleSheet, Text, View } from 'react-native';

type Props = {
  mensaje: string | null;
};

export function ErrorBanner({ mensaje }: Props) {
  if (!mensaje) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#d33',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  texto: {
    color: '#a02020',
    fontWeight: '600',
    textAlign: 'center',
  },
});