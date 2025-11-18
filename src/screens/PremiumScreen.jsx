import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Image, Platform, Alert, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/Colors';
import premiumImage from '../../constants/premium-image.png';
import Purchases from 'react-native-purchases';
import { updateUser, setCustomerInfo } from '../store/slices/userSlice';

export default function PremiumScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const [selectedPlan, setSelectedPlan] = useState(null); // 'monthly' | 'weekly'
  const [offerings, setOfferings] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = Colors.light;

  const features = useMemo(
    () => [
      { label: 'Intern, Resident and Attending level cases', free: true, pro: true },
      { label: 'Specialist and Super Specialist level cases', free: false, pro: true },
      { label: 'Followup Cases', free: false, pro: true },
      { label: 'Play endlessly with Unlimited Hearts', free: false, pro: true },
      { label: 'Clinical images within cases', free: false, pro: true },
      { label: 'Clinical Deep Dive after cases', free: false, pro: true },
      { label: 'No ads', free: false, pro: true },
    ],
    [],
  );

  useEffect(() => {
    getOfferingsAndEntitlements();
  }, []);

  const syncServerPremium = async (customerInfo) => {
    try {
      const active = customerInfo?.entitlements?.active || {};
      const activeList = Object.values(active || {});
      const hasActive = activeList.length > 0;
      let premiumExpiresAt = null;
      let premiumPlan = null;
      if (hasActive) {
        // Pick the farthest expiration among active entitlements (subscriptions)
        const maxDate = activeList.reduce((acc, e) => {
          const d = e?.expirationDate ? new Date(e.expirationDate) : null;
          if (!d) return acc;
          if (!acc) return d;
          return d > acc ? d : acc;
        }, null);
        premiumExpiresAt = maxDate ? maxDate.toISOString() : null;
        premiumPlan = activeList[0]?.productIdentifier || selectedPlan || null;
      }
      const uid = userData?.userId || userData?._id || userData?.id;
      if (!uid) return;
      await dispatch(updateUser({
        userId: uid,
        userData: {
          isPremium: hasActive,
          premiumExpiresAt: hasActive ? premiumExpiresAt : null,
          premiumPlan: hasActive ? premiumPlan : null,
        }
      }));
    } catch (e) {
      console.log('Failed to sync premium status to server', e);
    }
  };

  const checkEntitlements = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      dispatch(setCustomerInfo(customerInfo));
      setEntitlements(customerInfo.entitlements.active);
      await syncServerPremium(customerInfo);
    } catch (e) {
      console.log('Error checking entitlements:', e);
    }
  };

  const handlePurchase = async (pkg) => {
    try {
      setLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('Purchase successful', customerInfo);
      dispatch(setCustomerInfo(customerInfo));
      await checkEntitlements(); // Update entitlements after successful purchase
    } catch (e) {
      if (e?.userCancelled) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Purchase cancelled', ToastAndroid.SHORT);
        } else {
          Alert.alert('Purchase cancelled');
        }
      } else {
        console.log('Purchase failed:', e);
      }
      return;
    } finally {
      setLoading(false);
    }
  };

  const getOfferingsAndEntitlements = async () => {
    try {
      setLoading(true);
      const o = await Purchases.getOfferings();
      if (o?.current && Array.isArray(o.current.availablePackages) && o.current.availablePackages.length > 0) {
        console.log('offerings', o);
        setOfferings(o);
        // pick default: prefer monthly, else weekly
        if (o.current.monthly) {
          setSelectedPlan('monthly');
        } else if (o.current.weekly) {
          setSelectedPlan('weekly');
        } else {
          setSelectedPlan(null);
        }
      } else {
        setOfferings(null);
        setSelectedPlan(null);
      }
      await checkEntitlements();
    } catch (e) {
      console.log('Failed to load offerings', e);
      setOfferings(null);
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const weeklyPackage = offerings?.current?.weekly || null;
  const monthlyPackage = offerings?.current?.monthly || null;
  const selectedPackage = selectedPlan === 'monthly' ? monthlyPackage : selectedPlan === 'weekly' ? weeklyPackage : null;
  const isPremium = !!(userData?.isPremium || (entitlements && Object.keys(entitlements || {}).length > 0));
  const premiumPlan = userData?.premiumPlan || null;
  const premiumExpiresAt = userData?.premiumExpiresAt || null;
  const planLabelFromId = (id) => {
    try {
      if (!id) return 'Active subscription';
      const lower = String(id).toLowerCase();
      if (lower.includes('week')) return 'Weekly Plan';
      if (lower.includes('month')) return 'Monthly Plan';
      if (lower.includes('year') || lower.includes('annual')) return 'Annual Plan';
      if (lower.includes('life')) return 'Lifetime';
      return 'Active subscription';
    } catch {
      return 'Active subscription';
    }
  };
  const formatDate = (iso) => {
    try {
      if (!iso) return 'Active';
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Active';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E8E8E8',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
              marginRight: 6,
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#222222" />
          </TouchableOpacity>
          {/* <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.brand.darkPink }}>Go Premium</Text> */}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >

            {/* image display */}
            <View style={{ paddingHorizontal: 0, marginTop: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={premiumImage} style={{ width: 300, height: 300, resizeMode: 'cover' }} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.brand.darkPink }}>Subscribe Premium</Text>
              <Text style={{ fontSize: 16, fontWeight: '400', color: '#6C6C6C' }}>Get unlimited access to all features</Text>
            </View>
            {isPremium && (
              <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#EDEDED',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="crown" size={22} color={Colors.brand.darkPink} />
                    <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                      You’re Premium
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: '#6C6C6C', fontSize: 12, fontWeight: '700' }}>Plan</Text>
                      <Text style={{ color: '#1E1E1E', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                        {planLabelFromId(premiumPlan)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#6C6C6C', fontSize: 12, fontWeight: '700' }}>Renews/Expires</Text>
                      <Text style={{ color: '#1E1E1E', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                        {formatDate(premiumExpiresAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          {/* Feature comparison table */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#EDEDED',
                overflow: 'hidden',
              }}
            >
              {/* Aligned header row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: '#FAFAFA',
                  borderBottomWidth: 1,
                  borderBottomColor: '#F2F2F2',
                }}
              >
                <View style={{ flex: 1 }} />
                <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#6C6C6C' }}>FREE</Text>
                </View>
                <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                  <View
                    style={{
                      backgroundColor: Colors.brand.darkPink,
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>PRO</Text>
                  </View>
                </View>
              </View>
              {features.map((f, idx) => (
                <View
                  key={f.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    backgroundColor: 'transparent',
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: '#F2F2F2',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: '#24323D', fontSize: 14, fontWeight: '700' }}>{f.label}</Text>
                  </View>
                  <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                    {f.free ? (
                      <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
                    ) : (
                      <MaterialCommunityIcons name="minus" size={20} color="#B0B7BF" />
                    )}
                  </View>
                  <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                    {f.pro ? (
                      <MaterialCommunityIcons name="check" size={20} color="#00C4B3" />
                    ) : (
                      <MaterialCommunityIcons name="minus" size={20} color="#B0B7BF" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Plan cards */}
          {!isPremium && (<View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            {/* Monthly */}
            <Pressable
              onPress={() => monthlyPackage && setSelectedPlan('monthly')}
              style={{
                backgroundColor:  '#FFFFFF',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: selectedPlan === 'monthly' ? Colors.brand.darkPink : '#EDEDED',
                padding: 14,
                marginBottom: 12,
                opacity: monthlyPackage ? 1 : 0.5,
              }}
            >
              {monthlyPackage && (
                <View style={{ position: 'absolute', top: -10, right: 14 }}>
                  <View
                    style={{
                      backgroundColor: Colors.brand.darkPink,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 10 }}>MOST POPULAR</Text>
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name={selectedPlan === 'monthly' ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={selectedPlan === 'monthly' ? Colors.brand.darkPink : '#B0B7BF'}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>Monthly Plan</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                    {monthlyPackage?.product?.description || 'Access to all features'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                    {monthlyPackage?.product?.priceString || ''}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                    ₹1,000.00
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Weekly */}
            <Pressable
              onPress={() => weeklyPackage && setSelectedPlan('weekly')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: selectedPlan === 'weekly' ? Colors.brand.darkPink : '#EDEDED',
                padding: 14,
                opacity: weeklyPackage ? 1 : 0.5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name={selectedPlan === 'weekly' ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={selectedPlan === 'weekly' ? Colors.brand.darkPink : '#B0B7BF'}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>Weekly Plan</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                    {weeklyPackage?.product?.description || 'All premium features'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                    {weeklyPackage?.product?.priceString || ''}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                    ₹500.00
                  </Text>
                </View>
              </View>
            </Pressable>

            {!monthlyPackage && !weeklyPackage && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ color: '#6C6C6C' }}>No packages available</Text>
              </View>
            )}
          </View>)}

          {/* Subscribe CTA */}
          {!isPremium && (<View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => selectedPackage && handlePurchase(selectedPackage)}
              style={{
                backgroundColor: Colors.brand.darkPink,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#00C4B3',
                shadowOpacity: 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
                opacity: selectedPackage ? 1 : 0.6,
              }}
              disabled={!selectedPackage || loading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginRight: 6 }}>
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>)}

          

           {/* Cancel anytime */}
           <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text style={{ textAlign: 'center', color: '#4A5564', fontWeight: '700' }}>Cancel anytime</Text>
          </View>

          {/* Terms */}
          <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
            <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
              By continuing, you agree to our{' '}
              <Text
                style={{ color: theme.tint, fontWeight: '800' }}
                onPress={() => navigation.navigate('TermsOfService')}
              >
                terms
              </Text>{' '}
              &{' '}
              <Text
                style={{ color: theme.tint, fontWeight: '800' }}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                privacy policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}