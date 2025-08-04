import { View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native'
import React, { useState } from 'react'
import { BlurView } from 'expo-blur'
import RoundBtn from './RoundBtn'
import Colors from '@/constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { TextInput } from 'react-native-gesture-handler'
import { router } from '@/.expo/types/router'
import { Link, useRouter } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'


const CustomHeader = () => {
    const { user } = useUser()
    const {top} = useSafeAreaInsets()
    const router = useRouter()
    const [firstName, setFirstName] = useState(user?.firstName || '')
    const [lastName, setLastName] = useState(user?.lastName || '')
  return (
    <BlurView intensity={80} tint='extraLight' style={{paddingTop: top }}>
      <View style={styles.container}>
        <Link href="/(authenticated)/(modals)/account" asChild>
          <TouchableOpacity style={styles.roundBtn} onPress={() => console.log('Menu pressed')} onLongPress={() => router.push(__DEV__ ? '/_sitemap' : '/')}>
            {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={[styles.roundBtn, {zIndex: 0}]} />
            ): (
                <Text style={{color: '#fff', fontWeight: 500, fontSize: 16, zIndex: 1}}>{firstName[0]}{lastName[0]}</Text>
            )}
            
          </TouchableOpacity>
        </Link>
        <View style={styles.searchSection}>
            <Ionicons name='search' size={20} color={Colors.dark} style={styles.searchIcon}/>
            <TextInput
                placeholder='Search'
                placeholderTextColor={Colors.dark}
                style={styles.input}
            />
        </View>
        <View style={styles.circle}>
            <Ionicons name='stats-chart' size={20} color={Colors.dark} />
        </View>
        <View style={styles.circle}>
            <Ionicons name='card' size={20} color={Colors.dark} />
        </View>
        </View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        backgroundColor:'transparent',
        gap:10,
        paddingHorizontal: 20
    },
    roundBtn: {
        width:40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray,
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchSection: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 30,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
        justifyContent:'center',
        
    },
    searchIcon: {
        padding: 10,
    },
    input: {
        flex:1,
        paddingTop:10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 0,
        color: Colors.dark
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default CustomHeader