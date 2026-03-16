import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function CampusMapScreen() {
  const { fetchWithAuth } = useAuth();
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState(null);

  // UTech Jamaica Center Coordinates
  const mapRegion = {
    latitude: 18.0059,
    longitude: -76.7468,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // The backend was seeded with CoordinateX/Y percentages (40-60). We map them to real GPS coords around UTech.
  const getCoordinates = (x, y) => ({
    latitude: 18.0059 + (y - 50) * 0.00015,
    longitude: -76.7468 + (x - 50) * 0.00015,
  });

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Map</Text>
      </View>
      
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

      {loading ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.mapTitle}>Loading Map Data...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            initialRegion={mapRegion}
            showsUserLocation={true}
          >
            {filteredPois.map(poi => (
              <Marker
                key={poi.id}
                coordinate={getCoordinates(poi.coordinateX, poi.coordinateY)}
                title={poi.name}
                description={poi.description}
                pinColor={poi.category === 'Building' ? '#8A2BE2' : '#f06292'}
                onPress={() => setSelectedPoi(poi)}
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
                  name={selectedPoi.category === 'Building' ? 'business' : 'restaurant'} 
                  size={24} 
                  color="#8A2BE2" 
                />
                <Text style={styles.poiName}>{selectedPoi.name}</Text>
              </View>
              <Text style={styles.poiDesc}>{selectedPoi.description}</Text>
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: 200,
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
  }
});
