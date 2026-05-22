import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MAP_TILE_URL, MAP_ATTRIBUTION } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import Badge from '../ui/Badge';

// Fix default marker icon issue with Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const severityIcons = {
  low: new L.DivIcon({
    className: 'custom-marker',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(16,185,129,0.4)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }),
  medium: new L.DivIcon({
    className: 'custom-marker',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(245,158,11,0.4)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }),
  high: new L.DivIcon({
    className: 'custom-marker',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f43f5e,#e11d48);border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(244,63,94,0.4)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }),
};

// Custom User Location Icon
const userLocationIcon = new L.DivIcon({
  className: 'custom-user-marker',
  html: '<div class="user-location-pulse"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const LocationSelector = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Custom Map Controls component that has access to useMap()
const CustomMapControls = ({ userLocation, enableHeatmap, setEnableHeatmap, onLocateMe }) => {
  const map = useMap();

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
      <div className="leaflet-control flex flex-col gap-2 m-4">
        {/* Zoom In */}
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="w-10 h-10 rounded-xl bg-dark-100/90 hover:bg-dark-50 border border-white/10 backdrop-blur-md shadow-lg flex items-center justify-center text-white transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="w-10 h-10 rounded-xl bg-dark-100/90 hover:bg-dark-50 border border-white/10 backdrop-blur-md shadow-lg flex items-center justify-center text-white transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* Locate Me */}
        <button
          type="button"
          onClick={() => {
            if (userLocation) {
              map.setView([userLocation.lat, userLocation.lng], 15);
            }
            if (onLocateMe) {
              onLocateMe();
            }
          }}
          className="w-10 h-10 rounded-xl bg-dark-100/90 hover:bg-dark-50 border border-white/10 backdrop-blur-md shadow-lg flex items-center justify-center text-accent-400 transition-colors"
          title="Locate Me"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Heatmap Toggle */}
        {setEnableHeatmap && (
          <button
            type="button"
            onClick={() => setEnableHeatmap(prev => !prev)}
            className={`w-10 h-10 rounded-xl border backdrop-blur-md shadow-lg flex items-center justify-center transition-colors ${
              enableHeatmap
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                : 'bg-dark-100/90 border-white/10 text-white hover:bg-dark-50 border-white/20'
            }`}
            title="Toggle Heatmap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const MapView = ({
  reports = [],
  center = [20.5937, 78.9629],
  zoom = 5,
  onLocationSelect,
  selectedLocation,
  userLocation,
  activeReport,
  onActiveReportClose,
  enableHeatmap,
  setEnableHeatmap,
  onLocateMe,
  style,
  className = '',
  children,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      className={`w-full h-full rounded-2xl ${className}`}
      style={{ minHeight: '400px', ...style }}
      scrollWheelZoom={true}
    >
      <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} />
      {onLocationSelect && <LocationSelector onLocationSelect={onLocationSelect} />}
      {center && <RecenterMap center={center} />}

      {/* Children elements (e.g. HeatmapLayer) */}
      {children}

      {/* Custom Map UI controls */}
      <CustomMapControls
        userLocation={userLocation}
        enableHeatmap={enableHeatmap}
        setEnableHeatmap={setEnableHeatmap}
        onLocateMe={onLocateMe}
      />

      {/* User's Accurate Location dot + accuracy circle */}
      {userLocation && userLocation.lat && userLocation.lng && (
        <>
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center text-xs">
                <p className="font-semibold text-white">Your Location</p>
                <p className="text-white/60 mt-0.5">Accuracy: &plusmn;{Math.round(userLocation.accuracy || 0)}m</p>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={userLocation.accuracy || 20}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        </>
      )}

      {/* Selected Location marker (for map picking) */}
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={new L.DivIcon({
            className: 'custom-marker',
            html: '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#06b6d4);border:3px solid white;box-shadow:0 2px 12px rgba(59,130,246,0.5);animation:pulse 2s infinite"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-sm">Selected Location</p>
              <p className="text-xs text-white/60 mt-1">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Programmatic Popup for activeReport (when clicked from sidebar) */}
      {activeReport && activeReport.location?.coordinates && (
        <Popup
          position={[
            activeReport.location.coordinates[1],
            activeReport.location.coordinates[0]
          ]}
          onClose={onActiveReportClose}
        >
          <div className="min-w-[200px]">
            <h3 className="font-semibold text-sm mb-1">{activeReport.title || 'Untitled Report'}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge type="severity" value={activeReport.severity} />
              <Badge type="status" value={activeReport.status} />
            </div>
            <p className="text-xs text-white/50">{formatDate(activeReport.createdAt)}</p>
            {activeReport.description && (
              <p className="text-xs text-white/60 mt-1 line-clamp-2">{activeReport.description}</p>
            )}
            <div className="mt-2 text-right">
              <Link
                to={`/reports/${activeReport._id}`}
                className="text-[11px] text-accent-400 hover:text-accent-500 font-medium inline-block hover:underline"
              >
                View Details &rarr;
              </Link>
            </div>
          </div>
        </Popup>
      )}

      {/* Reports markers (normal clickable markers) */}
      {reports.map((report) => {
        const coords = report.location?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [lng, lat] = coords;
        const severity = report.severity || 'medium';

        return (
          <Marker
            key={report._id}
            position={[lat, lng]}
            icon={severityIcons[severity] || severityIcons.medium}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1">{report.title || 'Untitled Report'}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge type="severity" value={severity} />
                  <Badge type="status" value={report.status} />
                </div>
                <p className="text-xs text-white/50">{formatDate(report.createdAt)}</p>
                {report.description && (
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">{report.description}</p>
                )}
                <div className="mt-2 text-right">
                  <Link
                    to={`/reports/${report._id}`}
                    className="text-[11px] text-accent-400 hover:text-accent-500 font-medium inline-block hover:underline"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;
