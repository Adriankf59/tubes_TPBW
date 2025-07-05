// pages/api/upload.js
import { Pool } from 'pg';

// Configure PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || '70.153.193.19',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'trailviewid_db',
  user: process.env.DB_USER || 'trailviewid_user',
  password: process.env.DB_PASSWORD || 'postgres', // Ganti dengan password Anda
  // Optional: SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Function to sanitize filename for table naming
function sanitizeTableName(filename) {
  // Remove special characters and replace with underscore
  // Keep only alphanumeric characters and underscores
  return filename
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

// Function to create tables dynamically
async function createTables(client, tableName) {
  const pointTableName = `point_${tableName}`;
  const trackTableName = `jalur_${tableName}`;

  // Create points table
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

  // Create tracks table
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { points, tracks, filename } = req.body;

    if ((!points || points.length === 0) && (!tracks || tracks.length === 0)) {
      return res.status(400).json({ error: 'No data provided' });
    }

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Sanitize filename for table naming
    const sanitizedFilename = sanitizeTableName(filename);
    
    if (!sanitizedFilename) {
      return res.status(400).json({ error: 'Invalid filename for table creation' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create tables dynamically
      const { pointTableName, trackTableName } = await createTables(client, sanitizedFilename);

      let pointsInserted = 0;
      let tracksInserted = 0;

      // Insert points
      if (points && points.length > 0) {
        for (const point of points) {
          try {
            const insertPointQuery = `
              INSERT INTO ${pointTableName} (name, description, latitude, longitude, altitude) 
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await client.query(insertPointQuery, [
              point.name || 'Unnamed Point',
              point.description || '',
              point.coordinates[1], // latitude
              point.coordinates[0], // longitude
              point.coordinates[2] || 0 // altitude
            ]);
            pointsInserted++;
          } catch (err) {
            console.error(`Error inserting point ${point.name}:`, err);
            // Continue with other points instead of failing entirely
          }
        }
      }

      // Insert tracks
      if (tracks && tracks.length > 0) {
        for (const track of tracks) {
          try {
            const insertTrackQuery = `
              INSERT INTO ${trackTableName} (name, description, coordinates) 
              VALUES ($1, $2, $3)
            `;
            
            await client.query(insertTrackQuery, [
              track.name || 'Unnamed Track',
              track.description || '',
              JSON.stringify(track.coordinates)
            ]);
            tracksInserted++;
          } catch (err) {
            console.error(`Error inserting track ${track.name}:`, err);
            // Continue with other tracks instead of failing entirely
          }
        }
      }

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Data uploaded successfully',
        pointsInserted,
        tracksInserted,
        tablesCreated: {
          pointTable: pointTableName,
          trackTable: trackTableName
        },
        filename: sanitizedFilename
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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