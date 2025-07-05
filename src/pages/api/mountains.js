// pages/api/mountains.js (Updated version)
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
    // Table doesn't exist yet
    return {};
  }
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
      mountainName = tableName.substring(6); // Remove 'point_' prefix
    } else if (tableName.startsWith('jalur_')) {
      mountainName = tableName.substring(6); // Remove 'jalur_' prefix
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
  
  // Build mountain data
  const mountains = [];
  let id = 1;
  
  for (const [mountainName, tables] of Object.entries(mountainGroups)) {
    // Check if metadata exists for this mountain
    const metadata = metadataMap[mountainName];
    
    // Get sample data to determine elevation and other info if metadata doesn't exist
    let elevation = "";
    let samplePointName = "";
    let kota = "";
    let provinsi = "";
    let coordinates = null;
    
    // Try to get data from point table if exists
    if (tables.pointTable) {
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
        coordinates: coordinates
      };
      
      mountains.push(mountain);
    } else {
      // Try to determine location based on mountain name or coordinates
      // This is a simple heuristic - you might want to enhance this
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
      // Add more mountain-specific data as needed
      
      const mountain = {
        id: id++,
        name: samplePointName || mountainName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        kota: kota,
        provinsi: provinsi,
        elevation: elevation,
        difficulty: "Medium", // Default difficulty
        image: "",
        rating: "4.0", // Default rating
        penjelasan: `Data jalur pendakian ${mountainName.replace(/_/g, ' ')} yang telah diupload ke sistem TrailView ID.`,
        point: tables.pointTable || "",
        track: tables.trackTable || "",
        coordinates: coordinates
      };
      
      mountains.push(mountain);
    }
  }
  
  return mountains.sort((a, b) => a.name.localeCompare(b.name));
}

// Function to get detailed mountain info including points and tracks
async function getDetailedMountainInfo(client, mountainName) {
  const pointTableName = `point_${mountainName}`;
  const trackTableName = `jalur_${mountainName}`;
  
  const result = {
    mountain_name: mountainName,
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
    const { detailed, mountain } = req.query;
    const client = await pool.connect();
    
    try {
      if (detailed === 'true' && mountain) {
        // Get detailed info for specific mountain
        const detailedInfo = await getDetailedMountainInfo(client, mountain);
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
export { getMountainData, getDetailedMountainInfo, getDataTables };