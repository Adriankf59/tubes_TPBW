// utils/geoJsonHandler.js - Utility untuk menangani data GeoJSON dari Directus

/**
 * Mengkonversi data dari Directus yang berformat GeoJSON seperti contoh yang diberikan
 * ke format yang kompatibel dengan komponen peta
 */
export function processDirectusGeoData(directusData) {
  if (!directusData || !Array.isArray(directusData)) {
    return { points: [], lines: [], features: [] };
  }

  const points = [];
  const lines = [];
  const features = [];

  directusData.forEach((item, index) => {
    if (!item.geom || !item.geom.type || !item.geom.coordinates) {
      console.warn(`Item ${item.id || index} tidak memiliki data geometri yang valid`);
      return;
    }

    const feature = {
      type: 'Feature',
      geometry: item.geom,
      properties: {
        id: item.id,
        name: item.name || `Feature ${item.id}`,
        description: item.description || '',
        timestamp: item.timestamp,
        begin: item.begin,
        end: item.end,
        altitudemode: item.altitudemode,
        tessellate: item.tessellate,
        extrude: item.extrude,
        visibility: item.visibility,
        draworder: item.draworder,
        icon: item.icon
      }
    };

    features.push(feature);

    // Pisahkan berdasarkan tipe geometri
    switch (item.geom.type) {
      case 'Point':
        points.push({
          id: item.id,
          name: item.name || `Point ${item.id}`,
          description: item.description || '',
          latitude: item.geom.coordinates[1],
          longitude: item.geom.coordinates[0],
          altitude: item.geom.coordinates[2] || 0,
          elevation: item.geom.coordinates[2] || 0,
          properties: feature.properties
        });
        break;

      case 'LineString':
        lines.push({
          id: item.id,
          name: item.name || `Track ${item.id}`,
          description: item.description || '',
          coordinates: item.geom.coordinates,
          properties: feature.properties
        });
        break;

      case 'MultiLineString':
        // Handle MultiLineString dengan memecahnya menjadi beberapa LineString
        item.geom.coordinates.forEach((coords, segmentIndex) => {
          lines.push({
            id: `${item.id}_${segmentIndex}`,
            name: `${item.name || `Track ${item.id}`}${segmentIndex > 0 ? ` (Segment ${segmentIndex + 1})` : ''}`,
            description: item.description || '',
            coordinates: coords,
            properties: {
              ...feature.properties,
              segmentIndex: segmentIndex,
              isMultiSegment: true
            }
          });
        });
        break;

      case 'Polygon':
        // Konversi polygon menjadi LineString untuk jalur
        if (item.geom.coordinates && item.geom.coordinates[0]) {
          lines.push({
            id: item.id,
            name: item.name || `Area ${item.id}`,
            description: item.description || '',
            coordinates: item.geom.coordinates[0], // Gunakan ring luar polygon
            properties: {
              ...feature.properties,
              originalType: 'Polygon'
            }
          });
        }
        break;

      default:
        console.warn(`Tipe geometri ${item.geom.type} tidak didukung untuk item ${item.id}`);
    }
  });

  return { points, lines, features };
}

/**
 * Menghitung center coordinates dari data GeoJSON
 */
export function calculateCenterFromGeoData(geoData) {
  if (!geoData || geoData.length === 0) {
    return [107.601529, -6.917464]; // Default coordinates (Indonesia)
  }

  const coordinates = [];

  geoData.forEach(item => {
    if (item.geom && item.geom.coordinates) {
      switch (item.geom.type) {
        case 'Point':
          coordinates.push(item.geom.coordinates.slice(0, 2));
          break;
        case 'LineString':
          coordinates.push(...item.geom.coordinates.map(coord => coord.slice(0, 2)));
          break;
        case 'MultiLineString':
          item.geom.coordinates.forEach(line => {
            coordinates.push(...line.map(coord => coord.slice(0, 2)));
          });
          break;
        case 'Polygon':
          if (item.geom.coordinates[0]) {
            coordinates.push(...item.geom.coordinates[0].map(coord => coord.slice(0, 2)));
          }
          break;
      }
    }
  });

  if (coordinates.length === 0) {
    return [107.601529, -6.917464];
  }

  // Hitung center dengan rata-rata koordinat
  const totalLon = coordinates.reduce((sum, coord) => sum + coord[0], 0);
  const totalLat = coordinates.reduce((sum, coord) => sum + coord[1], 0);
  
  return [totalLon / coordinates.length, totalLat / coordinates.length];
}

/**
 * Menghitung bounds dari data GeoJSON
 */
export function calculateBoundsFromGeoData(geoData) {
  if (!geoData || geoData.length === 0) {
    return null;
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  geoData.forEach(item => {
    if (item.geom && item.geom.coordinates) {
      const processCoordinate = (coord) => {
        const [lon, lat] = coord.slice(0, 2);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      };

      switch (item.geom.type) {
        case 'Point':
          processCoordinate(item.geom.coordinates);
          break;
        case 'LineString':
          item.geom.coordinates.forEach(processCoordinate);
          break;
        case 'MultiLineString':
          item.geom.coordinates.forEach(line => {
            line.forEach(processCoordinate);
          });
          break;
        case 'Polygon':
          if (item.geom.coordinates[0]) {
            item.geom.coordinates[0].forEach(processCoordinate);
          }
          break;
      }
    }
  });

  if (minLon === Infinity) {
    return null;
  }

  return {
    southwest: [minLon, minLat],
    northeast: [maxLon, maxLat],
    center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2]
  };
}

/**
 * Membuat GeoJSON FeatureCollection dari data Directus
 */
export function createGeoJSONFeatureCollection(directusData) {
  const processed = processDirectusGeoData(directusData);
  
  return {
    type: 'FeatureCollection',
    features: processed.features
  };
}

/**
 * Menghitung panjang total jalur dari data LineString
 */
export function calculateTotalDistance(lines) {
  if (!lines || lines.length === 0) {
    return 0;
  }

  let totalDistance = 0;

  lines.forEach(line => {
    if (line.coordinates && line.coordinates.length > 1) {
      for (let i = 0; i < line.coordinates.length - 1; i++) {
        const [lon1, lat1] = line.coordinates[i];
        const [lon2, lat2] = line.coordinates[i + 1];
        totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
      }
    }
  });

  return totalDistance;
}

/**
 * Hitung jarak menggunakan formula Haversine
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Mencari titik tertinggi dari data points
 */
export function findHighestPoint(points) {
  if (!points || points.length === 0) {
    return null;
  }

  return points.reduce((highest, point) => {
    const elevation = point.elevation || point.altitude || 0;
    const highestElevation = highest.elevation || highest.altitude || 0;
    
    return elevation > highestElevation ? point : highest;
  }, points[0]);
}

/**
 * Membuat statistik dari data jalur
 */
export function generateTrailStatistics(points, lines) {
  const stats = {
    totalDistance: calculateTotalDistance(lines),
    totalPoints: points.length,
    totalSegments: lines.length,
    elevationGain: 0,
    highestPoint: null,
    lowestPoint: null,
    averageElevation: 0
  };

  if (points.length > 0) {
    const elevations = points
      .map(p => p.elevation || p.altitude || 0)
      .filter(e => e > 0);
    
    if (elevations.length > 0) {
      stats.highestPoint = Math.max(...elevations);
      stats.lowestPoint = Math.min(...elevations);
      stats.averageElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
      stats.elevationGain = stats.highestPoint - stats.lowestPoint;
    }
  }

  return stats;
}

/**
 * Fungsi utama untuk memproses semua data dan menyiapkan untuk komponen React
 */
export function prepareMapData(directusGeoData) {
  const processed = processDirectusGeoData(directusGeoData);
  const center = calculateCenterFromGeoData(directusGeoData);
  const bounds = calculateBoundsFromGeoData(directusGeoData);
  const stats = generateTrailStatistics(processed.points, processed.lines);
  const featureCollection = createGeoJSONFeatureCollection(directusGeoData);

  return {
    points: processed.points,
    lines: processed.lines,
    features: processed.features,
    centerCoordinates: center,
    bounds: bounds,
    statistics: stats,
    geoJSON: featureCollection,
    rawData: directusGeoData
  };
}