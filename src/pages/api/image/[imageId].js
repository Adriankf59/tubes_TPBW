// File: pages/api/image/[imageId].js
// Enhanced version dengan proper headers untuk bypass 403

export default async function handler(req, res) {
  const { imageId } = req.query;
  
  console.log('🔥 API Route called for imageId:', imageId);
  
  if (!imageId) {
    console.error('❌ No imageId provided');
    return res.status(400).json({ error: 'Image ID is required' });
  }

  try {
    const imageUrl = `https://adrianfirmansyah-website.my.id/trailview/assets/${imageId}`;
    console.log('🌐 Fetching from:', imageUrl);
    
    // Enhanced headers to mimic a real browser request
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'image',
        'Referer': 'https://adrianfirmansyah-website.my.id/',
        'Origin': 'https://adrianfirmansyah-website.my.id'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error(`❌ Fetch failed: ${response.status} ${response.statusText}`);
      
      // Try alternative approach - redirect to original URL
      if (response.status === 403) {
        console.log('🔄 Trying redirect approach...');
        res.writeHead(302, {
          'Location': imageUrl,
          'Cache-Control': 'public, max-age=3600'
        });
        res.end();
        return;
      }
      
      return res.status(response.status).json({ 
        error: `Failed to fetch image: ${response.status}`,
        details: response.statusText,
        url: imageUrl
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('✅ Image fetched successfully, size:', imageBuffer.byteLength, 'type:', contentType);
    
    // Set comprehensive headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Length', imageBuffer.byteLength);
    
    // Add ETag for caching
    const etag = `"${imageId}-${imageBuffer.byteLength}"`;
    res.setHeader('ETag', etag);
    
    // Check if client has cached version
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    
    // Send image
    res.send(Buffer.from(imageBuffer));
    
  } catch (error) {
    console.error('💥 Error in API route:', error);
    
    // Fallback: redirect to original URL
    console.log('🔄 Fallback: redirecting to original URL');
    res.writeHead(302, {
      'Location': `https://adrianfirmansyah-website.my.id/trailview/assets/${imageId}`,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end();
  }
}