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
import { Query, QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [assets] = useAssets([require('../assets/videos/intro.mp4')]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false); // Track overall app readiness
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();

  // Debugging logs to track resource states
  useEffect(() => {
    console.log('Fonts Loaded:', fontsLoaded);
    console.log('Fonts Error:', fontsError);
    console.log('Auth Loaded:', isLoaded);
    console.log('Assets Loaded:', !!assets);
    console.log('Video Loaded:', videoLoaded);
  }, [fontsLoaded, fontsError, isLoaded, assets, videoLoaded]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  useEffect(() => {
    if (fontsLoaded && assets) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, assets]);

  useEffect(() => {
    // Check if all resources are loaded
    if (fontsLoaded && isLoaded && assets && videoLoaded) {
      console.log('All resources loaded. App is ready.');
      setAppReady(true); // Mark app as ready
    }
  }, [fontsLoaded, isLoaded, assets, videoLoaded]);

  // Mark video as loaded when assets are available
  useEffect(() => {
    if (assets) {
      setVideoLoaded(true);
    }
  }, [assets]);

  useEffect(() => {
    console.log('isSignedIn:', isSignedIn);
    if (!appReady) return; // Wait until the app is ready
    const inAuthGroup = segments[0] === '(authenticated)';
    if (isSignedIn && !inAuthGroup) {
      router.replace('/(authenticated)/(modals)/lock'); //DEVELOPMENT ONLY 
    } else if (!isSignedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isSignedIn, appReady]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading...</Text>
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
