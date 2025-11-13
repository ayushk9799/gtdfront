import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import premiumImage from '../../constants/premium-image.png';

export default function PremiumScreen() {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState('annual');
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
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            {/* Annual - selected */}
            <Pressable
              onPress={() => setSelectedPlan('annual')}
              style={{
                backgroundColor:  '#FFFFFF',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: selectedPlan === 'annual' ? Colors.brand.darkPink : '#EDEDED',
                padding: 14,
                marginBottom: 12,
              }}
            >
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name={selectedPlan === 'annual' ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={selectedPlan === 'annual' ? Colors.brand.darkPink : '#B0B7BF'}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>Annual Plan</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                    Best value for serious learners
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>₹1,200.00</Text>
                  <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                    1,999.99
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Six month */}
            <Pressable
              onPress={() => setSelectedPlan('six')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: selectedPlan === 'six' ? Colors.brand.darkPink : '#EDEDED',
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name={selectedPlan === 'six' ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={selectedPlan === 'six' ? Colors.brand.darkPink : '#B0B7BF'}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>6 Month Plan</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                    Flexible access for focused learning
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>₹900.00</Text>
                  <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                    1,499.99
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Subscribe CTA */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {}}
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
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginRight: 6 }}>
                  Subscribe Now
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

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