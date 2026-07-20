import { useRef, useState, useEffect } from 'react';
import { 
    StyleSheet, Text, View, Image,
    TouchableOpacity, BackHandler,
    Platform, StatusBar, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BloopCard from '../components/bloop-card';
import { BlurView } from 'expo-blur';

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

    // temporary mock data to view the UI
    const dummyBloops = [
        {
            id: '1',
            username: 'random user',
            profilePicUrl: 'https://i.pravatar.cc/100?img=11',
            bloopImageUrl: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972',
            timeLeft: '7h',
            likes: 125,
            chats: 12,
            relays: 3
        },
        {
            id: '2',
            username: 'another person',
            profilePicUrl: 'https://i.pravatar.cc/100?img=33',
            bloopImageUrl: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd',
            timeLeft: '4h',
            likes: 42,
            chats: 5,
            relays: 1
        },
        {
            id: '3',
            username: 'hello person',
            profilePicUrl: 'https://i.pravatar.cc/100?img=33',
            bloopImageUrl: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd',
            timeLeft: '6h',
            likes: 72,
            chats: 59,
            relays: 10
        }
    ];

    const [focusedBloopId, setFocusedBloopId] = useState<string | null>(dummyBloops[0]?.id || null);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80, // bloop must be 80% on screen to be considered "focused"
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            // focus on the most visible bloop
            setFocusedBloopId(viewableItems[0].item.id);
        }
    }).current;

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

                {/* feed area */}
                {dummyBloops.length > 0 ? (
                    <FlatList
                        data={dummyBloops}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const isFocused = item.id === focusedBloopId;
                            return (
                                <View style={{ position: 'relative' }}>
                                    <BloopCard
                                        {...item}
                                        isFocused={isFocused}
                                    />

                                    {/* subtle card blur overlay */}
                                    {!isFocused && (
                                        <View
                                            style={[
                                                StyleSheet.absoluteFill,
                                                { borderRadius: 30, overflow: 'hidden', marginBottom: 25, zIndex: 10, elevation: 10 }
                                            ]}
                                            pointerEvents="none"
                                        >
                                            <BlurView
                                                intensity={15}
                                                tint="dark"
                                                style={{ flex: 1 }}
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                        contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 10, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        viewabilityConfig={viewabilityConfig}
                        onViewableItemsChanged={onViewableItemsChanged}
                    />
                ) : ( 
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
                )}

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