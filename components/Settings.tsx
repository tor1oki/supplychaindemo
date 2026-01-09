import React from 'react';
import { UnitSystem, CurrencySymbol } from '../types';
import { Globe, ShieldCheck, Zap, DollarSign } from 'lucide-react';

interface SettingsProps {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  currency: CurrencySymbol;
  setCurrency: (currency: CurrencySymbol) => void;
}

const Settings: React.FC<SettingsProps> = ({ unitSystem, setUnitSystem, currency, setCurrency }) => {
  return (
    <div className="bg-[#404040] rounded-3xl p-4 md:p-6 shadow-lg h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0 px-1 border-b border-gray-700/50 pb-4">
        <div className="flex flex-col">
          <h2 className="text-gray-200 font-medium text-lg">Application Settings</h2>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Personalize your experience</p>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto space-y-10 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {/* Unit System Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <Globe size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Regional Units</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setUnitSystem('US')}
              className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 ${
                unitSystem === 'US' 
                ? 'bg-cyan-900/20 border-cyan-400 shadow-lg shadow-cyan-900/20' 
                : 'bg-[#2a2a2a] border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-widest ${unitSystem === 'US' ? 'text-cyan-400' : 'text-gray-500'}`}>
                  US Standard
                </span>
                {unitSystem === 'US' && <ShieldCheck size={16} className="text-cyan-400" />}
              </div>
              <div className="text-lg font-bold text-gray-200">Imperial System</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Uses Miles (mi), Pounds (lbs), Inches (in), and Feet (ft) for all logistics calculations.
              </p>
            </button>

            <button 
              onClick={() => setUnitSystem('EU')}
              className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 ${
                unitSystem === 'EU' 
                ? 'bg-cyan-900/20 border-cyan-400 shadow-lg shadow-cyan-900/20' 
                : 'bg-[#2a2a2a] border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-widest ${unitSystem === 'EU' ? 'text-cyan-400' : 'text-gray-500'}`}>
                  EU Standard
                </span>
                {unitSystem === 'EU' && <ShieldCheck size={16} className="text-cyan-400" />}
              </div>
              <div className="text-lg font-bold text-gray-200">Metric System</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Uses Kilometers (km), Kilograms (kg), Centimeters (cm), and Meters (m) for all logistics calculations.
              </p>
            </button>
          </div>
        </section>

        {/* Currency Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-purple-400">
            <DollarSign size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Currency Symbol</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setCurrency('$')}
              className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                currency === '$' 
                ? 'bg-purple-900/20 border-purple-400 shadow-lg shadow-purple-900/20' 
                : 'bg-[#2a2a2a] border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold text-gray-200">USD / Symbol</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">Dollar ($)</span>
              </div>
              <span className={`text-3xl font-black ${currency === '$' ? 'text-purple-400' : 'text-gray-600'}`}>$</span>
            </button>

            <button 
              onClick={() => setCurrency('€')}
              className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                currency === '€' 
                ? 'bg-purple-900/20 border-purple-400 shadow-lg shadow-purple-900/20' 
                : 'bg-[#2a2a2a] border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold text-gray-200">EUR / Symbol</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">Euro (€)</span>
              </div>
              <span className={`text-3xl font-black ${currency === '€' ? 'text-purple-400' : 'text-gray-600'}`}>€</span>
            </button>
          </div>
        </section>

        {/* Info Section */}
        <div className="bg-[#2a2a2a]/50 border border-gray-700 p-6 rounded-2xl flex gap-4 items-start">
          <div className="p-3 bg-cyan-900/30 rounded-xl text-cyan-400 shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200 mb-1">Visual Change Only</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Switching systems will only update input labels and titles. <strong>Existing numeric data will not be mathematically converted.</strong> 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;