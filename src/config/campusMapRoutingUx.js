import { Alert, Platform } from 'react-native';

const APPROXIMATE_ROUTE_MESSAGE = 'Walking route unavailable. Showing approximate campus route.';
const MIN_ROUTE_BOTTOM_PADDING = 320;
const runtimeGlobal = globalThis;

const shouldRewriteApproximateRouteAlert = (title, message) => {
  if (typeof title !== 'string' || typeof message !== 'string') return false;

  const normalizedTitle = title.toLowerCase();
  const normalizedMessage = message.toLowerCase();

  return (normalizedTitle === 'route unavailable' || normalizedTitle === 'walking route unavailable')
    && normalizedMessage.includes('walking route unavailable')
    && normalizedMessage.includes('approximate');
};

const installApproximateRouteAlertCopy = () => {
  if (runtimeGlobal.__olmiesCampusRoutingAlertCopyInstalled) return;

  const originalAlert = Alert.alert.bind(Alert);
  Alert.alert = (title, message, buttons, options) => {
    if (shouldRewriteApproximateRouteAlert(title, message)) {
      return originalAlert('Walking Route Unavailable', APPROXIMATE_ROUTE_MESSAGE, buttons, options);
    }

    return originalAlert(title, message, buttons, options);
  };

  runtimeGlobal.__olmiesCampusRoutingAlertCopyInstalled = true;
};

const installRoutePaddingGuard = () => {
  if (Platform.OS === 'web' || runtimeGlobal.__olmiesCampusRoutePaddingGuardInstalled) return;

  try {
    const Maps = require('react-native-maps');
    const MapView = Maps?.default || Maps;
    const prototype = MapView?.prototype;

    if (!prototype?.fitToCoordinates || prototype.__olmiesRoutePaddingGuardInstalled) return;

    const originalFitToCoordinates = prototype.fitToCoordinates;
    prototype.fitToCoordinates = function fitToCoordinatesWithRouteCardPadding(coordinates, options = {}) {
      const existingPadding = options.edgePadding || {};
      const bottomPadding = Number(existingPadding.bottom) || 0;

      return originalFitToCoordinates.call(this, coordinates, {
        ...options,
        edgePadding: {
          ...existingPadding,
          bottom: Math.max(bottomPadding, MIN_ROUTE_BOTTOM_PADDING),
        },
      });
    };

    prototype.__olmiesRoutePaddingGuardInstalled = true;
    runtimeGlobal.__olmiesCampusRoutePaddingGuardInstalled = true;
  } catch (error) {
    console.warn('[CampusMap] Route padding guard skipped.', error);
  }
};

export const installCampusMapRoutingUx = () => {
  installApproximateRouteAlertCopy();
  installRoutePaddingGuard();
};
