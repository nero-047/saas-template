import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

export function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text
        accessibilityRole="header"
        style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}
        testID="app-title"
      >
        SaaS Template
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  lightContainer: {
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  darkText: {
    color: '#f9fafb',
  },
  lightText: {
    color: '#111827',
  },
});

export default App;
