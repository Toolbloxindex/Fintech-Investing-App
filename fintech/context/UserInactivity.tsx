
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({
    id: 'inactivity-storage',
})


export const UserInactivityProvider = ({ children }: any ) => {
    const appState = useRef(AppState.currentState); 
    const router = useRouter();
    const { isSignedIn } = useAuth();

    useEffect(() => {
        const subscription = AppState.addEventListener("change",handleAppStateChange)
    return () => {
        subscription.remove()
    }
    }, [])

    const handleAppStateChange = async(nextAppState: AppStateStatus) =>{
        if (nextAppState === "background") {
            recordStartTime()
        }
        else if (nextAppState === "active" && appState.current.match(/background/)) {
            const elapsed = Date.now() - (storage.getNumber('startTime') || 0);
            console.log("Elapsed time since last activity:", elapsed, "ms");
            if (elapsed > 5000 && isSignedIn) {
                router.replace('/(authenticated)/(modals)/lock');
            }
        }
        console.log("App state changed:", nextAppState);
        appState.current = nextAppState;
    }

    const recordStartTime = () => {
       
        storage.set('startTime', Date.now());
    }
    return children
}