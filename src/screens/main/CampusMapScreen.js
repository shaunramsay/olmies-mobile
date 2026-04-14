import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, FlatList, TouchableOpacity, Dimensions, Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';

// Dynamically import MapView to prevent web bundler from crashing
let MapView, Marker, Callout, UrlTile, Polygon, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
  UrlTile = Maps.UrlTile;
  Polygon = Maps.Polygon;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import * as Location from 'expo-location';

export default function CampusMapScreen() {
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const lastSearchSelectionRef = useRef(0);

  const handleSelectSearchResult = (poi) => {
    lastSearchSelectionRef.current = Date.now(); // Absolute Global Temporal Map Shield! 

    // Delay the unmounting of the search dropdown to absorb the raw physical TouchEnd event
    setTimeout(() => {
      setSearchQuery(''); 
      import('react-native').then(rn => rn.Keyboard.dismiss());
    }, 250);
    
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
      default: return 'location';
    }
  };

  useEffect(() => {
    const fetchPois = async () => {
      try {
        const res = await fetchWithAuth('/api/v1/mobile/pois');
        if (res.ok) {
          const data = await res.json();
          setPois(data);
        }
      } catch (err) {
        console.error('Failed to fetch POIs:', err);
      } finally {
        setLoading(false);
      }
    };
    
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
    
    fetchPois();
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
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {user && (
             <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
               <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
             </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={{ zIndex: 100, position: 'relative' }}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search locations, buildings, rooms..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
               if (filteredPois.length > 0) {
                  handleSelectSearchResult(filteredPois[0]);
               }
            }}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.mapTitle}>Loading Map Data...</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color="#4A90E2" />
          <Text style={styles.mapTitle}>Map Optimization</Text>
          <Text style={styles.mapSubtitle}>
            The interactive campus map leverages native hardware rendering and is only available on iOS and Android. Please open the Olmies app on your mobile device.
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
            showsPointsOfInterest={false}
            showsBuildings={false}
            userInterfaceStyle="dark"
            onPress={(e) => {
              // Imperenetrable Temporal Shield: Absolutely block ALL phantom taps bleeding through unmounting DOM nodes!
              if (Date.now() - lastSearchSelectionRef.current < 1500) return;
              
              // Ensure we only dismiss if the user actually clicked the map deliberately
              if(e.nativeEvent.coordinate && e.nativeEvent.action !== 'marker-press') {
                setSelectedPoi(null);
              }
            }}
          >
            
            {/* Draw permanently visible dynamic pins natively exclusively if they are not selected */}
            {filteredPois.filter(p => !selectedPoi || p.id !== selectedPoi.id).map(poi => {
              let parsedPolygon = null;
              if (poi.polygonCoordinates && poi.polygonCoordinates.startsWith('[')) {
                try {
                  const arr = JSON.parse(poi.polygonCoordinates);
                  if (arr && arr.length > 2) {
                    parsedPolygon = arr.map(coord => ({ latitude: coord[0], longitude: coord[1] }));
                  }
                } catch(e) {}
              }

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
                      onPress={() => setSelectedPoi(poi)}
                    />
                  )}
                  <Marker
                    coordinate={getCoordinates(poi.coordinateX, poi.coordinateY)}
                    title={poi.name}
                    description={poi.description}
                    onPress={() => setSelectedPoi(poi)}
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
                    parsedSelectedPolygon = arr.map(coord => ({ latitude: coord[0], longitude: coord[1] }));
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
                      onPress={() => setSelectedPoi(selectedPoi)}
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
                    onPress={() => setSelectedPoi(selectedPoi)}
                  />
                </React.Fragment>
              );
            })()}
          </MapView>
          
          {selectedPoi && (
            <TouchableOpacity activeOpacity={1} style={styles.poiCardFloating}>
              <View style={styles.poiHeader}>
                <Ionicons 
                  name={getCategoryIcon(selectedPoi.category)} 
                  size={24} 
                  color={getCategoryColor(selectedPoi.category)} 
                />
                <Text style={styles.poiName}>{selectedPoi.name}</Text>
              </View>
              <Text style={styles.poiDesc}>{selectedPoi.description}</Text>
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
    marginLeft: 10
  },
  poiDesc: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 34
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
  }
});
