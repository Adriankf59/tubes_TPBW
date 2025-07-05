import React, { useState, useEffect } from 'react';
import { Download, Upload, Eye, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const ExportDataComponent = () => {
  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState({ type: null, message: "" });
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch mountains data from database
  const fetchMountains = async () => {
    setLoading(true);
    try {
      // This would fetch from your database
      // For now, I'll simulate with sample data
      const response = await fetch('/api/mountains');
      if (response.ok) {
        const data = await response.json();
        setMountains(data);
      } else {
        throw new Error('Failed to fetch mountains data');
      }
    } catch (error) {
      console.error('Error fetching mountains:', error);
      setExportStatus({ 
        type: "error", 
        message: "Gagal mengambil data gunung: " + error.message 
      });
      
      // Sample data for demonstration
      const sampleData = [
        {
          id: 3,
          name: "Ciremai",
          kota: "Kuningan",
          provinsi: "Jawa Barat",
          elevation: "3078",
          difficulty: "Easy",
          image: "",
          rating: "4.0",
          penjelasan: "A solitary giant, this Ribu is the highest peak in West Java...",
          point: "point_ciremai",
          track: "jalur_ciremai"
        }
      ];
      setMountains(sampleData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMountains();
  }, []);

  // Format data for export
  const formatDataForExport = (data) => {
    return data.map(mountain => ({
      id: mountain.id || "",
      name: mountain.name || "",
      kota: mountain.kota || "",
      provinsi: mountain.provinsi || "",
      elevation: mountain.elevation || "",
      difficulty: mountain.difficulty || "",
      image: mountain.image || "",
      rating: mountain.rating || "",
      penjelasan: mountain.penjelasan || "",
      point: mountain.point || "",
      track: mountain.track || ""
    }));
  };

  // Convert to CSV format
  const convertToCSV = (data) => {
    const headers = ["id", "name", "kota", "provinsi", "elevation", "difficulty", "image", "rating", "penjelasan", "point", "track"];
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  // Preview data before export
  const previewExportData = () => {
    const formattedData = formatDataForExport(mountains);
    setPreviewData(formattedData);
    setShowPreview(true);
  };

  // Export to CSV file
  const exportToCSV = () => {
    try {
      const formattedData = formatDataForExport(mountains);
      const csvContent = convertToCSV(formattedData);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `mountains_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportStatus({ 
        type: "success", 
        message: "Data berhasil diekspor ke file CSV" 
      });
    } catch (error) {
      setExportStatus({ 
        type: "error", 
        message: "Gagal mengekspor ke CSV: " + error.message 
      });
    }
  };

  // Export to JSON file
  const exportToJSON = () => {
    try {
      const formattedData = formatDataForExport(mountains);
      const jsonContent = JSON.stringify(formattedData, null, 2);
      
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `mountains_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportStatus({ 
        type: "success", 
        message: "Data berhasil diekspor ke file JSON" 
      });
    } catch (error) {
      setExportStatus({ 
        type: "error", 
        message: "Gagal mengekspor ke JSON: " + error.message 
      });
    }
  };

  // Send data to API endpoint
  const sendToAPI = async (format = 'json') => {
    setLoading(true);
    try {
      const formattedData = formatDataForExport(mountains);
      const apiUrl = 'https://adrianfirmansyah-website.my.id/trailview/items/mountains';
      
      // Prepare payload based on format
      let payload;
      let contentType;
      
      if (format === 'csv') {
        payload = convertToCSV(formattedData);
        contentType = 'text/csv';
      } else {
        payload = JSON.stringify(formattedData);
        contentType = 'application/json';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
        body: payload
      });

      if (response.ok) {
        const result = await response.json();
        setExportStatus({ 
          type: "success", 
          message: `Data berhasil dikirim ke API dalam format ${format.toUpperCase()}. Response: ${JSON.stringify(result)}` 
        });
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Export to API error:', error);
      setExportStatus({ 
        type: "error", 
        message: `Gagal mengirim data ke API: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (exportStatus.type) {
      case "success": return "bg-green-100 border-green-500 text-green-700";
      case "error": return "bg-red-100 border-red-500 text-red-700";
      case "info": return "bg-blue-100 border-blue-500 text-blue-700";
      default: return "";
    }
  };

  const getStatusIcon = () => {
    switch (exportStatus.type) {
      case "success": return <CheckCircle className="w-5 h-5" />;
      case "error": return <AlertCircle className="w-5 h-5" />;
      case "info": return <AlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Export Data Gunung</h1>
      
      {/* Status Message */}
      {exportStatus.message && (
        <div className={`mb-6 p-4 border rounded-lg flex items-center ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="ml-2">{exportStatus.message}</span>
        </div>
      )}

      {/* Data Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Ringkasan Data</h2>
        <p className="text-gray-600">
          Total gunung dalam database: <span className="font-medium">{mountains.length}</span>
        </p>
        {loading && (
          <div className="flex items-center mt-2">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-gray-500">Memuat data...</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={previewExportData}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-5 h-5 mr-2" />
          Preview Data
        </button>

        <button
          onClick={exportToCSV}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5 mr-2" />
          Export CSV
        </button>

        <button
          onClick={exportToJSON}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5 mr-2" />
          Export JSON
        </button>

        <button
          onClick={() => sendToAPI('json')}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 mr-2" />
          Send JSON to API
        </button>

        <button
          onClick={() => sendToAPI('csv')}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 mr-2" />
          Send CSV to API
        </button>

        <button
          onClick={fetchMountains}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          Refresh Data
        </button>
      </div>

      {/* Preview Data */}
      {showPreview && previewData.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Preview Data Export</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Kota</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Provinsi</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Elevation</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Difficulty</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Rating</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Point</th>
                  <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Track</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((mountain, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 border text-sm">{mountain.id}</td>
                    <td className="px-4 py-2 border text-sm font-medium">{mountain.name}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.kota}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.provinsi}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.elevation}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.difficulty}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.rating}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.point}</td>
                    <td className="px-4 py-2 border text-sm">{mountain.track}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                Menampilkan 5 dari {previewData.length} data. Data lengkap akan diekspor.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Petunjuk Penggunaan</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Preview Data:</strong> Lihat data yang akan diekspor sebelum melakukan export atau pengiriman</p>
          <p><strong>Export CSV/JSON:</strong> Download data dalam format CSV atau JSON ke komputer Anda</p>
          <p><strong>Send to API:</strong> Kirim data langsung ke endpoint API dalam format JSON atau CSV</p>
          <p><strong>Refresh Data:</strong> Muat ulang data terbaru dari database</p>
        </div>
        
        <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Format Data Export:</h3>
          <p className="text-sm text-blue-700">
            Data akan diekspor dengan kolom: id, name, kota, provinsi, elevation, difficulty, image, rating, penjelasan, point, track
          </p>
        </div>

        <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
          <h3 className="font-semibold text-yellow-800 mb-2">🔗 API Endpoint:</h3>
          <p className="text-sm text-yellow-700 font-mono">
            https://adrianfirmansyah-website.my.id/trailview/items/mountains
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Data akan dikirim menggunakan method POST dengan Content-Type sesuai format yang dipilih.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportDataComponent;