import React from 'react';
import { useColorScheme, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <LeagueHeader onPressPro={() => {}} />
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={styles.centered}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Profile and settings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


