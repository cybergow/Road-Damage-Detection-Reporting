import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import GlassCard from '../ui/GlassCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopLocations = ({ data = [] }) => {
  const locations = data.length > 0
    ? data.slice(0, 5)
    : [
        { location: 'Main Street', count: 24 },
        { location: 'Highway 101', count: 18 },
        { location: 'Oak Avenue', count: 15 },
        { location: 'Park Road', count: 12 },
        { location: 'River Lane', count: 9 },
      ];

  const chartData = {
    labels: locations.map((l) => l.location),
    datasets: [
      {
        label: 'Reports',
        data: locations.map((l) => l.count),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, context.chart.width, 0);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.8)');
          return gradient;
        },
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.8)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter', size: 11 } },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter', size: 12 } },
      },
    },
  };

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-white/80 mb-4">Top Affected Locations</h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </GlassCard>
  );
};

export default TopLocations;
