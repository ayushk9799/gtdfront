/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './App';
import { name as appName } from './app.json';
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

enableScreens();

/*
 * Wrapping the root component with GestureHandlerRootView ensures
 * that react-native-gesture-handler (used by the Drawer) can utilise
 * the native driver and avoid excessive passes through the JS thread.
 * This results in smoother drawer interactions, especially on lower-end
 * devices.
 */
const Root = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);

AppRegistry.registerComponent("GuessTheDisease", () => Root);
