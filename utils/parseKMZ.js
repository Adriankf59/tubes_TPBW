// utils/parseKMZ.js
// Alternative approach untuk parsing KMZ tanpa JSZip issues

export async function parseKMZAlternative(file) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.kml')) {
    // Langsung baca file KML
    const kmlContent = await file.text();
    return parseKMLContent(kmlContent);
  }
  
  if (fileName.endsWith('.kmz')) {
    // Untuk KMZ, kita akan menggunakan approach berbeda
    // Option 1: Minta user untuk extract manual
    throw new Error(
      "File KMZ terdeteksi. Karena ada masalah teknis dengan dekompresi, " +
      "silakan ekstrak file KMZ (rename ke .zip dan ekstrak), " +
      "kemudian upload file .kml yang ada di dalamnya."
    );
  }
  
  throw new Error("Format file tidak didukung. Gunakan file .kml");
}

export function parseKMLContent(kmlContent) {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlContent, "text/xml");
  
  // Check for parsing errors
  const parserError = kmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Format KML tidak valid");
  }
  
  // Manual parsing karena @tmcw/togeojson mungkin juga bermasalah
  const points = [];
  const tracks = [];
  
  // Parse Placemarks
  const placemarks = kmlDoc.getElementsByTagName("Placemark");
  
  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    const name = placemark.getElementsByTagName("name")[0]?.textContent || "Unnamed";
    const description = placemark.getElementsByTagName("description")[0]?.textContent || "";
    
    // Check for Point
    const pointElements = placemark.getElementsByTagName("Point");
    if (pointElements.length > 0) {
      const coordinates = pointElements[0].getElementsByTagName("coordinates")[0]?.textContent;
      if (coordinates) {
        const [lon, lat, alt] = coordinates.trim().split(",").map(Number);
        points.push({
          name,
          description,
          coordinates: [lon, lat, alt || 0]
        });
      }
    }
    
    // Check for LineString
    const lineStringElements = placemark.getElementsByTagName("LineString");
    if (lineStringElements.length > 0) {
      const coordinates = lineStringElements[0].getElementsByTagName("coordinates")[0]?.textContent;
      if (coordinates) {
        const coordsArray = coordinates.trim().split(/\s+/).map(coord => {
          const [lon, lat, alt] = coord.split(",").map(Number);
          return [lon, lat, alt || 0];
        });
        tracks.push({
          name,
          description,
          coordinates: coordsArray
        });
      }
    }
  }
  
  return { points, tracks };
}

// Helper function untuk membaca KMZ menggunakan native browser APIs
export async function extractKMZUsingFileAPI(file) {
  // Ini hanya akan work jika browser support File System Access API
  if ('showOpenFilePicker' in window) {
    return {
      error: "Untuk membaca file KMZ, silakan ekstrak manual terlebih dahulu:\n" +
             "1. Rename file .kmz menjadi .zip\n" +
             "2. Ekstrak file zip tersebut\n" +
             "3. Upload file .kml yang ada di dalamnya"
    };
  }
  
  return {
    error: "Browser tidak mendukung pembacaan file KMZ. Silakan ekstrak manual dan upload file KML."
  };
}