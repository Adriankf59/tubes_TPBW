// pages/api/mountains.js (Updated version with GeoJSON support)
import { Pool } from 'pg';

// Configure PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || '70.153.193.19',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'trailviewid_db',
  user: process.env.DB_USER || 'trailviewid_user',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Function to get all table names that start with 'point_' or 'jalur_'
async function getDataTables(client) {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE 'point_%' OR table_name LIKE 'jalur_%')
    ORDER BY table_name;
  `;
  
  const result = await client.query(query);
  return result.rows.map(row => row.table_name);
}

// Function to get existing metadata
async function getExistingMetadata(client) {
  try {
    const query = `SELECT * FROM mountain_metadata`;
    const result = await client.query(query);
    
    const metadataMap = {};
    result.rows.forEach(row => {
      metadataMap[row.mountain_name] = row;
    });
    
    return metadataMap;
  } catch (error) {
    return {};
  }
}

// Function to convert GeoJSON data from new format to old format for compatibility
function convertGeoJSONToOldFormat(geoData) {
  const points = [];
  const tracks = [];
  
  geoData.forEach(item => {
    if (item.geom && item.geom.type && item.geom.coordinates) {
      if (item.geom.type === 'Point') {
        points.push({
          id: item.id,
          name: item.name || `Point ${item.id}`,
          description: item.description || '',
          latitude: item.geom.coordinates[1],
          longitude: item.geom.coordinates[0],
          altitude: item.geom.coordinates[2] || 0
        });
      } else if (item.geom.type === 'LineString') {
        tracks.push({
          id: item.id,
          name: item.name || `Track ${item.id}`,
          description: item.description || '',
          coordinates: item.geom.coordinates
        });
      } else if (item.geom.type === 'MultiLineString') {
        // Handle MultiLineString by converting to multiple LineStrings
        item.geom.coordinates.forEach((coords, idx) => {
          tracks.push({
            id: `${item.id}_${idx}`,
            name: `${item.name || `Track ${item.id}`}${idx > 0 ? ` (${idx + 1})` : ''}`,
            description: item.description || '',
            coordinates: coords
          });
        });
      }
    }
  });
  
  return { points, tracks };
}

// Function to check if a table exists and get sample data
async function checkTableAndGetSample(client, tableName) {
  try {
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    const checkResult = await client.query(checkQuery, [tableName]);
    
    if (!checkResult.rows[0].exists) {
      return null;
    }

    // Get sample data to determine structure
    const sampleQuery = `SELECT * FROM ${tableName} LIMIT 5`;
    const sampleResult = await client.query(sampleQuery);
    
    return {
      exists: true,
      sampleData: sampleResult.rows,
      columns: sampleResult.fields.map(field => field.name)
    };
  } catch (error) {
    console.warn(`Error checking table ${tableName}:`, error.message);
    return null;
  }
}

// Function to detect and fetch GeoJSON data
async function fetchGeoJSONData(client, tableName) {
  try {
    const tableInfo = await checkTableAndGetSample(client, tableName);
    
    if (!tableInfo || !tableInfo.exists) {
      return [];
    }

    // Check if this table contains GeoJSON data (has 'geom' column)
    const hasGeomColumn = tableInfo.columns.includes('geom');
    
    if (hasGeomColumn) {
      // This is a GeoJSON table - fetch all data
      const query = `
        SELECT id, name, description, geom, 
               timestamp, begin_time, end_time, altitudemode, 
               tessellate, extrude, visibility, draworder, icon
        FROM ${tableName} 
        ORDER BY id
      `;
      const result = await client.query(query);
      return result.rows;
    }
    
    return [];
  } catch (error) {
    console.warn(`Error fetching GeoJSON data from ${tableName}:`, error.message);
    return [];
  }
}

// Function to fetch old format data
async function fetchOldFormatData(client, pointTableName, trackTableName) {
  const result = {
    points: [],
    tracks: []
  };
  
  // Get points
  try {
    const pointQuery = `SELECT * FROM ${pointTableName} ORDER BY name`;
    const pointResult = await client.query(pointQuery);
    result.points = pointResult.rows;
  } catch (error) {
    console.warn(`Point table ${pointTableName} not found or error:`, error.message);
  }
  
  // Get tracks
  try {
    const trackQuery = `SELECT * FROM ${trackTableName} ORDER BY name`;
    const trackResult = await client.query(trackQuery);
    result.tracks = trackResult.rows.map(track => ({
      ...track,
      coordinates: typeof track.coordinates === 'string' 
        ? JSON.parse(track.coordinates) 
        : track.coordinates
    }));
  } catch (error) {
    console.warn(`Track table ${trackTableName} not found or error:`, error.message);
  }
  
  return result;
}

// Function to get mountain data by grouping point and track tables
async function getMountainData(client) {
  const tables = await getDataTables(client);
  const metadataMap = await getExistingMetadata(client);
  
  // Group tables by mountain name
  const mountainGroups = {};
  
  tables.forEach(tableName => {
    let mountainName;
    if (tableName.startsWith('point_')) {
      mountainName = tableName.substring(6);
    } else if (tableName.startsWith('jalur_')) {
      mountainName = tableName.substring(6);
    }
    
    if (mountainName) {
      if (!mountainGroups[mountainName]) {
        mountainGroups[mountainName] = {};
      }
      
      if (tableName.startsWith('point_')) {
        mountainGroups[mountainName].pointTable = tableName;
      } else if (tableName.startsWith('jalur_')) {
        mountainGroups[mountainName].trackTable = tableName;
      }
    }
  });

  // Also check for new GeoJSON format tables
  const allTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name NOT LIKE 'point_%' 
    AND table_name NOT LIKE 'jalur_%'
    AND table_name != 'mountain_metadata'
    ORDER BY table_name;
  `);
  
  for (const row of allTables.rows) {
    const tableName = row.table_name;
    const tableInfo = await checkTableAndGetSample(client, tableName);
    
    if (tableInfo && tableInfo.columns.includes('geom')) {
      // This might be a GeoJSON table for a mountain
      const mountainName = tableName.replace(/^geo_/, '').replace(/_features$/, '');
      
      if (!mountainGroups[mountainName]) {
        mountainGroups[mountainName] = {};
      }
      mountainGroups[mountainName].geoTable = tableName;
    }
  }
  
  // Build mountain data
  const mountains = [];
  let id = 1;
  
  for (const [mountainName, tables] of Object.entries(mountainGroups)) {
    const metadata = metadataMap[mountainName];
    
    let elevation = "";
    let samplePointName = "";
    let kota = "";
    let provinsi = "";
    let coordinates = null;
    
    // Try to get data from GeoJSON table first, then fall back to old format
    if (tables.geoTable) {
      try {
        const geoData = await fetchGeoJSONData(client, tables.geoTable);
        if (geoData.length > 0) {
          const converted = convertGeoJSONToOldFormat(geoData);
          if (converted.points.length > 0) {
            const firstPoint = converted.points[0];
            samplePointName = firstPoint.name;
            elevation = firstPoint.altitude ? Math.round(firstPoint.altitude).toString() : "";
            coordinates = {
              latitude: firstPoint.latitude,
              longitude: firstPoint.longitude
            };
          }
        }
      } catch (error) {
        console.warn(`Error processing GeoJSON table ${tables.geoTable}:`, error.message);
      }
    } else if (tables.pointTable) {
      try {
        const pointQuery = `SELECT name, latitude, longitude, altitude FROM ${tables.pointTable} LIMIT 1`;
        const pointResult = await client.query(pointQuery);
        
        if (pointResult.rows.length > 0) {
          const point = pointResult.rows[0];
          samplePointName = point.name || mountainName;
          elevation = point.altitude ? Math.round(point.altitude).toString() : "";
          coordinates = {
            latitude: point.latitude,
            longitude: point.longitude
          };
        }
      } catch (error) {
        console.warn(`Error querying ${tables.pointTable}:`, error.message);
      }
    }
    
    // Use metadata if available, otherwise use defaults or inferred data
    if (metadata) {
      const mountain = {
        id: id++,
        name: metadata.display_name || mountainName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        kota: metadata.kota || kota,
        provinsi: metadata.provinsi || provinsi,
        elevation: metadata.elevation ? metadata.elevation.toString() : elevation,
        difficulty: metadata.difficulty || "Medium",
        image: metadata.image_url || "",
        rating: metadata.rating ? metadata.rating.toString() : "4.0",
        penjelasan: metadata.description || `Data jalur pendakian ${mountainName.replace(/_/g, ' ')} yang telah diupload ke sistem TrailView ID.`,
        point: tables.pointTable || "",
        track: tables.trackTable || "",
        geoTable: tables.geoTable || "", // New field for GeoJSON table
        coordinates: coordinates,
        dataFormat: tables.geoTable ? 'geojson' : 'legacy' // Indicate data format
      };
      
      mountains.push(mountain);
    } else {
      // Mountain name inference logic (existing code)
      if (mountainName.toLowerCase().includes('ciremai')) {
        kota = "Kuningan";
        provinsi = "Jawa Barat";
        elevation = elevation || "3078";
      } else if (mountainName.toLowerCase().includes('merapi')) {
        kota = "Sleman";
        provinsi = "Yogyakarta";
        elevation = elevation || "2930";
      } else if (mountainName.toLowerCase().includes('bromo')) {
        kota = "Probolinggo";
        provinsi = "Jawa Timur";
        elevation = elevation || "2329";
      } else if (mountainName.toLowerCase().includes('semeru')) {
        kota = "Lumajang";
        provinsi = "Jawa Timur";
        elevation = elevation || "3676";
      } else if (mountainName.toLowerCase().includes('rinjani')) {
        kota = "Lombok Timur";
        provinsi = "Nusa Tenggara Barat";
        elevation = elevation || "3726";
      } else if (mountainName.toLowerCase().includes('kerinci')) {
        kota = "Kerinci";
        provinsi = "Jambi";
        elevation = elevation || "3805";
      } else if (mountainName.toLowerCase().includes('lawu')) {
        kota = "Karanganyar";
        provinsi = "Jawa Tengah";
        elevation = elevation || "3265";
      } else if (mountainName.toLowerCase().includes('merbabu')) {
        kota = "Magelang";
        provinsi = "Jawa Tengah";
        elevation = elevation || "3145";
      } else if (mountainName.toLowerCase().includes('sindoro')) {
        kota = "Wonosobo";
        provinsi = "Jawa Tengah";
        elevation = elevation || "3153";
      } else if (mountainName.toLowerCase().includes('sumbing')) {
        kota = "Wonosobo";
        provinsi = "Jawa Tengah";
        elevation = elevation || "3371";
      }
      
      const mountain = {
        id: id++,
        name: samplePointName || mountainName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        kota: kota,
        provinsi: provinsi,
        elevation: elevation,
        difficulty: "Medium",
        image: "",
        rating: "4.0",
        penjelasan: `Data jalur pendakian ${mountainName.replace(/_/g, ' ')} yang telah diupload ke sistem TrailView ID.`,
        point: tables.pointTable || "",
        track: tables.trackTable || "",
        geoTable: tables.geoTable || "",
        coordinates: coordinates,
        dataFormat: tables.geoTable ? 'geojson' : 'legacy'
      };
      
      mountains.push(mountain);
    }
  }
  
  return mountains.sort((a, b) => a.name.localeCompare(b.name));
}

// Function to get detailed mountain info including points and tracks
async function getDetailedMountainInfo(client, mountainName, useGeoJSON = false) {
  const pointTableName = `point_${mountainName}`;
  const trackTableName = `jalur_${mountainName}`;
  const geoTableName = `geo_${mountainName}` || mountainName; // Could be various naming conventions
  
  const result = {
    mountain_name: mountainName,
    points: [],
    tracks: [],
    geoData: [], // New field for raw GeoJSON data
    dataFormat: 'unknown'
  };
  
  // Try to fetch GeoJSON data first
  if (useGeoJSON) {
    try {
      const geoData = await fetchGeoJSONData(client, geoTableName);
      if (geoData.length > 0) {
        result.geoData = geoData;
        result.dataFormat = 'geojson';
        
        // Also convert to old format for compatibility
        const converted = convertGeoJSONToOldFormat(geoData);
        result.points = converted.points;
        result.tracks = converted.tracks;
        
        return result;
      }
    } catch (error) {
      console.warn(`Error fetching GeoJSON data for ${mountainName}:`, error.message);
    }
  }
  
  // Fall back to old format
  const oldFormatData = await fetchOldFormatData(client, pointTableName, trackTableName);
  result.points = oldFormatData.points;
  result.tracks = oldFormatData.tracks;
  result.dataFormat = 'legacy';
  
  return result;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { detailed, mountain, format } = req.query;
    const useGeoJSON = format === 'geojson';
    const client = await pool.connect();
    
    try {
      if (detailed === 'true' && mountain) {
        // Get detailed info for specific mountain
        const detailedInfo = await getDetailedMountainInfo(client, mountain, useGeoJSON);
        res.status(200).json(detailedInfo);
      } else {
        // Get all mountains summary
        const mountains = await getMountainData(client);
        res.status(200).json(mountains);
      }
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database error: ' + error.message 
    });
  }
}

// Export utility functions for use in other files
export { 
  getMountainData, 
  getDetailedMountainInfo, 
  getDataTables, 
  fetchGeoJSONData, 
  convertGeoJSONToOldFormat 
};