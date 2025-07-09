import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Footer from "../../../components/footer";

// SVG Icon Components
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RouteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ElevationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const HikingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MapStyleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const Toggle3DIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const WeatherIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

export default function Mountain({ mountain, directusPoints, directusLines, centerCoordinates }) {
  const mapContainerRef = useRef(null);
  const [is3D, setIs3D] = useState(false);
  const [map, setMap] = useState(null);
  const [mapStyle, setMapStyle] = useState('outdoor');
  const [showStyleBox, setShowStyleBox] = useState(false);
  const [showWeatherBox, setShowWeatherBox] = useState(false);
  const key = 'Bt7BC1waN22lhYojEJO1'; // MapTiler Key

  // Trail distance calculation
  const [trailDistance, setTrailDistance] = useState(null);
  const [trailSegments, setTrailSegments] = useState([]);
  const [pointsWithElevation, setPointsWithElevation] = useState([]);
  const [elevationLoading, setElevationLoading] = useState(false);

  // Weather configuration - Updated to use One Call API 3.0 with coordinates
  const [weatherData, setWeatherData] = useState(null);
  const [showWeatherInfo, setShowWeatherInfo] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [peakCoordinates, setPeakCoordinates] = useState(null); // To store coordinates of the highest point
  const openWeatherKey = '9cfcb16a346057f5282f5058f83f1d73'; // Updated API key

  // Updated fetch weather data function to use the highest point's coordinates
  const fetchWeatherData = useCallback(async () => {
    // Prioritize peak coordinates for weather data, fall back to center coordinates
    const coordinatesToUse = peakCoordinates || centerCoordinates;
    if (!openWeatherKey || !coordinatesToUse) return;

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const [lon, lat] = coordinatesToUse;
      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=hourly,daily&appid=${openWeatherKey}&units=metric&lang=id`
      );
      
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else {
        const errorData = await response.json();
        setWeatherError(`Gagal mengambil data cuaca: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError('Terjadi kesalahan saat mengambil data cuaca');
    } finally {
      setWeatherLoading(false);
    }
  }, [openWeatherKey, centerCoordinates, peakCoordinates]);

  // Calculate trail distance from coordinates
  const calculateTrailDistance = useCallback(() => {
    if (!directusLines || directusLines.length === 0) return null;

    let totalDistance = 0;
    const segments = [];

    directusLines.forEach((line, lineIndex) => {
      if (line.coordinates && line.coordinates.length > 1) {
        let segmentDistance = 0;
        
        for (let i = 0; i < line.coordinates.length - 1; i++) {
          const [lon1, lat1] = line.coordinates[i];
          const [lon2, lat2] = line.coordinates[i + 1];
          
          // Calculate distance using Haversine formula
          const distance = calculateDistance(lat1, lon1, lat2, lon2);
          segmentDistance += distance;
        }
        
        segments.push({
          id: lineIndex,
          name: line.name || `Jalur ${lineIndex + 1}`,
          description: line.description || 'Tidak ada deskripsi',
          distance: segmentDistance,
          coordinates: line.coordinates
        });
        
        totalDistance += segmentDistance;
      }
    });

    setTrailSegments(segments);
    return totalDistance;
  }, [directusLines]);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Calculate trail distance when component mounts or lines change
  useEffect(() => {
    const distance = calculateTrailDistance();
    setTrailDistance(distance);
  }, [calculateTrailDistance]);

  // Fetch elevation data for points and find the highest point
  const fetchElevationData = useCallback(async () => {
    if (!directusPoints || directusPoints.length === 0) return;

    setElevationLoading(true);
    
    try {
      // Prepare locations array for batch request
      const locations = directusPoints.map(point => ({
        latitude: parseFloat(point.latitude),
        longitude: parseFloat(point.longitude)
      }));

      // Use Open Elevation API (free service)
      const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: locations
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Combine original points with elevation data
        const pointsWithElevationData = directusPoints.map((point, index) => ({
          ...point,
          elevation: data.results[index]?.elevation || null,
          elevationError: !data.results[index]?.elevation
        }));

        // Find the point with the highest elevation from valid results
        const validPoints = pointsWithElevationData.filter(p => p.elevation !== null);
        if (validPoints.length > 0) {
          const highestPoint = validPoints.reduce(
            (max, p) => (p.elevation > max.elevation ? p : max),
            validPoints[0]
          );
          if (highestPoint && highestPoint.longitude && highestPoint.latitude) {
            setPeakCoordinates([parseFloat(highestPoint.longitude), parseFloat(highestPoint.latitude)]);
          }
        }
        
        setPointsWithElevation(pointsWithElevationData);
      } else {
        console.warn('Failed to fetch elevation data');
        // Fallback: use original points without elevation
        setPointsWithElevation(directusPoints.map(point => ({
          ...point,
          elevation: null,
          elevationError: true
        })));
      }
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      // Fallback: use original points without elevation
      setPointsWithElevation(directusPoints.map(point => ({
        ...point,
        elevation: null,
        elevationError: true
      })));
    } finally {
      setElevationLoading(false);
    }
  }, [directusPoints]);

  // Fetch elevation data when points change
  useEffect(() => {
    fetchElevationData();
  }, [fetchElevationData]);

  // Re-fetch weather data once peak coordinates are identified
  useEffect(() => {
    if (peakCoordinates) {
      fetchWeatherData();
    }
  }, [peakCoordinates, fetchWeatherData]);

  const addSourceAndLayers = useCallback((map) => {
    // Use points with elevation data if available, otherwise fall back to original points
    const pointsToUse = pointsWithElevation.length > 0 ? pointsWithElevation : directusPoints;
    
    // Add source for directus points
    if (pointsToUse.length && !map.getSource('directus-points')) {
      map.addSource('directus-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: pointsToUse.map((point) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(point.longitude), parseFloat(point.latitude)]
            },
            properties: {
              name: point.name,
              description: point.description || 'No description available',
              elevation: point.elevation || null,
              elevationError: point.elevationError || false
            }
          }))
        }
      });

      if (!map.getLayer('points-layer')) {
        map.addLayer({
          id: 'points-layer',
          type: 'circle',
          source: 'directus-points',
          paint: {
            'circle-radius': 8,
            'circle-color': '#10b981',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
      }
    }

    // Add source for directus lines with individual trail segments
    if (directusLines.length && !map.getSource('directus-lines')) {
      map.addSource('directus-lines', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: directusLines.map((line, index) => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: line.coordinates
            },
            properties: {
              id: index,
              name: line.name || `Jalur ${index + 1}`,
              description: line.description || 'Tidak ada deskripsi',
              distance: trailSegments.find(seg => seg.id === index)?.distance || 0
            }
          }))
        }
      });

      if (!map.getLayer('lines-layer')) {
        map.addLayer({
          id: 'lines-layer',
          type: 'line',
          source: 'directus-lines',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#10b981',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      }

      // Add hover layer for better visual feedback
      if (!map.getLayer('lines-hover')) {
        map.addLayer({
          id: 'lines-hover',
          type: 'line',
          source: 'directus-lines',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#059669',
            'line-width': 6,
            'line-opacity': 0
          },
          filter: ['==', ['get', 'id'], '']
        });
      }
    }
  }, [directusPoints, directusLines, trailSegments, pointsWithElevation]);

  const toggle3D = () => {
    if (map) {
      if (!is3D) {
        if (!map.getSource('terrain')) {
          map.addSource('terrain', {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`
          });
        }
        map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
        map.setPitch(60);
      } else {
        if (map.getSource('terrain')) {
          map.setTerrain(undefined);
          map.setPitch(0);
        }
      }
      setIs3D(!is3D);
    }
  };

  const changeMapStyle = useCallback((newStyle) => {
    if (map) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const currentPitch = map.getPitch();
      const currentBearing = map.getBearing();

      map.setStyle(`https://api.maptiler.com/maps/${newStyle}/style.json?key=${key}`);
      map.once('styledata', () => {
        map.setCenter(currentCenter);
        map.setZoom(currentZoom);
        map.setPitch(currentPitch);
        map.setBearing(currentBearing);

        if (is3D) {
          if (!map.getSource('terrain')) {
            map.addSource('terrain', {
              type: 'raster-dem',
              url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`
            });
          }
          map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
        }
        
        addSourceAndLayers(map);
        
        // Add weather marker if weather data is available
        if (weatherData) {
          addWeatherMarker();
        }
      });
      setMapStyle(newStyle);
    } else {
      setMapStyle(newStyle);
    }
  }, [map, is3D, addSourceAndLayers, key, weatherData]);

  const addWeatherMarker = useCallback(() => {
    if (!map || !weatherData || !weatherData.current) return;
    const coordinatesToUse = peakCoordinates || centerCoordinates; // Use peak coordinates if available

    try {
      // Remove existing weather marker if it exists
      if (map.getSource && map.getSource('weather-marker')) {
        if (map.getLayer('weather-marker')) {
          map.removeLayer('weather-marker');
        }
        map.removeSource('weather-marker');
      }

      // Add weather marker to the correct coordinates
      map.addSource('weather-marker', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinatesToUse
            },
            properties: {
              weather: weatherData.current.weather[0].main,
              temp: Math.round(weatherData.current.temp),
              description: weatherData.current.weather[0].description
            }
          }]
        }
      });

      // Add weather symbol layer
      map.addLayer({
        id: 'weather-marker',
        type: 'symbol',
        source: 'weather-marker',
        layout: {
          'text-field': getWeatherEmoji(weatherData.current.weather[0].main) + '\n{temp}°C',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 20,
          'text-anchor': 'bottom',
          'text-offset': [0, -1]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        }
      });
    } catch (error) {
      console.error('Error adding weather marker:', error);
    }
  }, [map, weatherData, centerCoordinates, peakCoordinates]);

  // Helper function to get weather emoji
  const getWeatherEmoji = (weather) => {
    const weatherEmojis = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return weatherEmojis[weather] || '🌤️';
  };

  // Helper function to convert Kelvin to Celsius
  const kelvinToCelsius = (kelvin) => {
    return Math.round(kelvin - 273.15);
  };

  // Helper function to format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleWeatherInfo = () => {
    setShowWeatherInfo(!showWeatherInfo);
    if (!weatherData && !weatherLoading) {
      fetchWeatherData();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${key}`,
      center: centerCoordinates,
      zoom: 13,
      maxPitch: 85
    });

    newMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }), 'top-right');
    newMap.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }), 'bottom-right');

    newMap.on('load', () => {
      addSourceAndLayers(newMap);

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

      // Point hover events
      newMap.on('mouseenter', 'points-layer', (e) => {
        newMap.getCanvas().style.cursor = 'pointer';
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        let elevationInfo = '';
        if (properties.elevation !== null && !properties.elevationError) {
          elevationInfo = `<br>Ketinggian: ${Math.round(properties.elevation)} m`;
        } else if (elevationLoading) {
          elevationInfo = '<br>Ketinggian: Memuat...';
        } else {
          elevationInfo = '<br>Ketinggian: Tidak tersedia';
        }
        
        const description = `<strong>${properties.name}</strong><br>${properties.description}<br>Koordinat: [${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}]${elevationInfo}`;
        popup.setLngLat(coordinates).setHTML(description).addTo(newMap);
      });

      newMap.on('mouseleave', 'points-layer', () => {
        newMap.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Line click events for trail segments
      newMap.on('click', 'lines-layer', (e) => {
        const feature = e.features[0];
        const segmentId = feature.properties.id;
        const segment = trailSegments.find(seg => seg.id === segmentId);
        
        if (segment) {
          const coordinates = e.lngLat;
          
          const trailPopup = new maplibregl.Popup({ closeOnClick: true })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="trail-popup" style="min-width: 200px; padding: 8px;">
                <div style="font-weight: bold; color: #059669; margin-bottom: 8px; font-size: 14px;">
                  📍 ${segment.name}
                </div>
                <div style="margin-bottom: 6px; font-size: 12px; color: #6b7280;">
                  ${segment.description}
                </div>
                <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; border-left: 3px solid #10b981;">
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Panjang Jalur</div>
                  <div style="font-weight: bold; color: #059669; font-size: 16px;">
                    📏 ${segment.distance.toFixed(2)} km
                  </div>
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: #9ca3af; text-align: center;">
                  Klik jalur lain untuk melihat detail lainnya
                </div>
              </div>
            `)
            .addTo(newMap);
        }
      });

      // Line hover events
      newMap.on('mouseenter', 'lines-layer', (e) => {
        newMap.getCanvas().style.cursor = 'pointer';
        const segmentId = e.features[0].properties.id;
        
        // Highlight the hovered line
        newMap.setFilter('lines-hover', ['==', ['get', 'id'], segmentId]);
        newMap.setPaintProperty('lines-hover', 'line-opacity', 0.6);
      });

      newMap.on('mouseleave', 'lines-layer', () => {
        newMap.getCanvas().style.cursor = '';
        
        // Remove highlight
        newMap.setPaintProperty('lines-hover', 'line-opacity', 0);
        newMap.setFilter('lines-hover', ['==', ['get', 'id'], '']);
      });

      // Fetch initial weather data when map loads
      fetchWeatherData();
    });

    setMap(newMap);

    return () => newMap && newMap.remove();
  }, [centerCoordinates, addSourceAndLayers, key, fetchWeatherData]);

  // Update weather marker when weather data changes
  useEffect(() => {
    if (map && weatherData) {
      addWeatherMarker();
    }
  }, [map, weatherData, addWeatherMarker]);
  
  const toggleStyleBox = () => {
    setShowStyleBox(!showStyleBox);
    setShowWeatherInfo(false);
  };

  const toggleWeatherBox = () => {
    setShowWeatherInfo(!showWeatherInfo);
    setShowStyleBox(false);
    if (!weatherData && !weatherLoading) {
      fetchWeatherData();
    }
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'Mudah';
      case 'moderate': case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      default: return difficulty || 'Tidak Diketahui';
    }
  };
  
  const processDescription = (text) => {
    if (!text) return '';
    if (text.includes('<p>') || text.includes('<br')) {
      return text;
    }
    // Simple markdown processing
    let processed = text
      .replace(/\n\n+/g, '<p>')
      .replace(/\n/g, '<br />');
    return processed;
  };
  
  const stripHtmlTags = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
  };

  // Generate page title and description
  const pageTitle = `Jalur Pendakian Gunung ${mountain.name} - ${mountain.kota}, ${mountain.provinsi} | TrailView ID`;
  const pageDescription = `Informasi lengkap jalur pendakian Gunung ${mountain.name} di ${mountain.kota}, ${mountain.provinsi}. ${mountain.penjelasan ? stripHtmlTags(processDescription(mountain.penjelasan)).substring(0, 100) + '...' : `Ketinggian ${mountain.elevation || mountain.elevation_gain || 'N/A'}m, tingkat kesulitan ${getDifficultyText(mountain.difficulty)}, estimasi waktu ${mountain.estimated_time || 'N/A'}.`}`;
  const pageKeywords = `gunung ${mountain.name}, jalur pendakian ${mountain.name}, ${mountain.name} ${mountain.provinsi}, hiking ${mountain.name}, trekking ${mountain.name}, basecamp ${mountain.name}, rute pendakian ${mountain.name}`;
  const ogTitle = `Jalur Pendakian Gunung ${mountain.name} - TrailView ID`;
  const ogDescription = `Informasi lengkap jalur pendakian Gunung ${mountain.name} di ${mountain.kota}, ${mountain.provinsi}. ${mountain.penjelasan ? stripHtmlTags(processDescription(mountain.penjelasan)).substring(0, 100) + '...' : `Ketinggian ${mountain.elevation || mountain.elevation_gain || 'N/A'}m.`}`;

  const mountainSchema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": `Gunung ${mountain.name}`,
    "description": stripHtmlTags(processDescription(mountain.penjelasan)).substring(0, 160) || `Informasi jalur pendakian Gunung ${mountain.name}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": mountain.kota,
      "addressRegion": mountain.provinsi,
      "addressCountry": "ID"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": centerCoordinates[1],
      "longitude": centerCoordinates[0],
      "elevation": mountain.elevation || mountain.elevation_gain
    },
    "aggregateRating": mountain.rating ? {
      "@type": "AggregateRating",
      "ratingValue": mountain.rating,
      "bestRating": "5"
    } : undefined
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://trailview.id/mountains/${mountain.id}`} />
        {mountain.image && (
          <meta property="og:image" content={`https://adrianfirmansyah-website.my.id/trailview/assets/${mountain.image}`} />
        )}
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mountainSchema) }}
        />
        
        <style>{`
          .prose {
            color: #374151;
            max-width: none;
          }
          .prose p {
            margin-bottom: 1.25rem;
            line-height: 1.8;
            text-align: justify;
          }
          .map-container {
            height: 600px;
            width: 100%;
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          .animate-fade-in-up {
            animation: fade-in 0.8s ease-out;
          }
          .weather-button {
            transition: all 0.2s ease;
          }
          .weather-button:hover {
            transform: translateY(-1px);
          }
          .weather-button.active {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
        `}</style>
      </Head>
      
      <main className="min-h-screen bg-gray-50">
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
          {mountain.image ? (
            <Image
              src={`https://adrianfirmansyah-website.my.id/trailview/assets/${mountain.image}`}
              alt={`Gunung ${mountain.name}`}
              fill
              className="object-cover"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-7xl mx-auto">
              <Link href="/" legacyBehavior>
                <a className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors duration-300 animate-fade-in">
                  <ChevronLeftIcon />
                  <span className="ml-2">Kembali ke Beranda</span>
                </a>
              </Link>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in-up">
                Gunung {mountain.name}
              </h1>
              
              <div className="flex items-center space-x-4 text-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center">
                  <MapPinIcon />
                  <span className="ml-2">{mountain.kota}, {mountain.provinsi}</span>
                </div>
                {mountain.rating && (
                  <div className="flex items-center">
                    <StarIcon filled={true} />
                    <span className="ml-1 font-semibold">{mountain.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center animate-fade-in-up">
                <div className="flex items-center justify-center mb-2 text-green-600">
                  <ElevationIcon />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {mountain.elevation || mountain.elevation_gain || 'N/A'} m
                </div>
                <div className="text-sm text-gray-500">Ketinggian</div>
              </div>
              
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-center mb-2 text-green-600">
                  <RouteIcon />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {trailDistance ? (
                    trailDistance >= 1 ? `${trailDistance.toFixed(1)} km` : `${(trailDistance * 1000).toFixed(0)} m`
                  ) : (mountain.distance || 'N/A')}
                </div>
                <div className="text-sm text-gray-500">Panjang Jalur</div>
              </div>
              
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-center mb-2 text-green-600">
                  <ClockIcon />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {mountain.estimated_time || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Estimasi Waktu</div>
              </div>
              
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-center mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(mountain.difficulty)}`}>
                    {getDifficultyText(mountain.difficulty)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">Tingkat Kesulitan</div>
              </div>
              
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-center mb-2 text-green-600">
                  <HikingIcon />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {mountain.type || 'Hiking'}
                </div>
                <div className="text-sm text-gray-500">Tipe</div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-1 h-8 bg-green-500 rounded-full mr-4"></span>
                  Deskripsi Jalur Pendakian
                </h2>
                {mountain.penjelasan ? (
                  <div 
                    className="prose prose-lg"
                    dangerouslySetInnerHTML={{ __html: processDescription(mountain.penjelasan) }}
                  />
                ) : (
                  <div className="text-gray-500 italic">
                    <p>Deskripsi jalur pendakian belum tersedia.</p>
                  </div>
                )}
              </div>
              
              {mountain.persyaratan && (
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-1 h-8 bg-green-500 rounded-full mr-4"></span>
                    Persyaratan Pendakian
                  </h2>
                  <div 
                    className="prose prose-lg"
                    dangerouslySetInnerHTML={{ __html: processDescription(mountain.persyaratan) }}
                  />
                </div>
              )}
              
              <div className="bg-white rounded-2xl shadow-sm p-8 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-1 h-8 bg-green-500 rounded-full mr-4"></span>
                  Peta Jalur Pendakian
                </h2>
                
                <div className="relative">
                  <div className="map-container mb-6">
                    <div id="map" ref={mapContainerRef} className="map-container"></div>
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <button 
                        onClick={toggle3D} 
                        className={`p-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 ${
                          is3D ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        title="Toggle 3D View"
                      >
                        <Toggle3DIcon />
                      </button>

                      <button 
                        onClick={toggleWeatherBox} 
                        className={`p-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 ${
                          showWeatherInfo ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        title="Weather Info"
                      >
                        <WeatherIcon />
                      </button>

                      {showWeatherInfo && (
                        <div className="absolute top-0 left-16 bg-white rounded-lg shadow-xl p-4 w-80 animate-fade-in z-20">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-900">Cuaca di {mountain.kota}</h4>
                            <button 
                              onClick={toggleWeatherBox}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {weatherLoading ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <div className="text-sm text-gray-600 mt-2">Mengambil data cuaca...</div>
                            </div>
                          ) : weatherError ? (
                            <div className="text-center py-4">
                              <div className="text-red-500 text-sm">{weatherError}</div>
                              <button 
                                onClick={fetchWeatherData}
                                className="text-blue-600 text-sm mt-2 hover:underline"
                              >
                                Coba lagi
                              </button>
                            </div>
                          ) : weatherData && weatherData.current ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-4xl mr-3">{getWeatherEmoji(weatherData.current.weather[0].main)}</div>
                                <div>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {Math.round(weatherData.current.temp)}°C
                                  </div>
                                  <div className="text-sm text-gray-600 capitalize">
                                    {weatherData.current.weather[0].description}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Terasa Seperti</div>
                                  <div className="font-semibold">{Math.round(weatherData.current.feels_like)}°C</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Kelembaban</div>
                                  <div className="font-semibold">{weatherData.current.humidity}%</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Angin</div>
                                  <div className="font-semibold">{weatherData.current.wind_speed || 0} m/s</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Tekanan</div>
                                  <div className="font-semibold">{weatherData.current.pressure} hPa</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Jarak Pandang</div>
                                  <div className="font-semibold">{(weatherData.current.visibility / 1000).toFixed(1)} km</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Awan</div>
                                  <div className="font-semibold">{weatherData.current.clouds}%</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">UV Index</div>
                                  <div className="font-semibold">{weatherData.current.uvi || 0}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-600">Titik Embun</div>
                                  <div className="font-semibold">{Math.round(weatherData.current.dew_point)}°C</div>
                                </div>
                              </div>
                              
                              {/* Weather Alerts */}
                              {weatherData.alerts && weatherData.alerts.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <div className="text-red-800 font-semibold text-sm mb-1">⚠️ Peringatan Cuaca</div>
                                  {weatherData.alerts.map((alert, index) => (
                                    <div key={index} className="text-red-700 text-xs">
                                      <div className="font-medium">{alert.event}</div>
                                      <div className="mt-1">{alert.description}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="bg-yellow-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-600 mb-1">Matahari</div>
                                <div className="flex justify-between text-sm">
                                  <span>🌅 {formatTime(weatherData.current.sunrise)}</span>
                                  <span>🌇 {formatTime(weatherData.current.sunset)}</span>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 text-center mt-3">
                                Data dari OpenWeatherMap • {peakCoordinates ? 'Puncak' : 'Area'}: {(peakCoordinates || centerCoordinates)[1].toFixed(4)}, {(peakCoordinates || centerCoordinates)[0].toFixed(4)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="text-gray-500 text-sm">Data cuaca tidak tersedia</div>
                              <button 
                                onClick={fetchWeatherData}
                                className="text-blue-600 text-sm mt-2 hover:underline"
                              >
                                Muat data cuaca
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 z-10">
                      <button
                        onClick={toggleStyleBox}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                        title="Ubah Gaya Peta"
                      >
                        <MapStyleIcon />
                      </button>
                      
                      {showStyleBox && (
                        <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-xl p-3 w-40 animate-fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">Gaya Peta</h4>
                            <button 
                              onClick={toggleStyleBox}
                              className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            {[
                              { id: 'outdoor', name: 'Outdoor' },
                              { id: 'streets', name: 'Streets' },
                              { id: 'satellite', name: 'Satellite' }
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => changeMapStyle(style.id)}
                                className={`w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                                  mapStyle === style.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                                }`}
                              >
                                <div className={`w-6 h-6 rounded border-2 ${
                                  mapStyle === style.id ? 'border-green-500' : 'border-gray-300'
                                }`}>
                                  {mapStyle === style.id && (
                                    <div className="w-full h-full bg-green-500 rounded flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-medium">{style.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              {/* Trail Statistics */}
              {trailDistance && (
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                    Statistik Jalur
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <RouteIcon />
                          <span className="ml-2 text-gray-700">Panjang Total</span>
                        </div>
                        <span className="font-bold text-green-600">
                          {trailDistance >= 1 ? `${trailDistance.toFixed(1)} km` : `${(trailDistance * 1000).toFixed(0)} m`}
                        </span>
                      </div>
                    </div>
                    
                    {mountain.elevation && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ElevationIcon />
                            <span className="ml-2 text-gray-700">Ketinggian Puncak</span>
                          </div>
                          <span className="font-bold text-purple-600">
                            {mountain.elevation >= 1000 ? `${(mountain.elevation / 1000).toFixed(1)} km` : `${mountain.elevation} m`}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Elevation Statistics */}
                    {pointsWithElevation.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-sm font-semibold text-orange-800 mb-2">📊 Statistik Ketinggian Titik</div>
                        <div className="space-y-1 text-xs">
                          {(() => {
                            const validElevations = pointsWithElevation
                              .filter(p => p.elevation !== null && !p.elevationError)
                              .map(p => p.elevation);
                            
                            if (validElevations.length === 0) {
                              return <div className="text-orange-600">Data ketinggian sedang dimuat...</div>;
                            }
                            
                            const minElevation = Math.min(...validElevations);
                            const maxElevation = Math.max(...validElevations);
                            const avgElevation = validElevations.reduce((a, b) => a + b, 0) / validElevations.length;
                            
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-orange-600">Terendah:</span>
                                  <span className="font-semibold text-orange-800">{Math.round(minElevation)} m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-orange-600">Tertinggi:</span>
                                  <span className="font-semibold text-orange-800">{Math.round(maxElevation)} m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-orange-600">Rata-rata:</span>
                                  <span className="font-semibold text-orange-800">{Math.round(avgElevation)} m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-orange-600">Gain Total:</span>
                                  <span className="font-semibold text-orange-800">{Math.round(maxElevation - minElevation)} m</span>
                                </div>
                                <div className="text-xs text-orange-500 mt-1">
                                  Data dari {validElevations.length} dari {pointsWithElevation.length} titik
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {mountain.estimated_time && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ClockIcon />
                            <span className="ml-2 text-gray-700">Estimasi Waktu</span>
                          </div>
                          <span className="font-bold text-red-600">{mountain.estimated_time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 animate-fade-in-up mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Info Cuaca</h3>
                <p className="text-gray-600 mb-3">
                  Cek prakiraan cuaca terbaru sebelum mendaki untuk keselamatan Anda.
                </p>
                
                {/* Current Weather Quick View */}
                {weatherData && weatherData.current && weatherData.current.weather && weatherData.current.weather[0] && (
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getWeatherEmoji(weatherData.current.weather[0].main)}</span>
                        <div>
                          <div className="font-semibold">{Math.round(weatherData.current.temp)}°C</div>
                          <div className="text-xs text-gray-500 capitalize">{weatherData.current.weather[0].description}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>💧 {weatherData.current.humidity}%</div>
                        <div>💨 {weatherData.current.wind_speed || 0} m/s</div>
                        <div>☀️ UV: {weatherData.current.uvi || 0}</div>
                      </div>
                    </div>
                    
                    {/* Weather Alert Badge */}
                    {weatherData.alerts && weatherData.alerts.length > 0 && (
                      <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full inline-block">
                        ⚠️ {weatherData.alerts.length} Peringatan Cuaca
                      </div>
                    )}
                  </div>
                )}
                
                <a 
                  href={`https://www.bmkg.go.id/cuaca/prakiraan-cuaca.bmkg?Kota=${mountain.kota}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lihat Prakiraan Lengkap
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              
              {/* Trail Segments Information */}
              {trailSegments.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 animate-fade-in-up mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Segmen Jalur</h3>
                  <div className="space-y-3">
                    {trailSegments.map((segment, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{segment.name}</h4>
                            <p className="text-sm text-gray-600">{segment.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {segment.distance.toFixed(2)} km
                            </div>
                            <div className="text-xs text-gray-500">Panjang</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Points with Elevation Information */}
              {pointsWithElevation.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Titik Penting</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {pointsWithElevation.map((point, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{point.name}</h4>
                            <p className="text-sm text-gray-600">{point.description || 'Tidak ada deskripsi'}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Koordinat: {parseFloat(point.latitude).toFixed(4)}, {parseFloat(point.longitude).toFixed(4)}
                            </div>
                          </div>
                          <div className="text-right">
                            {point.elevation !== null && !point.elevationError ? (
                              <div className="font-bold text-orange-600">
                                {Math.round(point.elevation)} m
                              </div>
                            ) : elevationLoading ? (
                              <div className="text-xs text-gray-500">Loading...</div>
                            ) : (
                              <div className="text-xs text-gray-400">N/A</div>
                            )}
                            <div className="text-xs text-gray-500">Ketinggian</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        
        <Footer />
      </main>
    </>
  );
}

export async function getStaticPaths() {
  const res = await fetch('https://adrianfirmansyah-website.my.id/trailview/items/mountains');
  const jsonData = await res.json();
  const mountains = jsonData.data;

  const paths = mountains.map((mountain) => ({
    params: { id: mountain.id.toString() },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const mountainRes = await fetch(`https://adrianfirmansyah-website.my.id/trailview/items/mountains/${params.id}`);
  const mountainData = await mountainRes.json();
  const mountain = mountainData.data;

  const pointKey = mountain.point || 'point_burangrang';
  const trackKey = mountain.track || 'jalur_burangrang';

  const resPoints = await fetch(`https://adrianfirmansyah-website.my.id/trailview/items/${pointKey}`);
  const pointsData = await resPoints.json();
  const directusPoints = pointsData.data || [];

  const resLines = await fetch(`https://adrianfirmansyah-website.my.id/trailview/items/${trackKey}`);
  const linesData = await resLines.json();
  const directusLines = linesData.data || [];

  let centerCoordinates = [107.601529, -6.917464]; // Default coordinates

  if (directusPoints.length > 0) {
    const startPoint = directusPoints.find(point => 
      point.name.toLowerCase().includes('start') || 
      point.name.toLowerCase().includes('puncak') ||
      point.id === 1
    ) || directusPoints[0];
    
    if (startPoint && startPoint.latitude && startPoint.longitude) {
      centerCoordinates = [parseFloat(startPoint.longitude), parseFloat(startPoint.latitude)];
    }
  } else if (directusLines.length > 0 && directusLines[0].coordinates && directusLines[0].coordinates.length > 0) {
    const firstCoord = directusLines[0].coordinates[0];
    centerCoordinates = [firstCoord[0], firstCoord[1]];
  }

  return {
    props: {
      mountain,
      directusPoints,
      directusLines,
      centerCoordinates
    },
    revalidate: 10,
  };
}