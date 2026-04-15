import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { computeDestinationPoint } from 'geolib';

export default function App() {
  const [location, setLocation] = useState(null);
  const [targetDistance, setTargetDistance] = useState('4'); // In Km
  const [loading, setLoading] = useState(false);
  
  const [routeCoords, setRouteCoords] = useState([]);
  const [actualDistance, setActualDistance] = useState(null); // In meters

  // Get User's Current Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to generate a route.');
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(currentLocation.coords);
      } catch (e) {
        Alert.alert('Location Error', 'Unable to fetch location.');
      }
    })();
  }, []);

  const generateRoute = async () => {
    if (!location) {
      Alert.alert('Tunggu', 'Lokasi Anda belum ditemukan.');
      return;
    }
    
    let distKm = parseFloat(targetDistance);
    if (isNaN(distKm) || distKm <= 0) {
      Alert.alert('Error', 'Masukkan jarak valid dalam Km (misal 4)');
      return;
    }

    setLoading(true);
    
    const targetMeters = distKm * 1000;
    const startPoint = { latitude: location.latitude, longitude: location.longitude };
    
    // We try to find a route up to 5 times to match the user's distance using linear adjustment
    // Initial radius assumption for an equilateral triangle loop
    let currentR = targetMeters / 3.9; 
    let bestRoute = null;
    let minDiff = Infinity;
    let angleBase = Math.random() * 360;

    for (let attempts = 0; attempts < 5; attempts++) {
      try {
        // Calculate the two other points for the triangular loop
        const p1 = computeDestinationPoint(startPoint, currentR, angleBase);
        const p2 = computeDestinationPoint(startPoint, currentR, (angleBase + 60) % 360);

        // OSRM coordinates format: lon,lat
        const pStr = (pt) => `${pt.longitude},${pt.latitude}`;
        const coordString = `${pStr(startPoint)};${pStr(p1)};${pStr(p2)};${pStr(startPoint)}`;
        
        const url = `http://router.project-osrm.org/route/v1/foot/${coordString}?geometries=geojson&overview=full`;
        
        const res = await axios.get(url);
        
        if (res.data.routes && res.data.routes.length > 0) {
          const route = res.data.routes[0];
          const distFromApi = route.distance; // in meters
          const diff = Math.abs(distFromApi - targetMeters);

          // Track the best route found
          if (diff < minDiff) {
            minDiff = diff;
            bestRoute = {
              distance: distFromApi,
              coords: route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }))
            };
          }

          // If within tolerance 1-200 meters, we break early and accept it
          if (diff <= 200) {
            break;
          }

          // Otherwise adjust the radius using linear ratio
          // e.g. if we got 3000m and wanted 4000m, increase R
          currentR = currentR * (targetMeters / (distFromApi || 1));
        }
      } catch (err) {
        console.warn('OSRM error', err);
      }
    }

    if (bestRoute) {
      setRouteCoords(bestRoute.coords);
      setActualDistance(bestRoute.distance);
    } else {
      Alert.alert('Gagal', 'Tidak berhasil membuat rute. Silakan coba lagi.');
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Controls */}
      <View style={styles.header}>
        <Text style={styles.title}>Route for Run 🏃‍♂️</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Target Jarak (Km): </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={targetDistance}
            onChangeText={setTargetDistance}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={generateRoute}
          disabled={loading}>
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Buat Rute Lari</Text>
          )}
        </TouchableOpacity>
        
        {actualDistance !== null && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ✓ Rute Ditemukan! Jarak Aktual: <Text style={styles.boldText}>{(actualDistance / 1000).toFixed(2)} Km</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
          >
            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="Start / Finish" />
            
            {routeCoords.length > 0 && (
              <Polyline 
                coordinates={routeCoords} 
                strokeColor="#007AFF" 
                strokeWidth={5} 
                lineDashPattern={[1]}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingMap}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{marginTop: 10, color: '#666'}}>Mencari lokasi Anda...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: Platform.OS === 'android' ? 40 : 0
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#007AFF',
    marginLeft: 10,
    backgroundColor: '#F2F2F7'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#99C6F9'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#E4F4D6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A8D68B',
  },
  infoText: {
    color: '#2B571A',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E5E5EA'
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
