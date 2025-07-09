// pages/api/upload.js - FIXED VERSION
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

// Function to validate coordinates
function validateCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return false;
  }
  
  const [lon, lat] = coordinates;
  return (
    typeof lon === 'number' && 
    typeof lat === 'number' && 
    !isNaN(lon) && !isNaN(lat) &&
    lon >= -180 && lon <= 180 &&
    lat >= -90 && lat <= 90
  );
}

// Function to validate track coordinates
function validateTrackCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }
  
  return coordinates.every(coord => validateCoordinates(coord));
}

// Function to create tables dynamically
async function createTables(client, tableName) {
  const pointTableName = `point_${tableName}`;
  const trackTableName = `jalur_${tableName}`;

  const createPointsTableQuery = `
    CREATE TABLE IF NOT EXISTS ${pointTableName} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      altitude DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTracksTableQuery = `
    CREATE TABLE IF NOT EXISTS ${trackTableName} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      coordinates JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await client.query(createPointsTableQuery);
  await client.query(createTracksTableQuery);

  return { pointTableName, trackTableName };
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

    const { points, tracks, filename } = req.body;

    // Validate input data
    if ((!points || !Array.isArray(points) || points.length === 0) && 
        (!tracks || !Array.isArray(tracks) || tracks.length === 0)) {
      return res.status(400).json({ error: 'No valid points or tracks provided' });
    }

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Valid filename is required' });
    }

    // Sanitize filename for table naming
    const sanitizedFilename = sanitizeTableName(filename);
    
    if (!sanitizedFilename || sanitizedFilename.length === 0) {
      return res.status(400).json({ error: 'Invalid filename for table creation' });
    }

    // Validate data before processing
    const validPoints = [];
    const validTracks = [];
    const errors = [];

    // Validate points
    if (points && Array.isArray(points)) {
      points.forEach((point, index) => {
        try {
          if (!point || typeof point !== 'object') {
            errors.push(`Point ${index + 1}: Invalid point object`);
            return;
          }

          if (!validateCoordinates(point.coordinates)) {
            errors.push(`Point ${index + 1}: Invalid coordinates`);
            return;
          }

          validPoints.push({
            name: String(point.name || 'Unnamed Point').substring(0, 255),
            description: String(point.description || '').substring(0, 1000),
            coordinates: point.coordinates
          });
        } catch (error) {
          errors.push(`Point ${index + 1}: ${error.message}`);
        }
      });
    }

    // Validate tracks
    if (tracks && Array.isArray(tracks)) {
      tracks.forEach((track, index) => {
        try {
          if (!track || typeof track !== 'object') {
            errors.push(`Track ${index + 1}: Invalid track object`);
            return;
          }

          if (!validateTrackCoordinates(track.coordinates)) {
            errors.push(`Track ${index + 1}: Invalid track coordinates`);
            return;
          }

          validTracks.push({
            name: String(track.name || 'Unnamed Track').substring(0, 255),
            description: String(track.description || '').substring(0, 1000),
            coordinates: track.coordinates
          });
        } catch (error) {
          errors.push(`Track ${index + 1}: ${error.message}`);
        }
      });
    }

    // Check if we have any valid data
    if (validPoints.length === 0 && validTracks.length === 0) {
      return res.status(400).json({ 
        error: 'No valid data to upload',
        details: errors.slice(0, 10) // Limit error details
      });
    }

    // Connect to database
    client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create tables dynamically
      const { pointTableName, trackTableName } = await createTables(client, sanitizedFilename);

      let pointsInserted = 0;
      let tracksInserted = 0;
      const insertErrors = [];

      // Insert points
      if (validPoints.length > 0) {
        for (const point of validPoints) {
          try {
            const insertPointQuery = `
              INSERT INTO ${pointTableName} (name, description, latitude, longitude, altitude) 
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await client.query(insertPointQuery, [
              point.name,
              point.description,
              point.coordinates[1], // latitude
              point.coordinates[0], // longitude
              point.coordinates[2] || 0 // altitude
            ]);
            pointsInserted++;
          } catch (err) {
            console.error(`Error inserting point ${point.name}:`, err);
            insertErrors.push(`Point ${point.name}: ${err.message}`);
          }
        }
      }

      // Insert tracks
      if (validTracks.length > 0) {
        for (const track of validTracks) {
          try {
            const insertTrackQuery = `
              INSERT INTO ${trackTableName} (name, description, coordinates) 
              VALUES ($1, $2, $3)
            `;
            
            await client.query(insertTrackQuery, [
              track.name,
              track.description,
              JSON.stringify(track.coordinates)
            ]);
            tracksInserted++;
          } catch (err) {
            console.error(`Error inserting track ${track.name}:`, err);
            insertErrors.push(`Track ${track.name}: ${err.message}`);
          }
        }
      }

      await client.query('COMMIT');

      // Return success response
      const response = {
        message: 'Data uploaded successfully',
        pointsInserted,
        tracksInserted,
        tablesCreated: {
          pointTable: pointTableName,
          trackTable: trackTableName
        },
        filename: sanitizedFilename
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

// Increase body size limit for large KMZ files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}