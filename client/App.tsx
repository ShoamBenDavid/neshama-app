import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import './global.css';
import AppNavigation from './app/navigation/AppNavigation';
import { store } from './app/store/store';
import { LanguageProvider } from './app/i18n';

export default function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <SafeAreaProvider>
          <AppNavigation />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </LanguageProvider>
    </Provider>
  );
}
