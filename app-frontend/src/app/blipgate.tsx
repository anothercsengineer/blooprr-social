import { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView,
    Platform, Image, Pressable, Alert,
    Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BACKEND_URL } from '../constants/config';

export default function BlipkeyScreen() {
    const { phoneHash } = useLocalSearchParams<{ phoneHash: string }>();
    const [blipkey, setBlipkey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (!phoneHash || typeof phoneHash !== 'string') {
            router.replace('/login');
        }
    }, [phoneHash]);

    // prevent rendering the UI while it redirects
    if (!phoneHash || typeof phoneHash != 'string') return null;

    const handleKeyChange = (text: string) => {
        // automatic lowercasing and whitespace stripping, doesnt allow numbers or symbols
        const lettersOnly = text.toLowerCase().replace(/[^a-z]/g, '');

        // auto-injecting hyphens for format consistency
        let formatted = lettersOnly;
        if (lettersOnly.length > 3 && lettersOnly.length <= 6) {
            formatted = `${lettersOnly.slice(0, 3)}-${lettersOnly.slice(3)}`;
        } else if (lettersOnly.length > 6) {
            formatted = `${lettersOnly.slice(0, 3)}-${lettersOnly.slice(3, 6)}-${lettersOnly.slice(6, 9)}`;
        }

        setBlipkey(formatted);
    };

    // format check to enable the button
    const isValidKey = blipkey.length >= 11 && blipkey.includes('-');

    const handleUnlock = async () => {
        if (!isValidKey) return;

        if (isLoading) return;
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneHash, blipkey }),
            });

            const data = await response.json();

            if (response.ok) {
                await SecureStore.setItemAsync('jwt', data.token);
                console.log("Signup successful! Blipkey burned.");

                router.replace('./home')
            } else {
                // displays the 400 error from the backend
                Alert.alert("Error:", data.error || "Something went wrong.");
            }

        } catch (error) {
            console.error("Could not connect to backend!", error);
            Alert.alert("Network Error:", "Could not connect to the blooprr servers!")
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        {/* logo on top */}
                        <View style={styles.header}>
                            <Image
                                source={require('../../assets/images/dark_logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>

                        {/* middle content area */}
                        <View style={styles.content}>
                            <Text style={styles.title}>got a blip key?</Text>
                            <Text style={styles.subtitle}>blooprr's invite-only rn</Text>

                            <Pressable 
                                style={styles.inputContainer}
                                onPress={() => inputRef.current?.focus()}
                            >
                                {/* The Ghost Placeholder */}
                                {blipkey.length === 0 && (
                                    <Text style={styles.ghostText} pointerEvents="none">
                                        blp-xxx-xxx
                                    </Text>
                                )}
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    maxLength={11}
                                    value={blipkey}
                                    onChangeText={handleKeyChange}
                                    autoCapitalize="none"
                                    selectionColor="#00DCCA"
                                />
                            </Pressable>
                        </View>

                        {/* bottom area */}
                        <View style={styles.bottomArea}>
                            {/* unlock button */}
                            <TouchableOpacity
                                style={[styles.button, (!isValidKey || isLoading) ? styles.buttonInactive : styles.buttonActive]}
                                onPress={handleUnlock}
                                disabled={!isValidKey || isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.buttonText, isValidKey && !isLoading ? styles.buttonTextActive : styles.buttonTextInactive]}>
                                    {isLoading ? "loading..." : "unlock"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#011110',
        paddingHorizontal: 30,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 80,
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
        alignItems: 'center',
        marginTop: -40,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'CalSans',
        marginBottom: 1,
    },
    subtitle: {
        color: '#757575',
        fontSize: 22,
        fontFamily: 'CalSans',
        marginBottom: 35,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    inputContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1B1F1F',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00DCCA',
        width: '100%',
        height: 65,
        paddingHorizontal: 20,
    },
    ghostText: {
        position: 'absolute',
        color: '#545757',
        fontSize: 22,
        fontFamily: 'CalSans',
    },
    input: {
        width: '100%',
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'CalSans',
        paddingTop: 0,
        paddingBottom: 0,
        textAlign: 'center',
    },
    bottomArea: {
        width: '100%',
        minHeight: 140,
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 30,
        width: '85%',
        alignItems: 'center',
        alignSelf: 'center',
    },
    buttonInactive: {
        backgroundColor: '#353535',
    },
    buttonActive: {
        backgroundColor: '#00DCCA',
    },
    buttonText: {
        fontSize: 30,
        fontFamily: 'CalSans',
    },
    buttonTextInactive: {
        color: '#9A9A9A',
    },
    buttonTextActive: {
        color: '#011110',
    },
});
