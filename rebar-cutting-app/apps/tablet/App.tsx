import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CaptureScreen } from './src/screens/CaptureScreen';
import { CutPlanScreen } from './src/screens/CutPlanScreen';
import { ExecuteCutsScreen } from './src/screens/ExecuteCutsScreen';
import { ReviewDetectionsScreen } from './src/screens/ReviewDetectionsScreen';

type ScreenKey = 'capture' | 'review' | 'plan' | 'execute';

const screenLabels: Record<ScreenKey, string> = {
  capture: 'Capture',
  review: 'Review Detections',
  plan: 'Cut Plan',
  execute: 'Execute Cuts'
};

const renderScreen = (screen: ScreenKey) => {
  switch (screen) {
    case 'capture':
      return <CaptureScreen />;
    case 'review':
      return <ReviewDetectionsScreen />;
    case 'plan':
      return <CutPlanScreen />;
    case 'execute':
      return <ExecuteCutsScreen />;
    default:
      return null;
  }
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('capture');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navBar}>
        {(Object.keys(screenLabels) as ScreenKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.navButton,
              currentScreen === key && styles.navButtonActive
            ]}
            onPress={() => setCurrentScreen(key)}
          >
            <Text
              style={
                currentScreen === key
                  ? styles.navButtonTextActive
                  : styles.navButtonText
              }
            >
              {screenLabels[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.screenContainer}>{renderScreen(currentScreen)}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7'
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0'
  },
  navButtonActive: {
    backgroundColor: '#1f6feb'
  },
  navButtonText: {
    color: '#333',
    fontSize: 14
  },
  navButtonTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  screenContainer: {
    flex: 1
  }
});
