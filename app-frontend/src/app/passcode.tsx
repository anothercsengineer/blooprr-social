import { useRef, useState, useEffect } from 'react';
import { 
    StyleSheet, Text, TextInput, View, Alert,
    KeyboardAvoidingView, Keyboard, Platform, Image,
    TouchableOpacity, TouchableWithoutFeedback, BackHandler
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../constants/config';

export default function PasscodeScreen() {
    // we catch the variables passed from blipgate or login here!
    const { phoneHash, blipkey, action, serverPassType } = useLocalSearchParams<{ phoneHash: string, blipkey?: string, action?: string, serverPassType?: 'pin4' | 'pin6' | 'alpha' }>();

    const [passType, setPassType] = useState<'pin4' | 'pin6' | 'alpha'>(serverPassType || 'pin4');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const confirmInputRef = useRef<TextInput>(null);
    const primaryInputRef = useRef<TextInput>(null);

    // locking the hardware back button on Android
    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    // dynamic pin length calculation
    const pinLength = passType === 'pin4' ? 4 : 6;

    const switchMode = (mode: 'pin4' | 'pin6' | 'alpha') => {
        setPassType(mode);
        setPass(''); // clear input when switching passcode modes
        setConfirmPass('');
    }

    const handlePassChange = (text: string) => {
        if (passType === 'alpha') {
            setPass(text); // allows all characters for alphanumeric
        } else {                                                                                                                       
            const cleaned = text.replace(/[^0-9]/g, '');
            setPass(cleaned); // strips out letters/symbols for PINs
            if (cleaned.length === pinLength) {
                // queue the focus event
                setTimeout (() => {
                    confirmInputRef.current?.focus();
                }, 50);
            }
        }
    };

    const handleConfirmPassChange = (text: string) => {
        if (passType === 'alpha') {
            setConfirmPass(text);
        } else {
            setConfirmPass(text.replace(/[^0-9]/g, ''));
        }
    };

    // validation
    const isPrimaryValid = passType === 'alpha'
        ? pass.length >= 8 && /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass)
        : pass.length === pinLength;

    const isReady = action === 'login'
        ? isPrimaryValid
        : (passType === 'alpha'
            ? pass.length >= 8 && pass === confirmPass
            : pass.length == pinLength && pass === confirmPass);

    const handleAction = async () => {
        if (!isReady || isLoading) return;
        setIsLoading(true);

        try {
            const endpoint = action === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload = action === 'login' 
                ? { phoneHash, pass }
                : { phoneHash, blipkey, pass, passType };

            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // securely stores the jwt and sends them forward
                await SecureStore.setItemAsync('jwt', data.token);
                if (action === 'login') {
                    console.log("Login successful! Passcode verified.");
                    router.dismissAll(); // nukes the entire backstack
                    router.replace('/home');
                } else {
                    console.log("Signup successful! Blipkey burned and password secured.");
                    router.dismissAll(); // nukes the entire backstack
                    router.replace('/setup');
                }
            } else {
                Alert.alert("Error:", data.error || "Something went wrong!");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Could not connect to backend!", error);
            Alert.alert("Network Error:", "Could not connect to the blooprr servers!");
            setIsLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        {/* logo on top */}
                        <View style={styles.header}>
                            <Image source={require('../../assets/images/dark_logo.png')} style={styles.logoImage} resizeMode="contain" />
                        </View>

                        {/* middle content area */}
                        <View style={styles.content}>
                            <Text style={styles.title}>
                                {action === 'login' ? 'welcome back' : 'pick your lock'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {action === 'login' ? 'enter your passcode' : `alphanumeric's the safest,\nbut it's your call`}
                            </Text>

                            {/* mode toggle row */}
                            {action !== 'login' && (
                                <View style={styles.toggleRow}>
                                     <TouchableOpacity onPress={() => switchMode('pin4')} style={[styles.toggleButton, passType === 'pin4' && styles.toggleButtonActive]}>
                                        <Text style={[styles.toggleText, passType === 'pin4' && styles.toggleTextActive]}>4-digit</Text>
                                     </TouchableOpacity>
                                     <TouchableOpacity onPress={() => switchMode('pin6')} style={[styles.toggleButton, passType === 'pin6' && styles.toggleButtonActive]}>
                                        <Text style={[styles.toggleText, passType === 'pin6' && styles.toggleTextActive]}>6-digit</Text>
                                     </TouchableOpacity>
                                     <TouchableOpacity onPress={() => switchMode('alpha')} style={[styles.toggleButton, passType === 'alpha' && styles.toggleButtonActive]}>
                                        <Text style={[styles.toggleText, passType === 'alpha' && styles.toggleTextActive]}>alpha-num</Text>
                                     </TouchableOpacity>
                                </View>
                            )}

                            {/* input area */}
                            {passType === 'alpha' ? (
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.alphaInput}
                                        placeholder="enter a secure passcode"
                                        placeholderTextColor="#545757"
                                        secureTextEntry={!showPass}
                                        value={pass}
                                        onChangeText={handlePassChange}
                                        selectionColor="#00DCCA"
                                        returnKeyType={action === 'login' ? "done" : "next"}
                                        onSubmitEditing={() => {
                                            if (action === 'login') handleAction();
                                            else confirmInputRef.current?.focus();
                                        }}
                                        blurOnSubmit={false}
                                    />
                                    <TouchableOpacity 
                                        style={styles.eyeButtonAlpha} 
                                        onPress={() => setShowPass(!showPass)}
                                    >
                                        <Ionicons name={showPass ? 'eye-off' : 'eye'} size={24} color="#00DCCA" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                // custom reference ui for the pins
                                <TouchableWithoutFeedback onPress={() => primaryInputRef.current?.focus()}>
                                    <View style={styles.pinWrapper}>
                                        <View style={styles.pinBoxesContainer}>
                                            {Array.from({ length: pinLength }).map((_, i) => (
                                                <View key={i} style={styles.pinBox}>
                                                    <Text style={[styles.pinText, pass[i] && styles.pinTextFilled]}>
                                                        {pass[i] ? (showPass ? pass[i] : '✱') : '✱'}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* invisible architecture */}
                                        <TextInput
                                            style={styles.hiddenInput}
                                            keyboardType="number-pad"
                                            maxLength={pinLength}
                                            value={pass}
                                            onChangeText={handlePassChange}
                                            caretHidden={true}
                                            ref={primaryInputRef}
                                        />

                                        {/* eye button */}
                                        <TouchableOpacity 
                                            style={styles.eyeButtonPin} 
                                            onPress={() => setShowPass(!showPass)}
                                        >
                                            <Ionicons name={showPass ? 'eye-off' : 'eye'} size={24} color="#00DCCA" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            )}

                            <View style={{ height: 20 }} />

                            {/* confirm input area */}
                            {action !== 'login' && (
                                passType === 'alpha' ? (
                                    <View style={[styles.inputContainer, !isPrimaryValid && { opacity: 0.3 }]}>
                                        <TextInput
                                            ref={confirmInputRef}
                                            style={styles.alphaInput}
                                            placeholder="confirm your passcode"
                                            placeholderTextColor="#545757"
                                            secureTextEntry={!showConfirmPass}
                                            value={confirmPass}
                                            onChangeText={handleConfirmPassChange}
                                            selectionColor="#00DCCA"
                                            returnKeyType="done"
                                            onSubmitEditing={handleAction}
                                            editable={isPrimaryValid}
                                        />
                                    </View>
                                ) : (
                                    <TouchableWithoutFeedback onPress={() => confirmInputRef.current?.focus()}>
                                        <View style={[styles.pinWrapper, !isPrimaryValid && { opacity: 0.3 }]}>
                                            <View style={styles.pinBoxesContainer}>
                                                {Array.from({ length: pinLength }).map((_, i) => (
                                                    <View key={i} style={styles.pinBox}>
                                                        <Text style={[styles.pinText, confirmPass[i] && styles.pinTextFilled]}>
                                                            {confirmPass[i] ? (showConfirmPass ? confirmPass[i] : '✱') : '✱'}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
    
                                            <TextInput
                                                ref={confirmInputRef}
                                                style={styles.hiddenInput}
                                                keyboardType="number-pad"
                                                maxLength={pinLength}
                                                value={confirmPass}
                                                onChangeText={handleConfirmPassChange}
                                                caretHidden={true}
                                                editable={isPrimaryValid}
                                            />
                                        </View>
                                    </TouchableWithoutFeedback>
                                )
                            )}
                        </View>

                        {/* bottom area */}
                        <View style={styles.bottomArea}>
                            <TouchableOpacity
                                style={[styles.button, (!isReady || isLoading) ? styles.buttonInactive : styles.buttonActive]}
                                onPress={handleAction}
                                disabled={!isReady || isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.buttonText, isReady && !isLoading ? styles.buttonTextActive : styles.buttonTextInactive]}>
                                    {isLoading ? (action === 'login' ? "unlocking..." : "securing...") : (action === 'login' ? "unlock" : "secure")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </>
    )
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'CalSans',
    },
    subtitle: {
        color: '#757575',
        fontSize: 22,
        fontFamily: 'CalSans',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#1B1F1F',
        borderRadius: 20,
        padding: 5,
        marginBottom: 35,
        width: '100%',
        justifyContent: 'space-between',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 15,
        alignItems: 'center',
        position: 'relative',
    },
    toggleButtonActive: {
        backgroundColor: '#011110',
        borderWidth: 1,
        borderColor: '#00DCCA', 
    },
    toggleText: {
        color: '#545757',
        fontFamily: 'CalSans',
        fontSize: 16,
    },
    toggleTextActive: {
        color: '#00DCCA',
    },
    inputContainer: {
        justifyContent: 'center',
        backgroundColor: '#1B1F1F',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00DCCA',
        width: '100%',
        height: 65,
        paddingHorizontal: 20,
    },
    alphaInput: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'CalSans',
        textAlign: 'left',
        paddingRight: 40,
    },
    pinWrapper: {
        width: '100%', 
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    pinBoxesContainer: { 
        flexDirection: 'row',
        gap: 15,
    },
    pinBox: {
        width: 35,
        height: 55,
        borderBottomWidth: 4,
        borderBottomColor: '#00DCCA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinText: {
        color: '#545757',
        fontSize: 38,
        fontFamily: 'CalSans',
        marginBottom: 5,
    },
    pinTextFilled: {
        color: '#FFFFFF',
        fontSize: 38,
    },
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
    },
    eyeButtonAlpha: {
        position: 'absolute',
        right: 15,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 10,
        zIndex: 10,
    },
    eyeButtonPin: {
        position: 'absolute',
        right: -15,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingTop: 8,
        zIndex: 10,
    },
    bottomArea: {
        width: '100%',
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
})