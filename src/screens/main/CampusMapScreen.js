import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, FlatList, TouchableOpacity, Dimensions, Platform, Linking, Alert, Modal, ScrollView, Image } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import API_BASE_URL from '../../config/api';

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

export default function CampusMapScreen({ navigation }) {
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
  const speechAvailable = !!ExpoSpeechRecognitionModule;
  const googleMapsApiKey =
    Constants.expoConfig?.extra?.googleMapsApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

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

  const handleGetDirections = async () => {
    if (!selectedPoi) return;
    setCalculatingRoute(true);
    
    try {
      let location;
      if (hasLocationPermission) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } else {
        Alert.alert("Permission Required", "Please enable location services to get walking directions.");
        setCalculatingRoute(false);
        return;
      }
      
      const originLat = location.coords.latitude;
      const originLng = location.coords.longitude;
      const destLat = parseFloat(selectedPoi.coordinateY);
      const destLng = parseFloat(selectedPoi.coordinateX);
      
      const distanceToCampus = calculateDistance(originLat, originLng, mapRegion.latitude, mapRegion.longitude);
      if (distanceToCampus > 5) { // Strict 5km Walking limit to prevent giant Map fetches
        Alert.alert("Too Far", "Walking directions are only available when you are near the UTech Campus. Use a vehicle or arrive on campus first.");
        setCalculatingRoute(false);
        return;
      }
      
      if (!googleMapsApiKey) {
        Alert.alert("Map Key Missing", "Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY before testing directions in this environment.");
        setCalculatingRoute(false);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&key=${googleMapsApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text
        });
        
        const decodedPoints = decodePolyline(route.overview_polyline.points);
        setCurrentRoute(decodedPoints);
        
        if (mapRef.current) {
           mapRef.current.fitToCoordinates(decodedPoints, {
             edgePadding: { top: 70, right: 70, bottom: 200, left: 70 },
             animated: true
           });
        }
      } else {
        Alert.alert("Route Error", "Could not calculate walking directions to this location.");
      }
    } catch (err) {
      console.warn("Direction fetch error:", err);
      Alert.alert("Network Error", "Failed to contact routing servers.");
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
    latitude: 18.0180,
    longitude: -76.7440,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const getCoordinates = (x, y) => {
    if (y > 10 && y < 30) {
      return { latitude: y, longitude: x };
    }
    return {
      latitude: 18.0167736 + (y - 50) * 0.00015,
      longitude: -76.7464894 + (x - 50) * 0.00015,
    };
  };

  // Explicit Geometric GPS mapping representing the exact parameter walls framing the University Campus.
  const UTECH_BOUNDARY_COORDS = [
    { latitude: 18.0210, longitude: -76.7475 }, // North-West (Papine Road edge)
    { latitude: 18.0210, longitude: -76.7380 }, // North-East (Hope River edge)
    { latitude: 18.0140, longitude: -76.7380 }, // South-East (Eastern flank)
    { latitude: 18.0125, longitude: -76.7440 }, // South (Old Hope Road bend)
    { latitude: 18.0125, longitude: -76.7485 }, // South-West (Hospital flank)
  ];

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
        <Ionicons name="map-outline" size={28} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text, flex: 1, marginLeft: 10 }]}>Campus Map</Text>
        
        <View style={styles.topRightActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginRight: 8 }]} 
            onPress={() => setMapType(prev => prev === 'standard' ? 'hybrid' : 'standard')}
          >
            <Ionicons name={mapType === 'standard' ? "earth" : "map-outline"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {user ? (
             <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
               <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
             </TouchableOpacity>
          ) : (
             <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={() => navigation.navigate('Login')}>
               <Ionicons name="log-in-outline" size={18} color={colors.textSecondary} />
             </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={{ zIndex: 100, position: 'relative' }}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder={isListening ? "Listening natively..." : "Search locations, buildings, rooms..."}
            placeholderTextColor={isListening ? "#66FCF1" : "#888"}
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
              size={22}
              color={isListening ? "#66FCF1" : speechAvailable ? "#888" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.mapTitle}>Loading Map Data...</Text>
        </View>
      ) : Platform.OS === 'web' || !MapView ? (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color="#4A90E2" />
          <Text style={styles.mapTitle}>{Platform.OS === 'web' ? 'Map Optimization' : 'Map Unavailable'}</Text>
          <Text style={styles.mapSubtitle}>
            {Platform.OS === 'web'
              ? 'The interactive campus map leverages native hardware rendering and is only available on iOS and Android. Please open the Olmies app on your mobile device.'
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
            <TouchableOpacity activeOpacity={1} style={styles.poiCardFloating}>
              
              {/* Dynamic Image Loader explicitly checking for Absolute vs Relative paths */}
              {selectedPoi.imageUrl && (
                <Image 
                  source={{ uri: selectedPoi.imageUrl.startsWith('http') ? selectedPoi.imageUrl : `${API_BASE_URL}${selectedPoi.imageUrl}` }} 
                  style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' }} 
                  resizeMode="cover" 
                />
              )}

              <View style={styles.poiHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons 
                    name={getCategoryIcon(selectedPoi.category)} 
                    size={24} 
                    color={getCategoryColor(selectedPoi.category)} 
                  />
                  <Text style={styles.poiName} numberOfLines={1}>{selectedPoi.name}</Text>
                </View>
                
                {/* Dynamically Render Community/Moderation Badges */}
                {selectedPoi.type === 'Community' && (
                  <View style={[styles.badge, { backgroundColor: selectedPoi.approvalStatus === 'Pending' ? 'rgba(255,165,0,0.2)' : 'rgba(138,43,226,0.2)', borderColor: selectedPoi.approvalStatus === 'Pending' ? 'orange' : 'violet' }]}>
                     <Text style={{ color: selectedPoi.approvalStatus === 'Pending' ? 'orange' : 'violet', fontSize: 10, fontWeight: 'bold' }}>
                       {selectedPoi.approvalStatus === 'Pending' ? 'PENDING' : 'COMMUNITY'}
                     </Text>
                  </View>
                )}
                {selectedPoi.type === 'Official' && (
                   <View style={[styles.badge, { backgroundColor: 'rgba(74,144,226,0.2)', borderColor: '#4A90E2' }]}>
                     <Text style={{ color: '#4A90E2', fontSize: 10, fontWeight: 'bold' }}>OFFICIAL</Text>
                  </View>
                )}
              </View>

              {selectedPoi.description && <Text style={styles.poiDesc}>{selectedPoi.description}</Text>}
              
              {routeInfo ? (
                <View style={{ marginTop: 12, backgroundColor: 'rgba(102, 252, 241, 0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(102, 252, 241, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ color: '#66FCF1', fontWeight: 'bold', marginBottom: 4 }}><Ionicons name="walk" size={14} /> Walking Route Active</Text>
                     <Text style={{ color: '#ddd', fontSize: 13 }}>Distance: {routeInfo.distance} • Est: {routeInfo.duration}</Text>
                   </View>
                   <TouchableOpacity 
                     style={{ padding: 6, backgroundColor: 'rgba(102, 252, 241, 0.2)', borderRadius: 20, marginLeft: 10 }}
                     onPress={() => {
                       setCurrentRoute(null);
                       setRouteInfo(null);
                       if (mapRef.current) {
                          mapRef.current.animateToRegion(getCoordinates(selectedPoi.coordinateX, selectedPoi.coordinateY), 500);
                       }
                     }}
                   >
                     <Ionicons name="close" size={22} color="#66FCF1" />
                   </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                   style={[styles.directionsButton, calculatingRoute && { opacity: 0.7 }]} 
                   onPress={handleGetDirections}
                   disabled={calculatingRoute}
                >
                  {calculatingRoute ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={styles.directionsButtonText}>Get Directions</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}

          {searchQuery.length > 0 && (
            <View style={[styles.searchDropdown, { top: 0, zIndex: 900 }]}>
              <FlatList
                data={filteredPois}
                keyExtractor={item => item.id.toString()}
                keyboardShouldPersistTaps="always"
                style={{ maxHeight: 250 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectSearchResult(item)}>
                    <Ionicons name={getCategoryIcon(item.category)} size={18} color={getCategoryColor(item.category)} />
                    <View style={styles.searchResultTextContainer}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      {item.associatedRooms && safeSearch.length > 0 && isMatch(item.associatedRooms) ? (() => {
                        const matchedRooms = item.associatedRooms
                          .split(',')
                          .map(r => r.trim())
                          .filter(r => r.toLowerCase().replace(/[\s-]/g, '').includes(safeSearch))
                          .join(', ');
                        return (
                          <Text numberOfLines={1} style={[styles.searchResultDesc, { color: '#4CAF50', fontWeight: '500' }]}>
                            Contains Room: {matchedRooms || searchQuery.toUpperCase()}
                          </Text>
                        );
                      })() : (
                        item.description && <Text numberOfLines={1} style={styles.searchResultDesc}>{item.description}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResultsText}>No locations found matching "{searchQuery}"</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Contribute Location</Text>
            
            <ScrollView style={{ width: '100%', maxHeight: '80%' }}>
              <Text style={styles.inputLabel}>Name / Title</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Science Lab 3"
                placeholderTextColor={colors.textSecondary}
                value={pinName}
                onChangeText={setPinName}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, height: 60 }]}
                placeholder="Details about this place..."
                placeholderTextColor={colors.textSecondary}
                multiline
                value={pinDesc}
                onChangeText={setPinDesc}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryContainer}>
                {['Building', 'Restroom', 'FoodZone', 'StudyZone', 'Parking', 'Recreation', 'Vendor', 'Landmark', 'Office', 'Clinic', 'Security'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip, 
                      pinCategory === cat && { backgroundColor: getCategoryColor(cat), borderColor: getCategoryColor(cat) }
                    ]}
                    onPress={() => setPinCategory(cat)}
                  >
                    <Text style={{ color: pinCategory === cat ? '#fff' : colors.text }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Photo (Optional)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                {pinImage ? (
                  <Image source={{ uri: pinImage.uri }} style={{ width: '100%', height: 150, borderRadius: 8 }} />
                ) : (
                   <View style={styles.imagePlaceholder}>
                     <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                     <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tap to add photo</Text>
                   </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setDraftPin(null);
              }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, (!pinName.trim() || submittingPin) && { opacity: 0.5 }]} 
                onPress={submitDraftPin}
                disabled={!pinName.trim() || submittingPin}
              >
                {submittingPin ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit Pin</Text>}
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
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 46,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  searchDropdown: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  searchResultTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  searchResultDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  noResultsText: {
    color: '#888',
    textAlign: 'center',
    padding: 15,
    fontStyle: 'italic',
  },
  mapPlaceholder: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  poiCardFloating: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  poiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  poiName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    flexShrink: 1
  },
  poiDesc: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 34,
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
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start'
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 15,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'transparent'
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%'
  },
  catChip: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent'
  },
  imagePickerBtn: {
    width: '100%',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#444',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
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
    marginTop: 25,
    gap: 15
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitBtn: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120
  },
  cancelBtnText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold'
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
