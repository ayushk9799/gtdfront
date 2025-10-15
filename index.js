/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './App';
import { name as appName } from './app.json';
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerAndroidBackgroundHandler } from './src/notifications/NotificationManager';
import { Provider } from 'react-redux';
import { store } from './src/store';

registerAndroidBackgroundHandler();

enableScreens();

/*
 * Wrapping the root component with GestureHandlerRootView ensures
 * that react-native-gesture-handler (used by the Drawer) can utilise
 * the native driver and avoid excessive passes through the JS thread.
 * This results in smoother drawer interactions, especially on lower-end
 * devices.
 */
const Root = () => (
  <SafeAreaProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <App />
      </Provider>
    </GestureHandlerRootView>
  </SafeAreaProvider>
);

AppRegistry.registerComponent("frontend", () => Root);
