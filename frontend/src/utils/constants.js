export const API_URL = 'http://localhost:5000/api';

export const SEVERITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f43f5e',
};

export const STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#3b82f6',
  in_progress: '#06b6d4',
  resolved: '#10b981',
  rejected: '#f43f5e',
};

export const SEVERITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: SEVERITY_COLORS.low },
  { value: 'medium', label: 'Medium', color: SEVERITY_COLORS.medium },
  { value: 'high', label: 'High', color: SEVERITY_COLORS.high },
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];
