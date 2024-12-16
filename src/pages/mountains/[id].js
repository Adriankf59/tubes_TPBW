import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Footer from "../../../components/footer";

export default function Mountain({ mountain, directusPoints, directusLines, centerCoordinates }) {
  const mapContainerRef = useRef(null);
  const [is3D, setIs3D] = useState(false);
  const [map, setMap] = useState(null);
  const [mapStyle, setMapStyle] = useState('outdoor');
  const [showStyleBox, setShowStyleBox] = useState(false);
  const key = 'Bt7BC1waN22lhYojEJO1';

  const toggle3D = () => {
    setIs3D(!is3D);
    if (map) {
      if (!is3D) {
        if (!map.getSource('terrain')) {
          map.addSource('terrain', {
            type: 'raster-dem',
            url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`
          });
        }
        map.setTerrain({ source: 'terrain' });
      } else {
        if (map.getSource('terrain')) {
          map.setTerrain(undefined);
          map.removeSource('terrain');
        }
      }
    }
  };

  const changeMapStyle = (newStyle) => {
    if (map) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const currentPitch = map.getPitch();
      const currentBearing = map.getBearing();

      map.setStyle(`https://api.maptiler.com/maps/${newStyle}/style.json?key=${key}`);
      map.once('styledata', () => {
        map.setCenter(currentCenter);
        map.setZoom(currentZoom);
        map.setPitch(currentPitch);
        map.setBearing(currentBearing);

        // Re-add the 3D terrain if it was enabled
        if (is3D) {
          if (!map.getSource('terrain')) {
            map.addSource('terrain', {
              type: 'raster-dem',
              url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`
            });
          }
          map.setTerrain({ source: 'terrain' });
        }

        // Re-add the Directus data sources and layers after style change
        addSourceAndLayers(map);
      });
      setMapStyle(newStyle);
    } else {
      setMapStyle(newStyle);
    }
  };

  const addSourceAndLayers = (map) => {
    // Add source for directus points
    if (directusPoints.length && !map.getSource('directus-points')) {
      map.addSource('directus-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: directusPoints.map((point) => ({
            type: 'Feature',
            geometry: point.geom,
            properties: {
              name: point.name || "No Name",
              description: point.description || "No Description"
            }
          }))
        }
      });

      if (!map.getLayer('points-layer')) {
        map.addLayer({
          id: 'points-layer',
          type: 'circle',
          source: 'directus-points',
          paint: {
            'circle-radius': 6,
            'circle-color': '#007bff'
          }
        });
      }
    }

    // Add source for directus lines
    if (directusLines.length && !map.getSource('directus-lines')) {
      map.addSource('directus-lines', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: directusLines.map((line) => ({
            type: 'Feature',
            geometry: line.geom,
            properties: {
              name: line.name || "No Name",
              description: line.description || "No Description"
            }
          }))
        }
      });

      if (!map.getLayer('lines-layer')) {
        map.addLayer({
          id: 'lines-layer',
          type: 'line',
          source: 'directus-lines',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#03fc28',
            'line-width': 4
          }
        });
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${key}`,
      center: centerCoordinates,
      zoom: 13,
      maxPitch: 85
    });

    // Add built-in zoom and rotation controls to the map.
    newMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add the map scale control.
    newMap.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left');

    // Add geolocate control to the map.
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    newMap.addControl(geolocate, 'bottom-right');

    newMap.on('load', () => {
      // Add sources and layers from fetched Directus data
      addSourceAndLayers(newMap);

      // Create a popup, but don't add it to the map yet.
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      // Hover effect for points-layer
      newMap.on('mouseenter', 'points-layer', (e) => {
        newMap.getCanvas().style.cursor = 'pointer';

        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = `<strong>${e.features[0].properties.name}</strong><br>${e.features[0].properties.description}<br>Coordinates: [${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}]`;

        popup.setLngLat(coordinates).setHTML(description).addTo(newMap);
      });

      newMap.on('mouseleave', 'points-layer', () => {
        newMap.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    setMap(newMap);

    return () => newMap && newMap.remove();
  }, [centerCoordinates, mapStyle, is3D]);

  const toggleStyleBox = () => {
    setShowStyleBox(!showStyleBox);
  };

  return (
    <>
      <Head>
        <title>Hiking Route - {mountain?.name ?? "Data Not Available"}</title>
        <style>{`
          .map-container {
            height: 550px;  // Set the height of the map
            width: 100%;
            position: relative;
            border-radius: 8px;
            overflow: hidden;
          }

          .action-buttons {
            position: absolute;
            top: 50px;  // Place below the navigation control
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1;  // Ensure buttons are above the map
          }

          .action-buttons button {
            background-color: white;
            border: none;
            padding: 8px;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            z-index: 1;
          }

          .action-buttons button:hover {
            background-color: #f0f0f0;
          }

          .map-style-icon {
            position: absolute;
            bottom: 35px;
            left: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
            cursor: pointer;
          }

          .style-box {
            display: ${showStyleBox ? 'flex' : 'none'};
            flex-direction: column;
            position: absolute;
            bottom: 80px;
            left: 10px;
            width: 135px;
            background-color: white;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 100;
            border-radius: 8px;
          }

          .style-box-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .style-box-header h4 {
            margin: 0;
          }

          .style-box-header button {
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
          }

          .style-thumbnails {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .style-thumbnails div {
            display: flex;
            align-items: center;
            gap: 7px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          }

          .style-thumbnails div:hover {
            background-color: #f0f0f0;
          }

          .selected-style {
            border: 2px solid #007bff;
            padding: 2px;
            border-radius: 4px;
          }

          .style-thumbnails img {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}</style>
      </Head>
      <main className="">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link href="/" legacyBehavior>
              <a className="text-green-600 hover:underline">Back to Explore</a>
            </Link>
            <p className="text-sm text-gray-600">
              {mountain?.location ?? "Location Not Available"}
            </p>
          </div>
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            {mountain?.name ?? "Mountain Name Not Available"}
          </h1>
          {mountain ? (
            <>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center">
                  <span className="text-black font-semibold">{mountain.rating}</span>
                  <span className="mx-2 text-gray-400">·</span>
                  <span className="text-gray-600">{mountain.difficulty}</span>
                </div>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <span className="block text-lg font-bold text-black">{mountain.distance} km</span>
                    <span className="text-sm text-gray-500">Distance</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-bold text-black">
                      {mountain.elevation_gain} m
                    </span>
                    <span className="text-sm text-gray-500">Elevation gain</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-bold text-black">
                      {mountain.estimated_time}
                    </span>
                    <span className="text-sm text-gray-500">Estimated time</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-bold text-black">
                      {mountain.type}
                    </span>
                    <span className="text-sm text-gray-500">Type</span>
                  </div>
                </div>
              </div>
              <div className="relative mb-6">
                <img
                  src={`https://directus-394340675569.us-central1.run.app/assets/${mountain.image}`}
                  alt={mountain.name ?? "Image Not Available"}
                  className="w-full h-96 object-cover rounded-lg transition-transform duration-300"
                />
              </div>
            </>
          ) : (
            <p className="text-red-600">Mountain data is not available at the moment. Please try again later.</p>
          )}
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-xl font-bold text-green-800 mb-4">Overview</h2>
          <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: mountain ? mountain.penjelasan : "Overview not available" }}></div>
          <h2 className="text-xl font-bold text-green-800 mb-4">Peta Jalur Pendakian</h2>
          <div className="map-container mb-6">
            <div className="action-buttons">
              <button onClick={toggle3D} className={is3D ? 'bg-blue-600 text-white' : 'bg-white'}>
                3D
              </button>
            </div>
            <div className="map-style-icon" onClick={toggleStyleBox}>
              <img src="/images/icons8-map-80.png" alt="Map Style Icon" width="40" height="40" />
            </div>
            <div className="style-box">
              <div className="style-box-header">
                <h4>Peta Dasar</h4>
                <button onClick={toggleStyleBox}>✕</button>
              </div>
              <div className="style-thumbnails">
                <div className={mapStyle === 'outdoor' ? 'selected-style' : ''} onClick={() => changeMapStyle('outdoor')}>
                  <img src="/images/outdoor.jpg" alt="Outdoor" />
                  <span>Outdoor</span>
                </div>
                <div className={mapStyle === 'streets' ? 'selected-style' : ''} onClick={() => changeMapStyle('streets')}>
                  <img src="/images/street.jpg" alt="Streets" />
                  <span>Streets</span>
                </div>
                <div className={mapStyle === 'satellite' ? 'selected-style' : ''} onClick={() => changeMapStyle('satellite')}>
                  <img src="/images/satellite.jpg" alt="Satellite" />
                  <span>Satellite</span>
                </div>
              </div>
            </div>
            <div id="map" ref={mapContainerRef} className="map-container"></div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}

export async function getStaticPaths() {
  try {
    const res = await fetch('https://directus-394340675569.us-central1.run.app/items/mountains');
    if (!res.ok) throw new Error('Failed to fetch mountain data');
    const jsonData = await res.json();
    const mountains = jsonData.data;

    const paths = mountains.map((mountain) => ({
      params: { id: mountain.id.toString() },
    }));

    return {
      paths,
      fallback: 'blocking',
    };
  } catch (error) {
    console.error("Error fetching mountain paths:", error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}

export async function getStaticProps({ params }) {
  let mountain = null;
  let directusPoints = [];
  let directusLines = [];
  let centerCoordinates = [107.601529, -6.917464]; // Default coordinates of Indonesia

  try {
    const mountainRes = await fetch(`https://directus-394340675569.us-central1.run.app/items/mountains/${params.id}`);
    if (!mountainRes.ok) throw new Error('Failed to fetch mountain data');
    const mountainData = await mountainRes.json();
    mountain = mountainData.data;

    const pointKey = mountain.point || 'default';
    const trackKey = mountain.track || 'default';

    const resPoints = await fetch(`https://directus-394340675569.us-central1.run.app/items/${pointKey}`);
    if (resPoints.ok) {
      const pointsData = await resPoints.json();
      directusPoints = pointsData.data || [];
    }

    const resLines = await fetch(`https://directus-394340675569.us-central1.run.app/items/${trackKey}`);
    if (resLines.ok) {
      const linesData = await resLines.json();
      directusLines = linesData.data || [];
    }

    if (directusPoints.length > 0) {
      const pointIdOne = directusPoints.find(point => point.id === 1);
      if (pointIdOne && pointIdOne.geom) {
        centerCoordinates = pointIdOne.geom.coordinates;
      }
    }

  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return {
    props: {
      mountain,
      directusPoints,
      directusLines,
      centerCoordinates
    },
    revalidate: 10, // Re-generate the page at most once every 10 seconds if a request comes in
  };
}