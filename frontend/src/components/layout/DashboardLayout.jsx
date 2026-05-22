import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <motion.main
        animate={{ marginLeft: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="pt-16 min-h-screen lg:ml-64"
        style={{ marginLeft: undefined }}
      >
        <motion.div
          animate={{ marginLeft: window.innerWidth >= 1024 ? (sidebarCollapsed ? 72 : 256) : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
