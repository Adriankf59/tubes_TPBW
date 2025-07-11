// pages/api/mountains-upload.js - Fixed version without updated_at column
import { Pool } from 'pg';

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
    return res.status(405).json({ error: 'Method not allowed. Use POST to upload mountains data.' });
  }

  let client;

  try {
    const mountainData = req.body;
    
    // Validate required fields
    if (!mountainData.name) {
      return res.status(400).json({ error: 'Mountain name is required' });
    }
    
    // Clean and prepare data
    const cleanData = {
      name: String(mountainData.name || '').trim(),
      kota: String(mountainData.kota || '').trim(),
      provinsi: String(mountainData.provinsi || '').trim(),
      elevation: parseInt(mountainData.elevation) || 0,
      difficulty: String(mountainData.difficulty || 'Medium').trim(),
      image: null, // Set to null since it expects UUID reference to directus_files
      rating: parseFloat(mountainData.rating) || 4.0,
      penjelasan: String(mountainData.penjelasan || '').trim(),
      point: String(mountainData.point || '').trim(),
      track: String(mountainData.track || '').trim()
    };
    
    // Handle image if it's a UUID
    if (mountainData.image && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mountainData.image)) {
      cleanData.image = mountainData.image;
    }
    
    // Validate data types
    if (cleanData.rating < 0 || cleanData.rating > 5) {
      cleanData.rating = 4.0;
    }
    
    if (!['Easy', 'Medium', 'Hard'].includes(cleanData.difficulty)) {
      cleanData.difficulty = 'Medium';
    }
    
    client = await pool.connect();
    
    try {
      // First, let's check the actual schema of the mountains table
      const schemaQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'mountains' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const schemaResult = await client.query(schemaQuery);
      const columns = schemaResult.rows.map(row => row.column_name);
      
      console.log('Available columns in mountains table:', columns);
      
      // Check if mountain already exists
      const checkQuery = 'SELECT id FROM mountains WHERE LOWER(name) = LOWER($1)';
      const checkResult = await client.query(checkQuery, [cleanData.name]);
      
      let result;
      let isUpdate = false;
      
      if (checkResult.rows.length > 0) {
        // Update existing mountain - only update columns that exist
        let updateFields = [];
        let updateValues = [cleanData.name]; // $1 for WHERE clause
        let paramIndex = 2;
        
        const fieldsToUpdate = [
          { field: 'kota', value: cleanData.kota },
          { field: 'provinsi', value: cleanData.provinsi },
          { field: 'elevation', value: cleanData.elevation },
          { field: 'difficulty', value: cleanData.difficulty },
          { field: 'image', value: cleanData.image },
          { field: 'rating', value: cleanData.rating },
          { field: 'penjelasan', value: cleanData.penjelasan },
          { field: 'point', value: cleanData.point },
          { field: 'track', value: cleanData.track }
        ];
        
        // Only add fields that exist in the table
        fieldsToUpdate.forEach(({ field, value }) => {
          if (columns.includes(field)) {
            updateFields.push(`${field} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }
        });
        
        // Add updated_at only if the column exists
        if (columns.includes('updated_at')) {
          updateFields.push('updated_at = CURRENT_TIMESTAMP');
        }
        
        if (updateFields.length > 0) {
          const updateQuery = `
            UPDATE mountains 
            SET ${updateFields.join(', ')}
            WHERE LOWER(name) = LOWER($1)
            RETURNING *
          `;
          
          result = await client.query(updateQuery, updateValues);
          isUpdate = true;
          console.log(`Updated mountain: ${cleanData.name}`);
        } else {
          // No fields to update
          result = await client.query('SELECT * FROM mountains WHERE LOWER(name) = LOWER($1)', [cleanData.name]);
          isUpdate = true;
        }
        
      } else {
        // Insert new mountain - only insert columns that exist
        let insertFields = ['name'];
        let insertPlaceholders = ['$1'];
        let insertValues = [cleanData.name];
        let paramIndex = 2;
        
        const fieldsToInsert = [
          { field: 'kota', value: cleanData.kota },
          { field: 'provinsi', value: cleanData.provinsi },
          { field: 'elevation', value: cleanData.elevation },
          { field: 'difficulty', value: cleanData.difficulty },
          { field: 'image', value: cleanData.image },
          { field: 'rating', value: cleanData.rating },
          { field: 'penjelasan', value: cleanData.penjelasan },
          { field: 'point', value: cleanData.point },
          { field: 'track', value: cleanData.track }
        ];
        
        // Only add fields that exist in the table
        fieldsToInsert.forEach(({ field, value }) => {
          if (columns.includes(field)) {
            insertFields.push(field);
            insertPlaceholders.push(`$${paramIndex}`);
            insertValues.push(value);
            paramIndex++;
          }
        });
        
        const insertQuery = `
          INSERT INTO mountains (${insertFields.join(', ')})
          VALUES (${insertPlaceholders.join(', ')})
          RETURNING *
        `;
        
        result = await client.query(insertQuery, insertValues);
        console.log(`Created new mountain: ${cleanData.name}`);
      }
      
      // Return success response in Directus-compatible format
      res.status(200).json({
        data: result.rows[0],
        message: isUpdate ? 'Mountain updated successfully' : 'Mountain created successfully',
        availableColumns: columns // Include schema info for debugging
      });
      
    } catch (error) {
      console.error('Database error:', error);
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({ 
          error: 'Mountain with this name already exists',
          code: 'DUPLICATE_ENTRY'
        });
      } else if (error.code === '23502') { // Not null constraint violation
        res.status(400).json({ 
          error: 'Missing required field',
          detail: error.column,
          code: 'MISSING_FIELD'
        });
      } else if (error.code === '42703') { // Column does not exist
        res.status(400).json({ 
          error: 'Database schema mismatch',
          message: error.message,
          code: 'SCHEMA_MISMATCH',
          hint: 'The database table structure may be different than expected'
        });
      } else {
        res.status(500).json({ 
          error: 'Database error',
          message: error.message,
          code: error.code
        });
      }
    }
    
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ 
      error: 'Connection error',
      message: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}