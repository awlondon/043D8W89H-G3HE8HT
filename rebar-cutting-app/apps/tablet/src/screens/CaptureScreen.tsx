import { StyleSheet, Text, View } from 'react-native';

export const CaptureScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Capture</Text>
    <Text style={styles.body}>
      Use the tablet camera to capture rebar images for AI recognition.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '600'
  },
  body: {
    fontSize: 16
  }
});
