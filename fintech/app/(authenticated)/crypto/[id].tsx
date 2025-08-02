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
      <Circle cx={x} cy={y} r={7} color={Colors.dark} />
      <Circle cx={x} cy={y} r={5} color={Colors.lightGray} />
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

type TimeInterval = 'day' | 'month' | 'year' | 'all';

// Define chart press state type to match victory-native
interface ChartPressState {
  x: {
    value: SharedValue<number>;
    position: SharedValue<number>;
  };
  y: {
    price: {
      value: SharedValue<number>;
      position: SharedValue<number>;
    };
  };
}

// Define section data type for SectionList
interface SectionData {
  title: string;
}

interface Section {
  data: SectionData[];
}

const categories = ['Overview', 'News', 'Orders', 'Transactions'];
const timeIntervals: { key: TimeInterval; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
];

const CryptoDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('day');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastTimestamp, setLastTimestamp] = useState<number>(0);
  const [lastPriceUpdateTime, setLastPriceUpdateTime] = useState<number>(0);
  const [isScrollingFast, setIsScrollingFast] = useState(false);
  const [isChangingInterval, setIsChangingInterval] = useState(false); // Add this line

  const font = useFont(require('@/assets/fonts/Inter-VariableFont_opsz,wght.ttf'), 10);
  const { state, isActive } = useChartPressState({ x: 0, y: { price: 0 } });

  // Get current price from the latest data point
  const getCurrentPrice = (): number => {
    if (tickers && tickers.length > 0) {
      return tickers[tickers.length - 1].price;
    }
    return 0;
  };

  // Function to update price and date
  const updatePriceAndDate = (price: number, timestamp: number) => {
    setCurrentPrice(price);
    
    // Format date based on selected interval when chart is active
    let formattedDate = '';
    if (selectedInterval === 'day') {
      // For day interval, show hours and minutes
      formattedDate = format(new Date(timestamp), 'HH:mm');
    } else {
      // For other intervals, show the full date
      formattedDate = new Date(timestamp).toLocaleDateString();
    }
    setCurrentDate(formattedDate);
    
    if (timestamp !== lastTimestamp && lastTimestamp !== 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLastTimestamp(timestamp);
  };

  // Use useDerivedValue to track changes in chart values
  useDerivedValue(() => {
    if (isActive && state?.y?.price?.value?.value !== undefined && state?.x?.value?.value !== undefined) {
      const price = state.y.price.value.value;
      const timestamp = state.x.value.value;
      runOnJS(updatePriceAndDate)(price, timestamp);
    }
    return null;
  });

  useEffect(() => {
    console.log(isActive);
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
    queryFn: async (): Promise<CryptoInfo> => {
      const info = await fetch(`/api/info?ids=${id}`).then((res) => res.json());
      return info[Number(id)];
    },
    enabled: !!id,
  });

  // Function to get date range and interval for API call (Free tier limitations)
  const getApiParams = (interval: TimeInterval) => {
    const end = new Date();
    const start = new Date();
    
    switch (interval) {
      case 'day':
        // Get exactly 24 hours from current moment, but add 2-minute buffer to avoid API timing issues
        start.setHours(end.getHours() - 24);
        start.setMinutes(start.getMinutes() + 2); // Add 2-minute buffer to stay within allowed window
        return {
          start: start.toISOString(),
          end: end.toISOString(),
          interval: '1h'
        };
      case 'month':
        // Free tier: daily data for last 30 days
        start.setDate(end.getDate() - 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          interval: '1d'
        };
      case 'year':
        // Free tier: daily data for last 365 days (1 year limit)
        start.setDate(end.getDate() - 365);
        start.setMinutes(start.getMinutes() + 2); // Add 2-minute buffer to stay within allowed window
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          interval: '1d'
        };
      case 'all':
        // Free tier: daily data for last 365 days (maximum for free tier)
        start.setDate(end.getDate() - 365);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          interval: '1d'
        };
    }
  };

  // Helper function to get a stable cache key for the current hour (for day view)
  const getCurrentHourKey = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  };

  // Fetch historical data from CoinPaprika API (Free tier)
  const { data: tickers, isLoading: tickersLoading, error } = useQuery<Ticker[]>({
    queryKey: [
      'historical', 
      id, 
      selectedInterval, 
      selectedInterval === 'day' ? getCurrentHourKey() : 'static'
    ],
    queryFn: async (): Promise<Ticker[]> => {
      if (!id) return [];
      
      const apiParams = getApiParams(selectedInterval);
      const { getDummyData } = await import('@/app/api/dummyData');
      const dummyTickers = getDummyData(selectedInterval);
      return dummyTickers
  .map((item: any) => ({
    timestamp: new Date(item.timestamp).getTime(),
    price: parseFloat(item.price) || 0,
  }))
  .filter((item: Ticker) => item.price > 0)
  .sort((a: Ticker, b: Ticker) => a.timestamp - b.timestamp);
     /*  const url = `https://api.coinpaprika.com/v1/tickers/${id}/historical?start=${apiParams.start}&end=${apiParams.end}&limit=1000&interval=${apiParams.interval}`;
      
      console.log('Fetching from URL:', url);
      console.log('Interval:', selectedInterval, 'API interval:', apiParams.interval);
      console.log('Time range:', apiParams.start, 'to', apiParams.end);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        if (response.status === 402) {
          throw new Error('Free tier limit exceeded. Hourly data may not be available for this time range.');
        }
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data.length, 'data points');
      
      if (!data || data.length === 0) {
        console.warn('No data returned from API');
        return [];
      }
      
      // Transform the API response to match our Ticker type
      const transformedData = data.map((item: any) => ({
        timestamp: new Date(item.timestamp).getTime(),
        price: parseFloat(item.price) || 0
      })).filter((item: Ticker) => item.price > 0) // Filter out invalid prices
        .sort((a: Ticker, b: Ticker) => a.timestamp - b.timestamp);
      
      console.log('Transformed data:', transformedData.length, 'valid points');
      return transformedData; */
    },
    enabled: !!id,
    staleTime: selectedInterval === 'day' ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5 min for day view, 10 min for others
    refetchInterval: selectedInterval === 'day' ? 5 * 60 * 1000 : false, // Refetch every 5 minutes for day view
    retry: 1, // Reduce retries for free tier
  });

  // Use tickers directly since they're already filtered by the API call
  const filteredTickers = tickers || [];

  const [displayCount, setDisplayCount] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  // Modified useEffect for animation
  useEffect(() => {
    if (filteredTickers && filteredTickers.length > 0) {
      // Reset progress and start fresh animation
      progress.setValue(0);
      setDisplayCount(0); // Ensure we start from 0
      
      const listener = progress.addListener(({ value }) => {
        const count = Math.min(Math.max(Math.ceil(value * filteredTickers.length), 1), filteredTickers.length);
        setDisplayCount(count);
      });
      
      // Small delay to ensure state has updated before starting animation
      const startAnimation = () => {
        Animated.timing(progress, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start(() => {
          progress.removeListener(listener);
          setIsChangingInterval(false); // Reset the changing flag
        });
      };

      // Use setTimeout to ensure the reset happens before animation starts
      if (isChangingInterval) {
        setTimeout(startAnimation, 50);
      } else {
        startAnimation();
      }
      
      return () => {
        progress.removeListener(listener);
      };
    }
  }, [filteredTickers, progress]);

  // Modified interval selection handler
  const handleIntervalSelect = (interval: TimeInterval) => {
    if (interval !== selectedInterval) {
      setIsChangingInterval(true);
      setDisplayCount(0); // Reset display count immediately
      setSelectedInterval(interval);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Get the format string based on selected interval
  const getDateFormat = (interval: TimeInterval): string => {
    switch (interval) {
      case 'day':
        return 'HH:mm'; // Hourly format for 24-hour view
      case 'month':
        return 'dd/MM';
      case 'year':
        return 'MMM';
      case 'all':
      default:
        return 'MMM yy';
    }
  };

  const sections: Section[] = [{ data: [{ title: "Chart" }] }];

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.name,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        }}
      />
      <SectionList<SectionData, Section>
        style={{ backgroundColor: Colors.background }}
        keyExtractor={(item) => item.title}
        contentInsetAdjustmentBehavior="automatic"
        sections={sections}
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
            <View style={{ height: 500, padding: 16 }}>
              <View>
                {!isActive ? (
                  <>
                    {!tickersLoading && tickers && tickers.length > 0 ? (
                    <>
                      <View style={{ alignItems: 'flex-start' }}>
                        <AnimatedRollingNumber 
                        textStyle={{ fontSize: 30, fontWeight: 'bold', color: Colors.dark }}
                        spinningAnimationConfig={{ duration: 100, easing: Easing.bounce }}
                        value={Number(getCurrentPrice().toFixed(2))}
                        />
                      </View>
                      <Text style={{ fontSize: 18, color: Colors.gray }}>
                        {selectedInterval === 'day' ? 'Last 24 hours' : 
                         selectedInterval === 'month' ? 'Last 30 days' : 
                         selectedInterval === 'year' ? 'Last year' : 
                         'Last year (Free tier limit)'}
                      </Text>
                    </>
                    ) : (
                      <View>
                        <Text style={{fontSize: 30, fontWeight: 'bold', color: Colors.dark}}>
                          {tickersLoading ? 'Loading...' : error ? 'Error' : 'No data'}
                        </Text>
                        {error && (
                          <Text style={{fontSize: 14, color: Colors.gray, marginTop: 4}}>
                            {(error as Error).message.includes('402') ? 'Hourly data not available on free tier' : 'Try a different time period'}
                          </Text>
                        )}
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

              

              {!tickersLoading && filteredTickers && filteredTickers.length > 0 ? (
                <CartesianChart
                    chartPressState={state}
                    data={filteredTickers}
                    padding={{ bottom: 6 }}
                    xAxis={{
                      font, 
                      tickCount: 5, 
                      formatXLabel: (ms: number) => format(new Date(ms), getDateFormat(selectedInterval)),
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
                    const displayPoints = points.price.slice(0, displayCount);

                    return (
                      <>
                        <Area points={displayPoints} y0={chartBounds.bottom}>
                          <LinearGradient
                            start={vec(0, 0)}
                            end={vec(0, chartBounds.bottom)}
                            colors={[Colors.primary + '10', Colors.background]}
                          />
                        </Area>
                        <Line points={displayPoints} color={Colors.primary} strokeWidth={3} />
                        {isActive && state?.x?.position && state?.y?.price?.position && (
                          <ToolTip x={state.x.position} y={state.y.price.position} />
                        )}
                      </>
                    );
                  }}
                </CartesianChart>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>{tickersLoading ? 'Loading chart data...' : error ? 'Failed to load data' : 'No chart data available'}</Text>
                  {error && (
                    <Text style={{ color: Colors.gray, marginTop: 8, textAlign: 'center' }}>
                      Try selecting a different time interval
                    </Text>
                  )}
                </View>
              )}
            </View>
            {/* Time Interval Selector */}
              <View style={styles.intervalContainer}>
                {timeIntervals.map((interval) => (
                  <TouchableOpacity
                    key={interval.key}
                    style={[
                      styles.intervalBtn,
                      selectedInterval === interval.key && styles.intervalBtnActive
                    ]}
                    onPress={() => handleIntervalSelect(interval.key)}
                  >
                    <Text style={[
                      styles.intervalText,
                      selectedInterval === interval.key && styles.intervalTextActive
                    ]}>
                      {interval.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
  intervalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  intervalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    minWidth: 60,
    alignItems: 'center',
  },
  intervalBtnActive: {
    backgroundColor: Colors.primary,
  },
  intervalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  intervalTextActive: {
    color: '#fff',
  },
});

export default CryptoDetail;