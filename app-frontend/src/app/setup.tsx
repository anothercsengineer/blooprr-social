import { useState } from 'react';
import { 
    StyleSheet, Text, TextInput, View, Alert,
    KeyboardAvoidingView, Keyboard, Platform, Image,
    TouchableOpacity, TouchableWithoutFeedback 
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_URL } from '../constants/config';

export default function SetupScreen() {
    const [bio, setBio] = useState('');
    const [pfp, setPfp] = useState<string | null>(null);
    const [pfpUri, setPfpUri] = useState<string | null>(null);
    const [pfpBase64, setpfpBase64] = useState<string | null>(null);

    const pickPfp = async () => {
        // asking native os for gallery permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required:", "blooprr needs to access to your gallery to set a profile picture!")
            return;
        }

        // launching the gallery
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // force a perfect square crop
            quality: 0.5,   // compress the image to save bandwidth
            base64: true,   // encode as a string so we can easily send it via json
        });

        // saving the image to state
        if (!result.canceled && result.assets[0].base64) {
            // formatting it into a data URI so the image component can read it
            setPfpUri(result.assets[0].uri); // local URI
            setPfp(`data:pfp/jpeg;based64,${result.assets[0].base64}`);
        }
    };

    const handleNext = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt');

            const response = await fetch(`${BACKEND_URL}/api/profile/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bio: bio,
                    profilePicUrl: pfpBase64
                }),
            });

            if (response.ok) {
                console.log("Profile successfully configured!");
                router.replace('/home');
            } else {
                const data = await response.json();
                Alert.alert("Error:", data.error || "Could not save profile!");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Network Error:", "Could not connect to the blooprr servers!");
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        {/* logo on top */}
                        <View style={styles.header}>
                            <Image source={require('../../assets/images/dark_logo.png')} style={styles.logoImage} resizeMode="contain" />
                        </View>

                        {/* middle content area */}
                        <View style={styles.content}>
                            <Text style={styles.title}>a face and a few words</Text>
                            <Text style={styles.subtitle}>just enough to say hello!</Text>

                            {/* profile picture picker */}
                            <TouchableOpacity style={styles.pfpWrapper} onPress={pickPfp} activeOpacity={0.8}>
                                {pfpUri ? (
                                    <Image source={{ uri: pfpUri }} style={styles.pfp} />
                                ) : (
                                    <View style={styles.pfpPlaceholder}>
                                        <Ionicons name="person" size={80} color="#757575" />
                                    </View>
                                )}
                                <View style={styles.plusBadge}>
                                    <Ionicons name="add" size={24} color="#011110" />
                                </View>
                            </TouchableOpacity>

                            {/* bio input area */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.bioInput}
                                    placeholder="say something about yourself (or don't)..."
                                    placeholderTextColor="#545757"
                                    multiline={true}
                                    value={bio}
                                    onChangeText={setBio}
                                    selectionColor="#00DCCA"
                                    maxLength={150}
                                />
                            </View>
                        </View>

                        {/* bottom area */}
                        <View style={styles.bottomArea}>
                            <TouchableOpacity
                                style={styles.buttonActive}
                                onPress={handleNext}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonTextActive}>
                                    next
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
        marginBottom: 44,
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
        marginBottom: 35,
        textAlign: 'center',
    },
    pfpWrapper: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: '#00DCCA',
        position: 'relative',
        marginBottom: 35,
    },
    pfpPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 75,
        backgroundColor: '#1B1F1F',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    pfp: {
        width: '100%',
        height: '100%',
        borderRadius: 75,
    },
    plusBadge: {
        position: 'absolute',
        top: '50%',
        marginTop: -16,
        right: -15,
        width: 32,
        height: 32,
        backgroundColor: '#00DCCA',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        backgroundColor: '#1B1F1F',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#00DCCA',
        width: '100%',
        height: 150,
        padding: 20,
    },
    bioInput: {
        flex: 1,
        marginTop: -3,
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'CalSans',
        textAlignVertical: 'top',
    },
    bottomArea: {
        width: '100%',
        justifyContent: 'flex-end',
    },
    buttonActive: {
        backgroundColor: '#00DCCA',
        paddingVertical: 14,
        borderRadius: 30,
        width: '85%',
        alignItems: 'center',
        alignSelf: 'center',
    },
    buttonTextActive: {
        fontSize: 30,
        fontFamily: 'CalSans',
        color: '#011110',
    },
});
