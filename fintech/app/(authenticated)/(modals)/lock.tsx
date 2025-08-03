import { View, Text, StyleSheet, Touchable, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import Colors from '@/constants/Colors'
import * as Haptics from 'expo-haptics'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

const OFFSET = 20;
const TIME = 80;

const lock = () => {
    const router = useRouter();
    const { user } = useUser()
    const [firstName, setFirstName] = useState<string>(user?.firstName || '')
    const [code, setCode] = useState<number[]>([])
    const codeLength = Array(6).fill(0)
    const offset = useSharedValue(0)

    // Add animated style for shake effect
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }]
    }));

    useEffect(() => {
        if (code.length === 6) {
            if (code.join('') === '123456') {
                router.replace('/(authenticated)/(tabs)/home')
                setCode([])
            } else {
                // Animate shake effect on error
                offset.value = withSequence(
                    withTiming(-OFFSET, { duration: TIME /2 }), 
                    withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
                    withTiming(0, { duration: TIME /2  })
                )
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setCode([])
            }
        }
    }, [code]);

    const onNumberPress = (number: number) => {
       
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCode([...code, number])
    }
    const numberBackspace = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCode(code.slice(0,-1))
    }

    const onBiometricPress = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { success } = await LocalAuthentication.authenticateAsync()

        if (success) {
            router.replace('/(authenticated)/(tabs)/home')
        } else {
            // Handle authentication failure
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }

  return (
    <SafeAreaView>
      <Text style={styles.greeting}>Welcome back, {firstName}!</Text>
      {/* Apply animatedStyle to Animated.View */}
      <Animated.View style={[styles.codeView, animatedStyle]}>
        {codeLength.map((_, index) => (
          <View
            key={index}
            style={[
              styles.codeEmpty,
              { backgroundColor: code[index] !== undefined ? Colors.primary : Colors.lightGray }
            ]}
          />
        ))}
      </Animated.View>
      <View style= {styles.numbersView}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            {[1, 2, 3].map((number)=> (
                <TouchableOpacity key={number} onPress={() => onNumberPress(number)}>
                    <View style={{width: 50, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={styles.number}>{number}</Text>
                    </View>
                </TouchableOpacity>
            ))}
            
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            {[4, 5, 6].map((number)=> (
                <TouchableOpacity key={number} onPress={() => onNumberPress(number)}>
                    <View style={{width: 50, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={styles.number}>{number}</Text>
                    </View>
                </TouchableOpacity>
            ))}
            
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            {[7, 8, 9].map((number)=> (
                <TouchableOpacity key={number} onPress={() => onNumberPress(number)}>
                    <View style={{width: 50, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={styles.number}>{number}</Text>
                    </View>
                </TouchableOpacity>
            ))}
            
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity onPress={onBiometricPress}>
                <View style={{width: 50, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                    <MaterialCommunityIcons name="face-recognition" size={26} color='black' />
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNumberPress(0)}>
                <View style={{width: 50, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={styles.number}>{0}</Text>
                </View>
            </TouchableOpacity>
            <View style={{minWidth: 50, minHeight: 50, justifyContent: 'center', alignItems: 'center'}}>
            {code.length > 0 && (
                <TouchableOpacity onPress={numberBackspace}>
                    <MaterialCommunityIcons name="backspace-outline" size={26} color='black' />
                </TouchableOpacity>
            )}
            </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 80,
        alignSelf: 'center',
    },
    codeView: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginVertical: 100
    },
    codeEmpty: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    numbersView: {
        marginHorizontal: 60,
        gap: 60
    },
    number: {
        fontSize: 32
    }
});


export default lock