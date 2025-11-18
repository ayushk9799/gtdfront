import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const PrivacyPolicy = () => {
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
      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.h1}>Privacy Policy</Text>
        <Text style={styles.p}>
          <Text style={styles.strong}>Effective Date:</Text> July 31, 2025 •{' '}
          <Text style={styles.strong}>Last Updated:</Text> July 31, 2025
        </Text>
        <Text style={styles.p}>
          At Diagnose It, we are committed to protecting your privacy. This
          Privacy Policy outlines how we collect, use, and protect your personal
          information when you use our app.
        </Text>

        <Text style={styles.h2}>1. Information We Collect</Text>
        <View style={styles.ul}>
          <Text style={styles.li}>
            <Text style={styles.strong}>Google Account Information:</Text> When
            you log in via Google Sign-In, we collect your email address and
            basic profile details (such as your name) as permitted.
          </Text>
          <Text style={styles.li}>
            <Text style={styles.strong}>Usage Data:</Text> We may collect
            anonymized data for analytics and performance monitoring.
          </Text>
        </View>

        <Text style={styles.h2}>2. How We Use Your Information</Text>
        <View style={styles.ul}>
          <Text style={styles.li}>To allow you to log in securely</Text>
          <Text style={styles.li}>
            To improve and personalize your app experience
          </Text>
        </View>

        <Text style={styles.h2}>3. Data Storage</Text>
        <Text style={styles.p}>
          All data is stored securely on our own servers or databases. We do not
          sell or share your personal information with third parties.
        </Text>

        <Text style={styles.h2}>4. Your Rights</Text>
        <Text style={styles.p}>
          You may request to access, delete, or export your data by emailing us
          at
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:ayushkumarsanu00@gmail.com')}
          >
            ayushkumarsanu00@gmail.com
          </Text>
          .
        </Text>
        <Text style={styles.p}>
          If you are unable to access your account, please contact us, and we
          will verify your identity before processing your request.
        </Text>

        <Text style={styles.h2}>5. Account Deletion</Text>
        <Text style={styles.p}>
          To request account deletion, please email us at
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:ayushkumarsanu00@gmail.com')}
          >
            ayushkumarsanu00@gmail.com
          </Text>
          from your logged-in email address. Include your request for account
          deletion in the email body.
        </Text>
        <Text style={styles.p}>
          We will verify your identity using your logged-in email address and
          process your deletion request within 30 days. Upon deletion, all your
          personal data, including account information will be permanently
          removed from our systems.
        </Text>

        <Text style={styles.h2}>6. Children's Privacy</Text>
        <Text style={styles.p}>
          We do not restrict use based on age, but we recommend supervision for
          users under 13 if required by your local laws.
        </Text>

        <Text style={styles.h2}>7. Changes to This Policy</Text>
        <Text style={styles.p}>
          We may update this Privacy Policy periodically. Changes will be posted
          in-app or on our website with a revised effective date.
        </Text>

        <Text style={styles.h2}>8. Contact</Text>
        <Text style={styles.p}>
          If you have any questions, reach out to us at
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:ayushkumarsanu00@gmail.com')}
          >
            ayushkumarsanu00@gmail.com
          </Text>
          .
        </Text>
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
    // paddingVertical: 10,
    // marginTop: 40,
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
  content: {
    maxWidth: 800,
    marginVertical: 20,
    marginHorizontal: 'auto',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // For Android shadow
  },
  h1: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    marginBottom: 10,
  },
  p: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 10,
  },
  strong: {
    fontWeight: 'bold',
  },
  ul: {
    marginBottom: 10,
  },
  li: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginLeft: 20,
    marginBottom: 5,
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default PrivacyPolicy;
