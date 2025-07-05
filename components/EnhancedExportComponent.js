import React, { useState, useEffect } from 'react';
import { Download, Upload, Eye, AlertCircle, CheckCircle, Loader, Edit, Save, X } from 'lucide-react';

const EnhancedExportComponent = () => {
  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState({ type: null, message: "" });
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingMountain, setEditingMountain] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch mountains data from database
  const fetchMountains = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mountains');
      if (response.ok) {
        const data = await response.json();
        setMountains(data);
        setExportStatus({ 
          type: "success", 
          message: `Berhasil memuat ${data.length} data gunung dari database` 
        });
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
          id: 1,
          name: "Ciremai",
          kota: "Kuningan",
          provinsi: "Jawa Barat",
          elevation: "3078",
          difficulty: "Easy",
          image: "",
          rating: "4.0",
          penjelasan: "A solitary giant, this Ribu is the highest peak in West Java province and one of the most popular hikes in Indonesia...",
          point: "point_ciremai",
          track: "jalur_ciremai"
        },
        {
          id: 2,
          name: "Merapi",
          kota: "Sleman",
          provinsi: "Yogyakarta",
          elevation: "2930",
          difficulty: "Hard",
          image: "",
          rating: "4.5",
          penjelasan: "Gunung Merapi adalah gunung berapi aktif yang terletak di perbatasan Jawa Tengah dan Yogyakarta...",
          point: "point_merapi",
          track: "jalur_merapi"
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

  // Update mountain metadata
  const updateMountainMetadata = async (mountainData) => {
    try {
      const response = await fetch('/api/mountains/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mountainData)
      });

      if (response.ok) {
        setExportStatus({ 
          type: "success", 
          message: `Metadata untuk ${mountainData.name} berhasil diperbarui` 
        });
        fetchMountains(); // Refresh data
      } else {
        throw new Error('Failed to update metadata');
      }
    } catch (error) {
      setExportStatus({ 
        type: "error", 
        message: "Gagal memperbarui metadata: " + error.message 
      });
    }
  };

  // Start editing a mountain
  const startEditing = (mountain) => {
    setEditingMountain(mountain.id);
    setEditForm({ ...mountain });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMountain(null);
    setEditForm({});
  };

  // Save edited mountain
  const saveEditing = async () => {
    await updateMountainMetadata(editForm);
    setEditingMountain(null);
    setEditForm({});
  };

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
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Export & Manage Data Gunung</h1>
      
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={previewExportData}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </button>

        <button
          onClick={exportToCSV}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Download className="w-4 h-4 mr-1" />
          CSV
        </button>

        <button
          onClick={exportToJSON}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Download className="w-4 h-4 mr-1" />
          JSON
        </button>

        <button
          onClick={() => sendToAPI('json')}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Upload className="w-4 h-4 mr-1" />
          API JSON
        </button>

        <button
          onClick={() => sendToAPI('csv')}
          disabled={loading || mountains.length === 0}
          className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Upload className="w-4 h-4 mr-1" />
          API CSV
        </button>

        <button
          onClick={fetchMountains}
          disabled={loading}
          className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <Loader className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-1" />
          )}
          Refresh
        </button>
      </div>

      {/* Mountains Data Table */}
      {mountains.length > 0 && (
        <div className="bg-white border rounded-lg mb-6 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold">Data Gunung</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nama</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Kota</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Provinsi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Elevasi</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Kesulitan</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rating</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Point Table</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Track Table</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {mountains.map((mountain, index) => (
                  <tr key={mountain.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {editingMountain === mountain.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.kota || ''}
                            onChange={(e) => setEditForm({...editForm, kota: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.provinsi || ''}
                            onChange={(e) => setEditForm({...editForm, provinsi: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.elevation || ''}
                            onChange={(e) => setEditForm({...editForm, elevation: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.difficulty || ''}
                            onChange={(e) => setEditForm({...editForm, difficulty: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Extreme">Extreme</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.rating || ''}
                            onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{mountain.point}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{mountain.track}</td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={saveEditing}
                              className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-sm font-medium">{mountain.name}</td>
                        <td className="px-4 py-2 text-sm">{mountain.kota}</td>
                        <td className="px-4 py-2 text-sm">{mountain.provinsi}</td>
                        <td className="px-4 py-2 text-sm">{mountain.elevation}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            mountain.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                            mountain.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            mountain.difficulty === 'Hard' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {mountain.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{mountain.rating}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{mountain.point}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{mountain.track}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => startEditing(mountain)}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Data */}
      {showPreview && previewData.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Preview Data Export</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">ID</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Name</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Kota</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Provinsi</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Elevation</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Difficulty</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Rating</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Point</th>
                  <th className="px-2 py-1 border text-left font-medium text-gray-700">Track</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((mountain, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 border">{mountain.id}</td>
                    <td className="px-2 py-1 border font-medium">{mountain.name}</td>
                    <td className="px-2 py-1 border">{mountain.kota}</td>
                    <td className="px-2 py-1 border">{mountain.provinsi}</td>
                    <td className="px-2 py-1 border">{mountain.elevation}</td>
                    <td className="px-2 py-1 border">{mountain.difficulty}</td>
                    <td className="px-2 py-1 border">{mountain.rating}</td>
                    <td className="px-2 py-1 border">{mountain.point}</td>
                    <td className="px-2 py-1 border">{mountain.track}</td>
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
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Petunjuk Penggunaan</h2>
        <div className="space-y-2 text-gray-700 text-sm">
          <p><strong>Edit Data:</strong> Klik icon edit (✏️) untuk mengubah metadata gunung</p>
          <p><strong>Preview:</strong> Lihat data yang akan diekspor sebelum melakukan export</p>
          <p><strong>Export CSV/JSON:</strong> Download data dalam format CSV atau JSON</p>
          <p><strong>Send to API:</strong> Kirim data langsung ke endpoint API</p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
          <h3 className="font-semibold text-blue-800 mb-2">🔗 API Endpoint:</h3>
          <p className="text-sm text-blue-700 font-mono">
            https://adrianfirmansyah-website.my.id/trailview/items/mountains
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedExportComponent;