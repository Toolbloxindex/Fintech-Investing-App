import { View, Text, StyleSheet, Button, Pressable } from 'react-native'
import React, { useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import RoundBtn from '@/app/components/RoundBtn';
import Dropdown from '@/app/components/Dropdown';
import { useBalanceStore } from '@/store/balanceStore';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';

const home = () => {
  const { balance, runTransaction, clearTransactions, transactions } = useBalanceStore();

  const onAddMoney = () => {
    runTransaction({
      id: Math.random().toString(),
      title: 'Added money',
      date: new Date(),
      amount: Math.floor(Math.random() * 1000) * (Math.random() < 0.5 ? 1 : -1)
    })
  }

  return (
    <ScrollView style ={{backgroundColor: Colors.background}}>
      <View style={styles.account}> 
        <View style={styles.row}>
          <Text style={styles.balance}>{balance()}</Text>
          <Text style={styles.currency}>€</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <RoundBtn icon={'add'} title={'add money'} onPress={onAddMoney} />
        <RoundBtn icon={'refresh'} title={'Exchange'} onPress={clearTransactions} />
        <RoundBtn icon={'list'} title={'Details'}  />
        <Dropdown/>
      </View>
      <Text style={defaultStyles.sectionHeader}>Transactions</Text>
      <View style={styles.transactions}>
        {transactions.length === 0 && (
          <Text style={{padding:14, color: Colors.gray}}>No transactions yet</Text>
        )}
        {transactions.map((transaction)=> (
          <View key={transaction.id} style={{flexDirection:'row', alignItems: 'center', gap: 16}}>
            <View style={styles.circle}>
              <Ionicons name={transaction.amount > 0 ? 'add' : 'remove'} size={24} color={Colors.dark}/>
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontWeight: '400'}}>{transaction.title}</Text>
              <Text style={{color: Colors.gray}}>{transaction.date.toLocaleString()}</Text>
            </View>
            <Text>{transaction.amount}€</Text>
          </View>
        ))}
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
  },
  transactions: {
    marginHorizontal:20,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    gap:20
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
export default home