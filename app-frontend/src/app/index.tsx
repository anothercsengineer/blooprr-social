import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View,
  TouchableOpacity, Image,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function OnboardingScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt');
        if (token) {
          router.replace('/home');
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  const handleInitialize = () => {
    console.log("Initialize button pressed!");
    router.replace('/login');
  };

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00DCCA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      { /* pushes content to the middle */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>welcome to</Text>
        
        <Image
          source={require('../../assets/images/dark_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* get started button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleInitialize}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>get started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011110',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'CalSans',
    marginBottom: 25,
  },
  logoImage: {
    width: 250,
    height: 90,
  },
  button: {
    position: 'absolute',
    bottom: 80,
    backgroundColor: '#00DCCA',
    paddingVertical: 14,
    borderRadius: 30,
    width: 280,
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonText: {
  color: '#011110',
  fontSize: 30,
  fontFamily: 'CalSans',
  },
});