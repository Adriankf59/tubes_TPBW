// pages/input-data.js - SIMPLIFIED VERSION (No config changes needed)
import Head from "next/head";
import Link from "next/link";
import { useState, useRef } from "react";
import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";

// Icon Components
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

export default function InputData() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: null, message: "" });
  const [parsedData, setParsedData] = useState({ points: [], tracks: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const fileSize = selectedFile.size;
      const maxSize = 10 * 1024 * 1024; // 10MB (keeping conservative limit)
      
      if (!fileName.endsWith('.kmz') && !fileName.endsWith('.kml')) {
        setUploadStatus({ 
          type: "error", 
          message: "Harap pilih file dengan format .kmz atau .kml" 
        });
        return;
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
      setShowPreview(false);
      setUploadProgress(0);
    }
  };

  const parseKMZFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(10);
      const fileName = file.name.toLowerCase();
      let kmlContent = null;
      
      if (fileName.endsWith('.kmz')) {
        setUploadStatus({ type: "info", message: "Membaca file KMZ..." });
        kmlContent = await extractKMLFromKMZ(file);
        setUploadProgress(30);
      } else if (fileName.endsWith('.kml')) {
        setUploadStatus({ type: "info", message: "Membaca file KML..." });
        kmlContent = await file.text();
        setUploadProgress(30);
      } else {
        throw new Error("Format file tidak didukung. Gunakan file .kml atau .kmz");
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
        throw new Error("Format KML tidak valid. Pastikan file KML dalam format yang benar.");
      }

      setUploadProgress(70);

      // Parse KML to extract points and tracks
      const { points, tracks } = parseKMLToData(kmlDoc);

      if (points.length === 0 && tracks.length === 0) {
        throw new Error("File tidak berisi data Point atau LineString yang valid. Pastikan file KML berisi data geospasial.");
      }

      // Validate data quality
      const validPoints = points.filter(point => {
        const coords = point.coordinates;
        return coords && coords.length >= 2 && 
               !isNaN(coords[0]) && !isNaN(coords[1]) &&
               coords[0] >= -180 && coords[0] <= 180 &&
               coords[1] >= -90 && coords[1] <= 90;
      });

      const validTracks = tracks.filter(track => {
        return track.coordinates && track.coordinates.length > 0 &&
               track.coordinates.every(coord => 
                 coord && coord.length >= 2 && 
                 !isNaN(coord[0]) && !isNaN(coord[1]) &&
                 coord[0] >= -180 && coord[0] <= 180 &&
                 coord[1] >= -90 && coord[1] <= 90
               );
      });

      const filteredData = { points: validPoints, tracks: validTracks };
      setParsedData(filteredData);
      setShowPreview(true);
      setUploadProgress(100);
      
      let message = `Berhasil membaca ${validPoints.length} titik dan ${validTracks.length} jalur`;
      
      if (validPoints.length !== points.length || validTracks.length !== tracks.length) {
        const invalidPoints = points.length - validPoints.length;
        const invalidTracks = tracks.length - validTracks.length;
        message += `\n⚠️ ${invalidPoints} titik dan ${invalidTracks} jalur diabaikan karena koordinat tidak valid`;
      }
      
      setUploadStatus({ 
        type: "success", 
        message: message
      });

    } catch (error) {
      console.error("Error parsing file:", error);
      setUploadStatus({ type: "error", message: safeText(error.message) });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (parsedData.points.length === 0 && parsedData.tracks.length === 0) {
      setUploadStatus({ type: "error", message: "Tidak ada data untuk diunggah" });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus({ type: "info", message: "Mengunggah data ke server..." });

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

      let result;
      
      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          const textResponse = await response.text();
          throw new Error(`Server returned invalid JSON response. Status: ${response.status}. Response: ${textResponse.substring(0, 200)}...`);
        }
      } else {
        // If response is not JSON, get the text content
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        
        if (response.status >= 400) {
          throw new Error(`Server error (${response.status}): ${textResponse.substring(0, 200)}...`);
        } else {
          throw new Error(`Unexpected response format. Expected JSON but got: ${contentType || 'unknown'}`);
        }
      }

      setUploadProgress(100);

      if (response.ok) {
        let successMessage = `Berhasil menyimpan ${result.pointsInserted} titik dan ${result.tracksInserted} jalur ke database.`;
        
        if (result.tablesCreated) {
          successMessage += ` Tabel: ${result.tablesCreated.pointTable} dan ${result.tablesCreated.trackTable}`;
        }
        
        // Add warnings if any
        if (result.warnings) {
          if (result.warnings.validationErrors) {
            successMessage += `\n⚠️ Ada ${result.warnings.totalValidationErrors} data yang tidak valid dan dilewati.`;
          }
          if (result.warnings.insertErrors) {
            successMessage += `\n⚠️ Ada ${result.warnings.totalInsertErrors} data yang gagal disimpan.`;
          }
        }
        
        setUploadStatus({ 
          type: "success", 
          message: successMessage
        });
        
        // Reset form
        setFile(null);
        setParsedData({ points: [], tracks: [] });
        setShowPreview(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        // Handle API errors
        const errorMessage = result.error || result.message || "Gagal mengunggah data";
        let fullErrorMessage = `Error: ${errorMessage}`;
        
        if (result.details && Array.isArray(result.details)) {
          fullErrorMessage += `\nDetail: ${result.details.slice(0, 3).join(', ')}`;
          if (result.details.length > 3) {
            fullErrorMessage += ` (dan ${result.details.length - 3} error lainnya)`;
          }
        }
        
        throw new Error(fullErrorMessage);
      }
    } catch (error) {
      console.error("Upload error:", error);
      
      let errorMessage = error.message;
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      } else if (error.message.includes('Body exceeded')) {
        errorMessage = "File terlalu besar untuk diupload. Maksimal ukuran file adalah 10MB.";
      } else if (error.message.includes('JSON')) {
        errorMessage = "Server mengembalikan response yang tidak valid. Coba lagi dalam beberapa saat.";
      }
      
      setUploadStatus({ 
        type: "error", 
        message: errorMessage
      });
      setUploadProgress(0);
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
        <title>Input Data - TrailView ID | Upload Jalur Pendakian Gunung</title>
        <meta name="description" content="Upload data jalur pendakian gunung dalam format KMZ ke database TrailView ID" />
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
              Upload Data Jalur Pendakian
            </h1>
            <p className="text-gray-600 mb-8">
              Unggah file KMZ atau KML yang berisi data titik lokasi dan jalur pendakian gunung
            </p>

            {/* Upload Area */}
            <div className="mb-8">
              <label 
                htmlFor="file-upload" 
                className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center hover:border-green-400 transition-colors cursor-pointer ${
                  file ? 'border-green-400 bg-green-50' : 'border-gray-300'
                }`}
              >
                <UploadIcon className="mx-auto text-gray-400 mb-4" />
                <span className="block text-lg font-medium text-gray-900">
                  {file ? file.name : "Klik untuk memilih file KMZ atau KML"}
                </span>
                <span className="block text-sm text-gray-600 mt-2">
                  atau drag and drop file di sini (format: .kmz, .kml, maksimal 10MB)
                </span>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".kmz,.kml"
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
                onClick={parseKMZFile}
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
            {showPreview && parsedData && (
              <div className="space-y-6">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPinIcon className="mr-2 text-green-600" />
                    Titik Lokasi ({parsedData.points.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsedData.points.map((point, index) => {
                      const lat = safeNumber(point.coordinates[1]);
                      const lon = safeNumber(point.coordinates[0]);
                      const alt = safeNumber(point.coordinates[2]);
                      return (
                        <div key={index} className="bg-white p-3 rounded border border-gray-200">
                          <div className="font-medium text-gray-900">{safeText(point.name)}</div>
                          <div className="text-sm text-gray-600">
                            Koordinat: {lat.toFixed(6)}, {lon.toFixed(6)}
                            {alt > 0 && `, Ketinggian: ${alt.toFixed(1)}m`}
                          </div>
                          {point.description && (
                            <div className="text-sm text-gray-500 mt-1">{safeText(point.description)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <RouteIcon className="mr-2 text-blue-600" />
                    Jalur Pendakian ({parsedData.tracks.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsedData.tracks.map((track, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="font-medium text-gray-900">{safeText(track.name)}</div>
                        <div className="text-sm text-gray-600">
                          Jumlah titik: {track.coordinates ? track.coordinates.length : 0}
                        </div>
                        {track.description && (
                          <div className="text-sm text-gray-500 mt-1">{safeText(track.description)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
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
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Petunjuk Penggunaan</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Siapkan file KML atau KMZ yang berisi data jalur pendakian gunung</li>
              <li>File harus mengandung data Point (titik lokasi) dan/atau LineString (jalur)</li>
              <li>Klik area upload atau drag file ke area tersebut (maksimal 10MB)</li>
              <li>Sistem akan otomatis mem-parse file dan menampilkan preview data</li>
              <li>Periksa data yang akan diupload, kemudian klik tombol &quot;Upload ke Database&quot;</li>
              <li>Sistem akan otomatis membuat tabel baru berdasarkan nama file</li>
            </ol>
            
            <div className="mt-4 p-4 bg-orange-100 rounded-lg border border-orange-300">
              <h3 className="font-semibold text-orange-800 mb-2">⚠️ Catatan Penting</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Maksimal ukuran file: 10MB</li>
                <li>• Format yang didukung: .kml, .kmz</li>
                <li>• Data akan divalidasi secara otomatis</li>
                <li>• Koordinat harus dalam rentang valid (latitude: -90 to 90, longitude: -180 to 180)</li>
                <li>• Karakter khusus dalam nama file akan diganti dengan underscore</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}