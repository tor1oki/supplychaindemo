import React from 'react';
import { TabName } from '../types';
import { Calculator, Truck, Box, Workflow, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { name: TabName; icon: React.ReactNode }[] = [
    { name: 'Route calculator', icon: <Truck size={18} /> },
    { name: 'LTL / Partial', icon: <Box size={18} /> },
    { name: 'Supply Chain Modeling', icon: <Workflow size={18} /> },
    { name: 'KPIs', icon: <BarChart3 size={18} /> },
    { name: 'Calculator', icon: <Calculator size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex flex-col w-full md:w-64 shrink-0 h-auto md:h-full">
      {/* Menu Section */}
      <div className="bg-[#404040] rounded-xl md:rounded-3xl p-3 md:p-6 shadow-lg h-full flex flex-col overflow-hidden">
        <h2 className="text-gray-300 text-sm mb-4 font-medium px-2 shrink-0 hidden md:block"></h2>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden custom-scrollbar flex-1 pr-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-left transition-colors duration-200 shrink-0 whitespace-nowrap ${
                activeTab === item.name
                  ? 'bg-gray-600 text-white font-medium shadow-sm'
                  : 'text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
              }`}
            >
              {item.icon}
              <span className="text-xs md:text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;