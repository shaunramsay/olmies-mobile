import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, FlatList, TouchableOpacity, Dimensions, Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';

// Dynamically import MapView to prevent web bundler from crashing
let MapView, Marker, Callout, UrlTile;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
  UrlTile = Maps.UrlTile;
}
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function CampusMapScreen() {
  const { fetchWithAuth } = useAuth();
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState(null);
  const mapRef = useRef(null);

  const handleSelectSearchResult = (poi) => {
    setSearchQuery(''); // Hide dropdown
    setSelectedPoi(poi); // Open popup
    
    // Animate map to point
    if (mapRef.current) {
      const coords = getCoordinates(poi.coordinateX, poi.coordinateY);
      mapRef.current.animateToRegion({
        ...coords,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 1000);
    }
  };

  // UTech Jamaica Center Coordinates
  const mapRegion = {
    latitude: 18.0167736,
    longitude: -76.7464894,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // The backend was originally seeded with CoordinateX/Y percentages (40-60). 
  // However, the new Web Admin Map drops real Lat/Lng GPS coordinates (e.g. Lat: 18.01..., Lng: -76.74...).
  // This logic dynamically detects real GPS vs legacy percentages.
  const getCoordinates = (x, y) => {
    // If y looks like a raw Jamaica Latitude (around 18), use it directly.
    if (y > 10 && y < 30) {
      return { latitude: y, longitude: x };
    }
    // Otherwise fallback to legacy percentage math
    return {
      latitude: 18.0167736 + (y - 50) * 0.00015,
      longitude: -76.7464894 + (x - 50) * 0.00015,
    };
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Building': return '#8A2BE2';
      case 'Vendor': return '#f06292';
      case 'Office': return '#4CAF50';
      case 'Restroom': return '#03A9F4';
      case 'LectureTheatre': return '#FF9800';
      case 'Lab': return '#00BCD4';
      case 'FoodZone': return '#E91E63';
      default: return '#9E9E9E';
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
    fetchPois();
  }, []);

  const filteredPois = pois.filter(poi => 
    poi.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (poi.description && poi.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGetDirections = async () => {
    if (!selectedPoi) return;
    try {
      // Universal Intent URL - Intelligently fires Google Maps on Android, and Apple Maps natively on iOS
      const url = `https://maps.google.com/?daddr=${selectedPoi.coordinateY},${selectedPoi.coordinateX}`;
      
      // Strict Mitigation: Ask the OS if ANY app is capable of handling this link before violently opening it
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Navigation Error", "We could not find a Maps application (like Google Maps) on your device.");
      }
    } catch (error) {
      Alert.alert("Navigation Error", "An unexpected error occurred while attempting to map your route.");
      console.error("Routing error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Map</Text>
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
          />
        </View>

        {searchQuery.length > 0 && (
          <View style={styles.searchDropdown}>
            <FlatList
              data={filteredPois}
              keyExtractor={item => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 250 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectSearchResult(item)}>
                  <Ionicons name={getCategoryIcon(item.category)} size={18} color={getCategoryColor(item.category)} />
                  <View style={styles.searchResultTextContainer}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    {item.description && <Text numberOfLines={1} style={styles.searchResultDesc}>{item.description}</Text>}
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

      {loading ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.mapTitle}>Loading Map Data...</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color="#8A2BE2" />
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
            initialRegion={mapRegion}
            showsUserLocation={true}
            userInterfaceStyle="light"
            mapType="standard"
            onPress={(e) => {
              // Mitigation: Deselect the highlighted pin if the user legitimately taps the empty grass on the map
              if(e.nativeEvent.action !== 'marker-press') setSelectedPoi(null);
            }}
          >
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              zIndex={-1}
            />
            {filteredPois.map(poi => (
              <Marker
                key={poi.id}
                coordinate={getCoordinates(poi.coordinateX, poi.coordinateY)}
                title={poi.name}
                description={poi.description}
                pinColor={selectedPoi && selectedPoi.id === poi.id ? '#FFEA00' : getCategoryColor(poi.category)}
                onPress={() => setSelectedPoi(poi)}
                zIndex={selectedPoi && selectedPoi.id === poi.id ? 100 : 1}
              >
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{poi.name}</Text>
                    <Text style={styles.calloutDesc}>{poi.description}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
          
          {selectedPoi && (
            <View style={styles.poiCardFloating}>
              <View style={styles.poiHeader}>
                <Ionicons 
                  name={getCategoryIcon(selectedPoi.category)} 
                  size={24} 
                  color={getCategoryColor(selectedPoi.category)} 
                />
                <Text style={styles.poiName}>{selectedPoi.name}</Text>
              </View>
              <Text style={styles.poiDesc}>{selectedPoi.description}</Text>
              
              <TouchableOpacity 
                style={styles.directionsButton}
                onPress={handleGetDirections}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-circle" size={20} color="#fff" />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  map: {
    width: '100%',
    height: '100%',
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
    backgroundColor: '#8A2BE2',
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
