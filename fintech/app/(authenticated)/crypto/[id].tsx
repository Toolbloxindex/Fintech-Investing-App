import { View, Text, SectionList, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Header, useHeaderHeight } from '@react-navigation/elements'
import { useQuery } from '@tanstack/react-query'
import { defaultStyles } from '@/constants/Styles'
import Colors from '@/constants/Colors'
import { ScrollView } from 'react-native-gesture-handler'
import { CartesianChart, Line, Area } from "victory-native";
import { Ticker } from '@/interfaces/crypto'
import { Circle, useFont, LinearGradient, vec } from '@shopify/react-native-skia';
import { format } from 'date-fns'


const categories = ['Overview', 'News', 'Orders', 'Transactions']

const CryptoDetail = () => {
  const { id }  = useLocalSearchParams()
  const [activeIndex, setActiveIndex] = useState(0);
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 12)

  const { data } = useQuery({
    queryKey: ['info', id],
    queryFn: async () => {
      const info = await fetch(`/api/info?ids=${id}`)
        .then((res) => res.json())
      //const logo = info?.[+id].logo
      return info[+id]
    },
    enabled: !!id // Only run this query if id is available
  })
  const { data:tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: async (): Promise<any[]> => fetch(`/api/tickers`)
        .then((res) => res.json())
  })


  return (
    <>
      <Stack.Screen
        options={{
          title: data?.name,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerShadowVisible: false,
        }}
      />
      <SectionList
        style={{ backgroundColor: Colors.background }}
        keyExtractor={(item) => item.title}
        contentInsetAdjustmentBehavior="automatic"
        sections={[{ data: [{ title: "Chart" }] }]}
        renderSectionHeader={() => (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingBottom: 8,
              backgroundColor: Colors.background,
              borderBottomColor: Colors.lightGray,
              borderBottomWidth: StyleSheet.hairlineWidth,
            }}
          >
            {categories.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={
                  activeIndex === index
                    ? styles.categoriesBtnActive
                    : styles.categoriesBtn
                }
                onPress={() => setActiveIndex(index)}
              >
                <Text
                  style={
                    activeIndex === index
                      ? styles.categoryTextActive
                      : styles.categoryText
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        ListHeaderComponent={() => (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginHorizontal: 16,
              }}
            >
              <Text style={styles.subtitle}>{data?.symbol}</Text>
              <Image
                source={{ uri: data?.logo }}
                style={{ width: 60, height: 60 }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10, margin: 12 }}>
              <TouchableOpacity
                style={[
                  defaultStyles.pillButtonSmall,
                  {
                    backgroundColor: Colors.primary,
                    flexDirection: "row",
                    gap: 16,
                  },
                ]}
              >
                <Ionicons name="add" size={24} color={"#fff"} />
                <Text style={[defaultStyles.buttonText, { color: "#fff" }]}>
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  defaultStyles.pillButtonSmall,
                  {
                    backgroundColor: Colors.primaryMuted,
                    flexDirection: "row",
                    gap: 16,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                <Text
                  style={[defaultStyles.buttonText, { color: Colors.primary }]}
                >
                  Receive
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          //TODO: CHART
          <>
            <View style={[defaultStyles.block, { height: 500 }]}>
              {tickers && tickers.length > 0 ? (
                <CartesianChart data={tickers} 
                axisOptions={{
                  font,
                  labelColor: Colors.gray,
                }}
                xAxis={{
                  font,
                  tickCount: 4,
                  formatXLabel: (ms) => format(new Date (ms), 'MM/yy'),
                }}
                yAxis={[{
                  font,
                  tickCount: 5, 
                  formatYLabel: (v) => `${v} €`,
                }]}
                xKey="timestamp" yKeys={["price"]}>
                  {({ points, chartBounds }) => (
                    <>
                      <Area 
                        points={points.price} 
                        y0={chartBounds.bottom}
                        animate={{ type: "timing", duration:  500}}
                      >
                        <LinearGradient
                          start={vec(0, 0)}
                          end={vec(0, chartBounds.bottom)}
                          colors={[Colors.primary + '40', Colors.primary + '10']}
                        />
                      </Area>
                      <Line 
                        points={points.price} 
                        color={Colors.primary} 
                        strokeWidth={3}
                        animate={{ type: "timing", duration: 300 }}
                      />
                    </>
                  )}
                </CartesianChart>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Loading chart data...</Text>
                </View>
              )}
            </View>
            <View style={[defaultStyles.block, { marginTop: 20 }]}>
              <Text style={styles.subtitle}>Overview</Text>
              <Text style={{ color: Colors.gray }}>
                Bitcoin is a decentralized digital currency created in 2009 by
                an anonymous person (or group) under the pseudonym Satoshi
                Nakamoto. Bitcoin uses cryptographic principles to secure
                transactions. The Bitcoin network introduced a way of creating
                and maintaining a public, peer-to-peer ledger of all
                transactions without being controlled by any individual or
                institution.
              </Text>
            </View>
          </>
        )}
      />
    </>
  );
}


const styles = StyleSheet.create({
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.gray,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.gray,
  },
  categoryTextActive: {
    fontSize: 14,
    color: '#000',
  },
  categoriesBtn: {
    padding: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  categoriesBtnActive: {
    padding: 10,
    paddingHorizontal: 14,

    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
  },
})

export default CryptoDetail