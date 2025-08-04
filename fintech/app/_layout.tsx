import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAssets } from 'expo-asset';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { UserInactivityProvider } from '@/context/UserInactivity';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient();

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting token from SecureStore:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error saving token to SecureStore:', error);
    }
  }
}

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [assets] = useAssets([require('../assets/videos/intro.mp4')]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  useEffect(() => {
    if (fontsLoaded && assets) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, assets]);

  useEffect(() => {
    if (assets) {
      setVideoLoaded(true);
    }
  }, [assets]);

  useEffect(() => {
    if (fontsLoaded && isLoaded && assets && videoLoaded) {
      setAppReady(true);
    }
  }, [fontsLoaded, isLoaded, assets, videoLoaded]);

  useEffect(() => {
    if (!appReady) return;
    
    const inAuthGroup = segments[0] === '(authenticated)';
    
    if (isSignedIn && !inAuthGroup) {
      router.replace('/(authenticated)/(tabs)/home');
    } else if (!isSignedIn && inAuthGroup) {
      router.replace('/');
    }
    
    // Set navigation ready after routing logic completes
    setNavigationReady(true);
  }, [isSignedIn, appReady, segments]);

  // Show loading until both app is ready AND navigation routing is complete
  if (!appReady || !navigationReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: Colors.background || '#000',
      }}>
        {/* Animated Logo/Icon Container */}
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: Colors.primary || '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 30,
          shadowColor: Colors.primary || '#007AFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}>
          <Ionicons name="wallet" size={50} color="white" />
        </View>

     

        {/* Loading Text */}
        <Text style={{ 
          color: Colors.dark || '#333', 
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 0.5,
        }}>
          Initializing...
        </Text>
        
        {/* Subtle Progress Indicator */}
        <View style={{
          width: 200,
          height: 2,
          backgroundColor: 'rgba(0,122,255,0.1)',
          borderRadius: 1,
          marginTop: 20,
          overflow: 'hidden',
        }}>
          <View style={{
            width: '60%',
            height: '100%',
            backgroundColor: Colors.primary || '#007AFF',
            borderRadius: 1,
          }} />
        </View>
      </View>
    );
  }
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown:false}}/>
      <Stack.Screen name="signup" options={{
        title: '',
        headerBackTitle:'',
        headerShadowVisible:false,
        headerStyle: {backgroundColor: Colors.background},
        headerLeft:()=>(
          <TouchableOpacity onPress={router.back}>
            <Ionicons name="arrow-back" size={34} color={Colors.dark} />
          </TouchableOpacity>
        )
      }}/>
      <Stack.Screen name="login" options={{
        title: '',
        headerBackTitle:'',
        headerShadowVisible:false,
        headerStyle: {backgroundColor: Colors.background},
        headerLeft:()=>(
          <TouchableOpacity onPress={router.back}>
            <Ionicons name="arrow-back" size={34} color={Colors.dark} />
          </TouchableOpacity>
        ),
        headerRight:()=>(
          <Link href={'/help'} asChild>
            <TouchableOpacity>
              <Ionicons name="help-circle-outline" size={34} color={Colors.dark} />
            </TouchableOpacity>
          </Link>
        )
      }}/>
      <Stack.Screen name="help" options={{title: 'Help', presentation:'modal'}}/>
      <Stack.Screen name="verify/[phone]" options={{
        title: '',
        headerBackTitle:'',
        headerShadowVisible:false,
        headerStyle: {backgroundColor: Colors.background},
        headerLeft:()=>(
          <TouchableOpacity onPress={router.back}>
            <Ionicons name="arrow-back" size={34} color={Colors.dark} />
          </TouchableOpacity>
        )
      }}/>
      <Stack.Screen name="(authenticated)/(tabs)" options={{headerShown: false}}/>
      <Stack.Screen name='(authenticated)/crypto/[id]' options={{
        title: '',
        headerLeft: () => (
          <TouchableOpacity onPress={router.back}>
            <Ionicons name="arrow-back" size={34} color={Colors.dark} />
          </TouchableOpacity>
        ),
        headerLargeTitle: true,
        headerTransparent: true,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={30} color={Colors.dark} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="star-outline" size={30} color={Colors.dark} />
            </TouchableOpacity>
          </View>
        ),
      }}/>
      <Stack.Screen name='(authenticated)/(modals)/lock' options={{
        headerShown: false,
        animation: 'none',
      }}/>
      <Stack.Screen name='(authenticated)/(modals)/account' options={{
        presentation: 'transparentModal',
        animation: 'fade',
        title: '',
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={router.back}>
            <Ionicons name="close-outline" size={34} color={'#fff'} />
          </TouchableOpacity>
        ),
      }}
      />
    </Stack>
  )
}

export default function RootLayoutNav () {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <UserInactivityProvider>
          <GestureHandlerRootView style={{flex:1}}>
            <StatusBar style="dark" />
            <InitialLayout/>
          </GestureHandlerRootView>
        </UserInactivityProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}