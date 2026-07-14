import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  const handleInitialize = () => {
    console.log("Initialize button pressed!");
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      { /* pushes content to the midde */}
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
    height: '100%',
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
    boxShadow: '0px 0px 20px 2px rgba(0, 229, 255, 0.6)',
  },
  buttonText: {
  color: '#011110',
  fontSize: 30,
  fontFamily: 'CalSans',
  },
});