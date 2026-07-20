import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// TO DO: map this interface directly to backend DB schema 
interface BloopCardProps {
    username: string;
    profilePicUrl: string;
    bloopImageUrl: string;
    timeLeft: string;
    likes: number;
    chats: number;
    relays: number;
    isFocused?: boolean;
}

export default function BloopCard({
    username,
    profilePicUrl,
    bloopImageUrl,
    timeLeft,
    likes,
    chats,
    relays,
    isFocused = true
} : BloopCardProps) {
    // determine pill color based on hours remaining
    const getTimerColors = (timeStr: string) => {
        const hours = parseInt(timeStr.replace(/\D/g, ''), 10) || 0;

        if (hours >= 12) {
            // green (safe)
            return { bg: '#2F7F32', border: '#47FF47', dot: '#47FF47' };
        } else if (hours > 4) {
            // yellow (warning)
            return { bg: '#7F622F', border: '#FFF047', dot: '#FFF047' };
        } else {
            // orange (critical)
            return { bg: '#7F2F2F', border: '#FF4747', dot: '#FF4747' };
        }
    };

    const timerColors = getTimerColors(timeLeft)

    return (
        <View style={[styles.cardContainer, { borderColor: isFocused ? '#00DCCA' : '#002B27' }]}>
            {/* 1. header strip */}
            <View style={styles.header}>
                <View style={[styles.userInfo, { opacity: isFocused ? 1 : 0.4 }]}>
                    <Image source={{ uri: profilePicUrl }} style={styles.profilePic} />
                    <Text style={[styles.username, { color: isFocused ? '#FFFFFF' : '#545757' }]}>{username}</Text>
                </View>

                {/* timer pill */}
                <View style={[styles.timerBadge, { backgroundColor: timerColors.bg, borderColor: timerColors.border, opacity: isFocused ? 1 : 0.4 }]}>
                    <View style={[styles.timerDot, { backgroundColor: timerColors.dot }]} />
                    <Text style={[styles.timerText, { color: isFocused ? '#FFFFFF' : '#757575' }]}>{timeLeft}</Text>
                </View>
            </View>

            {/* 2. content image */}
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: bloopImageUrl }}
                    style={styles.bloopImage}
                    resizeMode="cover"
                />
                {/* dark tint overlay for unfocused images */}
                {!isFocused && <View style={styles.darkTintOverlay} />}
            </View>

            {/* 3. footer strip */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                    <Ionicons name="thumbs-up-outline" size={28} color={isFocused ? '#00DCCA' : '#144A46'} />
                    <Text style={[styles.actionText, { color: isFocused ? '#FFFFFF' : '#545757' }]}>{likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                    <Ionicons name="chatbubble-outline" size={28} color={isFocused ? '#00DCCA' : '#144A46'} />
                    <Text style={[styles.actionText, { color: isFocused ? '#FFFFFF' : '#545757' }]}>{chats}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                    <Ionicons name="repeat-outline" size={30} color={isFocused ? '#00DCCA' : '#144A46'} />
                    <Text style={[styles.actionText, { color: isFocused ? '#FFFFFF' : '#545757' }]}>{relays}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        backgroundColor: '#001817', // in slight contrast to background
        borderWidth: 1.5,
        borderRadius: 30,
        padding: 15,
        marginBottom: 25,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        backgroundColor: '#1B1F1F',
        borderWidth: 1,
        borderColor: '#00DCCA',
    },
    username: {
        fontSize: 22,
        fontFamily: 'CalSans',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    timerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    timerText: {
        fontSize: 14,
        fontFamily: 'CalSans',
    },
    imageWrapper: {
        width: '100%',
        height: 250,
        borderRadius: 20,
        marginBottom: 15,
        overflow: 'hidden',
    },
    bloopImage: {
        width: '100%',
        height: '100%',
    },
    darkTintOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 15, 14, 0.75)',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        fontSize: 18,
        fontFamily: 'CalSans',
    }
});