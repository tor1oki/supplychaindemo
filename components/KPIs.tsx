
import React, { useState } from 'react';
import { KPIItem, CurrencySymbol } from '../types';
import { Plus, BarChart3, ChevronDown, DollarSign, X, Calculator, Info, Pencil, Trash2, TrendingUp, Percent, LayoutGrid, Table2, Calendar } from 'lucide-react';

interface KPIsProps {
  items: KPIItem[];
  onItemsUpdate: (items: KPIItem[]) => void;
  currency: CurrencySymbol;
}

const KPIs: React.FC<KPIsProps> = ({ items, onItemsUpdate, currency }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeType, setActiveType] = useState<'Revenue' | 'ROI'>('Revenue');
  const [editingItem, setEditingItem] = useState<KPIItem | null>(null);

  const [formInputs, setFormInputs] = useState({
    unitsSold: '',
    salesPrice: '',
    netProfit: '',
    cost: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleOpenModal = (type: 'Revenue' | 'ROI', item?: KPIItem) => {
    setActiveType(type);
    if (item) {
      setEditingItem(item);
      setFormInputs({
        unitsSold: item.inputs.unitsSold?.toString() || '',
        salesPrice: item.inputs.salesPrice?.toString() || '',
        netProfit: item.inputs.netProfit?.toString() || '',
        cost: item.inputs.cost?.toString() || '',
        note: item.note || '',
        date: new Date(item.timestamp).toISOString().split('T')[0]
      });
    } else {
      setEditingItem(null);
      setFormInputs({ 
        unitsSold: '', 
        salesPrice: '', 
        netProfit: '', 
        cost: '', 
        note: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
    setShowAddDropdown(false);
  };

  const handleSave = () => {
    let result = 0;
    let inputs = {};

    if (activeType === 'Revenue') {
      const units = parseFloat(formInputs.unitsSold) || 0;
      const price = parseFloat(formInputs.salesPrice) || 0;
      result = units * price;
      inputs = { unitsSold: units, salesPrice: price };
    } else {
      const profit = parseFloat(formInputs.netProfit) || 0;
      const cost = parseFloat(formInputs.cost) || 1; // avoid div by zero
      result = (profit / cost) * 100;
      inputs = { netProfit: profit, cost: cost };
    }

    const selectedDate = new Date(formInputs.date);
    const timestamp = selectedDate.getTime() + (selectedDate.getTimezoneOffset() * 60000);

    const newItem: KPIItem = {
      id: editingItem?.id || Date.now().toString(),
      type: activeType,
      result: result,
      note: formInputs.note,
      inputs: inputs,
      timestamp: isNaN(timestamp) ? Date.now() : timestamp
    };

    if (editingItem) {
      onItemsUpdate(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      onItemsUpdate([newItem, ...items]);
    }

    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    onItemsUpdate(items.filter(i => i.id !== id));
  };

  return (
    <div className="bg-[#404040] rounded-3xl p-4 md:p-6 shadow-lg h-full flex flex-col relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 px-1 border-b border-gray-700/50 pb-4 gap-4">
        <div className="flex flex-col">
          <h2 className="text-gray-200 font-medium text-lg">Supply Chain KPIs</h2>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Performance Metrics & Business Intelligence</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-[#2a2a2a] p-1 rounded-xl border border-gray-700 flex flex-1 sm:flex-none">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${viewMode === 'grid' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={14} /> <span>Grid</span>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${viewMode === 'table' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
              title="Spreadsheet View"
            >
              <Table2 size={14} /> <span>Spreadsheet</span>
            </button>
          </div>

          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg active:scale-95 w-full sm:w-auto whitespace-nowrap"
            >
              <Plus size={16}/> Add KPI <ChevronDown size={14} className={`transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showAddDropdown && (
              <div className="absolute right-0 mt-2 w-full sm:w-48 bg-[#2a2a2a] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => handleOpenModal('Revenue')}
                  className="w-full text-left px-4 py-3 text-xs text-gray-300 hover:bg-[#333] hover:text-white flex items-center gap-2 transition-colors border-b border-gray-800"
                >
                  <DollarSign size={14} className="text-cyan-400" /> Revenue
                </button>
                <button 
                  onClick={() => handleOpenModal('ROI')}
                  className="w-full text-left px-4 py-3 text-xs text-gray-300 hover:bg-[#333] hover:text-white flex items-center gap-2 transition-colors border-b border-gray-800"
                >
                  <Percent size={14} className="text-purple-400" /> ROI
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 opacity-50">
            <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center">
              <BarChart3 size={32} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">No KPIs Tracked Yet</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar h-full pr-1 pb-4">
            {items.map((item) => (
              <div key={item.id} className={`bg-[#2a2a2a] border border-gray-700/50 rounded-2xl p-4 flex flex-col group hover:border-cyan-500/30 transition-all shadow-md min-h-[auto] max-h-fit`}>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${item.type === 'Revenue' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-purple-900/30 text-purple-400'}`}>
                        {item.type === 'Revenue' ? <TrendingUp size={14} /> : <Percent size={14} />}
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.type}</h3>
                        <p className="text-[8px] text-gray-600 font-medium">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(item.type, item)} className="p-1 text-gray-500 hover:text-cyan-400 hover:bg-[#333] rounded-md transition-all"><Pencil size={12}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-[#333] rounded-md transition-all"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-xl font-black text-gray-100 tracking-tighter break-words leading-tight`}>
                      {item.type === 'Revenue' 
                        ? `${currency}${item.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${item.result.toFixed(2)}%`}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calculator size={9} /> 
                      {item.type === 'Revenue' ? (
                        <>{item.inputs.unitsSold?.toLocaleString()} units @ {currency}{item.inputs.salesPrice?.toLocaleString()}</>
                      ) : (
                        <>{currency}{item.inputs.netProfit?.toLocaleString()} Profit / {currency}{item.inputs.cost?.toLocaleString()} Cost</>
                      )}
                    </div>
                  </div>
                </div>

                {item.note && (
                  <div className="bg-[#1a1a1a] p-2 rounded-lg border border-gray-800 italic text-[9px] text-gray-500 leading-snug mt-2">
                    <p className="line-clamp-2">"{item.note}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[700px]">
                <thead className="bg-[#2a2a2a] text-[10px] text-gray-500 uppercase font-black tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 border-b border-gray-800">Metric Type</th>
                    <th className="px-6 py-4 border-b border-gray-800">Date</th>
                    <th className="px-6 py-4 border-b border-gray-800 text-right">Result Amount</th>
                    <th className="px-6 py-4 border-b border-gray-800">Calculation Parameters</th>
                    <th className="px-6 py-4 border-b border-gray-800">Note / Commentary</th>
                    <th className="px-6 py-4 border-b border-gray-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[#262626]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors border-b border-gray-800/50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${item.type === 'Revenue' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-purple-900/30 text-purple-400'}`}>
                            {item.type === 'Revenue' ? <TrendingUp size={14} /> : <Percent size={14} />}
                          </div>
                          <span className="font-bold text-gray-200">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-black tracking-tighter ${item.type === 'Revenue' ? 'text-cyan-400' : 'text-purple-400'}`}>
                          {item.type === 'Revenue' 
                            ? `${currency}${item.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${item.result.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {item.type === 'Revenue' ? (
                          <div className="flex items-center gap-3">
                            <span>Units: <span className="text-gray-200 font-bold">{item.inputs.unitsSold?.toLocaleString()}</span></span>
                            <span className="text-gray-700">|</span>
                            <span>Price: <span className="text-gray-200 font-bold">{currency}{item.inputs.salesPrice?.toLocaleString()}</span></span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span>Profit: <span className="text-purple-400 font-bold">{currency}{item.inputs.netProfit?.toLocaleString()}</span></span>
                            <span className="text-gray-700">|</span>
                            <span>Cost: <span className="text-gray-200 font-bold">{currency}{item.inputs.cost?.toLocaleString()}</span></span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs italic text-gray-500">
                        {item.note || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(item.type, item)} className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-[#333] rounded-lg transition-all"><Pencil size={14}/></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#333] rounded-lg transition-all"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#2a2a2a] px-6 py-3 border-t border-gray-800 text-[10px] text-gray-600 font-bold uppercase shrink-0 flex justify-between items-center">
              <span>Total Entries: {items.length}</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-400"></div><span className="text-[9px] text-gray-500">Revenue</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-400"></div><span className="text-[9px] text-gray-500">ROI</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-3xl w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-700 bg-[#2a2a2a] shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2 bg-[#333] rounded-xl ${activeType === 'Revenue' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {activeType === 'Revenue' ? <Calculator size={24} className="md:w-7 md:h-7" /> : <Percent size={24} className="md:w-7 md:h-7" />}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-200 leading-tight">{editingItem ? `Edit ${activeType}` : `New ${activeType} KPI`}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-widest mt-0.5">Performance Metric</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-[#333] hover:bg-gray-600 text-gray-300 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
              <div className="bg-[#1a1a1a] p-4 md:p-5 rounded-2xl border border-gray-800/50">
                <div className={`flex items-center gap-2 mb-2 md:mb-3 ${activeType === 'Revenue' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  <Info size={16} className="md:w-[18px] md:h-[18px]"/>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Formula Logic</span>
                </div>
                <p className="text-base md:text-lg text-gray-300 font-semibold">
                  {activeType === 'Revenue' ? 'Revenue = Units Sold × Sales Price per Unit' : 'ROI = (Net Profit / Cost) × 100'}
                </p>
              </div>

              <div className="space-y-5 md:space-y-6">
                <div>
                  <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold ml-1 block mb-2">Entry Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input 
                      type="date" 
                      value={formInputs.date}
                      onChange={(e) => setFormInputs({...formInputs, date: e.target.value})}
                      className="w-full bg-[#262626] text-white text-sm rounded-xl py-3 pl-10 pr-4 border border-gray-700 focus:border-cyan-400 outline-none transition-all" 
                    />
                  </div>
                </div>

                {activeType === 'Revenue' ? (
                  <>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold ml-1 block mb-2">Units Sold</label>
                      <input 
                        type="number" 
                        value={formInputs.unitsSold}
                        onChange={(e) => setFormInputs({...formInputs, unitsSold: e.target.value})}
                        placeholder="0"
                        className="w-full bg-[#262626] text-white text-base md:text-lg rounded-xl p-3.5 md:p-4 border border-gray-700 focus:border-cyan-400 outline-none transition-all placeholder:text-gray-700" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold ml-1 block mb-2">Sales Price per Unit ({currency})</label>
                      <input 
                        type="number" 
                        value={formInputs.salesPrice}
                        onChange={(e) => setFormInputs({...formInputs, salesPrice: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-[#262626] text-white text-base md:text-lg rounded-xl p-3.5 md:p-4 border border-gray-700 focus:border-cyan-400 outline-none transition-all placeholder:text-gray-700" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold ml-1 block mb-2">Net Profit ({currency})</label>
                      <input 
                        type="number" 
                        value={formInputs.netProfit}
                        onChange={(e) => setFormInputs({...formInputs, netProfit: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-[#262626] text-white text-base md:text-lg rounded-xl p-3.5 md:p-4 border border-gray-700 focus:border-purple-400 outline-none transition-all placeholder:text-gray-700" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold ml-1 block mb-2">Total Cost ({currency})</label>
                      <input 
                        type="number" 
                        value={formInputs.cost}
                        onChange={(e) => setFormInputs({...formInputs, cost: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-[#262626] text-white text-base md:text-lg rounded-xl p-3.5 md:p-4 border border-gray-700 focus:border-purple-400 outline-none transition-all placeholder:text-gray-700" 
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-[10px] md:text-xs text-gray-500 uppercase font-bold ml-1 block mb-2">Note (Optional)</label>
                  <textarea 
                    value={formInputs.note}
                    onChange={(e) => setFormInputs({...formInputs, note: e.target.value})}
                    placeholder="Describe this calculation..."
                    className="w-full bg-[#262626] text-white text-sm md:text-base rounded-xl p-3.5 md:p-4 border border-gray-700 focus:border-cyan-400 outline-none resize-none h-24 md:h-32 placeholder:text-gray-700" 
                  />
                </div>
              </div>

              <div className={`${activeType === 'Revenue' ? 'bg-cyan-900/10 border-cyan-500/20' : 'bg-purple-900/10 border-purple-500/20'} p-5 md:p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 shadow-inner`}>
                <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${activeType === 'Revenue' ? 'text-cyan-500' : 'text-purple-500'}`}>Total Result</span>
                <span className={`text-3xl md:text-4xl font-black ${activeType === 'Revenue' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {activeType === 'Revenue' ? (
                    <>{currency}{((parseFloat(formInputs.unitsSold) || 0) * (parseFloat(formInputs.salesPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                  ) : (
                    <>{((parseFloat(formInputs.netProfit) || 0) / (parseFloat(formInputs.cost) || 1) * 100).toFixed(2)}%</>
                  )}
                </span>
              </div>
            </div>

            <div className="p-5 md:p-6 border-t border-gray-800 bg-[#2a2a2a] flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0">
              <button onClick={() => setShowModal(false)} className="order-2 sm:order-1 flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3.5 md:py-4 rounded-xl text-xs md:text-sm font-bold transition-all border border-gray-700">Cancel</button>
              <button onClick={handleSave} className={`order-1 sm:order-2 flex-[2] text-black px-8 py-3.5 md:py-4 rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg active:scale-95 ${activeType === 'Revenue' ? 'bg-cyan-400 hover:bg-cyan-300' : 'bg-purple-400 hover:bg-purple-300'}`}>Save KPI Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIs;
