import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'

const lock = () => {
    const { user } = useUser()
    const [firstName, setFirstName] = useState<string>(user?.firstName || '')
    const [code, setCode] = useState<number[]>([])
  return (
    <SafeAreaView>
      <Text>Welcome back, {firstName}!</Text>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
    
})


export default lock