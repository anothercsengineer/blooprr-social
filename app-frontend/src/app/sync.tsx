import { useState } from 'react';
import { 
    StyleSheet, Text, View, Image,
    TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { BACKEND_URL } from '../constants/config';

export default function SyncScreen() {
    const [isSyncing, setIsSyncing] = useState(false);

    // hitting 'not now', sends them directly to home screen
    const handleSkip = () => {
        router.replace('/home');
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // 1. requesting native os permissions
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied:", "We need access to your contacts to find your friends.");
                setIsSyncing(false);
                return;
            }

            // 2. fetching phonebook from the device
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers],
            });

            if (data.length > 0) {
                // 3. extracting and sanitizing phone numbers
                const rawNumbers: string[] = [];
                data.forEach(contact => {
                    if (contact.phoneNumbers) {
                        contact.phoneNumbers.forEach(phone => {
                            // stripping everything except raw digits
                            const digits = phone.number?.replace(/[^0-9]/g, '');
                            if (digits && digits.length >= 7) {
                                rawNumbers.push(digits);
                            }
                        });
                    }
                });

                // 4. hashing numbers locally
                const hashedContacts = await Promise.all(
                    rawNumbers.map(async (num) => {
                        return await Crypto.digestStringAsync(
                            Crypto.CryptoDigestAlgorithm.SHA256,
                            num
                        );
                    })
                );

                // 5. sending cryptographic hashes to backend
                const token = await SecureStore.getItemAsync('jwt');
                const response = await fetch(`${BACKEND_URL}/api/contacts/sync`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        contactHashes: hashedContacts
                    }),
                });

                if (response.ok) {
                    console.log("Contacts synced successfully!");
                    router.replace('/home');
                } else {
                    Alert.alert("Error", "Failed to sync contacts with the server.");
                }
            } else {
                console.log("No contacts found on device.");
                router.replace('/home');
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", "Could not connect to the blooprr servers!");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                {/* logo on top */}
                <View style={styles.header}>
                    <Image source={require('../../assets/images/dark_logo.png')} style={styles.logoImage} resizeMode="contain" />
                </View>

                {/* content area */}
                <View style={styles.content}>
                    <Text style={styles.title}>find your friends</Text>
                    <Text style={styles.subtitle}>we'll connect you with contacts already on blooprr</Text>
                    <Text style={styles.subtitlePrivacy}>your numbers stay private, always!</Text>
                </View>

                {/* bottom area */}
                <View style={styles.bottomArea}>
                    <TouchableOpacity
                        style={styles.notNowButton}
                        onPress={handleSkip}
                        disabled={isSyncing}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.notNowText}>not now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.allowButton}
                        onPress={handleSync}
                        disabled={isSyncing}
                        activeOpacity={0.8}
                    >
                        {isSyncing ? (
                            <ActivityIndicator color="#011110" />
                        ) : (
                            <Text style={styles.allowText}>allow contacts</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#011110',
        paddingHorizontal: 30,
        paddingTop: 50,
        paddingBottom: 60, 
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoImage: {
        width: 150,
        height: 50,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 46,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'CalSans',
        marginBottom: 30,
    },
    subtitle: {
        color: '#757575',
        fontSize: 20,
        fontFamily: 'CalSans',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 26,
    },
    subtitlePrivacy: {
        color: '#757575', 
        fontSize: 20,
        fontFamily: 'CalSans',
        textAlign: 'center',
    },
    bottomArea: {
        width: '100%',
        gap: 20,
    },
    notNowButton: {
        paddingVertical: 14,
        borderRadius: 30,
        width: '85%',
        alignSelf: 'center',
        backgroundColor: '#1B1F1F',
        borderWidth: 1,
        borderColor: '#00DCCA',
    },
    notNowText: {
        fontSize: 28,
        fontFamily: 'CalSans',
        color: '#545757',
        textAlign: 'center',
    },
    allowButton: {
        paddingVertical: 14,
        borderRadius: 30,
        width: '85%',
        alignSelf: 'center',
        backgroundColor: '#00DCCA',
    },
    allowText: {
        fontSize: 28,
        fontFamily: 'CalSans',
        color: '#011110',
        textAlign: 'center',
    },
});
