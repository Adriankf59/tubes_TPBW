// pages/api/mountains-update-tables.js - API to update only point/track table references
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
    return res.status(405).json({ error: 'Method not allowed. Use POST to update mountain tables.' });
  }

  let client;

  try {
    const { name, point, track } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Mountain name is required' });
    }
    
    client = await pool.connect();
    
    // Get current schema to check available columns
    const schemaQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mountains' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const schemaResult = await client.query(schemaQuery);
    const columns = schemaResult.rows.map(row => row.column_name);
    
    // Build update query for only table references
    let updateFields = [];
    let updateValues = [name]; // $1 for WHERE clause
    let paramIndex = 2;
    
    if (point && columns.includes('point')) {
      updateFields.push(`point = $${paramIndex}`);
      updateValues.push(point);
      paramIndex++;
    }
    
    if (track && columns.includes('track')) {
      updateFields.push(`track = $${paramIndex}`);
      updateValues.push(track);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const updateQuery = `
      UPDATE mountains 
      SET ${updateFields.join(', ')}
      WHERE LOWER(name) = LOWER($1)
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, updateValues);
    
    if (result.rows.length > 0) {
      res.status(200).json({
        success: true,
        message: 'Mountain table references updated successfully',
        data: result.rows[0],
        updatedFields: updateFields
      });
    } else {
      res.status(404).json({
        error: 'Mountain not found',
        name: name
      });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database error',
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
      sizeLimit: '1mb',
    },
  },
}