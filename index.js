import { registerRootComponent } from 'expo';

import { installGoogleDirectionsProxy } from './src/config/googleDirectionsProxy';
import App from './App';

installGoogleDirectionsProxy();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
