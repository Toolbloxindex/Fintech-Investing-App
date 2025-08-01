import { View, Text, Touchable, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import Colors from '@/constants/Colors';

type RoundBtnProps = {
  title: string;
  onPress?: () => void;
  onLongPress?: () => void;
  icon: typeof Ionicons.defaultProps;
}




const RoundBtn = ({icon, title, onPress, onLongPress}: RoundBtnProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.circle}>
            <Ionicons name={icon} size={30} color={Colors.dark} />

        </View>
        <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  )
}

export default RoundBtn

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 10
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center'

    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark
    }
})