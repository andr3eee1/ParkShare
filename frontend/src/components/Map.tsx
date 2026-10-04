import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { tokens } from '../theme/tokens';

let MapContainer: any, TileLayer: any, Marker: any, DivIcon: any, useMapEvents: any, useMap: any;
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Marker = RL.Marker;
  useMapEvents = RL.useMapEvents;
  useMap = RL.useMap;
  const L = require('leaflet');
  DivIcon = L.divIcon;
}

interface MapDestination {
  name: string;
  latitude: number;
  longitude: number;
}

const getDestinationCoordinates = (destination?: MapDestination): [number, number] => (
  destination ? [destination.latitude, destination.longitude] : [44.4820, 26.1130]
);

const CLUSTER_ZOOM_THRESHOLD = 16;
const CLUSTER_RADIUS = 64;
const DESTINATION_ZOOM_THRESHOLD = 12;

interface SpotCluster {
  spots: any[];
  center: [number, number];
  projectedCenter: { x: number; y: number };
}

const getSpotCoordinates = (spot: any): [number, number] => {
  if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
    return [spot.latitude, spot.longitude];
  }

  const baseLat = 44.4820;
  const baseLng = 26.1130;
  const lat = baseLat + (parseFloat(spot.y) - 50) * -0.0003;
  const lng = baseLng + (parseFloat(spot.x) - 50) * 0.0003;
  return [lat, lng];
};

const getSpotClusters = (spots: any[], map: any, selectedSpot: any): SpotCluster[] => {
  const bounds = map.getBounds();
  const visibleSpots = spots.filter((spot) => bounds.contains(getSpotCoordinates(spot)));
  const zoom = map.getZoom();

  if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
    return visibleSpots.map((spot) => ({
      spots: [spot],
      center: getSpotCoordinates(spot),
      projectedCenter: map.project(getSpotCoordinates(spot), zoom),
    }));
  }

  return visibleSpots.reduce<SpotCluster[]>((clusters, spot) => {
    if (selectedSpot?.id === spot.id) {
      clusters.push({
        spots: [spot],
        center: getSpotCoordinates(spot),
        projectedCenter: map.project(getSpotCoordinates(spot), zoom),
      });
      return clusters;
    }

    const coordinates = getSpotCoordinates(spot);
    const projected = map.project(coordinates, zoom);
    const nearbyCluster = clusters.find((cluster) => {
      if (cluster.spots.some((clusterSpot) => clusterSpot.id === selectedSpot?.id)) {
        return false;
      }

      const distance = Math.hypot(
        cluster.projectedCenter.x - projected.x,
        cluster.projectedCenter.y - projected.y,
      );
      return distance <= CLUSTER_RADIUS;
    });

    if (!nearbyCluster) {
      clusters.push({ spots: [spot], center: coordinates, projectedCenter: projected });
      return clusters;
    }

    nearbyCluster.spots.push(spot);
    const count = nearbyCluster.spots.length;
    nearbyCluster.center = [
      nearbyCluster.spots.reduce((sum, clusterSpot) => sum + getSpotCoordinates(clusterSpot)[0], 0) / count,
      nearbyCluster.spots.reduce((sum, clusterSpot) => sum + getSpotCoordinates(clusterSpot)[1], 0) / count,
    ];
    nearbyCluster.projectedCenter = map.project(nearbyCluster.center, zoom);
    return clusters;
  }, []);
};

const WebDestinationMarker = ({ destination }: { destination?: MapDestination }) => {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(map.getZoom() >= DESTINATION_ZOOM_THRESHOLD);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(map.getZoom() >= DESTINATION_ZOOM_THRESHOLD);
    map.on('zoomend', updateVisibility);
    return () => map.off('zoomend', updateVisibility);
  }, [map]);

  if (!isVisible || !destination) {
    return null;
  }

  return (
    <Marker
      position={getDestinationCoordinates(destination) as any}
      icon={new DivIcon({
        className: 'destination-leaflet-marker',
        html: '<div class="destination-marker"></div>',
        iconSize: [28, 34],
        iconAnchor: [14, 34],
      })}
      zIndexOffset={2000}
    />
  );
};

const WebMapSpots = ({ spots, selectedSpot, onSelectSpot }: {
  spots: any[];
  selectedSpot: any;
  onSelectSpot: (spot: any) => void;
}) => {
  const map = useMap();
  const [viewportVersion, setViewportVersion] = useState(0);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshVisibleSpots = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => setViewportVersion((version) => version + 1), 350);
    };

    setViewportVersion((version) => version + 1);
    map.on('zoomend moveend', refreshVisibleSpots);
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      map.off('zoomend moveend', refreshVisibleSpots);
    };
  }, [map, spots]);

  const clusters = getSpotClusters(spots, map, selectedSpot);
  void viewportVersion;

  return <>
    {clusters.map((cluster) => {
      if (cluster.spots.length > 1) {
        const icon = new DivIcon({
          className: 'cluster-leaflet-marker',
          html: `<div class="cluster-marker">${cluster.spots.length}</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        return (
          <Marker
            key={`cluster-${cluster.spots.map((spot) => spot.id).join('-')}`}
            position={cluster.center as any}
            icon={icon}
            eventHandlers={{
              click: () => map.setView(cluster.center, Math.min(map.getZoom() + 2, 18)),
            }}
          />
        );
      }

      const spot = cluster.spots[0];
      const isSelected = selectedSpot?.id === spot.id;
      const isMunicipal = spot.type === 'municipal';
      const bgColor = isMunicipal
        ? (isSelected ? '#1E3A8A' : '#3B82F6')
        : (isSelected ? '#14532D' : '#22C55E');
      const icon = new DivIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-content" style="background-color: ${bgColor}; transform: scale(${isSelected ? 1.2 : 1});"><span class="marker-price">${spot.price} RON</span><span class="marker-badge">${isMunicipal ? 'M' : 'P'}</span></div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      return (
        <Marker
          key={spot.id}
          position={getSpotCoordinates(spot) as any}
          icon={icon}
          zIndexOffset={isSelected ? 1000 : 0}
          eventHandlers={{ click: () => onSelectSpot(spot) }}
        />
      );
    })}
  </>;
};


const WebUserLocationMarker = ({ userLocation }: { userLocation?: { latitude: number; longitude: number } }) => {
  if (!userLocation) return null;
  return (
    <Marker
      position={[userLocation.latitude, userLocation.longitude] as any}
      icon={new DivIcon({
        className: 'user-leaflet-marker',
        html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })}
      zIndexOffset={3000}
    />
  );
};

export const Map = forwardRef(({ spots, selectedSpot, onSelectSpot, destination, userLocation }: {
  spots: any[];
  selectedSpot: any;
  onSelectSpot: (spot: any) => void;
  destination?: MapDestination;
  userLocation?: { latitude: number; longitude: number };
}, ref) => {
  const webviewRef = useRef<WebView>(null);
  const webMapRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (Platform.OS === 'web' && webMapRef.current) {
        webMapRef.current.zoomIn();
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`if (typeof map !== 'undefined') { map.zoomIn(); } true;`);
      }
    },
    zoomOut: () => {
      if (Platform.OS === 'web' && webMapRef.current) {
        webMapRef.current.zoomOut();
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`if (typeof map !== 'undefined') { map.zoomOut(); } true;`);
      }
    },
    centerOnLocation: (loc: { latitude: number; longitude: number }) => {
      if (Platform.OS === 'web' && webMapRef.current) {
        webMapRef.current.setView([loc.latitude, loc.longitude], 16);
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`if (typeof map !== 'undefined') { map.setView([${loc.latitude}, ${loc.longitude}], 16); } true;`);
      }
    }
  }));

  const getCoordinates = (spot: any): [number, number] => {
    if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
      return [spot.latitude, spot.longitude];
    }

    const baseLat = 44.4820;
    const baseLng = 26.1130;
    const lat = baseLat + (parseFloat(spot.y) - 50) * -0.0003; 
    const lng = baseLng + (parseFloat(spot.x) - 50) * 0.0003;
    return [lat, lng];
  };

  useEffect(() => {
    const targetCoordinates = selectedSpot
      ? getCoordinates(selectedSpot)
      : getDestinationCoordinates(destination);

    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.panTo(targetCoordinates);
    } else if (webviewRef.current) {
      let script = `if (typeof updateSelection === 'function') { updateSelection(${JSON.stringify(selectedSpot?.id || '')}); }`;
      script += `if (typeof map !== 'undefined') { map.panTo([${targetCoordinates[0]}, ${targetCoordinates[1]}]); }`;
      script += 'true;';
      webviewRef.current.injectJavaScript(script);
    }
  }, [selectedSpot, destination]);

  if (Platform.OS === 'web') {
    const WebMapEvents = () => {
      useMapEvents({
        click: () => onSelectSpot(null)
      });
      return null;
    };

    return (
      <View style={styles.container}>
        <style type="text/css">{`
          .leaflet-container { width: 100%; height: 100%; position: absolute; }
          .custom-leaflet-marker { background: transparent; border: none; }
          .destination-leaflet-marker { background: transparent; border: none; }
          .user-leaflet-marker { background: transparent; border: none; }
          .user-location-dot { width: 16px; height: 16px; background-color: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); position: relative; }
          .user-location-pulse { position: absolute; top: -12px; left: -12px; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: pulse 2s infinite ease-in-out; }
          @keyframes pulse { 0% { transform: scale(0.1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
          .cluster-leaflet-marker { background: transparent; border: none; }
          .marker-content {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 9999px;
            color: white;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.2s;
            white-space: nowrap;
          }
          .marker-price { margin-right: 4px; }
          .marker-badge {
            background-color: rgba(255,255,255,0.2);
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .cluster-marker {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-color: #86EFAC;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            color: #14532D;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 15px;
            font-weight: bold;
          }
          .destination-marker {
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            background-color: #EF4444;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            transform: rotate(-45deg);
            position: relative;
          }
          .destination-marker::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #FFFFFF;
            top: 6px;
            left: 6px;
          }
          .leaflet-control-attribution { display: none; }
        `}</style>
        
        <MapContainer 
          center={getDestinationCoordinates(destination)}
          zoom={14.5} 
          zoomControl={false}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          ref={webMapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <WebMapEvents />
          {destination && (
            <WebDestinationMarker key="destination" destination={destination} />
          )}
          <WebUserLocationMarker userLocation={userLocation} />
          <WebMapSpots spots={spots} selectedSpot={selectedSpot} onSelectSpot={onSelectSpot} />
        </MapContainer>
      </View>
    );
  }

  const htmlContent = (() => {
    const spotsJson = JSON.stringify(spots).replace(/</g, '\\u003c');
    const destinationCoordinates = getDestinationCoordinates(destination);

    const userLocationMarker = userLocation ? `
      L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
        icon: L.divIcon({
          className: 'user-leaflet-marker',
          html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        }),
        zIndexOffset: 3000
      }).addTo(map);
    ` : '';

    const destinationMarker = destination ? `
      var destinationMarker = L.marker([${destinationCoordinates[0]}, ${destinationCoordinates[1]}], {
        icon: L.divIcon({
          className: 'destination-leaflet-marker',
          html: '<div class="destination-marker"></div>',
          iconSize: [28, 34],
          iconAnchor: [14, 34]
        }),
        zIndexOffset: 2000
      }).addTo(map);
      function updateDestinationVisibility() {
        if (!destinationMarker) return;
        if (map.getZoom() < ${DESTINATION_ZOOM_THRESHOLD}) {
          if (map.hasLayer(destinationMarker)) map.removeLayer(destinationMarker);
        } else if (!map.hasLayer(destinationMarker)) {
          destinationMarker.addTo(map);
        }
      }
      map.on('zoomend', updateDestinationVisibility);
    ` : 'var destinationMarker = null;';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #EEF2F5; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
          .custom-leaflet-marker { background: transparent; border: none; }
          .destination-leaflet-marker { background: transparent; border: none; }
          .user-leaflet-marker { background: transparent; border: none; }
          .user-location-dot { width: 16px; height: 16px; background-color: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); position: relative; }
          .user-location-pulse { position: absolute; top: -12px; left: -12px; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: pulse 2s infinite ease-in-out; }
          @keyframes pulse { 0% { transform: scale(0.1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
          .cluster-leaflet-marker { background: transparent; border: none; }
          .marker-content {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 9999px;
            color: white;
            font-family: sans-serif;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
            transition: transform 0.2s, background-color 0.2s;
            cursor: pointer;
          }
          .marker-price { margin-right: 4px; }
          .marker-badge {
            background-color: rgba(255,255,255,0.2);
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .cluster-marker {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-color: #86EFAC;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            color: #14532D;
            font-family: sans-serif;
            font-size: 15px;
            font-weight: bold;
          }
          .destination-marker {
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            background-color: #EF4444;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            transform: rotate(-45deg);
            position: relative;
          }
          .destination-marker::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #FFFFFF;
            top: 6px;
            left: 6px;
          }
          .leaflet-control-attribution { display: none; }
          .leaflet-control-zoom { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${destinationCoordinates[0]}, ${destinationCoordinates[1]}], 14.5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          var spotData = ${spotsJson};
          var selectedId = null;
          var markersLayer = L.layerGroup().addTo(map);
          var refreshTimer = null;

          function spotCoordinates(spot) {
            if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
              return [spot.latitude, spot.longitude];
            }
            return [44.4820 + (parseFloat(spot.y) - 50) * -0.0003, 26.1130 + (parseFloat(spot.x) - 50) * 0.0003];
          }

          function markerHtml(spot) {
            var isSelected = spot.id === selectedId;
            var isMunicipal = spot.type === 'municipal';
            var color = isMunicipal ? (isSelected ? '#1E3A8A' : '#3B82F6') : (isSelected ? '#14532D' : '#22C55E');
            var scale = isSelected ? 'scale(1.2)' : 'scale(1)';
            return '<div class="marker-content" style="background-color: ' + color + '; transform: ' + scale + ';">' +
              '<span class="marker-price">' + spot.price + ' RON</span><span class="marker-badge">' + (isMunicipal ? 'M' : 'P') + '</span></div>';
          }

          function renderSpots() {
            markersLayer.clearLayers();
            var bounds = map.getBounds();
            var zoom = map.getZoom();
            var visibleSpots = spotData.filter(function(spot) { return bounds.contains(spotCoordinates(spot)); });
            var clusters = [];

            visibleSpots.forEach(function(spot) {
              var coordinates = spotCoordinates(spot);
              var projected = map.project(coordinates, zoom);
              if (zoom >= ${CLUSTER_ZOOM_THRESHOLD} || spot.id === selectedId) {
                clusters.push({ spots: [spot], center: coordinates, projectedCenter: projected });
                return;
              }

              var nearbyCluster = clusters.find(function(cluster) {
                if (cluster.spots.some(function(clusterSpot) { return clusterSpot.id === selectedId; })) return false;
                return Math.hypot(cluster.projectedCenter.x - projected.x, cluster.projectedCenter.y - projected.y) <= ${CLUSTER_RADIUS};
              });
              if (!nearbyCluster) {
                clusters.push({ spots: [spot], center: coordinates, projectedCenter: projected });
                return;
              }

              nearbyCluster.spots.push(spot);
              nearbyCluster.center = [
                nearbyCluster.spots.reduce(function(sum, clusterSpot) { return sum + spotCoordinates(clusterSpot)[0]; }, 0) / nearbyCluster.spots.length,
                nearbyCluster.spots.reduce(function(sum, clusterSpot) { return sum + spotCoordinates(clusterSpot)[1]; }, 0) / nearbyCluster.spots.length
              ];
              nearbyCluster.projectedCenter = map.project(nearbyCluster.center, zoom);
            });

            clusters.forEach(function(cluster) {
              if (cluster.spots.length > 1) {
                L.marker(cluster.center, {
                  icon: L.divIcon({
                    className: 'cluster-leaflet-marker',
                    html: '<div class="cluster-marker">' + cluster.spots.length + '</div>',
                    iconSize: [44, 44],
                    iconAnchor: [22, 22]
                  })
                }).addTo(markersLayer).on('click', function(e) {
                  L.DomEvent.stopPropagation(e);
                  map.setView(cluster.center, Math.min(map.getZoom() + 2, 18));
                });
                return;
              }

              var spot = cluster.spots[0];
              L.marker(spotCoordinates(spot), {
                icon: L.divIcon({
                  className: 'custom-leaflet-marker',
                  html: markerHtml(spot),
                  iconSize: [80, 30],
                  iconAnchor: [40, 15]
                })
              }).addTo(markersLayer).on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: spot.id }));
              });
            });
          }

          function scheduleRefresh() {
            if (refreshTimer) clearTimeout(refreshTimer);
            refreshTimer = setTimeout(renderSpots, 350);
          }

          map.on('zoomend moveend', scheduleRefresh);
          
          map.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click' }));
          });

          function updateSelection(nextSelectedId) {
            selectedId = nextSelectedId;
            renderSpots();
          }

          ${destinationMarker}
          ${userLocationMarker}
          renderSpots();
        </script>
      </body>
      </html>
    `;
  })();

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.mapGrid}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'map_click') {
              onSelectSpot(null);
            } else if (data.type === 'select') {
              const tappedSpot = spots.find((s: any) => s.id === data.id);
              if (tappedSpot) {
                onSelectSpot(tappedSpot);
              }
            }
          } catch {}
        }}
      />
    </View>
  );
});

Map.displayName = 'Map';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  mapGrid: {
    flex: 1,
  },
});
