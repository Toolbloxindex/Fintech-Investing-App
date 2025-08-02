import { View, Text, SectionList, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { ScrollView } from 'react-native-gesture-handler';
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { Circle, useFont, LinearGradient, vec } from '@shopify/react-native-skia';
import { format } from 'date-fns';
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { Easing } from "react-native-reanimated";
import { SharedValue } from 'react-native-reanimated/lib/typescript/Animated';
import { runOnJS, useDerivedValue } from 'react-native-reanimated';

function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
  return (
    <>
      <Circle cx={x} cy={y} r={7} color={Colors.lightGray} />
      <Circle cx={x} cy={y} r={5} color={Colors.dark} />
    </>
  );
}

// Define types for fetched data
interface CryptoInfo {
  name: string;
  symbol: string;
  logo: string;
}

type Ticker = {
  timestamp: number;
  price: number;
};

const categories = ['Overview', 'News', 'Orders', 'Transactions'];



const CryptoDetail = () => {
  const { id } = useLocalSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastTimestamp, setLastTimestamp] = useState<number>(0);
  const [lastPriceUpdateTime, setLastPriceUpdateTime] = useState<number>(0);
  const [isScrollingFast, setIsScrollingFast] = useState(false);

  const font = useFont(require('@/assets/fonts/Inter-VariableFont_opsz,wght.ttf'), 10);
  const { state, isActive } = useChartPressState({x: 0, y: {price: 0}});

  // Function to update price and date
  const updatePriceAndDate = (price: number, timestamp: number) => {
   
    
    setCurrentPrice(price);
    setCurrentDate(new Date(timestamp).toLocaleDateString());
    
    if (timestamp !== lastTimestamp && lastTimestamp !== 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLastTimestamp(timestamp);
  };

  // Use useDerivedValue to track changes in chart values
  useDerivedValue(() => {
    if (isActive) {
      const price = state.y.price.value.value;
      const timestamp = state.x.value.value;
      runOnJS(updatePriceAndDate)(price, timestamp);
    }
    return null;
  });

  useEffect(() => {
    console.log(isActive)
    if (isActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      // Reset lastTimestamp when chart interaction ends
      setLastTimestamp(0);
    }
  }, [isActive]);

  // Fetch crypto info
  const { data } = useQuery<CryptoInfo>({
    queryKey: ['info', id],
    queryFn: async () => {
      const info = await fetch(`/api/info?ids=${id}`).then((res) => res.json());
      return info[+id];
    },
    enabled: !!id,
  });

  // Fetch tickers
  const { data: tickers } = useQuery<Ticker[]>({
    queryKey: ['tickers'],
    queryFn: async () => fetch(`/api/tickers`).then((res) => res.json()),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const [displayCount, setDisplayCount] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tickers && tickers.length > 0) {
      progress.setValue(0);
      const listener = progress.addListener(({ value }) => {
        const count = Math.min(Math.max(Math.ceil(value * tickers.length), 1), tickers.length);
        setDisplayCount(count);
      });
      
      Animated.timing(progress, {
        toValue: 1,
        duration: 500,
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
            <View style={[defaultStyles.block, { height: 350}]}>
              <View>
                {!isActive ? (
                  <>
                    {tickers && tickers.length > 0 ? (
                    <>
                      <View style={{ alignItems: 'flex-start'
                       }}>
                        
                        <AnimatedRollingNumber 
                        textStyle={{ fontSize: 30, fontWeight: 'bold', color: Colors.dark }}
                        spinningAnimationConfig={{ duration: 100, easing: Easing.bounce }}
                        value={Number(tickers[tickers.length - 1].price.toFixed(2)) ?? 0}
                        
                      />
                      </View>
                        
                      
                        <Text style={{ fontSize: 18, color: Colors.gray }}>
                          Today
                        </Text>
                      </>
                    ) : (
                      <View>
                        <Text style={{fontSize: 30, fontWeight: 'bold', color: Colors.dark}}>Loading...</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={{ alignItems: 'flex-start' }}>
                    
                      <AnimatedRollingNumber 
                        textStyle={{ fontSize: 30, fontWeight: 'bold', color: Colors.dark }}
                        spinningAnimationConfig={{ duration: 200, easing: Easing.bounce }}
                        value={currentPrice ?? 0}
                      />
                  
                    <Text style={{ fontSize: 18, color: Colors.gray }}>
                      {currentDate}
                    </Text>
                  </View>
                )}
              </View>
              {tickers && tickers.length > 0 ? (
                
                <CartesianChart
                    chartPressState={state}
                    data={tickers}
                    padding={{ bottom:6, left: 12 }}
                    xAxis={{
                      font, 
                      tickCount: 4, 
                      formatXLabel: (ms) => format(new Date(ms), 'MM/yy'),
                      lineWidth: 0
                    }}
                    yAxis={[{
                      lineWidth: 0
                    }]}
                    xKey="timestamp"
                    yKeys={["price"]}
                >
                  {({ points, chartBounds }) => {
                    // Use all points if animation is disabled, otherwise use animated count
                    const displayPoints =  points.price.slice(0, displayCount)

                    return (
                      <>
                        <Area points={displayPoints} y0={chartBounds.bottom}>
                          <LinearGradient
                            start={vec(0, 0)}
                            end={vec(0, chartBounds.bottom)}
                            colors={[Colors.primary + '70', Colors.primary + '10']}
                          />
                        </Area>
                        <Line points={displayPoints} color={Colors.primary} strokeWidth={3} />
                        {isActive && <ToolTip x={state.x.position} y={state.y.price.position} />}
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
    marginBottom: 0,
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