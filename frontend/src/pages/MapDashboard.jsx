import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMap, FiList, FiCompass, FiInfo, FiChevronLeft, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';
import axios from '../api/axios';
import Navbar from '../components/layout/Navbar';
import MapView from '../components/map/MapView';
import HeatmapLayer from '../components/map/HeatmapLayer';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function MapDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enableHeatmap, setEnableHeatmap] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState(5);
  
  // Geolocation & Proximity States
  const [userLocation, setUserLocation] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  // Search Geocoding States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    const fetchApprovedReports = async () => {
      try {
        const response = await axios.get('/reports/map');
        setReports(response.data.data || []);
      } catch (err) {
        console.error('Error fetching map reports:', err);
        toast.error('Could not load map reports');
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedReports();
  }, []);

  // Continuous watchPosition tracking with high accuracy
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        
        // Auto center on user's location on first coordinate load
        if (!hasCentered) {
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
          setHasCentered(true);
        }
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasCentered]);

  // Haversine distance formula (in km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLocateMe = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(15);
      toast.success('Centered on your live location');
    } else {
      toast.error('Still retrieving your location coordinates...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude, accuracy });
          setMapCenter([latitude, longitude]);
          setMapZoom(15);
        },
        () => {
          toast.error('Could not retrieve location. Please check browser permissions.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Debounced search lookup using Nominatim API
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.warn('Geocoding search error:', err);
      }
    }, 400);
    setSearchTimeout(timeout);
  };

  const selectSuggestion = (sug) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    setMapCenter([lat, lon]);
    setMapZoom(14);
    setSuggestions([]);
    setSearchQuery(sug.display_name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleFocusReport = (report) => {
    const coords = report.location?.coordinates;
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;
    setMapCenter([lat, lng]);
    setMapZoom(15);
    setActiveReport(report);
  };

  // Map and sort reports by proximity
  const reportsWithDistance = reports.map(r => {
    const coords = r.location?.coordinates;
    if (!coords || coords.length < 2 || !userLocation) return { ...r, distance: null };
    const [lng, lat] = coords;
    const distance = getDistance(userLocation.lat, userLocation.lng, lat, lng);
    return { ...r, distance };
  });

  const filteredReports = severityFilter === 'all'
    ? reportsWithDistance
    : reportsWithDistance.filter(r => r.severity === severityFilter);

  // Sort closest first if distances are calculated
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  // Heatmap points structure: [lat, lng, intensity]
  const heatmapPoints = reports
    .map(r => {
      const coords = r.location?.coordinates;
      if (!coords) return null;
      const intensity = r.severity === 'high' ? 1.0 : r.severity === 'medium' ? 0.6 : 0.2;
      return [coords[1], coords[0], intensity]; // Leaflet is [lat, lng]
    })
    .filter(Boolean);

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-200 text-white overflow-hidden relative">
      <Navbar />

      {/* Map body */}
      <div className="flex-grow pt-16 flex relative z-10">
        
        {/* Sidebar panel */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -350, opacity: 0 }}
              className="absolute left-0 top-16 bottom-0 w-80 glass-card border-l-0 border-y-0 rounded-none z-30 flex flex-col p-4 space-y-4 shrink-0 shadow-2xl"
            >
              <div>
                <h2 className="text-lg font-bold">Road Damage Radar</h2>
                <p className="text-[11px] text-white/50">Aggregating public safety reports from the city.</p>
              </div>

              {/* Filters */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-white/40 uppercase">Filter Severity</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['all', 'low', 'medium', 'high'].map(val => (
                    <button
                      key={val}
                      onClick={() => setSeverityFilter(val)}
                      className={`py-1 text-xs font-medium capitalize rounded-lg border border-white/10 ${
                        severityFilter === val
                          ? 'bg-primary-500/20 border-primary-500 text-primary-400 font-bold'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reports list */}
              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                <span className="text-[10px] font-semibold text-white/40 uppercase block">Reports List ({sortedReports.length})</span>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="h-16 w-full animate-pulse rounded-lg bg-white/5" />
                    ))}
                  </div>
                ) : sortedReports.length === 0 ? (
                  <div className="text-center py-10 text-xs text-white/40">
                    No reports match this criteria.
                  </div>
                ) : (
                  sortedReports.map(r => (
                    <div
                      key={r._id}
                      onClick={() => handleFocusReport(r)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs cursor-pointer ${
                        activeReport?._id === r._id
                          ? 'bg-primary-500/10 border-primary-500 shadow-md shadow-primary-500/5'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="min-w-0 flex-grow">
                        <h4 className="font-bold text-white truncate">{r.title}</h4>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">{r.address || 'Address unlisted'}</p>
                        {r.distance !== null && r.distance !== undefined && (
                          <span className="text-[10px] text-accent-400 font-bold mt-1 block">
                            {r.distance < 1
                              ? `${Math.round(r.distance * 1000)} m away`
                              : `${r.distance.toFixed(1)} km away`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge type="severity" value={r.severity} className="scale-90" />
                        <Link
                          to={`/reports/${r._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-accent-400 hover:text-accent-300 font-semibold underline animate-none"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar trigger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-[20%] p-2 rounded-r-xl bg-primary-600/80 border border-l-0 border-white/10 text-white z-30 transition-transform hidden sm:block"
          style={{ transform: sidebarOpen ? 'translateX(320px)' : 'translateX(0)' }}
        >
          {sidebarOpen ? <FiChevronLeft className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
        </button>

        {/* Floating Search Bar (Aligned dynamically relative to Sidebar) */}
        <div
          className="absolute top-20 z-20 w-72 transition-all duration-300"
          style={{ left: sidebarOpen ? '340px' : '16px' }}
        >
          <div className="relative">
            <div className="flex items-center bg-dark-100/90 border border-white/10 rounded-xl px-3 py-2.5 shadow-lg backdrop-blur-md">
              <FiSearch className="text-white/40 mr-2 w-4 h-4" />
              <input
                type="text"
                placeholder="Search address or area..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-white/40"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="text-white/40 hover:text-white">
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-dark-100/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30 max-h-60 overflow-y-auto backdrop-blur-md">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSuggestion(sug)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 truncate block text-white/80"
                    title={sug.display_name}
                  >
                    {sug.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaflet instance */}
        <div className="absolute inset-0 z-0">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            reports={sortedReports}
            userLocation={userLocation}
            activeReport={activeReport}
            onActiveReportClose={() => setActiveReport(null)}
            enableHeatmap={enableHeatmap}
            setEnableHeatmap={setEnableHeatmap}
            onLocateMe={handleLocateMe}
          >
            {enableHeatmap && heatmapPoints.length > 0 && (
              <HeatmapLayer points={heatmapPoints} />
            )}
          </MapView>
        </div>
      </div>
    </div>
  );
}
