import { useState, useRef } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView,
    Platform, Image, Pressable
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BACKEND_URL } from '../constants/config';

export default function BlipkeyScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [blipkey, setBlipkey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const handleKeyChange = (text: string) => {
        // automatic lowercasing and whitespace stripping, doesnt allow numbers or symbols
        const lettersOnly = text.toLowerCase().replace(/[^a-z]/g, '');

        // auto-injecting hypens for format consistency
        let formatted = lettersOnly;
        if (lettersOnly.length > 3 && lettersOnly.length <= 6) {
            formatted = `${lettersOnly.slice(0, 3)}-${lettersOnly.slice(3)}`;
        } else if (lettersOnly.length > 6) {
            formatted = `${lettersOnly.slice(0, 3)}-${lettersOnly.slice(3, 6)}-${lettersOnly.slice(6, 9)}`;
        }

        setBlipkey(formatted);
        setErrorMessage('');
    };

    // format check to enable the button
    const isValidKey = blipkey.length >= 11 && blipkey.includes('-');

    const handleUnlock = async () => {
        if (!isValidKey) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, blipkey }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push({ pathname: '/verification', params: { phone } });
            } else {
                setErrorMessage(data.error || 'Something went wrong!');
            }
        } catch (error) {
            setErrorMessage('Could not connect to server!');
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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
                        {/* inline error message */}
                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage.toLowerCase()}</Text>
                        ) : null}
                    </View>

                    {/* bottom area */}
                    <View style={styles.bottomArea}>
                        {/* unlock button */}
                        <TouchableOpacity
                            style={[styles.button, isValidKey ? styles.buttonActive : styles.buttonInactive]}
                            onPress={handleUnlock}
                            disabled={!isValidKey}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, isValidKey ? styles.buttonTextActive : styles.buttonTextInactive]}>
                                unlock
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        paddingHorizontal: 20,
        paddingVertical: 14,
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
    errorText: {
        color: '#FF4D4D',
        fontSize: 14,
        fontFamily: 'System',
        marginTop: 10,
        opacity: 0.8,
    },
    bottomArea: {
        width: '100%',
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
        boxShadow: '0px 0px 20px 2px rgba(0, 229, 255, 0.6)',
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
