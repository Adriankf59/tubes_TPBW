// pages/input-data.js - Enhanced version with improved CSV parsing
import Head from "next/head";
import Link from "next/link";
import { useState, useRef } from "react";
import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";

// Icon Components (keeping existing ones)
const MountainIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16L14 8l-3 5-3-5-4 12z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RouteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ProcessingIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

// Helper functions
const safeText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "object" && value.textContent) return value.textContent;
  if (typeof value === "object" && value.value) return String(value.value);
  return String(value);
};

const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
  if (typeof value === "object" && value.value !== undefined) {
    return safeNumber(value.value, defaultValue);
  }
  return defaultValue;
};

// Function to extract and parse KML from KMZ
async function extractKMLFromKMZ(file) {
  try {
    const zip = await JSZip.loadAsync(file);
    
    let kmlFile = null;
    const fileNames = Object.keys(zip.files);
    
    for (const fileName of fileNames) {
      if (fileName.toLowerCase().endsWith('.kml')) {
        kmlFile = zip.files[fileName];
        break;
      }
    }
    
    if (!kmlFile) {
      throw new Error("Tidak ditemukan file KML dalam file KMZ");
    }
    
    const kmlContent = await kmlFile.async('string');
    return kmlContent;
  } catch (error) {
    console.error("Error extracting KML from KMZ:", error);
    throw new Error("Gagal membaca file KMZ: " + error.message);
  }
}

// Function to parse KML content to extract points and tracks
function parseKMLToData(kmlDoc) {
  let points = [];
  let tracks = [];
  
  try {
    // Try using togeojson first
    const geojson = kml(kmlDoc);
    
    if (!geojson || !geojson.features) {
      throw new Error("Tidak dapat mengkonversi KML ke GeoJSON");
    }

    // Separate points and linestrings
    geojson.features.forEach(feature => {
      if (!feature.geometry) return;
      
      if (feature.geometry.type === "Point") {
        points.push({
          name: safeText(feature.properties?.name || "Unnamed Point"),
          description: safeText(feature.properties?.description || ""),
          coordinates: feature.geometry.coordinates.map(coord => safeNumber(coord))
        });
      } else if (feature.geometry.type === "LineString") {
        tracks.push({
          name: safeText(feature.properties?.name || "Unnamed Track"),
          description: safeText(feature.properties?.description || ""),
          coordinates: feature.geometry.coordinates.map(coord => coord.map(c => safeNumber(c)))
        });
      } else if (feature.geometry.type === "MultiLineString") {
        feature.geometry.coordinates.forEach((coords, idx) => {
          tracks.push({
            name: safeText((feature.properties?.name || "Unnamed Track") + (idx > 0 ? ` (${idx + 1})` : "")),
            description: safeText(feature.properties?.description || ""),
            coordinates: coords.map(coord => coord.map(c => safeNumber(c)))
          });
        });
      }
    });
  } catch (togeojsonError) {
    console.warn("togeojson parsing failed, trying manual parsing:", togeojsonError);
    
    // Fallback to manual parsing
    const placemarks = kmlDoc.getElementsByTagName("Placemark");
    
    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const nameEl = placemark.getElementsByTagName("name")[0];
      const descEl = placemark.getElementsByTagName("description")[0];
      const name = safeText(nameEl?.textContent || "Unnamed");
      const description = safeText(descEl?.textContent || "");
      
      // Check for Point
      const pointElements = placemark.getElementsByTagName("Point");
      if (pointElements.length > 0) {
        const coordsEl = pointElements[0].getElementsByTagName("coordinates")[0];
        if (coordsEl) {
          const coordsText = safeText(coordsEl.textContent);
          const coordinates = coordsText.trim().split(",").map(c => safeNumber(c));
          if (coordinates.length >= 2) {
            points.push({
              name,
              description,
              coordinates: [coordinates[0], coordinates[1], coordinates[2] || 0]
            });
          }
        }
      }
      
      // Check for LineString
      const lineStringElements = placemark.getElementsByTagName("LineString");
      if (lineStringElements.length > 0) {
        const coordsEl = lineStringElements[0].getElementsByTagName("coordinates")[0];
        if (coordsEl) {
          const coordsText = safeText(coordsEl.textContent);
          const coordsArray = coordsText.trim().split(/\s+/).filter(c => c).map(coord => {
            const parts = coord.split(",").map(c => safeNumber(c));
            return [parts[0], parts[1], parts[2] || 0];
          });
          if (coordsArray.length > 0) {
            tracks.push({
              name,
              description,
              coordinates: coordsArray
            });
          }
        }
      }
    }
  }
  
  return { points, tracks };
}

// IMPROVED CSV PARSER with proper handling for quoted fields and multiline content
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const mountains = [];
  
  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  console.log('CSV Headers detected:', headers);
  
  // Parse data rows
  let i = 1;
  while (i < lines.length) {
    const result = parseCSVRecord(lines, i);
    if (result.record && result.record.length > 0) {
      const mountain = {};
      
      // Map values to headers
      headers.forEach((header, index) => {
        let value = result.record[index] || '';
        
        // Clean header and value
        const cleanHeader = header.trim().replace(/^"|"$/g, '');
        const cleanValue = value.trim().replace(/^"|"$/g, '');
        
        // Convert to appropriate types
        if (cleanHeader === 'id' || cleanHeader === 'elevation') {
          mountain[cleanHeader] = safeNumber(cleanValue);
        } else if (cleanHeader === 'rating') {
          mountain[cleanHeader] = safeNumber(cleanValue, 4.0);
        } else if (cleanHeader === 'image') {
          // Image should be UUID or empty
          mountain[cleanHeader] = cleanValue || null;
        } else {
          // Truncate long values for name field to prevent database errors
          if (cleanHeader === 'name' && cleanValue.length > 200) {
            mountain[cleanHeader] = cleanValue.substring(0, 200) + '...';
          } else {
            mountain[cleanHeader] = cleanValue;
          }
        }
      });
      
      // Only add if we have at least a name
      if (mountain.name && mountain.name.trim()) {
        mountains.push(mountain);
        console.log(`Parsed mountain: ${mountain.name.substring(0, 50)}...`);
      }
    }
    
    i = result.nextIndex;
  }
  
  console.log(`Total mountains parsed: ${mountains.length}`);
  return mountains;
}

// Helper function to parse a single CSV line handling quotes properly
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      // Check for escaped quotes ""
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      
      inQuotes = !inQuotes;
      i++;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

// Helper function to parse a CSV record that might span multiple lines
function parseCSVRecord(lines, startIndex) {
  let record = [];
  let currentField = '';
  let inQuotes = false;
  let lineIndex = startIndex;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    let charIndex = 0;
    
    while (charIndex < line.length) {
      const char = line[charIndex];
      
      if (char === '"') {
        // Check for escaped quotes ""
        if (charIndex + 1 < line.length && line[charIndex + 1] === '"') {
          currentField += '"';
          charIndex += 2;
          continue;
        }
        
        inQuotes = !inQuotes;
        charIndex++;
      } else if (char === ',' && !inQuotes) {
        record.push(currentField);
        currentField = '';
        charIndex++;
      } else {
        currentField += char;
        charIndex++;
      }
    }
    
    // If we're still in quotes, add a newline and continue to next line
    if (inQuotes) {
      currentField += '\n';
      lineIndex++;
    } else {
      // Add the last field and finish
      record.push(currentField);
      break;
    }
  }
  
  // If we never closed quotes and reached end of file
  if (inQuotes) {
    record.push(currentField);
  }
  
  return {
    record: record,
    nextIndex: lineIndex + 1
  };
}

export default function InputData() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: null, message: "" });
  const [parsedData, setParsedData] = useState({ points: [], tracks: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState('kmz'); // 'kmz' or 'mountains'
  const [mountainsData, setMountainsData] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualMountain, setManualMountain] = useState({
    name: '',
    kota: '',
    provinsi: '',
    elevation: '',
    difficulty: 'Medium',
    image: '',
    rating: '4.0',
    penjelasan: '',
    point: '',
    track: ''
  });
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const fileSize = selectedFile.size;
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (uploadMode === 'kmz') {
        if (!fileName.endsWith('.kmz') && !fileName.endsWith('.kml')) {
          setUploadStatus({ 
            type: "error", 
            message: "Harap pilih file dengan format .kmz atau .kml" 
          });
          return;
        }
      } else if (uploadMode === 'mountains') {
        if (!fileName.endsWith('.csv')) {
          setUploadStatus({ 
            type: "error", 
            message: "Harap pilih file dengan format .csv untuk data mountains" 
          });
          return;
        }
      }
      
      if (fileSize > maxSize) {
        setUploadStatus({ 
          type: "error", 
          message: `File terlalu besar (${(fileSize / 1024 / 1024).toFixed(1)}MB). Maksimal 10MB.` 
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus({ type: null, message: "" });
      setParsedData({ points: [], tracks: [] });
      setMountainsData([]);
      setShowPreview(false);
      setUploadProgress(0);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(10);
      const fileName = file.name.toLowerCase();
      
      if (uploadMode === 'kmz') {
        let kmlContent = null;
        
        if (fileName.endsWith('.kmz')) {
          setUploadStatus({ type: "info", message: "Membaca file KMZ..." });
          kmlContent = await extractKMLFromKMZ(file);
          setUploadProgress(30);
        } else if (fileName.endsWith('.kml')) {
          setUploadStatus({ type: "info", message: "Membaca file KML..." });
          kmlContent = await file.text();
          setUploadProgress(30);
        }

        if (!kmlContent || kmlContent.trim().length === 0) {
          throw new Error("File kosong atau tidak dapat dibaca.");
        }

        setUploadStatus({ type: "info", message: "Mengkonversi KML ke GeoJSON..." });
        setUploadProgress(50);

        // Parse KML to DOM
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlContent, "text/xml");
        
        // Check for parsing errors
        const parserError = kmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error("Format KML tidak valid.");
        }

        setUploadProgress(70);

        // Parse KML to extract points and tracks
        const { points, tracks } = parseKMLToData(kmlDoc);

        if (points.length === 0 && tracks.length === 0) {
          throw new Error("File tidak berisi data Point atau LineString yang valid.");
        }

        setParsedData({ points, tracks });
        setShowPreview(true);
        setUploadProgress(100);
        
        setUploadStatus({ 
          type: "success", 
          message: `Berhasil membaca ${points.length} titik dan ${tracks.length} jalur`
        });
      } else if (uploadMode === 'mountains') {
        setUploadStatus({ type: "info", message: "Membaca file CSV..." });
        const csvContent = await file.text();
        setUploadProgress(30);
        
        setUploadStatus({ type: "info", message: "Parsing CSV dengan improved parser..." });
        setUploadProgress(50);
        
        const mountains = parseCSV(csvContent);
        
        if (mountains.length === 0) {
          throw new Error("File CSV tidak berisi data yang valid.");
        }
        
        // Validate mountains data
        const validMountains = mountains.filter(mountain => {
          if (!mountain.name || mountain.name.trim() === '') {
            console.warn('Skipping mountain with empty name:', mountain);
            return false;
          }
          
          // Check for extremely long names that would cause database errors
          if (mountain.name.length > 255) {
            console.warn(`Mountain name too long, truncating: ${mountain.name.substring(0, 50)}...`);
            mountain.name = mountain.name.substring(0, 200) + '...';
          }
          
          return true;
        });
        
        setMountainsData(validMountains);
        setShowPreview(true);
        setUploadProgress(100);
        
        setUploadStatus({ 
          type: "success", 
          message: `Berhasil membaca ${validMountains.length} data gunung (${mountains.length - validMountains.length} data diabaikan karena tidak valid)`
        });
      }

    } catch (error) {
      console.error("Error parsing file:", error);
      setUploadStatus({ type: "error", message: safeText(error.message) });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus({ type: "info", message: "Mengunggah data ke server..." });

      if (uploadMode === 'kmz') {
        if (parsedData.points.length === 0 && parsedData.tracks.length === 0) {
          setUploadStatus({ type: "error", message: "Tidak ada data untuk diunggah" });
          return;
        }

        // Extract filename without extension for table naming
        const filename = file.name.replace(/\.(kml|kmz)$/i, '');

        setUploadProgress(40);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...parsedData,
            filename: filename
          }),
        });

        setUploadProgress(80);

        const result = await response.json();

        if (response.ok) {
          setUploadStatus({ 
            type: "success", 
            message: `Berhasil menyimpan ${result.pointsInserted} titik dan ${result.tracksInserted} jalur ke database.`
          });
          
          resetForm();
        } else {
          throw new Error(result.error || "Gagal mengunggah data");
        }
      } else if (uploadMode === 'mountains') {
        if (mountainsData.length === 0) {
          setUploadStatus({ type: "error", message: "Tidak ada data mountains untuk diunggah" });
          return;
        }

        // Upload mountains data one by one with better error handling
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < mountainsData.length; i++) {
          setUploadProgress(Math.floor((i / mountainsData.length) * 100));
          
          try {
            console.log(`Uploading mountain ${i + 1}/${mountainsData.length}:`, mountainsData[i].name);
            
            await addToMountainsTable(mountainsData[i]);
            successCount++;
            
          } catch (error) {
            console.error(`Failed to upload mountain ${i + 1}:`, error);
            errorCount++;
            errors.push(`${mountainsData[i].name}: ${error.message}`);
            
            // Continue with next mountain instead of stopping
          }
        }
        
        setUploadProgress(100);
        
        if (successCount > 0) {
          setUploadStatus({ 
            type: successCount === mountainsData.length ? "success" : "info", 
            message: `Berhasil mengunggah ${successCount} data gunung${errorCount > 0 ? `, ${errorCount} gagal` : ''}.${errorCount > 0 ? '\n\nError: ' + errors.slice(0, 3).join(', ') : ''}`
          });
        } else {
          setUploadStatus({ 
            type: "error", 
            message: `Gagal mengunggah semua data. Errors: ${errors.slice(0, 5).join(', ')}`
          });
        }
        
        if (successCount > 0) {
          resetForm();
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({ 
        type: "error", 
        message: error.message
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const addToMountainsTable = async (mountainData) => {
    try {
      // Extra validation and cleaning
      const cleanData = {
        name: String(mountainData.name || '').trim().substring(0, 200), // Ensure max length
        kota: String(mountainData.kota || '').trim().substring(0, 100),
        provinsi: String(mountainData.provinsi || '').trim().substring(0, 100),
        elevation: parseInt(mountainData.elevation) || 0,
        difficulty: String(mountainData.difficulty || 'Medium').trim(),
        image: mountainData.image || '',
        rating: parseFloat(mountainData.rating) || 4.0,
        penjelasan: String(mountainData.penjelasan || '').trim().substring(0, 5000), // Limit penjelasan length
        point: String(mountainData.point || '').trim().substring(0, 100),
        track: String(mountainData.track || '').trim().substring(0, 100)
      };
      
      // Validate required fields
      if (!cleanData.name) {
        throw new Error('Mountain name is required');
      }
      
      console.log('Sending cleaned data:', {
        ...cleanData,
        penjelasan: cleanData.penjelasan.substring(0, 100) + '...' // Log truncated version
      });
      
      // Try local API first (direct PostgreSQL)
      const response = await fetch('/api/mountains-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Mountain uploaded successfully:', result.data?.name);
        return result;
      } else {
        console.error('API error:', result);
        throw new Error(result.error || `HTTP ${response.status}: Failed to upload`);
      }
      
    } catch (error) {
      console.error('Error in addToMountainsTable:', error);
      throw error;
    }
  };

  const handleManualSubmit = async () => {
    try {
      setUploading(true);
      setUploadStatus({ type: "info", message: "Menyimpan data gunung..." });
      
      await addToMountainsTable(manualMountain);
      
      setUploadStatus({ 
        type: "success", 
        message: "Berhasil menyimpan data gunung!"
      });
      
      // Reset form
      setManualMountain({
        name: '',
        kota: '',
        provinsi: '',
        elevation: '',
        difficulty: 'Medium',
        image: '',
        rating: '4.0',
        penjelasan: '',
        point: '',
        track: ''
      });
      setShowManualForm(false);
      
    } catch (error) {
      setUploadStatus({ 
        type: "error", 
        message: "Gagal menyimpan data: " + error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.type) {
      case "success": return "bg-green-100 border-green-500 text-green-700";
      case "error": return "bg-red-100 border-red-500 text-red-700";
      case "info": return "bg-blue-100 border-blue-500 text-blue-700";
      default: return "";
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData({ points: [], tracks: [] });
    setMountainsData([]);
    setShowPreview(false);
    setUploadStatus({ type: null, message: "" });
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Head>
        <title>Input Data - TrailView ID | Upload Data Gunung</title>
        <meta name="description" content="Upload data jalur pendakian dan informasi gunung ke database TrailView ID" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gray-900 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center text-white">
                <MountainIcon />
                <span className="ml-2 text-2xl font-bold">TrailView ID</span>
              </Link>
              <nav className="flex items-center space-x-8">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <span className="text-green-400 font-medium">Input Data</span>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Data Gunung
            </h1>
            <p className="text-gray-600 mb-8">
              Pilih jenis data yang ingin Anda upload
            </p>

            {/* Mode Selection */}
            <div className="mb-8">
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => {
                    setUploadMode('kmz');
                    resetForm();
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    uploadMode === 'kmz' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Upload KMZ/KML (Jalur & Titik)
                </button>
                <button
                  onClick={() => {
                    setUploadMode('mountains');
                    resetForm();
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    uploadMode === 'mountains' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Upload Data Mountains (CSV)
                </button>
                <button
                  onClick={() => {
                    setShowManualForm(!showManualForm);
                    resetForm();
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    showManualForm 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Input Manual
                </button>
              </div>

              {/* Manual Form */}
              {showManualForm && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">Input Data Gunung Manual</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Gunung</label>
                      <input
                        type="text"
                        value={manualMountain.name}
                        onChange={(e) => setManualMountain({...manualMountain, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: Semeru"
                        maxLength="200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                      <input
                        type="text"
                        value={manualMountain.kota}
                        onChange={(e) => setManualMountain({...manualMountain, kota: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: Lumajang"
                        maxLength="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                      <input
                        type="text"
                        value={manualMountain.provinsi}
                        onChange={(e) => setManualMountain({...manualMountain, provinsi: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: Jawa Timur"
                        maxLength="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ketinggian (m)</label>
                      <input
                        type="number"
                        value={manualMountain.elevation}
                        onChange={(e) => setManualMountain({...manualMountain, elevation: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: 3676"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Kesulitan</label>
                      <select
                        value={manualMountain.difficulty}
                        onChange={(e) => setManualMountain({...manualMountain, difficulty: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={manualMountain.rating}
                        onChange={(e) => setManualMountain({...manualMountain, rating: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: 4.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tabel Point</label>
                      <input
                        type="text"
                        value={manualMountain.point}
                        onChange={(e) => setManualMountain({...manualMountain, point: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: point_semeru"
                        maxLength="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tabel Track</label>
                      <input
                        type="text"
                        value={manualMountain.track}
                        onChange={(e) => setManualMountain({...manualMountain, track: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Contoh: jalur_semeru"
                        maxLength="100"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Penjelasan</label>
                      <textarea
                        value={manualMountain.penjelasan}
                        onChange={(e) => setManualMountain({...manualMountain, penjelasan: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Deskripsi tentang gunung..."
                        maxLength="5000"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {manualMountain.penjelasan.length}/5000 karakter
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleManualSubmit}
                    disabled={uploading || !manualMountain.name}
                    className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Menyimpan..." : "Simpan Data Gunung"}
                  </button>
                </div>
              )}

              {/* File Upload Area */}
              {!showManualForm && (
                <div className="mb-8">
                  <label 
                    htmlFor="file-upload" 
                    className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center hover:border-green-400 transition-colors cursor-pointer ${
                      file ? 'border-green-400 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <UploadIcon className="mx-auto text-gray-400 mb-4" />
                    <span className="block text-lg font-medium text-gray-900">
                      {file ? file.name : uploadMode === 'kmz' 
                        ? "Klik untuk memilih file KMZ atau KML" 
                        : "Klik untuk memilih file CSV"}
                    </span>
                    <span className="block text-sm text-gray-600 mt-2">
                      atau drag and drop file di sini 
                      {uploadMode === 'kmz' 
                        ? " (format: .kmz, .kml)" 
                        : " (format: .csv)"}
                    </span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept={uploadMode === 'kmz' ? ".kmz,.kml" : ".csv"}
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                  
                  {/* File Info */}
                  {file && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            Ukuran: {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={resetForm}
                          className="text-red-600 hover:text-red-700 text-sm"
                          disabled={uploading}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && uploadProgress > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Message */}
            {uploadStatus.message && (
              <div className={`mb-6 p-4 border rounded-lg flex items-start ${getStatusColor()}`}>
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {uploadStatus.type === "success" && <CheckIcon />}
                  {uploadStatus.type === "error" && <XIcon />}
                  {uploadStatus.type === "info" && uploading && <ProcessingIcon />}
                </div>
                <div className="whitespace-pre-line">{safeText(uploadStatus.message)}</div>
              </div>
            )}

            {/* Action Buttons */}
            {file && !showPreview && (
              <button
                onClick={parseFile}
                disabled={uploading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <ProcessingIcon />
                    <span className="ml-2">Memproses...</span>
                  </>
                ) : (
                  "Parse File"
                )}
              </button>
            )}

            {/* Data Preview */}
            {showPreview && uploadMode === 'kmz' && (
              <div className="space-y-6">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPinIcon className="mr-2 text-green-600" />
                    Titik Lokasi ({parsedData.points.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsedData.points.slice(0, 5).map((point, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-medium text-gray-900">{safeText(point.name)}</div>
                        <div className="text-sm text-gray-600">
                          Koordinat: {point.coordinates[1].toFixed(6)}, {point.coordinates[0].toFixed(6)}
                        </div>
                      </div>
                    ))}
                    {parsedData.points.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... dan {parsedData.points.length - 5} titik lainnya
                      </p>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <RouteIcon className="mr-2 text-blue-600" />
                    Jalur Pendakian ({parsedData.tracks.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsedData.tracks.slice(0, 5).map((track, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-medium text-gray-900">{safeText(track.name)}</div>
                        <div className="text-sm text-gray-600">
                          Jumlah titik: {track.coordinates.length}
                        </div>
                      </div>
                    ))}
                    {parsedData.tracks.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... dan {parsedData.tracks.length - 5} jalur lainnya
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mountains Preview */}
            {showPreview && uploadMode === 'mountains' && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MountainIcon className="mr-2 text-green-600" />
                  Data Gunung ({mountainsData.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mountainsData.map((mountain, index) => (
                    <div key={index} className="bg-white p-4 rounded border border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Nama:</span> {mountain.name.length > 50 ? mountain.name.substring(0, 50) + '...' : mountain.name}
                        </div>
                        <div>
                          <span className="font-medium">Kota:</span> {mountain.kota}
                        </div>
                        <div>
                          <span className="font-medium">Provinsi:</span> {mountain.provinsi}
                        </div>
                        <div>
                          <span className="font-medium">Ketinggian:</span> {mountain.elevation}m
                        </div>
                        <div>
                          <span className="font-medium">Kesulitan:</span> {mountain.difficulty}
                        </div>
                        <div>
                          <span className="font-medium">Rating:</span> {mountain.rating}
                        </div>
                      </div>
                      {mountain.penjelasan && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Penjelasan:</span> {mountain.penjelasan.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showPreview && (
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <ProcessingIcon />
                      <span className="ml-2">Mengunggah...</span>
                    </>
                  ) : (
                    "Upload ke Database"
                  )}
                </button>
                <button
                  onClick={resetForm}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Petunjuk Penggunaan</h2>
            
            {uploadMode === 'kmz' ? (
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Siapkan file KML atau KMZ yang berisi data jalur pendakian gunung</li>
                <li>File harus mengandung data Point (titik lokasi) dan/atau LineString (jalur)</li>
                <li>Klik area upload atau drag file ke area tersebut</li>
                <li>Sistem akan otomatis mem-parse file dan menampilkan preview data</li>
                <li>Data akan otomatis ditambahkan ke tabel mountains setelah upload</li>
              </ol>
            ) : (
              <div>
                <p className="mb-2 text-gray-700">Format CSV untuk data mountains:</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`"id","name","kota","provinsi","elevation","difficulty","image","rating","penjelasan","point","track"
"1","Semeru","Lumajang","Jawa Timur","3676","Hard","","4.5","Deskripsi gunung...","point_semeru","jalur_semeru"`}
                </pre>
                <ul className="list-disc list-inside space-y-1 mt-3 text-gray-700">
                  <li>Header harus sesuai dengan contoh di atas</li>
                  <li>Gunakan tanda kutip untuk text yang mengandung koma atau newline</li>
                  <li>ID bisa dikosongkan (akan auto-generate)</li>
                  <li>Difficulty: Easy, Medium, atau Hard</li>
                  <li>Nama maksimal 200 karakter, penjelasan maksimal 5000 karakter</li>
                  <li><strong>Penting:</strong> Pastikan text multiline dalam field penjelasan dibungkus tanda kutip ganda</li>
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}