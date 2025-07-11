// pages/api/upload.js - Fixed version to prevent overwriting existing mountain data
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

// Directus configuration
const DIRECTUS_URL = 'https://adrianfirmansyah-website.my.id/trailview';

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

// Function to create tables dynamically with auto-registration
async function createTables(client, tableName) {
  const pointTableName = `point_${tableName}`;
  const trackTableName = `jalur_${tableName}`;

  let useManualCreation = false;

  try {
    // Try to use wrapper functions first (if available)
    await client.query('SAVEPOINT before_wrapper');
    await client.query('SELECT create_point_table($1)', [tableName]);
    await client.query('SELECT create_jalur_table($1)', [tableName]);
    await client.query('RELEASE SAVEPOINT before_wrapper');
    
    console.log('Tables created using wrapper functions with auto-registration');
  } catch (error) {
    // Rollback to savepoint if wrapper functions fail
    await client.query('ROLLBACK TO SAVEPOINT before_wrapper');
    console.log('Wrapper functions not available, will create tables manually');
    useManualCreation = true;
  }

  if (useManualCreation) {
    // Fallback to manual creation
    const createPointsTableQuery = `
      CREATE TABLE IF NOT EXISTS ${pointTableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        altitude DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTracksTableQuery = `
      CREATE TABLE IF NOT EXISTS ${trackTableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        coordinates JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createPointsTableQuery);
    await client.query(createTracksTableQuery);
    
    console.log('Tables created manually. Event trigger should auto-register them.');
  }

  return { pointTableName, trackTableName };
}

// IMPROVED function to add mountain to database - preserves existing data
async function addToMountainsTable(mountainData, preserveExisting = true) {
  try {
    // Clean data - ensure no undefined values
    const cleanData = {
      name: mountainData.name || '',
      kota: mountainData.kota || '',
      provinsi: mountainData.provinsi || '',
      elevation: parseInt(mountainData.elevation) || 0,
      difficulty: mountainData.difficulty || 'Medium',
      image: mountainData.image || null,
      rating: parseFloat(mountainData.rating) || 4.0,
      penjelasan: mountainData.penjelasan || '',
      point: mountainData.point || '',
      track: mountainData.track || ''
    };

    console.log('Attempting to add mountain to database:', cleanData.name);
    
    // Try local API first (direct PostgreSQL) - this is more reliable
    try {
      console.log('Trying local mountains-upload API...');
      
      // Check if mountain exists first
      if (preserveExisting) {
        const checkResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mountains-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: cleanData.name })
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          if (checkResult.exists) {
            console.log(`Mountain "${cleanData.name}" already exists with full data, updating only point/track tables...`);
            
            // Only update point and track table references, preserve other data
            const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mountains-update-tables`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: cleanData.name,
                point: cleanData.point,
                track: cleanData.track
              })
            });

            if (updateResponse.ok) {
              const updateResult = await updateResponse.json();
              console.log('Mountain table references updated successfully');
              return updateResult;
            }
          }
        }
      }

      const localResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mountains-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData)
      });

      if (localResponse.ok) {
        const result = await localResponse.json();
        console.log('Mountain uploaded successfully via local API:', result.data?.name);
        return result;
      } else {
        const errorText = await localResponse.text();
        console.log('Local API failed:', errorText);
        throw new Error(`Local API error: ${localResponse.status}`);
      }
    } catch (localError) {
      console.log('Local API failed, trying Directus directly:', localError.message);
      
      // Fallback to Directus API - but first check if mountain exists
      try {
        const checkResponse = await fetch(
          `${DIRECTUS_URL}/items/mountains?filter[name][_eq]=${encodeURIComponent(cleanData.name)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          if (existing.data && existing.data.length > 0) {
            console.log(`Mountain "${cleanData.name}" already exists in Directus`);
            
            if (preserveExisting) {
              // Only update point and track references if they're provided
              const updateData = {};
              if (cleanData.point) updateData.point = cleanData.point;
              if (cleanData.track) updateData.track = cleanData.track;
              
              if (Object.keys(updateData).length > 0) {
                console.log('Updating only point/track references...');
                const updateResponse = await fetch(
                  `${DIRECTUS_URL}/items/mountains/${existing.data[0].id}`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                  }
                );
                
                if (updateResponse.ok) {
                  const result = await updateResponse.json();
                  console.log('Mountain table references updated successfully in Directus');
                  return result;
                } else {
                  console.log('Failed to update mountain references in Directus');
                }
              }
              
              return { success: true, message: 'Mountain already exists with full data', preserved: true };
            }
          }
        }
      } catch (checkError) {
        console.log('Could not check existing mountains in Directus:', checkError.message);
      }

      // Create new mountain in Directus only if it doesn't exist
      console.log('Creating new mountain in Directus...');
      const response = await fetch(`${DIRECTUS_URL}/items/mountains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Directus response error:', errorText);
        
        // Check if it's a specific error we can handle
        if (errorText.includes('duplicate') || errorText.includes('already exists')) {
          console.log('Mountain might already exist in Directus');
          return { success: true, message: 'Mountain already exists' };
        }
        
        throw new Error(`Failed to add mountain to Directus: ${response.status}`);
      }

      const result = await response.json();
      console.log('Mountain added to Directus successfully:', result.data?.id);
      return result;
    }
    
  } catch (error) {
    console.error('Error adding to mountains table:', error);
    // Don't throw error, just log it so the main operation continues
    return { success: false, error: error.message };
  }
}

// Function to sync with Directus data model
async function syncWithDirectus(pointTable, trackTable, mountainName) {
  try {
    console.log(`Tables ${pointTable} and ${trackTable} created for ${mountainName}`);
    console.log('Event trigger should auto-register these tables in Directus');
    
    return true;
  } catch (error) {
    console.error('Error in syncWithDirectus:', error);
    return false;
  }
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

      // Calculate average elevation from points
      let avgElevation = 0;
      if (validPoints.length > 0) {
        const totalElevation = validPoints.reduce((sum, point) => {
          return sum + (point.coordinates[2] || 0);
        }, 0);
        avgElevation = Math.round(totalElevation / validPoints.length);
      }

      // Prepare mountain data for mountains table
      const mountainName = filename
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      const mountainData = {
        name: mountainName,
        kota: '', // Keep empty for KMZ uploads - don't overwrite existing data
        provinsi: '', // Keep empty for KMZ uploads - don't overwrite existing data
        elevation: avgElevation || 0,
        difficulty: 'Medium',
        image: '',
        rating: 4.0,
        penjelasan: `Data jalur pendakian ${mountainName} yang telah diupload ke sistem TrailView ID. Terdapat ${pointsInserted} titik lokasi dan ${tracksInserted} jalur pendakian.`,
        point: pointTableName,
        track: trackTableName
      };

      // Add to mountains table with preservation of existing data
      let mountainAddResult = null;
      try {
        mountainAddResult = await addToMountainsTable(mountainData, true); // preserveExisting = true
        console.log('Mountain add result:', mountainAddResult);
      } catch (directusError) {
        console.error('Failed to add to mountains table:', directusError);
        // Don't fail the whole operation if mountains table fails
      }

      // Sync with Directus data model (register tables)
      try {
        await syncWithDirectus(pointTableName, trackTableName, mountainName);
        console.log('Successfully synced with Directus data model');
      } catch (syncError) {
        console.error('Failed to sync with Directus:', syncError);
        // Don't fail the whole operation if sync fails
      }

      // Return success response
      const response = {
        message: 'Data uploaded successfully',
        pointsInserted,
        tracksInserted,
        tablesCreated: {
          pointTable: pointTableName,
          trackTable: trackTableName
        },
        filename: sanitizedFilename,
        mountainAdded: mountainAddResult ? mountainAddResult.success !== false : false,
        mountainResult: mountainAddResult,
        preservedExistingData: mountainAddResult?.preserved || false
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