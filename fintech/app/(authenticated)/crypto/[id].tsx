import { View, Text, SectionList, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { ScrollView } from 'react-native-gesture-handler';
import { CartesianChart, Line, Area } from "victory-native";
import { Circle, useFont, LinearGradient, vec } from '@shopify/react-native-skia';
import { format } from 'date-fns';

// Define types for fetched data
interface CryptoInfo {
  name: string;
  symbol: string;
  logo: string;
  // Add other properties as needed based on your API response
}

type Ticker = {
  timestamp: number;
  price: number;
};

const categories = ['Overview', 'News', 'Orders', 'Transactions'];

const CryptoDetail = () => {
  const { id } = useLocalSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 12);

  // Fetch crypto info with type annotation
  const { data } = useQuery<CryptoInfo>({
    queryKey: ['info', id],
    queryFn: async () => {
      const info = await fetch(`/api/info?ids=${id}`).then((res) => res.json());
      return info[+id];
    },
    enabled: !!id,
  });

  // Fetch tickers with type annotation
  const { data: tickers } = useQuery<Ticker[]>({
    queryKey: ['tickers'],
    queryFn: async () => fetch(`/api/tickers`).then((res) => res.json()),
  });

  const [displayCount, setDisplayCount] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tickers && tickers.length > 0) {
      progress.setValue(0); // Reset progress to 0
      const listener = progress.addListener(({ value }) => {
        const count = Math.min(Math.max(Math.ceil(value * tickers.length), 1), tickers.length);
        setDisplayCount(count);
      });
      Animated.timing(progress, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        progress.removeListener(listener);
      });
      return () => {
        progress.removeListener(listener);
      };
    }
  }, [tickers]);

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.name,
          headerStyle: { backgroundColor: Colors.background },
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
                style={activeIndex === index ? styles.categoriesBtnActive : styles.categoriesBtn}
                onPress={() => setActiveIndex(index)}
              >
                <Text style={activeIndex === index ? styles.categoryTextActive : styles.categoryText}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        ListHeaderComponent={() => (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16 }}>
              <Text style={styles.subtitle}>{data?.symbol}</Text>
              <Image source={{ uri: data?.logo }} style={{ width: 60, height: 60 }} />
            </View>
            <View style={{ flexDirection: "row", gap: 10, margin: 12 }}>
              <TouchableOpacity style={[defaultStyles.pillButtonSmall, { backgroundColor: Colors.primary, flexDirection: "row", gap: 16 }]}>
                <Ionicons name="add" size={24} color={"#fff"} />
                <Text style={[defaultStyles.buttonText, { color: "#fff" }]}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[defaultStyles.pillButtonSmall, { backgroundColor: Colors.primaryMuted, flexDirection: "row", gap: 16 }]}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                <Text style={[defaultStyles.buttonText, { color: Colors.primary }]}>Receive</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <>
            <View style={[defaultStyles.block, { height: 500 }]}>
              {tickers && tickers.length > 0 ? (
                <CartesianChart
                  data={tickers} // Full dataset for stable axes
                  xAxis={{ font, tickCount: 4, formatXLabel: (ms) => format(new Date(ms), 'MM/yy') }}
                  yAxis={[{ font, tickCount: 5, formatYLabel: (v) => `${v} €` }]}
                  xKey="timestamp"
                  yKeys={["price"]}
                >
                  {({ points, chartBounds }) => {
                    const displayPoints = points.price.slice(0, displayCount);
                    return (
                      <>
                        <Area points={displayPoints} y0={chartBounds.bottom}>
                          <LinearGradient
                            start={vec(0, 0)}
                            end={vec(0, chartBounds.bottom)}
                            colors={[Colors.primary + '40', Colors.primary + '10']}
                          />
                        </Area>
                        <Line points={displayPoints} color={Colors.primary} strokeWidth={3} />
                      </>
                    );
                  }}
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
};

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
});

export default CryptoDetail;