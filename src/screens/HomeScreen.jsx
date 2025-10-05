import React from 'react';
import { useColorScheme, View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <LeagueHeader onPressPro={() => {}} />
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.cardContent}>
            <View style={styles.rowCenterBetween}>
              <View style={styles.rowCenter}>
                <MaterialCommunityIcons name="calendar-star" size={22} color={Colors.brand.darkPink} />
                <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Daily Challenge</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>New</Text>
              </View>
            </View>
            <Text style={[styles.cardDesc, { marginTop: 8 }]}>
              Solve today’s case in under 3 tries to keep your streak alive.
            </Text>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => navigation.navigate('ClinicalInfo')}>
              <Text style={styles.primaryButtonText}>Solve the case</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Image source={inappicon} style={styles.gameImage} />
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Guess The Disease</Text>
            <Text style={styles.cardDesc}>
              A quick, fun medical guessing game. Look at the hint and pick the right
              diagnosis. New rounds every day.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


