import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#222222" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.effectiveDate}>
            Effective Date: July 31, 2025
          </Text>

          <Text style={styles.intro}>
            Welcome to Diagnose It: Guess Disease. By using our app, you agree
            to these Terms of Service. Please read them carefully.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Using the App</Text>
            <Text style={styles.text}>
              You must log in via Google Sign-In to access the full features of
              the app.
            </Text>
            <Text style={styles.text}>
              By using the app, you grant us permission to process your input
              prompts and generate AI-based content.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Content</Text>
            <Text style={styles.text}>
              You are responsible for any prompts you enter. Do not enter
              offensive, illegal, or harmful content.
            </Text>
            <Text style={styles.text}>
              All content you generate or share remains yours. However, we may
              store and analyze it to improve our services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Account Access</Text>
            <Text style={styles.text}>
              You are responsible for maintaining the security of your login
              credentials.
            </Text>
            <Text style={styles.text}>
              If you lose access to your account and want your data removed,
              contact us at
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL('mailto:ayushkumarsanu00@gmail.com')
                }
              >
                ayushkumarsanu00@gmail.com
              </Text>
              .
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Limitations</Text>
            <Text style={styles.text}>
              We do not guarantee the accuracy or appropriateness of the
              AI-generated content.
            </Text>
            <Text style={styles.text}>
              The app is provided "as is" without warranties of any kind.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Termination</Text>
            <Text style={styles.text}>
              We reserve the right to suspend or terminate access if you violate
              these terms or misuse the platform.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Changes</Text>
            <Text style={styles.text}>
              We may update these terms from time to time. Continued use of the
              app means you accept the revised terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact</Text>
            <Text style={styles.text}>
              For any questions, please contact us at
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL('mailto:ayushkumarsanu00@gmail.com')
                }
              >
                ayushkumarsanu00@gmail.com
              </Text>
              .
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  effectiveDate: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default TermsOfServiceScreen;
