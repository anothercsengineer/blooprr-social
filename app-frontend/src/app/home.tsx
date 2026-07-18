import { useEffect } from 'react';
import { 
    StyleSheet, Text, View, Image,
    TouchableOpacity, SafeAreaView,
    Platform, StatusBar, BackHandler
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    useEffect(() => {
        const backAction = () => {
            BackHandler.exitApp();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);
    
    const handleInvite = () => {
        // we will implement native os sharing here later
        console.log("Invite clicked");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <StatusBar barStyle="light-content" />
            
            <View style={styles.container}>
                {/* header row */}
                <View style={styles.header}>
                    <Image 
                        source={require('../../assets/images/dark_logo.png')} 
                        style={styles.logoImage} 
                        resizeMode="contain" 
                    />
                    <TouchableOpacity style={styles.bellButton} activeOpacity={0.6}>
                        <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* empty feed */}
                <View style={styles.feedContainer}>
                    <Text style={styles.emptyTitle}>nobody here yet</Text>
                    
                    <Text style={styles.emptySubtitle}>
                        blooprr only shows people{'\n'}already in your contacts.
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.inviteButton} 
                        onPress={handleInvite} 
                        activeOpacity={0.8}
                    >
                        <Text style={styles.inviteText}>invite a friend</Text>
                    </TouchableOpacity>

                    <Text style={styles.emptyFooter}>
                        invite a friend to get this started!
                    </Text>
                </View>

                {/* custom navigation bar */}
                <View style={styles.bottomNav}>
                    {/* home tab */}
                    <TouchableOpacity style={[styles.navIconContainer, styles.navIconActive]} activeOpacity={0.8}>
                        <Ionicons name="home" size={26} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* bloop! button */}
                    <TouchableOpacity style={styles.bloopNavButton} activeOpacity={0.8}>
                        <Text style={styles.bloopNavText}>bloop!</Text>
                    </TouchableOpacity>

                    {/* profile tab */}
                    <TouchableOpacity 
                        style={[styles.navIconContainer, styles.navIconInactive]}
                        activeOpacity={0.6}
                        onPress={() => console.log('Route to profile settings')}
                    >
                        <Ionicons name="person" size={26} color="#757575" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#011110',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
    },
    logoImage: {
        width: 120,
        height: 35,
    },
    bellButton: {
        padding: 5,
    },
    feedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: -30,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 34,
        fontFamily: 'CalSans',
        marginBottom: 20,
    },
    emptySubtitle: {
        color: '#757575',
        fontSize: 20,
        fontFamily: 'CalSans',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 40,
    },
    inviteButton: {
        backgroundColor: '#00DCCA',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginBottom: 45,
    },
    inviteText: {
        color: '#011110',
        fontSize: 26,
        fontFamily: 'CalSans',
    },
    emptyFooter: {
        color: '#757575',
        fontSize: 20,
        fontFamily: 'CalSans',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
        paddingBottom: Platform.OS === 'ios' ? 25 : 20,
    },
    navIconContainer: {
        width: 55,
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    navIconActive: {
        borderColor: '#00DCCA',
        backgroundColor: '#011110',
    },
    navIconInactive: {
        borderColor: '#545757',
        backgroundColor: 'transparent',
    },
    bloopNavButton: {
        flex: 1,
        marginHorizontal: 15,
        backgroundColor: '#00DCCA',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bloopNavText: {
        color: '#011110',
        fontSize: 26,
        fontFamily: 'CalSans',
    },
});