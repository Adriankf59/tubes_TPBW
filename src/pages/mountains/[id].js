import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Footer from "../../../components/footer";

// SVG Icon Components (keeping all existing icons)
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const WeatherIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

// Close Icon for mobile
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Helper function to convert Directus GeoJSON data to standard format
const convertDirectusGeoJSONToStandard = (directusData) => {
  if (!directusData || !Array.isArray(directusData)) return [];
  
  return directusData.map(item => {
    if (item.geom && item.geom.type && item.geom.coordinates) {
      return {
        id: item.id,
        name: item.name || `Feature ${item.id}`,
        description: item.description || '',
        geometry: item.geom,
        properties: {
          ...item,
          name: item.name || `Feature ${item.id}`,
          description: item.description || ''
        }
      };
    } else if (item.latitude && item.longitude) {
      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        latitude: item.latitude,
        longitude: item.longitude,
        altitude: item.altitude || 0,
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(item.longitude), parseFloat(item.latitude), item.altitude || 0]
        },
        properties: {
          ...item,
          elevation: item.altitude || 0
        }
      };
    } else if (item.coordinates) {
      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        coordinates: item.coordinates,
        geometry: {
          type: 'LineString',
          coordinates: item.coordinates
        },
        properties: {
          ...item
        }
      };
    }
    
    return null;
  }).filter(item => item !== null);
};

// Helper function to separate points and lines from mixed data
const separateGeoFeatures = (features) => {
  const points = [];
  const lines = [];
  
  features.forEach(feature => {
    if (feature.geometry) {
      if (feature.geometry.type === 'Point') {
        points.push({
          id: feature.id,
          name: feature.name,
          description: feature.description,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          altitude: feature.geometry.coordinates[2] || 0,
          elevation: feature.geometry.coordinates[2] || 0
        });
      } else if (feature.geometry.type === 'LineString') {
        lines.push({
          id: feature.id,
          name: feature.name,
          description: feature.description,
          coordinates: feature.geometry.coordinates
        });
      }
    } else if (feature.latitude && feature.longitude) {
      points.push(feature);
    } else if (feature.coordinates) {
      lines.push(feature);
    }
  });
  
  return { points, lines };
};

// Helper function for weather emoji - moved outside component
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

// Helper function for time formatting - moved outside component
const formatTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Haversine formula - moved outside component
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Hook to detect mobile device
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default function Mountain({ mountain, directusData, directusPoints, directusLines, centerCoordinates }) {
  console.log('=== MOUNTAIN COMPONENT PROPS ===');
  console.log('Mountain:', mountain?.name);
  console.log('DirectusData:', directusData?.length || 0, 'items');
  console.log('DirectusPoints:', directusPoints?.length || 0, 'items');
  console.log('DirectusLines:', directusLines?.length || 0, 'items');
  console.log('CenterCoordinates:', centerCoordinates);
  console.log('=================================');

  const mapContainerRef = useRef(null);
  const [is3D, setIs3D] = useState(false);
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('outdoor');
  const [showStyleBox, setShowStyleBox] = useState(false);
  const [showWeatherBox, setShowWeatherBox] = useState(false);
  const key = 'Bt7BC1waN22lhYojEJO1';

  // Mobile detection
  const isMobile = useIsMobile();

  // Process the data - handle both old format and new GeoJSON format - WITH DEBUGGING
  const [processedPoints, setProcessedPoints] = useState([]);
  const [processedLines, setProcessedLines] = useState([]);
  
  useEffect(() => {
    console.log('=== DATA PROCESSING ===');
    console.log('DirectusData:', directusData);
    console.log('DirectusPoints:', directusPoints);
    console.log('DirectusLines:', directusLines);
    
    let points = [];
    let lines = [];
    
    if (directusData && directusData.length > 0) {
      console.log('Processing directusData...');
      const convertedFeatures = convertDirectusGeoJSONToStandard(directusData);
      const separated = separateGeoFeatures(convertedFeatures);
      points = separated.points;
      lines = separated.lines;
      console.log('From directusData - Points:', points.length, 'Lines:', lines.length);
    } else {
      console.log('Using fallback directusPoints and directusLines...');
      points = directusPoints || [];
      lines = directusLines || [];
      console.log('From fallback - Points:', points.length, 'Lines:', lines.length);
    }
    
    console.log('Final processed - Points:', points.length, 'Lines:', lines.length);
    console.log('Sample point:', points[0]);
    console.log('Sample line:', lines[0]);
    
    setProcessedPoints(points);
    setProcessedLines(lines);
  }, [directusData, directusPoints, directusLines]);

  // Trail distance calculation
  const [trailDistance, setTrailDistance] = useState(null);
  const [trailSegments, setTrailSegments] = useState([]);
  const [pointsWithElevation, setPointsWithElevation] = useState([]);
  const [elevationLoading, setElevationLoading] = useState(false);

  // Weather configuration
  const [weatherData, setWeatherData] = useState(null);
  const [showWeatherInfo, setShowWeatherInfo] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [peakCoordinates, setPeakCoordinates] = useState(null);
  const openWeatherKey = '9cfcb16a346057f5282f5058f83f1d73';

  // Add state to track if features need to be re-added after style change
  const [featuresNeedReload, setFeaturesNeedReload] = useState(false);
  const [styleChangeInProgress, setStyleChangeInProgress] = useState(false);

  // Fetch weather data function
  const fetchWeatherData = useCallback(async () => {
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
    if (!processedLines || processedLines.length === 0) return null;

    let totalDistance = 0;
    const segments = [];

    processedLines.forEach((line, lineIndex) => {
      if (line.coordinates && line.coordinates.length > 1) {
        let segmentDistance = 0;
        
        for (let i = 0; i < line.coordinates.length - 1; i++) {
          const [lon1, lat1] = line.coordinates[i];
          const [lon2, lat2] = line.coordinates[i + 1];
          
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
  }, [processedLines]);

  // Calculate trail distance when lines change
  useEffect(() => {
    const distance = calculateTrailDistance();
    setTrailDistance(distance);
  }, [calculateTrailDistance]);

  // Fetch elevation data for points
  const fetchElevationData = useCallback(async () => {
    if (!processedPoints || processedPoints.length === 0) return;

    setElevationLoading(true);
    
    try {
      const locations = processedPoints.map(point => ({
        latitude: parseFloat(point.latitude),
        longitude: parseFloat(point.longitude)
      }));

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
        
        const pointsWithElevationData = processedPoints.map((point, index) => ({
          ...point,
          elevation: data.results[index]?.elevation || point.altitude || point.elevation || null,
          elevationError: !data.results[index]?.elevation && !point.altitude && !point.elevation
        }));

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
        setPointsWithElevation(processedPoints.map(point => ({
          ...point,
          elevation: point.altitude || point.elevation || null,
          elevationError: !point.altitude && !point.elevation
        })));
      }
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      setPointsWithElevation(processedPoints.map(point => ({
        ...point,
        elevation: point.altitude || point.elevation || null,
        elevationError: !point.altitude && !point.elevation
      })));
    } finally {
      setElevationLoading(false);
    }
  }, [processedPoints]);

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

  // Function to add map sources and layers - IMPROVED VERSION WITH BETTER CHECKING
  const addMapFeatures = useCallback((mapInstance, forceReload = false) => {
    if (!mapInstance || 
        typeof mapInstance.isStyleLoaded !== 'function' || 
        !mapInstance.isStyleLoaded()) {
      console.log('Map not ready for adding features');
      return false;
    }

    console.log('Adding map features... Force reload:', forceReload);
    
    try {
      const currentPoints = pointsWithElevation.length > 0 ? pointsWithElevation : processedPoints;
      
      // Check if sources already exist and we don't need to force reload
      if (!forceReload) {
        const pointsSourceExists = mapInstance.getSource && mapInstance.getSource('directus-points');
        const linesSourceExists = mapInstance.getSource && mapInstance.getSource('directus-lines');
        
        if (pointsSourceExists || linesSourceExists) {
          console.log('Features already exist, skipping addition');
          return true;
        }
      }

      // Remove existing sources if they exist
      ['directus-points', 'directus-lines', 'weather-marker'].forEach(sourceId => {
        try {
          if (mapInstance.getSource && mapInstance.getSource(sourceId)) {
            // Remove layers first
            const layers = ['points-layer', 'lines-layer', 'lines-hover', 'weather-marker'];
            layers.forEach(layerId => {
              if (mapInstance.getLayer && mapInstance.getLayer(layerId) && mapInstance.removeLayer) {
                mapInstance.removeLayer(layerId);
              }
            });
            if (mapInstance.removeSource) {
              mapInstance.removeSource(sourceId);
            }
          }
        } catch (e) {
          console.warn(`Error removing source ${sourceId}:`, e);
        }
      });

      // Add points source and layer
      if (currentPoints.length > 0 && mapInstance.addSource && mapInstance.addLayer) {
        console.log('Adding points source and layer...');
        mapInstance.addSource('directus-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: currentPoints.map((point) => ({
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

        mapInstance.addLayer({
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
        console.log('Points added successfully');
      }

      // Add lines source and layers
      if (processedLines.length > 0 && mapInstance.addSource && mapInstance.addLayer) {
        console.log('Adding lines source and layers...');
        mapInstance.addSource('directus-lines', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: processedLines.map((line, index) => ({
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

        mapInstance.addLayer({
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

        mapInstance.addLayer({
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
        console.log('Lines added successfully');
      }

      console.log('All map features added successfully');
      return true;
    } catch (error) {
      console.error('Error adding map features:', error);
      return false;
    }
  }, [pointsWithElevation, processedPoints, processedLines, trailSegments]);

  // Function to setup map event listeners - MOBILE OPTIMIZED VERSION
  const setupMapEventListeners = useCallback((mapInstance) => {
    if (!mapInstance || 
        typeof mapInstance.getLayer !== 'function' ||
        typeof mapInstance.on !== 'function' ||
        typeof mapInstance.off !== 'function') {
      console.log('Map instance not ready for event listeners');
      return;
    }

    console.log('Setting up map event listeners...');

    // Remove existing event listeners first to prevent duplicates
    try {
      mapInstance.off('mouseenter', 'points-layer');
      mapInstance.off('mouseleave', 'points-layer');
      mapInstance.off('click', 'lines-layer');
      mapInstance.off('mouseenter', 'lines-layer');
      mapInstance.off('mouseleave', 'lines-layer');
      mapInstance.off('click', 'points-layer');
      mapInstance.off('touchstart', 'points-layer');
      mapInstance.off('touchstart', 'lines-layer');
    } catch (e) {
      // Ignore errors if listeners don't exist
    }

    const popup = new maplibregl.Popup({ 
      closeButton: false, 
      closeOnClick: false,
      // Mobile optimizations
      maxWidth: isMobile ? '280px' : '400px',
      className: isMobile ? 'mobile-popup' : ''
    });

    // Point hover events (desktop) and click events (mobile)
    const onPointMouseEnter = (e) => {
      if (isMobile) return; // Skip hover on mobile
      console.log('Point mouse enter triggered');
      mapInstance.getCanvas().style.cursor = 'pointer';
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      
      let elevationInfo = '';
      if (properties.elevation !== null && !properties.elevationError) {
        elevationInfo = `<br>Ketinggian: ${Math.round(properties.elevation)} m`;
      } else {
        elevationInfo = '<br>Ketinggian: Tidak tersedia';
      }
      
      const description = `<strong>${properties.name}</strong><br>${properties.description}<br>Koordinat: [${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}]${elevationInfo}`;
      popup.setLngLat(coordinates).setHTML(description).addTo(mapInstance);
    };

    const onPointMouseLeave = () => {
      if (isMobile) return; // Skip hover on mobile
      console.log('Point mouse leave triggered');
      mapInstance.getCanvas().style.cursor = '';
      popup.remove();
    };

    // Mobile-specific click handler for points
    const onPointClick = (e) => {
      if (!isMobile) return; // Only on mobile
      console.log('Point click triggered on mobile');
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      
      let elevationInfo = '';
      if (properties.elevation !== null && !properties.elevationError) {
        elevationInfo = `<br>Ketinggian: ${Math.round(properties.elevation)} m`;
      } else {
        elevationInfo = '<br>Ketinggian: Tidak tersedia';
      }
      
      const description = `<strong>${properties.name}</strong><br>${properties.description}<br>Koordinat: [${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}]${elevationInfo}`;
      
      const pointPopup = new maplibregl.Popup({ 
        closeOnClick: true,
        maxWidth: '280px',
        className: 'mobile-popup'
      })
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(mapInstance);
    };

    // Line click events (optimized for mobile)
    const onLineClick = (e) => {
      console.log('Line click triggered');
      const feature = e.features[0];
      const segmentId = feature.properties.id;
      const distance = feature.properties.distance;
      const name = feature.properties.name;
      const description = feature.properties.description;
      
      const coordinates = e.lngLat;
      
      const trailPopup = new maplibregl.Popup({ 
        closeOnClick: true,
        maxWidth: isMobile ? '260px' : '300px',
        className: isMobile ? 'mobile-popup' : ''
      })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="trail-popup" style="min-width: ${isMobile ? '200px' : '200px'}; padding: ${isMobile ? '6px' : '8px'};">
            <div style="font-weight: bold; color: #059669; margin-bottom: ${isMobile ? '6px' : '8px'}; font-size: ${isMobile ? '13px' : '14px'};">
              📍 ${name}
            </div>
            <div style="margin-bottom: ${isMobile ? '4px' : '6px'}; font-size: ${isMobile ? '11px' : '12px'}; color: #6b7280;">
              ${description}
            </div>
            <div style="background: #f0fdf4; padding: ${isMobile ? '6px' : '8px'}; border-radius: ${isMobile ? '4px' : '6px'}; border-left: 3px solid #10b981;">
              <div style="font-size: ${isMobile ? '10px' : '11px'}; color: #6b7280; margin-bottom: 2px;">Panjang Jalur</div>
              <div style="font-weight: bold; color: #059669; font-size: ${isMobile ? '14px' : '16px'};">
                📏 ${distance ? distance.toFixed(2) : 'N/A'} km
              </div>
            </div>
            <div style="margin-top: ${isMobile ? '6px' : '8px'}; font-size: ${isMobile ? '9px' : '10px'}; color: #9ca3af; text-align: center;">
              Klik jalur lain untuk melihat detail lainnya
            </div>
          </div>
        `)
        .addTo(mapInstance);
    };

    // Line hover events (desktop only)
    const onLineMouseEnter = (e) => {
      if (isMobile) return; // Skip hover on mobile
      console.log('Line mouse enter triggered');
      mapInstance.getCanvas().style.cursor = 'pointer';
      const segmentId = e.features[0].properties.id;
      
      try {
        const hoverLayer = mapInstance.getLayer('lines-hover');
        if (hoverLayer && typeof mapInstance.setFilter === 'function' && typeof mapInstance.setPaintProperty === 'function') {
          mapInstance.setFilter('lines-hover', ['==', ['get', 'id'], segmentId]);
          mapInstance.setPaintProperty('lines-hover', 'line-opacity', 0.6);
        }
      } catch (error) {
        console.warn('Error setting line hover effect:', error);
      }
    };

    const onLineMouseLeave = () => {
      if (isMobile) return; // Skip hover on mobile
      console.log('Line mouse leave triggered');
      mapInstance.getCanvas().style.cursor = '';
      
      try {
        const hoverLayer = mapInstance.getLayer('lines-hover');
        if (hoverLayer && typeof mapInstance.setPaintProperty === 'function' && typeof mapInstance.setFilter === 'function') {
          mapInstance.setPaintProperty('lines-hover', 'line-opacity', 0);
          mapInstance.setFilter('lines-hover', ['==', ['get', 'id'], '']);
        }
      } catch (error) {
        console.warn('Error removing line hover effect:', error);
      }
    };

    // Add event listeners with error handling
    try {
      const pointsLayer = mapInstance.getLayer('points-layer');
      const linesLayer = mapInstance.getLayer('lines-layer');
      
      console.log('Points layer exists:', !!pointsLayer);
      console.log('Lines layer exists:', !!linesLayer);
      
      if (pointsLayer) {
        if (isMobile) {
          // On mobile, use click events for points
          mapInstance.on('click', 'points-layer', onPointClick);
        } else {
          // On desktop, use hover events for points
          mapInstance.on('mouseenter', 'points-layer', onPointMouseEnter);
          mapInstance.on('mouseleave', 'points-layer', onPointMouseLeave);
        }
        console.log('Point event listeners added successfully');
      }
      
      if (linesLayer) {
        mapInstance.on('click', 'lines-layer', onLineClick);
        if (!isMobile) {
          // Only add hover events on desktop
          mapInstance.on('mouseenter', 'lines-layer', onLineMouseEnter);
          mapInstance.on('mouseleave', 'lines-layer', onLineMouseLeave);
        }
        console.log('Line event listeners added successfully');
      }
    } catch (error) {
      console.error('Error adding map event listeners:', error);
    }
  }, [isMobile]);

  // Add weather marker function
  const addWeatherMarker = useCallback((mapInstance) => {
    if (!mapInstance || 
        !weatherData || 
        !weatherData.current || 
        !mapInstance.isStyleLoaded ||
        !mapInstance.isStyleLoaded() ||
        typeof mapInstance.getSource !== 'function' ||
        typeof mapInstance.addSource !== 'function' ||
        typeof mapInstance.addLayer !== 'function') {
      console.warn('Cannot add weather marker - map or data not ready');
      return;
    }
    
    const coordinatesToUse = peakCoordinates || centerCoordinates;

    try {
      // Remove existing weather marker if it exists
      const existingWeatherSource = mapInstance.getSource('weather-marker');
      if (existingWeatherSource) {
        const existingWeatherLayer = mapInstance.getLayer('weather-marker');
        if (existingWeatherLayer && typeof mapInstance.removeLayer === 'function') {
          mapInstance.removeLayer('weather-marker');
        }
        if (typeof mapInstance.removeSource === 'function') {
          mapInstance.removeSource('weather-marker');
        }
      }

      mapInstance.addSource('weather-marker', {
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

      mapInstance.addLayer({
        id: 'weather-marker',
        type: 'symbol',
        source: 'weather-marker',
        layout: {
          'text-field': getWeatherEmoji(weatherData.current.weather[0].main) + '\n{temp}°C',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': isMobile ? 16 : 20, // Smaller on mobile
          'text-anchor': 'bottom',
          'text-offset': [0, -1]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        }
      });
      
      console.log('Weather marker added successfully');
    } catch (error) {
      console.error('Error adding weather marker:', error);
    }
  }, [weatherData, centerCoordinates, peakCoordinates, isMobile]);

  const toggle3D = () => {
    if (!map || !mapLoaded) {
      console.warn('Map not available for 3D toggle');
      return;
    }

    if (!map.getSource || 
        !map.addSource || 
        !map.setTerrain || 
        !map.setPitch ||
        typeof map.getSource !== 'function' ||
        typeof map.addSource !== 'function' ||
        typeof map.setTerrain !== 'function' ||
        typeof map.setPitch !== 'function') {
      console.warn('Map methods not available for 3D toggle');
      return;
    }
      
    try {
      if (!is3D) {
        const existingTerrain = map.getSource('terrain');
        if (!existingTerrain) {
          map.addSource('terrain', {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`
          });
        }
        map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
        map.setPitch(isMobile ? 45 : 60); // Less aggressive pitch on mobile
      } else {
        const existingTerrain = map.getSource('terrain');
        if (existingTerrain) {
          map.setTerrain(undefined);
          map.setPitch(0);
        }
      }
      setIs3D(!is3D);
    } catch (error) {
      console.error('Error toggling 3D:', error);
    }
  };

  // COMPLETELY REWRITTEN changeMapStyle function with proper sequence
  const changeMapStyle = useCallback((newStyle) => {
    if (!map || !mapLoaded || styleChangeInProgress) {
      console.warn('Map not available for style change or change in progress');
      return;
    }

    if (!map.getCenter || 
        !map.getZoom || 
        !map.setStyle ||
        typeof map.getCenter !== 'function' ||
        typeof map.getZoom !== 'function' ||
        typeof map.setStyle !== 'function') {
      console.warn('Map methods not available for style change');
      return;
    }
      
    console.log('Changing map style to:', newStyle);
    
    // Prevent multiple style changes at once
    setStyleChangeInProgress(true);
    
    try {
      // Store current map state
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const currentPitch = map.getPitch ? map.getPitch() : 0;
      const currentBearing = map.getBearing ? map.getBearing() : 0;
      const current3D = is3D;

      // Store current data state
      const currentPointsData = pointsWithElevation.length > 0 ? pointsWithElevation : processedPoints;
      const currentLinesData = processedLines;
      const currentWeatherData = weatherData;

      // Change style
      map.setStyle(`https://api.maptiler.com/maps/${newStyle}/style.json?key=${key}`);
      
      // Single event handler for style completion
      const handleStyleLoad = () => {
        console.log('Style loaded, beginning restoration sequence...');
        
        // Wait a bit for style to fully settle
        setTimeout(() => {
          try {
            // Step 1: Restore camera position
            if (map && map.jumpTo) {
              map.jumpTo({
                center: currentCenter,
                zoom: currentZoom,
                pitch: currentPitch,
                bearing: currentBearing
              });
              console.log('Camera position restored');
            }

            // Step 2: Re-add 3D terrain if it was enabled
            if (current3D && map && map.addSource && map.setTerrain) {
              setTimeout(() => {
                try {
                  if (map.getSource && !map.getSource('terrain')) {
                    map.addSource('terrain', {
                      type: 'raster-dem',
                      url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`
                    });
                  }
                  map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
                  console.log('3D terrain restored');
                } catch (error) {
                  console.error('Error restoring 3D terrain:', error);
                }
              }, 100);
            }

            // Step 3: Add features (most important step)
            setTimeout(() => {
              if (map && map.isStyleLoaded && map.isStyleLoaded()) {
                console.log('Adding features after style change...');
                
                // Force reload features
                const success = addMapFeatures(map, true);
                
                if (success) {
                  console.log('Features added successfully after style change');
                  
                  // Step 4: Setup event listeners
                  setTimeout(() => {
                    if (map && map.getLayer) {
                      setupMapEventListeners(map);
                      console.log('Event listeners setup after style change');
                    }
                    
                    // Step 5: Add weather marker if available
                    if (currentWeatherData && map && map.addSource && map.addLayer) {
                      setTimeout(() => {
                        addWeatherMarker(map);
                        console.log('Weather marker added after style change');
                      }, 200);
                    }
                    
                    // Complete the style change process
                    setStyleChangeInProgress(false);
                    setMapLoaded(true);
                    console.log('Style change process completed');
                    
                  }, 300);
                } else {
                  console.error('Failed to add features after style change');
                  setStyleChangeInProgress(false);
                  setMapLoaded(true);
                }
              } else {
                console.error('Map style not loaded after timeout');
                setStyleChangeInProgress(false);
                setMapLoaded(true);
              }
            }, 500); // Increased delay for style to settle

          } catch (error) {
            console.error('Error in style restoration sequence:', error);
            setStyleChangeInProgress(false);
            setMapLoaded(true);
          }
        }, 200); // Initial delay for style to settle
      };

      // Listen for style load event (using once to prevent multiple calls)
      map.once('styledata', handleStyleLoad);
      
      // Update the style state
      setMapStyle(newStyle);
      
    } catch (error) {
      console.error('Error changing map style:', error);
      setStyleChangeInProgress(false);
      setMapLoaded(true);
    }
  }, [map, mapLoaded, styleChangeInProgress, is3D, key, addMapFeatures, setupMapEventListeners, addWeatherMarker, weatherData, pointsWithElevation, processedPoints, processedLines, isMobile]);

  const toggleWeatherInfo = () => {
    setShowWeatherInfo(!showWeatherInfo);
    if (!weatherData && !weatherLoading) {
      fetchWeatherData();
    }
  };

  // Map initialization with better event handling
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    console.log('Initializing map...');

    const newMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${key}`,
      center: centerCoordinates,
      zoom: isMobile ? 12 : 13, // Slightly zoomed out on mobile
      maxPitch: 85
    });

    // Mobile-optimized navigation control
    newMap.addControl(new maplibregl.NavigationControl({ 
      visualizePitch: true, 
      showZoom: true, 
      showCompass: !isMobile // Hide compass on mobile to save space
    }), 'top-right');
    
    // Mobile-optimized geolocate control
    newMap.addControl(new maplibregl.GeolocateControl({ 
      positionOptions: { enableHighAccuracy: true }, 
      trackUserLocation: true, 
      showUserHeading: true 
    }), isMobile ? 'bottom-right' : 'bottom-right');

    // CRITICAL: Wait for both load AND styledata to ensure map is fully ready
    let loadComplete = false;
    let styleComplete = false;

    const checkMapReady = () => {
      if (loadComplete && styleComplete && newMap.isStyleLoaded()) {
        console.log('Map fully ready, setting loaded state');
        setMapLoaded(true);
        
        // Initialize weather data fetch
        setTimeout(() => {
          fetchWeatherData();
        }, 100);
      }
    };

    newMap.on('load', () => {
      console.log('Map load event fired');
      loadComplete = true;
      checkMapReady();
    });

    newMap.on('styledata', () => {
      if (newMap.isStyleLoaded()) {
        console.log('Map styledata event fired and style is loaded');
        styleComplete = true;
        checkMapReady();
      }
    });

    // Additional safety check with timeout
    setTimeout(() => {
      if (newMap.isStyleLoaded() && !mapLoaded) {
        console.log('Force setting map as loaded after timeout');
        setMapLoaded(true);
        fetchWeatherData();
      }
    }, 3000);

    setMap(newMap);

    return () => {
      console.log('Cleaning up map...');
      if (newMap) {
        newMap.remove();
      }
    };
  }, [centerCoordinates, key, fetchWeatherData, mapStyle, isMobile]);

  // IMPROVED: Effect for initial map setup and feature loading with better reliability
  useEffect(() => {
    console.log('=== MAP SETUP EFFECT ===');
    console.log('Map exists:', !!map);
    console.log('Map loaded:', mapLoaded);
    console.log('Style change in progress:', styleChangeInProgress);
    console.log('Processed points length:', processedPoints.length);
    console.log('Processed lines length:', processedLines.length);
    
    // Skip if style change is in progress to avoid conflicts
    if (styleChangeInProgress) {
      console.log('Style change in progress, skipping setup');
      return;
    }

    // Only proceed if we have map, it's loaded, and we have data
    if (!map || !mapLoaded) {
      console.log('Map not ready, skipping setup');
      return;
    }

    if (processedPoints.length === 0 && processedLines.length === 0) {
      console.log('No data available, skipping setup');
      return;
    }

    // Ultra defensive map method checks
    if (!map.isStyleLoaded || 
        !map.getSource || 
        !map.getLayer || 
        !map.addSource || 
        !map.addLayer ||
        typeof map.isStyleLoaded !== 'function' ||
        typeof map.getSource !== 'function' ||
        typeof map.getLayer !== 'function' ||
        typeof map.addSource !== 'function' ||
        typeof map.addLayer !== 'function') {
      console.log('Map methods not available, skipping setup');
      return;
    }

    // Check if style is loaded
    if (!map.isStyleLoaded()) {
      console.log('Style not loaded, skipping setup');
      return;
    }

    // Check if features already exist to avoid duplicates
    try {
      const pointsSourceExists = map.getSource('directus-points');
      const linesSourceExists = map.getSource('directus-lines');
      
      if (pointsSourceExists && linesSourceExists) {
        console.log('All features already exist, just ensuring event listeners');
        setTimeout(() => {
          if (map && map.getLayer) {
            setupMapEventListeners(map);
          }
        }, 100);
        return;
      }
    } catch (error) {
      console.error('Error checking existing sources:', error);
    }

    console.log('Setting up map features...');

    // IMPROVED: Setup features with multiple retry attempts
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupFeaturesWithRetry = () => {
      console.log(`Attempting to setup features (attempt ${retryCount + 1}/${maxRetries})`);
      
      if (!map || !map.isStyleLoaded()) {
        console.log('Map not ready during retry');
        if (retryCount < maxRetries - 1) {
          retryCount++;
          setTimeout(setupFeaturesWithRetry, 500);
        }
        return;
      }

      const success = addMapFeatures(map, true); // Force reload to ensure clean state
      
      if (success) {
        console.log('Features setup successful');
        
        // Setup event listeners after features are ready
        setTimeout(() => {
          if (map && map.getLayer) {
            setupMapEventListeners(map);
            console.log('Event listeners setup complete');
          }
        }, 300);
        
      } else if (retryCount < maxRetries - 1) {
        console.log('Feature setup failed, retrying...');
        retryCount++;
        setTimeout(setupFeaturesWithRetry, 500);
      } else {
        console.error('Feature setup failed after all retries');
      }
    };

    // Start the setup process with a small delay
    const timeoutId = setTimeout(setupFeaturesWithRetry, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };

  }, [map, mapLoaded, styleChangeInProgress, processedPoints, processedLines, addMapFeatures, setupMapEventListeners]);

  // Effect for updating elevation data only
  useEffect(() => {
    if (map && 
        mapLoaded && 
        pointsWithElevation.length > 0 && 
        map.getSource &&
        typeof map.getSource === 'function') {
      
      try {
        const pointsSource = map.getSource('directus-points');
        
        if (pointsSource && pointsSource.setData && typeof pointsSource.setData === 'function') {
          console.log('Updating elevation data for existing points source');
          
          pointsSource.setData({
            type: 'FeatureCollection',
            features: pointsWithElevation.map((point) => ({
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
          });
          console.log('Elevation data updated successfully');
        }
      } catch (error) {
        console.error('Error updating elevation data:', error);
      }
    }
  }, [map, mapLoaded, pointsWithElevation]);

  // Add weather marker when weather data changes - WITH BETTER TIMING
  useEffect(() => {
    if (map && 
        mapLoaded && 
        !styleChangeInProgress &&
        weatherData &&
        typeof map.isStyleLoaded === 'function' &&
        map.isStyleLoaded()) {
      
      // Add delay to ensure other features are loaded first
      setTimeout(() => {
        addWeatherMarker(map);
      }, 300);
    }
  }, [map, mapLoaded, styleChangeInProgress, weatherData, addWeatherMarker]);
  
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
    let processed = text
      .replace(/\n\n+/g, '<p>')
      .replace(/\n/g, '<br />');
    return processed;
  };
  
  const stripHtmlTags = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
  };

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
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
            height: ${isMobile ? '400px' : '600px'};
            width: 100%;
            position: relative;
            border-radius: ${isMobile ? '12px' : '16px'};
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
          
          /* Mobile-specific styles */
          @media (max-width: 768px) {
            .mobile-popup .maplibregl-popup-content {
              padding: 8px 12px !important;
              font-size: 14px !important;
              line-height: 1.4 !important;
              border-radius: 8px !important;
            }
            
            .mobile-popup .maplibregl-popup-tip {
              border-top-color: #ffffff !important;
            }
            
            .mobile-weather-overlay {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              background: rgba(0, 0, 0, 0.5) !important;
              z-index: 9999 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 20px !important;
            }
            
            .mobile-weather-content {
              background: white !important;
              border-radius: 12px !important;
              padding: 20px !important;
              max-width: 350px !important;
              width: 100% !important;
              max-height: 80vh !important;
              overflow-y: auto !important;
              position: relative !important;
            }
            
            .mobile-style-overlay {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              background: white !important;
              border-radius: 12px 12px 0 0 !important;
              padding: 20px !important;
              z-index: 9999 !important;
              box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15) !important;
            }
          }
          
          /* Map controls mobile optimization */
          @media (max-width: 768px) {
            .map-controls-mobile {
              position: absolute;
              top: 8px;
              left: 8px;
              right: 8px;
              display: flex;
              justify-content: space-between;
              z-index: 10;
            }
            
            .map-controls-left {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            
            .map-controls-right {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            
            .map-control-button {
              width: 44px;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              border: none;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            
            .map-control-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .map-control-button.active {
              background: #10b981;
              color: white;
            }
            
            .map-control-button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        `}</style>
      </Head>
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className={`relative ${isMobile ? 'h-[50vh] min-h-[350px]' : 'h-[70vh] min-h-[500px]'} overflow-hidden`}>
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
          
          <div className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'p-4' : 'p-8'} text-white`}>
            <div className="max-w-7xl mx-auto">
              <Link href="/" legacyBehavior>
                <a className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors duration-300 animate-fade-in">
                  <ChevronLeftIcon />
                  <span className="ml-2">Kembali ke Beranda</span>
                </a>
              </Link>
              
              <h1 className={`${isMobile ? 'text-3xl md:text-4xl' : 'text-5xl md:text-6xl'} font-bold mb-4 animate-fade-in-up`}>
                Gunung {mountain.name}
              </h1>
              
              <div className={`flex items-center space-x-4 ${isMobile ? 'text-base' : 'text-lg'} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
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
        
        {/* Stats Section */}
        <section className="bg-white shadow-sm border-b">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-4' : 'py-6'}`}>
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-5 gap-6'}`}>
              <div className="text-center animate-fade-in-up">
                <div className="flex items-center justify-center mb-2 text-green-600">
                  <ElevationIcon />
                </div>
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
                  {mountain.elevation || mountain.elevation_gain || 'N/A'} m
                </div>
                <div className="text-sm text-gray-500">Ketinggian</div>
              </div>
              
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-center mb-2 text-green-600">
                  <RouteIcon />
                </div>
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
                  {trailDistance ? (
                    trailDistance >= 1 ? `${trailDistance.toFixed(1)} km` : `${(trailDistance * 1000).toFixed(0)} m`
                  ) : (mountain.distance || 'N/A')}
                </div>
                <div className="text-sm text-gray-500">Panjang Jalur</div>
              </div>
              
              {!isMobile && (
                <>
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
                </>
              )}
            </div>
            
            {/* Mobile additional stats */}
            {isMobile && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-center mb-2 text-green-600">
                    <ClockIcon />
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {mountain.estimated_time || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Estimasi Waktu</div>
                </div>
                
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-center mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(mountain.difficulty)}`}>
                      {getDifficultyText(mountain.difficulty)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Tingkat Kesulitan</div>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Main Content */}
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-6' : 'py-12'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'lg:grid-cols-3 gap-12'}`}>
            <div className={isMobile ? 'order-2' : 'lg:col-span-2'}>
              {/* Description */}
              <div className={`bg-white rounded-2xl shadow-sm ${isMobile ? 'p-6 mb-6' : 'p-8 mb-8'} animate-fade-in-up`}>
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-6 flex items-center`}>
                  <span className="w-1 h-8 bg-green-500 rounded-full mr-4"></span>
                  Deskripsi Jalur Pendakian
                </h2>
                {mountain.penjelasan ? (
                  <div 
                    className={`prose ${isMobile ? 'prose-sm' : 'prose-lg'}`}
                    dangerouslySetInnerHTML={{ __html: processDescription(mountain.penjelasan) }}
                  />
                ) : (
                  <div className="text-gray-500 italic">
                    <p>Deskripsi jalur pendakian belum tersedia.</p>
                  </div>
                )}
              </div>
              
              {/* Requirements */}
              {mountain.persyaratan && (
                <div className={`bg-white rounded-2xl shadow-sm ${isMobile ? 'p-6 mb-6' : 'p-8 mb-8'} animate-fade-in-up`}>
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-6 flex items-center`}>
                    <span className="w-1 h-8 bg-green-500 rounded-full mr-4"></span>
                    Persyaratan Pendakian
                  </h2>
                  <div 
                    className={`prose ${isMobile ? 'prose-sm' : 'prose-lg'}`}
                    dangerouslySetInnerHTML={{ __html: processDescription(mountain.persyaratan) }}
                  />
                </div>
              )}
              
              {/* Map Section */}
              <div className={`bg-white rounded-2xl shadow-sm ${isMobile ? 'p-4' : 'p-8'} animate-fade-in-up ${isMobile ? 'order-1' : ''}`}>
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'} flex items-center`}>
                  <span className="w-1 h-8 bg-green-500 rounded-full mr-4"></span>
                  Peta Jalur Pendakian
                </h2>
                
                <div className="relative">
                  <div className={`map-container ${isMobile ? 'mb-4' : 'mb-6'}`}>
                    <div id="map" ref={mapContainerRef} className="map-container"></div>
                    
                    {/* Map Loading Indicator */}
                    {!mapLoaded && (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                          <div className="text-gray-600">Memuat peta...</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Mobile Map Controls */}
                    {isMobile ? (
                      <>
                        <div className="map-controls-mobile">
                          <div className="map-controls-left">
                            <button 
                              onClick={toggle3D} 
                              disabled={!mapLoaded}
                              className={`map-control-button ${is3D ? 'active' : ''}`}
                              title="Toggle 3D View"
                            >
                              <Toggle3DIcon />
                            </button>

                            <button 
                              onClick={toggleWeatherBox} 
                              className={`map-control-button ${showWeatherInfo ? 'active' : ''}`}
                              title="Weather Info"
                            >
                              <WeatherIcon />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Style Control - Bottom Left */}
                        <div className="absolute bottom-2 left-2 z-10">
                          <button
                            onClick={toggleStyleBox}
                            disabled={!mapLoaded}
                            className="map-control-button"
                            title="Ubah Gaya Peta"
                          >
                            <MapStyleIcon />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Desktop Map Controls */
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        <button 
                          onClick={toggle3D} 
                          disabled={!mapLoaded}
                          className={`p-2 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
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
                      </div>
                    )}

                    {/* Mobile Weather Info Overlay */}
                    {isMobile && showWeatherInfo && (
                      <div className="mobile-weather-overlay" onClick={toggleWeatherBox}>
                        <div className="mobile-weather-content" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-900 text-lg">Cuaca di {mountain.kota}</h4>
                            <button 
                              onClick={toggleWeatherBox}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <CloseIcon />
                            </button>
                          </div>
                          
                          {weatherLoading ? (
                            <div className="text-center py-6">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <div className="text-sm text-gray-600 mt-3">Mengambil data cuaca...</div>
                            </div>
                          ) : weatherError ? (
                            <div className="text-center py-6">
                              <div className="text-red-500 text-sm mb-3">{weatherError}</div>
                              <button 
                                onClick={fetchWeatherData}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                              >
                                Coba lagi
                              </button>
                            </div>
                          ) : weatherData && weatherData.current ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center p-6 bg-blue-50 rounded-xl">
                                <div className="text-5xl mr-4">{getWeatherEmoji(weatherData.current.weather[0].main)}</div>
                                <div>
                                  <div className="text-3xl font-bold text-gray-900">
                                    {Math.round(weatherData.current.temp)}°C
                                  </div>
                                  <div className="text-gray-600 capitalize">
                                    {weatherData.current.weather[0].description}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="text-gray-600 text-xs">Terasa Seperti</div>
                                  <div className="font-semibold text-lg">{Math.round(weatherData.current.feels_like)}°C</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="text-gray-600 text-xs">Kelembaban</div>
                                  <div className="font-semibold text-lg">{weatherData.current.humidity}%</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="text-gray-600 text-xs">Angin</div>
                                  <div className="font-semibold text-lg">{weatherData.current.wind_speed || 0} m/s</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="text-gray-600 text-xs">Tekanan</div>
                                  <div className="font-semibold text-lg">{weatherData.current.pressure} hPa</div>
                                </div>
                              </div>
                              
                              {weatherData.alerts && weatherData.alerts.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <div className="text-red-800 font-semibold mb-2">⚠️ Peringatan Cuaca</div>
                                  {weatherData.alerts.map((alert, index) => (
                                    <div key={index} className="text-red-700 text-sm">
                                      <div className="font-medium">{alert.event}</div>
                                      <div className="mt-1">{alert.description}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-2">Matahari</div>
                                <div className="flex justify-between">
                                  <span className="text-sm">🌅 {formatTime(weatherData.current.sunrise)}</span>
                                  <span className="text-sm">🌇 {formatTime(weatherData.current.sunset)}</span>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 text-center">
                                Data dari OpenWeatherMap
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <div className="text-gray-500 mb-3">Data cuaca tidak tersedia</div>
                              <button 
                                onClick={fetchWeatherData}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                              >
                                Muat data cuaca
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Desktop Weather Info Box */}
                    {!isMobile && showWeatherInfo && (
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
                            </div>
                            
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
                              Data dari OpenWeatherMap
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
                    
                    {/* Mobile Style Control Bottom Sheet */}
                    {isMobile && showStyleBox && (
                      <div className="mobile-style-overlay">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-gray-900 text-lg">Gaya Peta</h4>
                          <button 
                            onClick={toggleStyleBox}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <CloseIcon />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'outdoor', name: 'Outdoor' },
                            { id: 'streets', name: 'Streets' },
                            { id: 'satellite', name: 'Satellite' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => {
                                changeMapStyle(style.id);
                                setShowStyleBox(false);
                              }}
                              disabled={!mapLoaded || styleChangeInProgress}
                              className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                mapStyle === style.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                              } ${styleChangeInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded border-2 ${
                                mapStyle === style.id ? 'border-green-500 bg-green-500' : 'border-gray-300'
                              } flex items-center justify-center`}>
                                {mapStyle === style.id && (
                                  <span className="text-white text-sm">✓</span>
                                )}
                              </div>
                              <span className="text-sm font-medium">{style.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Desktop Style Control */}
                    {!isMobile && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <button
                          onClick={toggleStyleBox}
                          disabled={!mapLoaded}
                          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  disabled={!mapLoaded || styleChangeInProgress}
                                  className={`w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    mapStyle === style.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                                  } ${styleChangeInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className={`${isMobile ? 'order-3' : 'lg:col-span-1'}`}>
              {/* Trail Statistics */}
              {trailDistance && (
                <div className={`bg-white rounded-2xl shadow-sm ${isMobile ? 'p-4 mb-4' : 'p-6 mb-6'} animate-fade-in-up`}>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-4 flex items-center`}>
                    <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                    Statistik Jalur
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <RouteIcon />
                          <span className={`ml-2 text-gray-700 ${isMobile ? 'text-sm' : ''}`}>Panjang Total</span>
                        </div>
                        <span className={`font-bold text-green-600 ${isMobile ? 'text-sm' : ''}`}>
                          {trailDistance >= 1 ? `${trailDistance.toFixed(1)} km` : `${(trailDistance * 1000).toFixed(0)} m`}
                        </span>
                      </div>
                    </div>
                    
                    {mountain.elevation && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ElevationIcon />
                            <span className={`ml-2 text-gray-700 ${isMobile ? 'text-sm' : ''}`}>Ketinggian Puncak</span>
                          </div>
                          <span className={`font-bold text-purple-600 ${isMobile ? 'text-sm' : ''}`}>
                            {mountain.elevation >= 1000 ? `${(mountain.elevation / 1000).toFixed(1)} km` : `${mountain.elevation} m`}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Elevation Statistics */}
                    {pointsWithElevation.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className={`font-semibold text-orange-800 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>📊 Statistik Ketinggian Titik</div>
                        <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
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
                            <span className={`ml-2 text-gray-700 ${isMobile ? 'text-sm' : ''}`}>Estimasi Waktu</span>
                          </div>
                          <span className={`font-bold text-red-600 ${isMobile ? 'text-sm' : ''}`}>{mountain.estimated_time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Weather Info Card */}
              <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl ${isMobile ? 'p-4 mb-4' : 'p-6 mb-6'} animate-fade-in-up`}>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-4`}>Info Cuaca</h3>
                <p className={`text-gray-600 mb-3 ${isMobile ? 'text-sm' : ''}`}>
                  Cek prakiraan cuaca terbaru sebelum mendaki untuk keselamatan Anda.
                </p>
                
                {/* Current Weather Quick View */}
                {weatherData && weatherData.current && weatherData.current.weather && weatherData.current.weather[0] && (
                  <div className={`bg-white rounded-lg ${isMobile ? 'p-2 mb-2' : 'p-3 mb-3'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`${isMobile ? 'text-xl mr-2' : 'text-2xl mr-2'}`}>{getWeatherEmoji(weatherData.current.weather[0].main)}</span>
                        <div>
                          <div className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>{Math.round(weatherData.current.temp)}°C</div>
                          <div className={`text-gray-500 capitalize ${isMobile ? 'text-xs' : 'text-xs'}`}>{weatherData.current.weather[0].description}</div>
                        </div>
                      </div>
                      <div className={`text-right ${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                        <div>💧 {weatherData.current.humidity}%</div>
                        <div>💨 {weatherData.current.wind_speed || 0} m/s</div>
                        <div>☀️ UV: {weatherData.current.uvi || 0}</div>
                      </div>
                    </div>
                    
                    {/* Weather Alert Badge */}
                    {weatherData.alerts && weatherData.alerts.length > 0 && (
                      <div className={`mt-2 px-2 py-1 bg-red-100 text-red-800 ${isMobile ? 'text-xs' : 'text-xs'} rounded-full inline-block`}>
                        ⚠️ {weatherData.alerts.length} Peringatan Cuaca
                      </div>
                    )}
                  </div>
                )}
                
                <a 
                  href={`https://www.bmkg.go.id/cuaca/prakiraan-cuaca.bmkg?Kota=${mountain.kota}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center text-blue-600 hover:text-blue-700 font-medium ${isMobile ? 'text-sm' : ''}`}
                >
                  Lihat Prakiraan Lengkap
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              
              {/* Trail Segments Information */}
              {trailSegments.length > 0 && (
                <div className={`bg-gradient-to-br from-green-50 to-green-100 rounded-2xl ${isMobile ? 'p-4 mb-4' : 'p-6 mb-6'} animate-fade-in-up`}>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-4`}>Segmen Jalur</h3>
                  <div className="space-y-3">
                    {trailSegments.map((segment, index) => (
                      <div key={index} className={`bg-white rounded-lg ${isMobile ? 'p-2' : 'p-3'} border border-green-200`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{segment.name}</h4>
                            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>{segment.description}</p>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-green-600 ${isMobile ? 'text-sm' : ''}`}>
                              {segment.distance.toFixed(2)} km
                            </div>
                            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Panjang</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Points with Elevation Information */}
              {pointsWithElevation.length > 0 && (
                <div className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl ${isMobile ? 'p-4' : 'p-6'} animate-fade-in-up`}>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-4`}>Titik Penting</h3>
                  <div className={`space-y-3 ${isMobile ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
                    {pointsWithElevation.map((point, index) => (
                      <div key={index} className={`bg-white rounded-lg ${isMobile ? 'p-2' : 'p-3'} border border-orange-200`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{point.name}</h4>
                            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>{point.description || 'Tidak ada deskripsi'}</p>
                            <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              Koordinat: {parseFloat(point.latitude).toFixed(4)}, {parseFloat(point.longitude).toFixed(4)}
                            </div>
                          </div>
                          <div className="text-right">
                            {point.elevation !== null && !point.elevationError ? (
                              <div className={`font-bold text-orange-600 ${isMobile ? 'text-sm' : ''}`}>
                                {Math.round(point.elevation)} m
                              </div>
                            ) : elevationLoading ? (
                              <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Loading...</div>
                            ) : (
                              <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>N/A</div>
                            )}
                            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Ketinggian</div>
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

  let directusData = [];
  let directusPoints = [];
  let directusLines = [];
  let centerCoordinates = [107.601529, -6.917464]; // Default coordinates

  try {
    const pointKey = mountain.point || 'point_burangrang';
    const trackKey = mountain.track || 'jalur_burangrang';

    // Try to fetch from a unified collection if it exists
    try {
      const geoDataRes = await fetch(`https://adrianfirmansyah-website.my.id/trailview/items/geo_features?filter[mountain_id][_eq]=${params.id}`);
      if (geoDataRes.ok) {
        const geoData = await geoDataRes.json();
        directusData = geoData.data || [];
      }
    } catch (error) {
      console.log('No unified geo collection found, using separate collections');
    }

    // If no unified data, fall back to separate point and track collections
    if (directusData.length === 0) {
      // Fetch points
      try {
        const resPoints = await fetch(`https://adrianfirmansyah-website.my.id/trailview/items/${pointKey}`);
        if (resPoints.ok) {
          const pointsData = await resPoints.json();
          directusPoints = pointsData.data || [];
        }
      } catch (error) {
        console.warn(`Failed to fetch points from ${pointKey}:`, error);
      }

      // Fetch lines/tracks
      try {
        const resLines = await fetch(`https://adrianfirmansyah-website.my.id/trailview/items/${trackKey}`);
        if (resLines.ok) {
          const linesData = await resLines.json();
          directusLines = linesData.data || [];
        }
      } catch (error) {
        console.warn(`Failed to fetch lines from ${trackKey}:`, error);
      }
    }

    // Determine center coordinates
    if (directusData.length > 0) {
      // Find center from GeoJSON data
      const firstFeature = directusData.find(item => item.geom);
      if (firstFeature && firstFeature.geom) {
        if (firstFeature.geom.type === 'Point') {
          centerCoordinates = firstFeature.geom.coordinates.slice(0, 2);
        } else if (firstFeature.geom.type === 'LineString' && firstFeature.geom.coordinates.length > 0) {
          centerCoordinates = firstFeature.geom.coordinates[0].slice(0, 2);
        }
      }
    } else if (directusPoints.length > 0) {
      // Use old point format
      const startPoint = directusPoints.find(point => 
        point.name && (
          point.name.toLowerCase().includes('start') || 
          point.name.toLowerCase().includes('puncak')
        )
      ) || directusPoints[0];
      
      if (startPoint && startPoint.latitude && startPoint.longitude) {
        centerCoordinates = [parseFloat(startPoint.longitude), parseFloat(startPoint.latitude)];
      }
    } else if (directusLines.length > 0 && directusLines[0].coordinates && directusLines[0].coordinates.length > 0) {
      // Use old line format
      const firstCoord = directusLines[0].coordinates[0];
      centerCoordinates = [firstCoord[0], firstCoord[1]];
    }

  } catch (error) {
    console.error('Error fetching trail data:', error);
    // Continue with empty data and default coordinates
  }

  return {
    props: {
      mountain,
      directusData, // New GeoJSON format data
      directusPoints, // Fallback old format
      directusLines, // Fallback old format  
      centerCoordinates
    },
    revalidate: 10,
  };
}