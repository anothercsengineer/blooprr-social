import { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView,
    Platform, Image, Alert,
    Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BACKEND_URL } from '../constants/config';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handlePhoneChange = (text: string) => {
        const numericOnly = text.replace(/[^0-9]/g, '');

        let formatted = numericOnly;
        if (numericOnly.length > 5) {
            formatted = `${numericOnly.slice(0, 5)} ${numericOnly.slice(5, 10)}`;
        }

        setPhoneNumber(formatted);
    }

    // validation: proccessing allowed only when 10 digits are entered and box is checked
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const isValidNumber = cleanNumber.length >= 10;
    const canProceed =  isValidNumber && agreed;

    const handleProceed = async () => {
        if (!canProceed) return;

        const formattedPhone = `+91${cleanNumber}`; // format with the country code

        if (isLoading) return;
        setIsLoading(true);

        // backend talking
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone }), 
            });

            const data = await response.json();

            if (response.ok) {
                // for returning user, save the jwt token securely to the device
                await SecureStore.setItemAsync('jwt', data.token);
                console.log("Logged in successully!");

                router.replace('/home');
            } else if (response.status === 404) {
                // for new user, redirect them to the blipgate screen
                router.push({
                    pathname: '/blipgate',
                    params: { phone: `+91${cleanNumber}` }
                });
            } else {
                // some backend error (500 or something)
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

                        {/* middle placeholder area */}
                        <View style={styles.content}>
                            <Text style={styles.title}>enter your number</Text>
                            <Text style={styles.subtitle}>dw we won't leak it!</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.countryCode}>+91</Text>
                                <View style={styles.divider} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="XXXXX XXXXX"
                                    placeholderTextColor="#545757"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={handlePhoneChange}
                                    maxLength={11}
                                    selectionColor="#00DCCA"
                                />
                            </View>
                        </View>

                        {/* bottom area */}
                        <View style={styles.bottomArea}>
                            {/* custom checkbox row */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setAgreed(!agreed)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                                    {agreed && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.termsText}>
                                    By continuing, you agree to our{'\n'}
                                    <Text style={styles.termsLink}>Privacy Policy and Terms</Text>
                                </Text>
                            </TouchableOpacity>

                            {/* proceed button */}
                            <TouchableOpacity
                                style={[styles.button, (!canProceed || isLoading) ? styles.buttonInactive : styles.buttonActive]}
                                onPress={handleProceed}
                                disabled={!canProceed || isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.buttonText, canProceed ? styles.buttonTextActive : styles.buttonTextInactive]}>
                                    {isLoading ? "loading..." : "proceed"}
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
        width: 150, // smaller than the main screen
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
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B1F1F',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00DCCA',
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    countryCode: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'CalSans',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#00DCCA',
        marginHorizontal: 15,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'CalSans',
        paddingTop: 0,
        paddingBottom: 0,
    },
    bottomArea: {
        width: '100%',
    },
        checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 5,
    },
    checkbox: {
        width: 30,
        height: 30,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#00DCCA',
        backgroundColor: '#1B1F1F',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    checkboxActive: {
        backgroundColor: '#00DCCA',
    },
        checkmark: {
        color: '#011110',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 0, // centers the checkmark
    },
        termsText: {
        color: '#757575',
        fontSize: 14,
        flex: 1,
        fontFamily: 'System',
    },
    termsLink: {
        color: '#00DCCA',
        fontWeight: 'bold',
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