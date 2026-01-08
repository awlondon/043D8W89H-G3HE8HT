import { StyleSheet, Text, View } from 'react-native';

export const ExecuteCutsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Execute Cuts</Text>
    <Text style={styles.body}>
      Follow the cut list on the shop floor and record completion offline.
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
