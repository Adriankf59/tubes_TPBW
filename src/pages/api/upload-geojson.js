// pages/api/upload-geojson.js
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

// Function to sanitize filename for table naming
function sanitizeTableName(filename) {
  return filename
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

// Function to validate GeoJSON geometry
function validateGeometry(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return false;
  }

  const validTypes = ['Point', 'LineString', 'MultiLineString', 'Polygon'];
  if (!validTypes.includes(geometry.type)) {
    return false;
  }

  // Validate coordinates based on geometry type
  switch (geometry.type) {
    case 'Point':
      return validateCoordinate(geometry.coordinates);
    
    case 'LineString':
      return Array.isArray(geometry.coordinates) && 
             geometry.coordinates.length >= 2 &&
             geometry.coordinates.every(coord => validateCoordinate(coord));
    
    case 'MultiLineString':
      return Array.isArray(geometry.coordinates) &&
             geometry.coordinates.every(line => 
               Array.isArray(line) && 
               line.length >= 2 &&
               line.every(coord => validateCoordinate(coord))
             );
    
    case 'Polygon':
      return Array.isArray(geometry.coordinates) &&
             geometry.coordinates.length > 0 &&
             geometry.coordinates.every(ring =>
               Array.isArray(ring) &&
               ring.length >= 4 &&
               ring.every(coord => validateCoordinate(coord))
             );
    
    default:
      return false;
  }
}

// Function to validate individual coordinate
function validateCoordinate(coord) {
  if (!Array.isArray(coord) || coord.length < 2) {
    return false;
  }

  const [lon, lat] = coord;
  return typeof lon === 'number' && 
         typeof lat === 'number' && 
         !isNaN(lon) && !isNaN(lat) &&
         lon >= -180 && lon <= 180 &&
         lat >= -90 && lat <= 90;
}

// Function to create GeoJSON table
async function createGeoJSONTable(client, tableName) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      geom JSONB NOT NULL,
      timestamp TIMESTAMP,
      begin_time TIMESTAMP,
      end_time TIMESTAMP,
      altitudemode VARCHAR(50),
      tessellate INTEGER DEFAULT -1,
      extrude INTEGER DEFAULT 0,
      visibility INTEGER DEFAULT -1,
      draworder INTEGER,
      icon VARCHAR(255),
      properties JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await client.query(createTableQuery);

  // Create indexes for better performance
  const createIndexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_${tableName}_geom ON ${tableName} USING GIN (geom);`,
    `CREATE INDEX IF NOT EXISTS idx_${tableName}_name ON ${tableName} (name);`,
    `CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName} (created_at);`
  ];

  for (const indexQuery of createIndexQueries) {
    try {
      await client.query(indexQuery);
    } catch (error) {
      console.warn(`Warning: Could not create index: ${error.message}`);
    }
  }

  return tableName;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  
  try {
    // Validate request body
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { features, filename, format } = req.body;

    // Validate input data
    if (!features || !Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ error: 'No valid features provided' });
    }

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Valid filename is required' });
    }

    if (format !== 'geojson') {
      return res.status(400).json({ error: 'This endpoint only supports GeoJSON format' });
    }

    // Sanitize filename for table naming
    const sanitizedFilename = sanitizeTableName(filename);
    
    if (!sanitizedFilename || sanitizedFilename.length === 0) {
      return res.status(400).json({ error: 'Invalid filename for table creation' });
    }

    // Create table name
    const tableName = `geo_${sanitizedFilename}`;

    // Validate features
    const validFeatures = [];
    const errors = [];

    features.forEach((feature, index) => {
      try {
        if (!feature || typeof feature !== 'object') {
          errors.push(`Feature ${index + 1}: Invalid feature object`);
          return;
        }

        if (!feature.geom || !validateGeometry(feature.geom)) {
          errors.push(`Feature ${index + 1}: Invalid geometry`);
          return;
        }

        validFeatures.push({
          id: feature.id || null,
          name: String(feature.name || `Feature ${index + 1}`).substring(0, 255),
          description: String(feature.description || '').substring(0, 2000),
          geom: feature.geom,
          timestamp: feature.timestamp || null,
          begin_time: feature.begin || null,
          end_time: feature.end || null,
          altitudemode: feature.altitudemode || null,
          tessellate: typeof feature.tessellate === 'number' ? feature.tessellate : -1,
          extrude: typeof feature.extrude === 'number' ? feature.extrude : 0,
          visibility: typeof feature.visibility === 'number' ? feature.visibility : -1,
          draworder: feature.draworder || null,
          icon: feature.icon || null,
          properties: feature.properties || {}
        });
      } catch (error) {
        errors.push(`Feature ${index + 1}: ${error.message}`);
      }
    });

    // Check if we have any valid data
    if (validFeatures.length === 0) {
      return res.status(400).json({ 
        error: 'No valid features to upload',
        details: errors.slice(0, 10)
      });
    }

    // Connect to database
    client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create GeoJSON table
      const createdTableName = await createGeoJSONTable(client, tableName);

      let featuresInserted = 0;
      const insertErrors = [];

      // Insert features
      for (const feature of validFeatures) {
        try {
          const insertQuery = `
            INSERT INTO ${tableName} (
              name, description, geom, timestamp, begin_time, end_time,
              altitudemode, tessellate, extrude, visibility, draworder, icon, properties
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `;
          
          await client.query(insertQuery, [
            feature.name,
            feature.description,
            JSON.stringify(feature.geom),
            feature.timestamp,
            feature.begin_time,
            feature.end_time,
            feature.altitudemode,
            feature.tessellate,
            feature.extrude,
            feature.visibility,
            feature.draworder,
            feature.icon,
            JSON.stringify(feature.properties)
          ]);
          
          featuresInserted++;
        } catch (err) {
          console.error(`Error inserting feature ${feature.name}:`, err);
          insertErrors.push(`Feature ${feature.name}: ${err.message}`);
        }
      }

      await client.query('COMMIT');

      // Return success response
      const response = {
        message: 'GeoJSON data uploaded successfully',
        featuresInserted,
        tableName: createdTableName,
        filename: sanitizedFilename,
        format: 'geojson'
      };

      // Include validation warnings if any
      if (errors.length > 0) {
        response.warnings = {
          validationErrors: errors.slice(0, 10),
          totalValidationErrors: errors.length
        };
      }

      // Include insert errors if any
      if (insertErrors.length > 0) {
        response.warnings = response.warnings || {};
        response.warnings.insertErrors = insertErrors.slice(0, 10);
        response.warnings.totalInsertErrors = insertErrors.length;
      }

      res.status(200).json(response);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Database error:', error);
    
    // Return proper JSON error response
    const errorResponse = {
      error: 'Database error occurred',
      message: error.message,
      timestamp: new Date().toISOString()
    };

    // Don't expose sensitive database details in production
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = error.stack;
    }

    res.status(500).json(errorResponse);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Increase body size limit for large files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};