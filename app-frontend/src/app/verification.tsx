import { useState, useRef } from "react";
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView,
    Platform, Image, Pressable
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { BACKEND_URL } from "@/constants/config";
import auth from '@react-native-firebase/auth';

export default function VerifyScreen() {
    const { phone, verificationId } = useLocalSearchParams<{ phone: string, verificationId: string }>(); // captures the phone number from previous page
    const safePhone = `+${phone?.toString().replace(/\D/g, '')}`; // glues the '+' back on the numbers
    const [otp, setOtp] = useState('');
    const OTP_LENGTH = 6;

    const inputRef = useRef<TextInput>(null);

    const canProceed = otp.length === OTP_LENGTH;

    const handleVerification = async () => {
        if (!canProceed) return;

        try {
            // 1. check firebase's server for otp
            const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
            const userCredential = await auth().signInWithCredential(credential);

            // 2. grab the cryptographically secure ID token after firebase verification is done
            const firebaseIdToken = await userCredential.user.getIdToken();

            // 3. send the token instead of the raw otp
            const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: safePhone, token: firebaseIdToken }),
            });

            if (response.ok) {
                console.log("Backend accepted Firebase token!");
                // will connect to contacts sync page
                // router.push('/sync');
            } else {
                console.error("Backend refused token!");
            }
        } catch (error) {
            console.error("Firebase rejected OTP or network error:", error);
            alert("Invalid code or expired. Please try again.")
        }
    };

    const renderOtpSlots = () => {
        const slots = [];
        for (let i = 0; i < OTP_LENGTH; i++) {
            const char = otp[i];
            slots.push(
                <View key={i} style={styles.slot}>
                    <Text style={[styles.slotText, !char && styles.slotPlaceholder]}>
                        {char || 'X'}
                    </Text>
                    <View style={styles.slotUnderline} />
                </View>
            );
        }
        return slots;
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

                    <View style={styles.content}>
                        <Text style={styles.title}>check your messages</Text>
                        <Text style={styles.subtitle}>super secret code arriving!</Text>

                        {/* clicking near the slots will focus on the invisible input */}
                        <Pressable
                            style={styles.otpContainer}
                            onPress={() => inputRef.current?.focus()}
                        >
                            {renderOtpSlots()}

                            {/* invisible full-screen input field */}
                            <TextInput
                                ref={inputRef}
                                style={styles.hiddenInput}
                                value={otp}
                                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                maxLength={OTP_LENGTH}
                                keyboardType="number-pad"
                                autoFocus
                            />
                        </Pressable>
                    </View>

                    <View style={styles.bottomArea}>
                        <TouchableOpacity
                            style={[styles.button, canProceed ? styles.buttonActive : styles.buttonInactive]}
                            onPress={handleVerification}
                            disabled={!canProceed}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, canProceed ? styles.buttonTextActive : styles.buttonTextInactive]}>
                                verify
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
        marginTop: 10,
    },
    logoImage: {
        width: 140,
        height: 45,
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
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    slot: {
        alignItems: 'center',
        width: 40,
    },
    slotText: {
        color: '#FFFFFF',
        fontSize: 38,
        fontFamily: 'CalSans',
        marginBottom: 10,
    },
    slotPlaceholder: {
        color: '#414D4C',
    },
    slotUnderline: {
        width: '100%',
        height: 4,
        backgroundColor: '#00DCCA',
        borderRadius: 1,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: '100%',
        height: '100%'
    },
    bottomArea: {
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 30,
        width: 280,
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