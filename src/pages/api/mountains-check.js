// pages/api/mountains-check.js - API to check if mountain exists with full data
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
    return res.status(405).json({ error: 'Method not allowed. Use POST to check mountain.' });
  }

  let client;

  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Mountain name is required' });
    }
    
    client = await pool.connect();
    
    // Check if mountain exists and has substantial data
    const checkQuery = `
      SELECT id, name, kota, provinsi, elevation, penjelasan, point, track
      FROM mountains 
      WHERE LOWER(name) = LOWER($1)
    `;
    
    const result = await client.query(checkQuery, [name.trim()]);
    
    if (result.rows.length > 0) {
      const mountain = result.rows[0];
      
      // Check if mountain has substantial data (not just from KMZ upload)
      const hasSubstantialData = (
        mountain.kota && mountain.kota.trim() !== '' ||
        mountain.provinsi && mountain.provinsi.trim() !== '' ||
        (mountain.elevation && mountain.elevation > 100) ||
        (mountain.penjelasan && mountain.penjelasan.length > 200 && !mountain.penjelasan.includes('Data jalur pendakian'))
      );
      
      res.status(200).json({
        exists: true,
        hasSubstantialData: hasSubstantialData,
        data: mountain
      });
    } else {
      res.status(200).json({
        exists: false,
        hasSubstantialData: false,
        data: null
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