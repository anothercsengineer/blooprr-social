import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BACKEND_URL } from '../constants/config';

export default function SyncContactsScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Waiting for permission...');

  const pepper = 'default-blooprr-pepper'; // Must match backend exactly

  const hashPhoneNumber = async (phone: string) => {
    // Clean phone number: remove spaces, dashes, parentheses to ensure matching
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      cleaned + pepper
    );
    return digest;
  };

  const syncContacts = async () => {
    if (!profileId) {
        Alert.alert("Error", "Missing user profile ID");
        return;
    }

    setLoading(true);
    setStatus('Requesting permission...');
    
    const { status: currentStatus } = await Contacts.requestPermissionsAsync();
    
    if (currentStatus !== 'granted') {
      Alert.alert('Permission Denied', 'We need contacts to find your friends.');
      setLoading(false);
      return;
    }

    setStatus('Reading contacts...');
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    if (data.length > 0) {
      setStatus('Hashing contacts (Privacy first!)...');
      const hashes: string[] = [];
      
      for (const contact of data) {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          // Just taking the first phone number for this prototype
          const rawPhone = contact.phoneNumbers[0].number;
          if (rawPhone) {
             const hash = await hashPhoneNumber(rawPhone);
             hashes.push(hash);
          }
        }
      }

      setStatus('Syncing with Blooprr servers...');
      try {
        const response = await fetch(`${BACKEND_URL}/api/contacts/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            profileId: parseInt(profileId as string), 
            contactHashes: hashes 
          }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          Alert.alert("Success!", `Found ${result.mutualConnectionsFound} mutual connections!`);
          router.replace('/');
        } else {
          Alert.alert("Error", result.error || "Failed to sync contacts");
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not reach server");
      }
    } else {
      Alert.alert("Empty", "No contacts found on this device.");
      router.replace('/');
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Your Friends</Text>
      <Text style={styles.subtitle}>
        Blooprr is for real friends only. We need to check your contacts to find mutual connections.
        Your contacts never leave your device unencrypted!
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF4400" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={syncContacts}>
          <Text style={styles.buttonText}>Sync Contacts</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/')}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center', lineHeight: 24 },
  button: { backgroundColor: '#FF4400', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipButton: { marginTop: 20 },
  skipText: { color: '#666', fontSize: 16 },
  loadingBox: { alignItems: 'center' },
  statusText: { marginTop: 15, fontSize: 16, color: '#333' }
});
