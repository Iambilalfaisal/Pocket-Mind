import Constants from 'expo-constants';
import { Text, View } from 'react-native';

export default function IndexRoute() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>PocketMind</Text>
      <Text>Build OK · v{Constants.expoConfig?.version}</Text>
    </View>
  );
}
