import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, FlatList, TouchableOpacity, Dimensions, Platform, Linking, Alert, Modal, ScrollView, Image } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import API_BASE_URL, { buildApiUrl } from '../../config/api';

let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = (eventName, callback) => {};

try {
  if (Constants.appOwnership !== 'expo') {
    const Speech = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = Speech.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = Speech.useSpeechRecognitionEvent;
  }
} catch (e) {
  console.warn("Speech recognition native module not loaded.");
}

// Dynamically import MapView to prevent web bundler from crashing
let MapView, Marker, Callout, UrlTile, Polygon, Polyline, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    const MapsModule = Maps?.default ? Maps : { default: Maps, ...Maps };
    MapView = MapsModule.default;
    Marker = MapsModule.Marker;
    Callout = MapsModule.Callout;
    UrlTile = MapsModule.UrlTile;
    Polygon = MapsModule.Polygon;
    Polyline = MapsModule.Polyline;
    PROVIDER_GOOGLE = MapsModule.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps native module not loaded.', e);
  }
}
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui';
import { fonts, radii, spacing } from '../../utils/theme';
import * as Location from 'expo-location';

const decodePolyline = (t, e) => {
    for (var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5); u < t.length; ) {
        a = null, h = 0, i = 0;
        do a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5; while (a >= 32);
        n = 1 & i ? ~(i >> 1) : i >> 1, h = i = 0;
        do a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5; while (a >= 32);
        o = 1 & i ? ~(i >> 1) : i >> 1, l += n, r += o, d.push({ latitude: l / c, longitude: r / c });
    }
    return d;
};

// Haversine formula to compute metric distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

const UTECH_CENTER = {
  latitude: 18.0180,
  longitude: -76.7440,
};

const UTECH_BOUNDARY_COORDS = [
  { latitude: 18.0210, longitude: -76.7475 }, // North-West (Papine Road edge)
  { latitude: 18.0210, longitude: -76.7380 }, // North-East (Hope River edge)
  { latitude: 18.0140, longitude: -76.7380 }, // South-East (Eastern flank)
  { latitude: 18.0125, longitude: -76.7440 }, // South (Old Hope Road bend)
  { latitude: 18.0125, longitude: -76.7485 }, // South-West (Hospital flank)
];

const UTECH_BOUNDS = UTECH_BOUNDARY_COORDS.reduce(
  (bounds, coord) => ({
    minLat: Math.min(bounds.minLat, coord.latitude),
    maxLat: Math.max(bounds.maxLat, coord.latitude),
    minLng: Math.min(bounds.minLng, coord.longitude),
    maxLng: Math.max(bounds.maxLng, coord.longitude),
  }),
  { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
);

const isFiniteNumber = (value) => Number.isFinite(value);

const isValidLatLng = (coord) => (
  coord &&
  isFiniteNumber(coord.latitude) &&
  isFiniteNumber(coord.longitude) &&
  Math.abs(coord.latitude) <= 90 &&
  Math.abs(coord.longitude) <= 180
);

const isWithinCampusBounds = (coord) => (
  isValidLatLng(coord) &&
  coord.latitude >= UTECH_BOUNDS.minLat &&
  coord.latitude <= UTECH_BOUNDS.maxLat &&
  coord.longitude >= UTECH_BOUNDS.minLng &&
  coord.longitude <= UTECH_BOUNDS.maxLng
);

const toLegacyMapCoordinates = (x, y) => ({
  latitude: 18.0167736 + (y - 50) * 0.00015,
  longitude: -76.7464894 + (x - 50) * 0.00015,
});

const getCoordinates = (x, y) => {
  const parsedX = Number.parseFloat(x);
  const parsedY = Number.parseFloat(y);

  if (!isFiniteNumber(parsedX) || !isFiniteNumber(parsedY)) {
    return { latitude: NaN, longitude: NaN };
  }

  const storedCoords = { latitude: parsedY, longitude: parsedX };
  const reversedCoords = { latitude: parsedX, longitude: parsedY };

  if (isValidLatLng(storedCoords) && isWithinCampusBounds(storedCoords)) {
    return storedCoords;
  }

  if (isValidLatLng(reversedCoords) && isWithinCampusBounds(reversedCoords)) {
    console.warn('[CampusMap] POI coordinates appear reversed; using corrected latitude/longitude.', {
      coordinateX: x,
      coordinateY: y,
      corrected: reversedCoords,
    });
    return reversedCoords;
  }

  if (parsedX >= 0 && parsedX <= 100 && parsedY >= 0 && parsedY <= 100) {
    return toLegacyMapCoordinates(parsedX, parsedY);
  }

  if (isValidLatLng(storedCoords)) {
    return storedCoords;
  }

  if (isValidLatLng(reversedCoords)) {
    console.warn('[CampusMap] POI coordinates appear reversed but outside campus bounds.', {
      coordinateX: x,
      coordinateY: y,
      corrected: reversedCoords,
    });
    return reversedCoords;
  }

  return { latitude: NaN, longitude: NaN };
};

export default function CampusMapScreen({ navigation, route }) {
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const isFocused = useIsFocused();
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [mapType, setMapType] = useState('hybrid'); // Expose toggle for Standard vs Hybrid
  const [isListening, setIsListening] = useState(false); // Native Map Dictation state

  // Interactive Crowdsourcing State
  const [draftPin, setDraftPin] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pinName, setPinName] = useState('');
  const [pinDesc, setPinDesc] = useState('');
  const [pinCategory, setPinCategory] = useState('Building');
  const [pinImage, setPinImage] = useState(null);
  const [submittingPin, setSubmittingPin] = useState(false);
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const lastSearchSelectionRef = useRef(0);
  const lastFocusRequestRef = useRef(null);
  const speechAvailable = !!ExpoSpeechRecognitionModule;

  // Hook directly into the OS Speech engine thread
  useSpeechRecognitionEvent('result', (event) => {
    setSearchQuery(event.results[0]?.transcript || "");
  });

  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', () => setIsListening(false));

  const toggleDictation = async () => {
    if (!speechAvailable) {
      Alert.alert("Feature Unavailable", "Voice search requires a custom native app build. Not available in standard Expo Go.");
      return;
    }

    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } else {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert("Permissions needed", "Microphone access is required for voice search.");
        return;
      }
      setSearchQuery(""); // Wipe input for fresh dictation
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({ lang: 'en-JM', interimResults: true });
    }
  };

  const handleSelectSearchResult = (poi) => {
    lastSearchSelectionRef.current = Date.now(); // Absolute Global Temporal Map Shield! 

    // Delay the unmounting of the search dropdown to absorb the raw physical TouchEnd event
    setTimeout(() => {
      setSearchQuery(''); 
      import('react-native').then(rn => rn.Keyboard.dismiss());
    }, 250);
    
    setCurrentRoute(null);
    setRouteInfo(null);
    setSelectedPoi(poi); // Open popup
    
    // Animate map to point safely using 2D Bounding Box Math
    if (mapRef.current) {
      const coords = getCoordinates(poi.coordinateX, poi.coordinateY);
      // Wait roughly 450ms for React Native DOM AND CartoDB Tile shards to fully download/draw before violent Android Camera panning locks the thread!
      setTimeout(() => {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.005, 
          longitudeDelta: 0.005,
        }, 800);
      }, 450);
      
      // Automatically pop the native Callout Bubble after the camera finishes flying to the location
      setTimeout(() => {
        if (selectedMarkerRef.current && selectedMarkerRef.current.showCallout) {
          selectedMarkerRef.current.showCallout();
        }
      }, 1200);
    }
  };

  const openExternalMaps = async (destination, origin = null, mode = 'walking') => {
    const travelMode = mode.toLowerCase();
    const params = [
      'api=1',
      `destination=${destination.latitude},${destination.longitude}`,
      `travelmode=${travelMode}`,
    ];

    if (origin) {
      params.push(`origin=${origin.latitude},${origin.longitude}`);
    }

    const mapsUrl = `https://www.google.com/maps/dir/?${params.join('&')}`;

    try {
      await Linking.openURL(mapsUrl);
    } catch (error) {
      console.warn('[CampusMap] Failed to open Google Maps externally.', { error, mapsUrl });
      Alert.alert('Map Error', 'Could not open Google Maps on this device.');
    }
  };

  const focusOnDestination = (destination) => {
    if (!mapRef.current || !isValidLatLng(destination)) return;

    mapRef.current.animateToRegion({
      ...destination,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    }, 500);
  };

  const showApproximateRoute = (origin, destination) => {
    const straightLineDistance = calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    const approximateRoute = [origin, destination];

    setCurrentRoute(approximateRoute);
    setRouteInfo({
      distance: `~${straightLineDistance.toFixed(2)} km`,
      duration: 'estimate only',
      icon: 'navigate',
      label: 'Approximate Location',
      note: 'Straight-line campus path estimate',
    });

    if (mapRef.current) {
      mapRef.current.fitToCoordinates(approximateRoute, {
        edgePadding: { top: 70, right: 70, bottom: 200, left: 70 },
        animated: true,
      });
    }
  };

  const fetchCampusDirections = async (origin, destination, mode) => {
    const endpoint = buildApiUrl('/api/v1/mobile/map/directions');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, mode }),
    });

    const rawText = await response.text().catch(() => '');
    let payload;

    try {
      payload = rawText ? JSON.parse(rawText) : { status: 'UNKNOWN_STATUS', error_message: 'Empty response from route service.' };
    } catch (error) {
      console.warn('[CampusMap] Unable to parse backend route response.', { error, rawText });
      payload = { status: 'INVALID_RESPONSE', error_message: 'The route service returned invalid JSON.' };
    }

    const status = payload?.status || 'UNKNOWN_STATUS';
    const errorMessage = payload?.error_message || null;

    if (response.ok && status === 'OK') {
      console.info('[CampusMap] Backend directions route calculated.', {
        mode,
        status,
        routes: payload?.routes?.length || 0,
      });
    } else {
      console.warn('[CampusMap] Backend directions route failed.', {
        mode,
        status,
        errorMessage,
        origin,
        destination,
        poiId: selectedPoi?.id,
        poiName: selectedPoi?.name,
      });
    }

    return { data: payload, status, errorMessage };
  };

  const applyGoogleRoute = (route, mode) => {
    const leg = route.legs[0];
    const decodedPoints = decodePolyline(route.overview_polyline.points);

    setRouteInfo({
      distance: leg.distance.text,
      duration: leg.duration.text,
      icon: mode === 'driving' ? 'car' : 'walk',
      label: mode === 'driving' ? 'Driving Route Active' : 'Walking Route Active',
    });

    setCurrentRoute(decodedPoints);

    if (mapRef.current) {
       mapRef.current.fitToCoordinates(decodedPoints, {
         edgePadding: { top: 70, right: 70, bottom: 200, left: 70 },
         animated: true
       });
    }
  };

  const handleGetDirections = async () => {
    if (!selectedPoi) return;
    setCalculatingRoute(true);
    
    try {
      const destination = getCoordinates(selectedPoi.coordinateX, selectedPoi.coordinateY);

      if (!isValidLatLng(destination)) {
        console.warn('[CampusMap] Invalid POI coordinates for directions.', {
          poiId: selectedPoi.id,
          poiName: selectedPoi.name,
          coordinateX: selectedPoi.coordinateX,
          coordinateY: selectedPoi.coordinateY,
          destination,
        });
        Alert.alert('Location Error', 'This map pin has invalid coordinates, so directions are unavailable.');
        return;
      }

      if (!isWithinCampusBounds(destination)) {
        console.warn('[CampusMap] POI appears outside UTech campus bounds.', {
          poiId: selectedPoi.id,
          poiName: selectedPoi.name,
          destination,
        });
      }

      let location;
      if (hasLocationPermission) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } else {
        focusOnDestination(destination);
        Alert.alert(
          "Permission Required",
          "Please enable location services to calculate a route. Showing this location on the campus map instead.",
          [
            { text: 'Open Google Maps', onPress: () => openExternalMaps(destination) },
            { text: 'OK' },
          ]
        );
        return;
      }
      
      const origin = {
        latitude: Number.parseFloat(location?.coords?.latitude),
        longitude: Number.parseFloat(location?.coords?.longitude),
      };

      if (!isValidLatLng(origin)) {
        console.warn('[CampusMap] Invalid current location for directions.', {
          location,
          origin,
        });
        focusOnDestination(destination);
        Alert.alert(
          'Location Unavailable',
          'Your current location is unavailable. Showing this location on the campus map instead.',
          [
            { text: 'Open Google Maps', onPress: () => openExternalMaps(destination) },
            { text: 'OK' },
          ]
        );
        return;
      }
      
      const distanceToCampus = calculateDistance(origin.latitude, origin.longitude, mapRegion.latitude, mapRegion.longitude);
      if (distanceToCampus > 5) { // Strict 5km Walking limit to prevent giant Map fetches
        focusOnDestination(destination);
        Alert.alert(
          "Too Far",
          "Walking directions are only available when you are near the UTech Campus. Showing this location on the campus map instead.",
          [
            { text: 'Open Google Maps', onPress: () => openExternalMaps(destination, origin, 'driving') },
            { text: 'OK' },
          ]
        );
        return;
      }
      
      const walkingResult = await fetchCampusDirections(origin, destination, 'walking');
      
      if (walkingResult.status === 'OK' && walkingResult.data.routes?.length > 0) {
        applyGoogleRoute(walkingResult.data.routes[0], 'walking');
        return;
      }

      if (walkingResult.status === 'OK') {
        console.warn('[CampusMap] Backend directions returned OK without route data.', {
          mode: 'walking',
          routes: walkingResult.data.routes?.length || 0,
          poiId: selectedPoi.id,
          poiName: selectedPoi.name,
        });
      }

      if (walkingResult.status === 'ZERO_RESULTS') {
        const drivingResult = await fetchCampusDirections(origin, destination, 'driving');

        if (drivingResult.status === 'OK' && drivingResult.data.routes?.length > 0) {
          applyGoogleRoute(drivingResult.data.routes[0], 'driving');
          Alert.alert('Walking Route Unavailable', 'Walking route unavailable. Showing a driving route instead.');
          return;
        }

        showApproximateRoute(origin, destination);
        Alert.alert(
          'Walking Route Unavailable',
          'Walking route unavailable. Showing approximate location / opening Google Maps.',
          [
            { text: 'Open Google Maps', onPress: () => openExternalMaps(destination, origin) },
            { text: 'OK' },
          ]
        );
        return;
      }

      showApproximateRoute(origin, destination);
      Alert.alert(
        'Route Unavailable',
        'Walking route unavailable. Showing approximate location / opening Google Maps.',
        [
          { text: 'Open Google Maps', onPress: () => openExternalMaps(destination, origin) },
          { text: 'OK' },
        ]
      );
    } catch (err) {
      console.warn("[CampusMap] Direction fetch error:", err);
      const destination = selectedPoi ? getCoordinates(selectedPoi.coordinateX, selectedPoi.coordinateY) : null;
      if (isValidLatLng(destination)) {
        focusOnDestination(destination);
      }
      Alert.alert("Network Error", "Failed to contact routing servers. Showing this location on the campus map instead.");
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleMapLongPress = (e) => {
    if (!user) {
      Alert.alert("Login Required", "You must be logged in to contribute new map locations.");
      return;
    }
    const { coordinate } = e.nativeEvent;
    setDraftPin(coordinate);
    setPinName('');
    setPinDesc('');
    setPinCategory('Building');
    setPinImage(null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPinImage(result.assets[0]);
    }
  };

  const submitDraftPin = async () => {
    if (!pinName.trim()) {
      Alert.alert("Error", "Please provide a name for this location.");
      return;
    }

    setSubmittingPin(true);
    try {
      const formData = new FormData();
      formData.append('Name', pinName);
      formData.append('Description', pinDesc);
      formData.append('Category', pinCategory);
      formData.append('CoordinateX', draftPin.longitude.toString());
      formData.append('CoordinateY', draftPin.latitude.toString());

      if (pinImage) {
        const localUri = pinImage.uri;
        const filename = localUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        if (type === 'image/jpg') type = 'image/jpeg';

        formData.append('Image', { uri: localUri, name: filename, type });
      }

      const res = await fetchWithAuth('/api/v1/mobile/map/submissions', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        Alert.alert("Success!", "Your pin was submitted and is waiting for administrator approval. You can now see it natively on your map!");
        setModalVisible(false);
        setDraftPin(null);
        // Refresh POIs to show the newly pending pin
        const fetchRes = await fetchWithAuth('/api/v1/mobile/map/pins');
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setPois(data);
        }
      } else {
        const errText = await res.text();
        Alert.alert("Submission Failed", errText || "Could not submit your location.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Unable to reach servers.");
    } finally {
      setSubmittingPin(false);
    }
  };

  // UTech Jamaica Center Coordinates
  const mapRegion = {
    latitude: UTECH_CENTER.latitude,
    longitude: UTECH_CENTER.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Building': return 'violet'; // 'purple' string crashes Android natively
      case 'Vendor': return 'plum';
      case 'Office': return 'green';
      case 'Restroom': return 'turquoise';
      case 'LectureTheatre': return 'orange';
      case 'Lab': return 'blue';
      case 'FoodZone': return 'tomato';
      case 'Recreation': return 'forestgreen';
      case 'Landmark': return 'goldenrod';
      case 'Parking': return 'slategray';
      case 'StudyZone': return 'sandybrown';
      case 'Security': return 'crimson';
      case 'Clinic': return 'teal';
      default: return 'red';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Building': return 'business';
      case 'Vendor': return 'pricetag';
      case 'Office': return 'briefcase';
      case 'Restroom': return 'water';
      case 'LectureTheatre': return 'easel';
      case 'Lab': return 'flask';
      case 'FoodZone': return 'restaurant';
      case 'Recreation': return 'leaf';
      case 'Landmark': return 'star';
      case 'Parking': return 'car';
      case 'StudyZone': return 'book';
      case 'Security': return 'shield-checkmark';
      case 'Clinic': return 'medkit';
      default: return 'location';
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchPois = async () => {
      if (!isFocused) return;
      try {
        const res = await fetchWithAuth('/api/v1/mobile/map/pins');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setPois(data);
        }
      } catch (err) {
        console.error('Failed to fetch POIs:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    
    fetchPois();

    return () => {
       isCancelled = true;
    };
  }, [isFocused, user?.username]);

  useEffect(() => {
    const focusPoiId = route?.params?.focusPoiId;
    const focusRequestId = route?.params?.focusRequestId || focusPoiId;

    if (!isFocused || loading || !focusPoiId || pois.length === 0) return;
    if (lastFocusRequestRef.current === focusRequestId) return;

    const matchedPoi = pois.find(poi => String(poi.id) === String(focusPoiId));
    if (!matchedPoi) return;

    lastFocusRequestRef.current = focusRequestId;
    handleSelectSearchResult(matchedPoi);
  }, [isFocused, loading, pois, route?.params?.focusPoiId, route?.params?.focusRequestId]);

  useEffect(() => {
    const requestGpsPermissions = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasLocationPermission(true);
        }
      } catch (error) {
        console.warn("Failed to request GPS bounds securely:", error);
      }
    };
    
    requestGpsPermissions();
  }, []);

  const safeSearch = searchQuery.trim().toLowerCase().replace(/[\s-]/g, '');
  const isMatch = (text) => text && text.toLowerCase().replace(/[\s-]/g, '').includes(safeSearch);
  
  const filteredPois = pois.filter(poi => 
    isMatch(poi.name) || 
    isMatch(poi.description) ||
    isMatch(poi.associatedRooms)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.headerTitle, { color: colors.text, flex: 1 }]}>Campus Map</Text>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginRight: 8 }]}
            onPress={() => setMapType(prev => prev === 'standard' ? 'hybrid' : 'standard')}
          >
            <Ionicons name={mapType === 'standard' ? "earth" : "map-outline"} size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          {user ? (
             <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
               <Ionicons name="log-out-outline" size={17} color={colors.textSecondary} />
             </TouchableOpacity>
          ) : (
             <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginLeft: 8 }]} onPress={() => navigation.navigate('Login')}>
               <Ionicons name="log-in-outline" size={17} color={colors.textSecondary} />
             </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ zIndex: 100, position: 'relative' }}>
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={isListening ? "Listening natively..." : "Search locations, buildings, rooms..."}
            placeholderTextColor={isListening ? colors.info : colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
               if (filteredPois.length > 0) {
                  handleSelectSearchResult(filteredPois[0]);
               }
            }}
          />
          <TouchableOpacity
            onPress={toggleDictation}
            disabled={!speechAvailable}
            style={{ padding: 8, marginLeft: 'auto', opacity: speechAvailable ? 1 : 0.35 }}
          >
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={20}
              color={isListening ? colors.info : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.mapTitle, { color: colors.text }]}>Loading Map Data...</Text>
        </View>
      ) : Platform.OS === 'web' || !MapView ? (
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Ionicons name="map" size={44} color={colors.secondary} />
          <Text style={[styles.mapTitle, { color: colors.text }]}>{Platform.OS === 'web' ? 'Map Optimization' : 'Map Unavailable'}</Text>
          <Text style={[styles.mapSubtitle, { color: colors.textSecondary }]}>
            {Platform.OS === 'web'
              ? 'The interactive campus map leverages native hardware rendering and is only available on iOS and Android. Please open Campus Companion on your mobile device.'
              : 'This app build could not load the native map module. Please reinstall the latest mobile build.'}
          </Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            initialRegion={mapRegion}
            showsUserLocation={hasLocationPermission}
            showsMyLocationButton={hasLocationPermission}
            showsPointsOfInterest={true}
            showsBuildings={true}
            mapType={mapType}
            userInterfaceStyle={isDarkTheme ? "dark" : "light"}
            onLongPress={handleMapLongPress}
            onPress={(e) => {
              // Imperenetrable Temporal Shield: Absolutely block ALL phantom taps bleeding through unmounting DOM nodes!
              if (Date.now() - lastSearchSelectionRef.current < 1500) return;
              
              // Ensure we only dismiss if the user actually clicked the map deliberately
              if(e.nativeEvent.coordinate && e.nativeEvent.action !== 'marker-press') {
                setSelectedPoi(null);
                setCurrentRoute(null);
                setRouteInfo(null);
              }
            }}
          >
            
            {currentRoute && (
              <Polyline
                coordinates={currentRoute}
                strokeColor="#66FCF1"
                strokeWidth={5}
                zIndex={200}
              />
            )}
            
            {draftPin && (
              <Marker
                coordinate={draftPin}
                pinColor="yellow"
                title="New Location"
                description="Drafting contribution..."
                zIndex={300}
              />
            )}
            
            {/* Draw permanently visible dynamic pins natively exclusively if they are not selected */}
            {filteredPois.filter(p => !selectedPoi || p.id !== selectedPoi.id).map(poi => {
              let parsedPolygon = null;
              if (poi.polygonCoordinates && poi.polygonCoordinates.startsWith('[')) {
                try {
                  const arr = JSON.parse(poi.polygonCoordinates);
                  if (arr && arr.length > 2) {
                    parsedPolygon = arr.map(coord => ({ latitude: parseFloat(coord[0]), longitude: parseFloat(coord[1]) }));
                  }
                } catch(e) {}
              }

              const onMarkerPress = () => {
                setCurrentRoute(null);
                setRouteInfo(null);
                setSelectedPoi(poi);
              };

              return (
                <React.Fragment key={poi.id}>
                  {parsedPolygon && (
                    <Polygon
                      coordinates={parsedPolygon}
                      strokeColor="#4A90E2"
                      strokeWidth={3}
                      fillColor="rgba(138, 43, 226, 0.2)"
                      zIndex={50}
                      tappable={true}
                      onPress={onMarkerPress}
                    />
                  )}
                  <Marker
                    coordinate={getCoordinates(poi.coordinateX, poi.coordinateY)}
                    title={poi.name}
                    description={poi.description}
                    onPress={onMarkerPress}
                  />
                </React.Fragment>
              );
            })}
            {/* Decoupled Selected Pin rendered distinctly to brutally override Map engine dropping rules */}
            {selectedPoi && (() => {
              let parsedSelectedPolygon = null;
              if (selectedPoi.polygonCoordinates && selectedPoi.polygonCoordinates.startsWith('[')) {
                try {
                  const arr = JSON.parse(selectedPoi.polygonCoordinates);
                  if (arr && arr.length > 2) {
                    parsedSelectedPolygon = arr.map(coord => ({ latitude: parseFloat(coord[0]), longitude: parseFloat(coord[1]) }));
                  }
                } catch(e) {}
              }

              return (
                <React.Fragment key={`selected-fragment-${selectedPoi.id}`}>
                  {parsedSelectedPolygon && (
                    <Polygon
                      key={`selected-polygon-${selectedPoi.id}`}
                      coordinates={parsedSelectedPolygon}
                      strokeColor="#66FCF1"
                      strokeWidth={4}
                      fillColor="rgba(102, 252, 241, 0.4)"
                      zIndex={100}
                      tappable={true}
                      onPress={() => {}}
                    />
                  )}
                  <Marker
                    ref={selectedMarkerRef}
                    key={`selected-${selectedPoi.id}`}
                    coordinate={getCoordinates(selectedPoi.coordinateX, selectedPoi.coordinateY)}
                    title={selectedPoi.name}
                    description={selectedPoi.description}
                    pinColor="blue"
                    zIndex={100}
                    tracksViewChanges={false}
                    onPress={() => {}}
                  />
                </React.Fragment>
              );
            })()}
          </MapView>
          
          {selectedPoi && (
            <TouchableOpacity activeOpacity={1} style={[styles.poiCardFloating, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>

              {/* Dynamic Image Loader explicitly checking for Absolute vs Relative paths */}
              {selectedPoi.imageUrl && (
                <Image
                  source={{ uri: selectedPoi.imageUrl.startsWith('http') ? selectedPoi.imageUrl : `${API_BASE_URL}${selectedPoi.imageUrl}` }}
                  style={{ width: '100%', height: 140, borderRadius: radii.sm, marginBottom: 12, backgroundColor: colors.surfaceAlt }}
                  resizeMode="cover"
                />
              )}

              <View style={styles.poiHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons
                    name={getCategoryIcon(selectedPoi.category)}
                    size={22}
                    color={colors.secondary}
                  />
                  <Text style={[styles.poiName, { color: colors.text }]} numberOfLines={1}>{selectedPoi.name}</Text>
                </View>

                {/* Dynamically Render Community/Moderation Badges */}
                {selectedPoi.type === 'Community' && (
                  <Badge label={selectedPoi.approvalStatus === 'Pending' ? 'PENDING' : 'COMMUNITY'} tone={selectedPoi.approvalStatus === 'Pending' ? 'warning' : 'neutral'} />
                )}
                {selectedPoi.type === 'Official' && (
                  <Badge label="OFFICIAL" tone="accent" />
                )}
              </View>

              {selectedPoi.description && <Text style={[styles.poiDesc, { color: colors.textSecondary }]}>{selectedPoi.description}</Text>}

              {routeInfo ? (
                <View style={{ marginTop: 12, backgroundColor: colors.infoTint, padding: 12, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.info, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ color: colors.info, fontFamily: fonts.bold, marginBottom: 4 }}><Ionicons name={routeInfo.icon || "walk"} size={14} /> {routeInfo.label || 'Walking Route Active'}</Text>
                     <Text style={{ color: colors.text, fontSize: 13, fontFamily: fonts.regular }}>Distance: {routeInfo.distance} • Est: {routeInfo.duration}</Text>
                     {routeInfo.note && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, fontFamily: fonts.regular }}>{routeInfo.note}</Text>}
                   </View>
                   <TouchableOpacity
                     style={{ padding: 6, backgroundColor: colors.cardBackground, borderRadius: 20, marginLeft: 10 }}
                     onPress={() => {
                       setCurrentRoute(null);
                       setRouteInfo(null);
                       if (mapRef.current) {
                          mapRef.current.animateToRegion(getCoordinates(selectedPoi.coordinateX, selectedPoi.coordinateY), 500);
                       }
                     }}
                   >
                     <Ionicons name="close" size={22} color={colors.info} />
                   </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                   style={[styles.directionsButton, { backgroundColor: colors.primary }, calculatingRoute && { opacity: 0.7 }]}
                   onPress={handleGetDirections}
                   disabled={calculatingRoute}
                >
                  {calculatingRoute ? (
                    <ActivityIndicator size="small" color={isDarkTheme ? '#1A1400' : '#FFFFFF'} />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={17} color={isDarkTheme ? '#1A1400' : '#FFFFFF'} />
                      <Text style={[styles.directionsButtonText, { color: isDarkTheme ? '#1A1400' : '#FFFFFF' }]}>Get Directions</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}

          {searchQuery.length > 0 && (
            <View style={[styles.searchDropdown, { top: 0, zIndex: 900, backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <FlatList
                data={filteredPois}
                keyExtractor={item => item.id.toString()}
                keyboardShouldPersistTaps="always"
                style={{ maxHeight: 250 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.searchResultItem, { borderBottomColor: colors.border }]} onPress={() => handleSelectSearchResult(item)}>
                    <Ionicons name={getCategoryIcon(item.category)} size={17} color={colors.secondary} />
                    <View style={styles.searchResultTextContainer}>
                      <Text style={[styles.searchResultName, { color: colors.text }]}>{item.name}</Text>
                      {item.associatedRooms && safeSearch.length > 0 && isMatch(item.associatedRooms) ? (() => {
                        const matchedRooms = item.associatedRooms
                          .split(',')
                          .map(r => r.trim())
                          .filter(r => r.toLowerCase().replace(/[\s-]/g, '').includes(safeSearch))
                          .join(', ');
                        return (
                          <Text numberOfLines={1} style={[styles.searchResultDesc, { color: colors.success, fontFamily: fonts.semiBold }]}>
                            Contains Room: {matchedRooms || searchQuery.toUpperCase()}
                          </Text>
                        );
                      })() : (
                        item.description && <Text numberOfLines={1} style={[styles.searchResultDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>No locations found matching "{searchQuery}"</Text>
                }
              />
            </View>
          )}

        </View>
      )}

      {/* Crowdsourcing Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Contribute Location</Text>

            <ScrollView style={{ width: '100%', maxHeight: '80%' }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name / Title</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Science Lab 3"
                placeholderTextColor={colors.textSecondary}
                value={pinName}
                onChangeText={setPinName}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 60 }]}
                placeholder="Details about this place..."
                placeholderTextColor={colors.textSecondary}
                multiline
                value={pinDesc}
                onChangeText={setPinDesc}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
              <View style={styles.categoryContainer}>
                {['Building', 'Restroom', 'FoodZone', 'StudyZone', 'Parking', 'Recreation', 'Vendor', 'Landmark', 'Office', 'Clinic', 'Security'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      { borderColor: colors.border },
                      pinCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setPinCategory(cat)}
                  >
                    <Text style={{ color: pinCategory === cat ? (isDarkTheme ? '#1A1400' : '#FFFFFF') : colors.text, fontFamily: fonts.semiBold, fontSize: 12.5 }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Photo (Optional)</Text>
              <TouchableOpacity style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={pickImage}>
                {pinImage ? (
                  <Image source={{ uri: pinImage.uri }} style={{ width: '100%', height: 150, borderRadius: radii.sm }} />
                ) : (
                   <View style={styles.imagePlaceholder}>
                     <Ionicons name="camera-outline" size={30} color={colors.textSecondary} />
                     <Text style={{ color: colors.textSecondary, marginTop: 8, fontFamily: fonts.regular }}>Tap to add photo</Text>
                   </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setDraftPin(null);
              }}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }, (!pinName.trim() || submittingPin) && { opacity: 0.5 }]}
                onPress={submitDraftPin}
                disabled={!pinName.trim() || submittingPin}
              >
                {submittingPin ? <ActivityIndicator size="small" color={isDarkTheme ? '#1A1400' : '#FFFFFF'} /> : <Text style={[styles.submitBtnText, { color: isDarkTheme ? '#1A1400' : '#FFFFFF' }]}>Submit Pin</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.3,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    height: '100%',
  },
  searchDropdown: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#0E004E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  searchResultTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  searchResultDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 15,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
  },
  mapPlaceholder: {
    flex: 1,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  mapTitle: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    marginTop: 20,
    marginBottom: 10,
  },
  mapSubtitle: {
    fontSize: 13.5,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 30,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  poiCardFloating: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#0E004E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  poiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  poiName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginLeft: 10,
    flexShrink: 1
  },
  poiDesc: {
    fontSize: 13.5,
    fontFamily: fonts.regular,
    lineHeight: 20,
    paddingLeft: 32,
    marginBottom: 4
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 10
  },
  calloutContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 8,
    padding: 8,
    width: 180,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 12,
    color: '#444',
  },
  directionsButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14,0,78,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#0E004E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    marginBottom: 18,
    alignSelf: 'flex-start'
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    marginBottom: 6,
    marginTop: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  modalInput: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: radii.sm,
    padding: 13,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%'
  },
  catChip: {
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  imagePickerBtn: {
    width: '100%',
    minHeight: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 22,
    gap: 12
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radii.sm,
  },
  submitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
  }
});
