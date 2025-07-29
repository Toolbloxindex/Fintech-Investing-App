import { View, Text, StyleSheet, Button, Pressable } from 'react-native'
import React, { useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import RoundBtn from '@/app/components/RoundBtn';
import Dropdown from '@/app/components/Dropdown';

const home = () => {
  const balance = 1420;

  const onAddMoney = () => {
    console.log('Add money pressed');
    // Implement add money functionality here
  };
  return (
    <ScrollView style ={{backgroundColor: Colors.background}}>
      <View style={styles.account}> 
        <View style={styles.row}>
          <Text style={styles.balance}>{balance}</Text>
          <Text style={styles.currency}>€</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <RoundBtn icon={'add'} title={'add money'} onPress={onAddMoney} />
        <RoundBtn icon={'refresh'} title={'Exchange'}  />
        <RoundBtn icon={'list'} title={'Details'}  />
        <Dropdown/>
      </View>
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  account: {
    margin: 80,
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10
  }, 
  balance: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  currency: {
    fontSize: 20,
    fontWeight:'500'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20
  }
})
export default home