import { StyleSheet, Text, View } from 'react-native';

export const ReviewDetectionsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Review Detections</Text>
    <Text style={styles.body}>
      Confirm detected rebar counts and classifications before planning cuts.
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
