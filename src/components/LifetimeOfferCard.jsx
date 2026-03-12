import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Purchases from 'react-native-purchases';
import { MMKV } from 'react-native-mmkv';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const storage = new MMKV();

// Format remaining ms to HH:MM:SS
function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function LifetimeOfferCard({ offerStartTime, onOfferExpired }) {
  const [remaining, setRemaining] = useState(TWO_HOURS_MS);
  const [lifetimePackage, setLifetimePackage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Countdown
  useEffect(() => {
    if (!offerStartTime) return;

    const tick = () => {
      const elapsed = Date.now() - offerStartTime;
      const left = Math.max(TWO_HOURS_MS - elapsed, 0);
      setRemaining(left);
      if (left <= 0) {
        onOfferExpired?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [offerStartTime]);

  // Fetch offering for price display
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const lifetimeOffering = offerings?.all?.['lifetime_offer'];
        if (lifetimeOffering?.lifetime) {
          setLifetimePackage(lifetimeOffering.lifetime);
        } else if (lifetimeOffering?.availablePackages?.[0]) {
          setLifetimePackage(lifetimeOffering.availablePackages[0]);
        }
      } catch (e) {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, []);

  // Tap → re-open the full-screen banner via MMKV signal
  const handlePress = () => {
    storage.set('lifetimeOfferDismissed', false);
  };

  if (loading) return null;
  if (remaining <= 0 || !lifetimePackage) return null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <View style={s.cardWrapper}>
        <LinearGradient
          colors={['#2D0F1E', '#3D1028', '#2D0F1E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Left section: icon + text */}
        <View style={s.leftSection}>
          <View style={s.iconCircle}>
            <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
          </View>
          <View style={s.textSection}>
            <View style={s.titleRow}>
              <Text style={s.title}>Lifetime Pass Offer</Text>
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={s.subtitle}>
              {lifetimePackage?.product?.priceString
                ? `Get lifetime access for ${lifetimePackage.product.priceString}`
                : 'Get lifetime access now'}
            </Text>
          </View>
        </View>

        {/* Right section: countdown */}
        <View style={s.countdownSection}>
          <Text style={s.countdownLabel}>Ends in</Text>
          <Text style={s.countdownTime}>{formatCountdown(remaining)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 2,
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,64,125,0.2)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,64,125,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF407D',
    marginRight: 3,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FF6B9D',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  countdownSection: {
    alignItems: 'flex-end',
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownTime: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF6B9D',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
});
