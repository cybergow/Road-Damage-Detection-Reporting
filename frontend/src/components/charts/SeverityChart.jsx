import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import GlassCard from '../ui/GlassCard';

ChartJS.register(ArcElement, Tooltip, Legend);

const SeverityChart = ({ data = { low: 0, medium: 0, high: 0 } }) => {
  const total = data.low + data.medium + data.high;

  const chartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        data: [data.low, data.medium, data.high],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(244, 63, 94, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(244, 63, 94, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { family: 'Inter', size: 12 },
        },
      },
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
  };

  return (
    <GlassCard className="relative">
      <h3 className="text-sm font-semibold text-white/80 mb-4">Severity Distribution</h3>
      <div className="relative h-64">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: '40px' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-xs text-white/50">Total</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default SeverityChart;
