import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points = [], options = {} }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const defaultOptions = {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.0: '#10b981',
        0.3: '#22d3ee',
        0.5: '#f59e0b',
        0.7: '#f97316',
        1.0: '#f43f5e',
      },
      ...options,
    };

    const heat = L.heatLayer(points, defaultOptions).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points, options]);

  return null;
};

export default HeatmapLayer;
