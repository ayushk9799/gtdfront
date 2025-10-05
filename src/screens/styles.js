import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, opacity: 0.7 },
  screenScroll: { padding: 16, paddingBottom: 120, flexGrow: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    // Bluish, subtle shadow
    shadowColor: '#1E88E5',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  gameImage: { width: '100%', height: 180, resizeMode: 'contain', backgroundColor: 'transparent' },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  cardDesc: { fontSize: 14, lineHeight: 20, color: '#687076' },
  rowCenterBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: Colors.brand.lightPink, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { color: Colors.brand.darkPink, fontWeight: '700', fontSize: 12 },
  primaryButton: {
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: Colors.brand.darkPink,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '800' },
});


