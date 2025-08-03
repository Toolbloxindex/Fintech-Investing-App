import { View, Text, Animated, StyleSheet } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';




export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [loadingText, setLoadingText] = useState('Loading crypto data...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation with different loading messages
    const loadingSteps = [
      { text: 'Fetching market data...', duration: 50 },
      { text: 'Analyzing price trends...', duration: 50 },
      { text: 'Preparing charts...', duration: 100 },
      { text: 'Loading Contents...', duration: 100 },
    ];

    let currentStep = 0;
    let totalTime = 0;
    const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0);

    const runLoadingStep = () => {
      if (currentStep < loadingSteps.length) {
        const currentStepData = loadingSteps[currentStep];
        setLoadingText(currentStepData.text);
        
        // Animate progress
        Animated.timing(progressAnim, {
          toValue: (totalTime + currentStepData.duration) / totalDuration,
          duration: currentStepData.duration,
          useNativeDriver: false,
        }).start();

        // Update progress state for the progress bar
        const progressListener = progressAnim.addListener(({ value }) => {
          setProgress(Math.round(value * 100));
        });

        totalTime += currentStepData.duration;
        currentStep++;

        setTimeout(() => {
          progressAnim.removeListener(progressListener);
          if (currentStep < loadingSteps.length) {
            runLoadingStep();
          } else {
            // Fade out and complete
            setTimeout(() => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                onComplete();
              });
            }, 200);
          }
        }, currentStepData.duration);
      }
    };

    runLoadingStep();
  }, []);

  return (
    <Animated.View style={[
      styles.loadingContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <View style={styles.loadingContent}>
        {/* Crypto Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="analytics" size={60} color={'#000'} />
        </View>
        
        {/* Loading Text */}
        <Text style={styles.loadingTitle}>AI Market Watch</Text>
        <Text style={styles.loadingSubtitle}>{loadingText}</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
        
        {/* Pulse Animation */}
        <Animated.View style={[
          styles.pulseCircle,
          {
            transform: [{
              scale: progressAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.1, 1],
              }),
            }],
            opacity: progressAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.5, 0.3],
            }),
          }
        ]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    top: -10,
  },
})