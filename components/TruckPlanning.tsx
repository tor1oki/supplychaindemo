import React, { useState } from 'react';
import { TruckPlanningData, RouteHistoryItem, PlannedRoute, CalculationResult, UnitSystem, CurrencySymbol } from '../types';
import { Fuel, DollarSign, ArrowRight, Wallet, History, Receipt, Banknote, Plus, X, Pencil, MapPin, Calculator, TrendingUp, Save, RotateCcw } from 'lucide-react';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, icon, type="text", placeholder, onChange, className }) => (
  <div className={className}>
    <label className="block text-gray-500 font-bold uppercase mb-1 ml-1 text-[9px] truncate">{label}</label>
    <div className="relative group">
      {icon && (
        <div className="absolute top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors left-2.5">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 12 })}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700/50 focus:border-cyan-400 focus:bg-[#151515] outline-none transition-all placeholder:text-gray-700 py-2 text-xs ${icon ? 'pl-8' : 'pl-3'} pr-2`}
      />
    </div>
  </div>
);

interface TruckPlanningProps {
  draft: TruckPlanningData;
  onUpdateDraft: (data: TruckPlanningData) => void;
  routes: PlannedRoute[];
  onUpdateRoutes: (routes: PlannedRoute[]) => void;
  history: RouteHistoryItem[];
  onHistoryUpdate: (history: RouteHistoryItem[]) => void;
  unitSystem: UnitSystem;
  currency: CurrencySymbol;
}

const TruckPlanning: React.FC<TruckPlanningProps> = ({ draft, onUpdateDraft, routes, onUpdateRoutes, history, onHistoryUpdate, unitSystem, currency }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const calculate = (data: TruckPlanningData): CalculationResult => {
    const distance = parseFloat(data.distance) || 0;
    const mpg = parseFloat(data.mpg) || 0;
    const fuelPrice = parseFloat(data.fuelPrice) || 0;
    const driverPayRate = parseFloat(data.driverPay) || 0;
    const shipmentPrice = parseFloat(data.shipmentPrice) || 0;
    const otherExpenses = parseFloat(data.otherExpenses) || 0;

    let totalCostVal = 0;
    let fuelCostVal = 0;
    let driverCostVal = 0;
    let fuelNeededVal = 0;

    if (distance > 0) {
      if (mpg > 0) {
        fuelNeededVal = distance / mpg;
        fuelCostVal = fuelNeededVal * fuelPrice;
      }
      driverCostVal = distance * driverPayRate;
      totalCostVal = fuelCostVal + driverCostVal + otherExpenses;
    }

    let profitVal = 0;
    let hasProfit = false;
    if (shipmentPrice > 0) {
      profitVal = shipmentPrice - totalCostVal;
      hasProfit = true;
    }

    const cpmVal = distance > 0 ? totalCostVal / distance : 0;
    const ppmVal = (distance > 0 && hasProfit) ? profitVal / distance : 0;

    return {
      totalCost: `${currency}${totalCostVal.toFixed(2)}`,
      fuelCost: `${currency}${fuelCostVal.toFixed(2)}`,
      driverCost: `${currency}${driverCostVal.toFixed(2)}`,
      fuelNeeded: fuelNeededVal.toFixed(1),
      otherCost: `${currency}${otherExpenses.toFixed(2)}`,
      netProfit: hasProfit ? `${currency}${profitVal.toFixed(2)}` : 'N/A',
      rawProfit: hasProfit ? profitVal : -Infinity,
      cpm: `${currency}${cpmVal.toFixed(2)}`,
      ppm: hasProfit ? `${currency}${ppmVal.toFixed(2)}` : 'N/A',
      shipmentPrice: shipmentPrice > 0 ? `${currency}${shipmentPrice.toFixed(2)}` : 'N/A'
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDraft({ ...draft, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Basic validation
    if (!draft.distance || parseFloat(draft.distance) === 0) return;

    const result = calculate(draft);
    
    // Create new route object
    const newRoute: PlannedRoute = {
      id: editingId || Date.now().toString(),
      inputs: { ...draft }, // Copy draft
      results: result,
      timestamp: Date.now()
    };

    let updatedRoutes;
    if (editingId) {
      // Update existing
      updatedRoutes = routes.map(r => r.id === editingId ? newRoute : r);
      setEditingId(null);
    } else {
      // Add new (max 5)
      if (routes.length >= 5) {
        return; 
      }
      updatedRoutes = [...routes, newRoute];
    }

    onUpdateRoutes(updatedRoutes);
    
    // Add to History sidebar as well (only on new creates or significant updates)
    const historyItem: RouteHistoryItem = {
      id: newRoute.id,
      inputs: newRoute.inputs,
      results: newRoute.results,
      timestamp: newRoute.timestamp
    };
    onHistoryUpdate([historyItem, ...history].slice(0, 50));
  };

  const handleEdit = (route: PlannedRoute) => {
    onUpdateDraft(route.inputs);
    setEditingId(route.id);
  };

  const handleDelete = (id: string) => {
    onUpdateRoutes(routes.filter(r => r.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleLoadHistory = (item: RouteHistoryItem) => {
      onUpdateDraft(item.inputs);
      setEditingId(null); // Treat as new entry based on history
  };

  const resetDraft = () => {
      onUpdateDraft({
        pickupLocation: '',
        deliveryLocation: '',
        distance: '',
        mpg: '6.5',
        fuelPrice: '',
        driverPay: '',
        shipmentPrice: '',
        otherExpenses: ''
      });
      setEditingId(null);
  }

  // Find winner
  const winnerId = routes.length > 1 
    ? routes.reduce((prev, current) => (prev.results.rawProfit > current.results.rawProfit) ? prev : current).id 
    : null;

  const labels = unitSystem === 'US' ? {
    dist: 'Distance (mi)',
    eff: 'MPG',
    rate: 'Driver/mi',
    shortDist: 'mi',
    shortEff: 'mpg',
    cpm: 'cpm'
  } : {
    dist: 'Distance (km)',
    eff: 'L/100km',
    rate: 'Driver/km',
    shortDist: 'km',
    shortEff: 'L/100',
    cpm: 'cpk'
  };

  return (
    <div className="bg-[#404040] rounded-3xl p-4 md:p-6 shadow-lg h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0 px-1">
         <div className="flex items-center gap-2">
            <h2 className="text-gray-200 font-medium">Route Calculator</h2>
         </div>
         <span className="text-gray-500 text-xs">{routes.length} / 5 Comparison Slots</span>
      </div>
      
      {/* Wrapper scrolls on mobile, locked on lg. */}
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 overflow-y-auto lg:overflow-hidden p-1">
        
        {/* Main Area */}
        <div className="w-full lg:flex-1 flex flex-col gap-4 min-h-0 shrink-0">
           
           {/* Top: Input Container (Horizontal) */}
           <div className={`p-4 md:p-5 rounded-2xl border shrink-0 transition-colors shadow-lg ${editingId ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-[#2a2a2a] border-gray-700'}`}>
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2 text-gray-300">
                    {editingId ? <Pencil size={16} className="text-cyan-400"/> : <Calculator size={16} />}
                    <span className="text-xs font-bold uppercase tracking-wider">{editingId ? 'Editing Lane' : 'New Lane Entry'}</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={resetDraft} className="text-gray-500 hover:text-white p-1 rounded transition-colors" title="Clear Inputs">
                        <RotateCcw size={14} />
                    </button>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="text-red-400 text-[10px] flex items-center gap-1 hover:underline">
                            <X size={12}/> Cancel Edit
                        </button>
                    )}
                 </div>
              </div>

              {/* Responsive Grid - Adjusted to 4 columns on Desktop for better visibility */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Row 1 */}
                  <div className="col-span-2 lg:col-span-1">
                     <InputField label="Pickup" name="pickupLocation" value={draft.pickupLocation} onChange={handleInputChange} placeholder="Origin" />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                     <InputField label="Delivery" name="deliveryLocation" value={draft.deliveryLocation} onChange={handleInputChange} placeholder="Dest" />
                  </div>
                  <div className="col-span-1 lg:col-span-1">
                     <InputField label={labels.dist} name="distance" value={draft.distance} onChange={handleInputChange} icon={<ArrowRight/>} type="number" placeholder="0" />
                  </div>
                  <div className="col-span-1 lg:col-span-1">
                     <InputField label={`Rate/Pay ${currency}`} name="shipmentPrice" value={draft.shipmentPrice} onChange={handleInputChange} icon={<Banknote/>} type="number" placeholder="Total" />
                  </div>
                  
                  {/* Row 2 - Expenses */}
                  <div className="col-span-1 lg:col-span-1">
                     <InputField label={labels.eff} name="mpg" value={draft.mpg} onChange={handleInputChange} type="number" placeholder="6.5" />
                  </div>
                  <div className="col-span-1 lg:col-span-1">
                     <InputField label={`Fuel ${currency}`} name="fuelPrice" value={draft.fuelPrice} onChange={handleInputChange} type="number" placeholder="3.85" />
                  </div>
                  <div className="col-span-1 lg:col-span-1">
                     <InputField label={labels.rate} name="driverPay" value={draft.driverPay} onChange={handleInputChange} type="number" placeholder="0.60" />
                  </div>
                  <div className="col-span-1 lg:col-span-1">
                     <InputField label={`Other ${currency}`} name="otherExpenses" value={draft.otherExpenses} onChange={handleInputChange} type="number" placeholder="0" />
                  </div>
              </div>

              <div className="flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={!editingId && routes.length >= 5}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg w-full md:w-auto justify-center ${
                        !editingId && routes.length >= 5
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : editingId 
                            ? 'bg-cyan-400 hover:bg-cyan-300 text-black' 
                            : 'bg-cyan-400 hover:bg-cyan-300 text-black hover:scale-[1.02]'
                    }`}
                  >
                    {editingId ? <Save size={16}/> : <Plus size={16}/>}
                    {editingId ? 'Update Comparison' : routes.length >= 5 ? 'Max 5 Slots Full' : 'Calculate & Add'}
                  </button>
              </div>
           </div>

           {/* Bottom: Results Container (Table Layout) */}
           <div className="flex-none lg:flex-1 bg-[#2a2a2a]/30 border border-gray-700/30 rounded-2xl overflow-hidden flex flex-col min-h-[200px] lg:min-h-0 relative">
               <div className="overflow-auto custom-scrollbar flex-1 p-1">
                 <table className="w-full text-left border-collapse min-w-[500px]">
                   <thead className="bg-[#333] sticky top-0 z-10 text-xs text-gray-400 uppercase font-bold shadow-md">
                     <tr>
                       <th className="py-3 px-4 rounded-tl-lg">Route Details</th>
                       <th className="py-3 px-4">Efficiency</th>
                       <th className="py-3 px-4 text-right">Financials</th>
                       <th className="py-3 px-2 rounded-tr-lg"></th>
                     </tr>
                   </thead>
                   <tbody className="text-sm">
                     {routes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-600">
                             <div className="flex flex-col items-center gap-2">
                                 <Calculator size={32} className="opacity-20"/>
                                 <span className="text-sm font-medium">Add routes above to compare profitability</span>
                             </div>
                          </td>
                        </tr>
                     )}
                     {routes.map((route, idx) => {
                       const isWinner = winnerId === route.id && routes.length > 1;
                       return (
                         <tr 
                            key={route.id} 
                            className={`border-b border-gray-700/50 transition-colors group ${
                                isWinner ? 'bg-gradient-to-r from-green-900/10 to-transparent' : 'bg-[#262626] hover:bg-[#2d2d2d]'
                            }`}
                         >
                           {/* Route Info */}
                           <td className="py-4 px-4 align-top">
                             <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWinner ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                                      #{idx + 1}
                                  </span>
                                  {isWinner && <span className="text-xs text-green-400 font-bold uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12}/> Best Option</span>}
                               </div>
                               <div className="text-lg font-semibold text-gray-100 flex items-center gap-2 flex-wrap">
                                  <span>{route.inputs.pickupLocation || 'Origin'}</span>
                                  <ArrowRight size={16} className="text-gray-500"/>
                                  <span>{route.inputs.deliveryLocation || 'Dest'}</span>
                               </div>
                               <div className="flex gap-2 mt-1">
                                    <div className="bg-[#1e1e1e] px-2 py-1 rounded border border-gray-700 flex items-center gap-1.5" title="Distance">
                                        <MapPin size={12} className="text-cyan-400"/>
                                        <span className="text-sm font-medium text-gray-300">{route.inputs.distance} {labels.shortDist}</span>
                                    </div>
                                    <div className="bg-[#1e1e1e] px-2 py-1 rounded border border-gray-700 flex items-center gap-1.5" title="Efficiency">
                                        <Fuel size={12} className="text-purple-400"/>
                                        <span className="text-sm font-medium text-gray-300">{route.inputs.mpg} {labels.shortEff}</span>
                                    </div>
                               </div>
                             </div>
                           </td>

                           {/* Metrics */}
                           <td className="py-4 px-4 align-middle">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3 bg-[#1e1e1e] px-3 py-1.5 rounded border border-gray-700 w-full max-w-[140px]">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">RPM</span>
                                        <span className="text-base font-bold text-cyan-400">{route.results.ppm}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 bg-[#1e1e1e] px-3 py-1.5 rounded border border-gray-700 w-full max-w-[140px]">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">CPM</span>
                                        <span className="text-sm font-bold text-gray-300">{route.results.cpm}</span>
                                    </div>
                                </div>
                           </td>

                           {/* Profit */}
                           <td className="py-4 px-4 align-middle text-right">
                              <div className="flex flex-col gap-1">
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Net Profit</div>
                                <div className={`text-3xl font-bold tracking-tight mb-1 ${route.results.netProfit.includes('-') ? 'text-red-500' : 'text-green-400'}`}>
                                  {route.results.netProfit}
                                </div>
                                <div className="flex items-center justify-end gap-3 text-xs text-gray-400">
                                    <span>Gross: <span className="text-gray-200 font-medium">{route.results.shipmentPrice}</span></span>
                                    <span className="text-gray-700">|</span>
                                    <span>Cost: <span className="text-gray-200 font-medium">{route.results.totalCost}</span></span>
                                </div>
                              </div>
                           </td>

                           {/* Actions */}
                           <td className="py-4 px-2 align-middle text-right w-10">
                              <div className="flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEdit(route)} 
                                    className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-[#333] rounded-lg transition-colors"
                                    title="Edit"
                                >
                                   <Pencil size={16}/>
                                </button>
                                <button 
                                    onClick={() => handleDelete(route.id)} 
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#333] rounded-lg transition-colors"
                                    title="Delete"
                                >
                                   <X size={16}/>
                                </button>
                              </div>
                           </td>
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
           </div>
        </div>

        {/* History Sidebar */}
        <div className="w-full lg:w-[200px] bg-[#2a2a2a] rounded-2xl p-3 border border-gray-700/30 flex flex-col shrink-0 h-64 lg:h-auto mb-10 md:mb-0">
             <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <History size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">History</span>
                </div>
                {history.length > 0 && (
                  <button onClick={() => onHistoryUpdate([])} className="text-[10px] text-gray-600 hover:text-red-400">Clear</button>
                )}
             </div>
             
             <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2">
                {history.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleLoadHistory(item)}
                      className="bg-[#333]/50 hover:bg-[#333] border border-transparent hover:border-gray-600 rounded-lg p-2 cursor-pointer transition-colors group"
                    >
                        <div className="flex justify-between items-start text-xs mb-1">
                            <div className="flex flex-col max-w-[70%]">
                                <span className="text-gray-300 font-medium truncate">{item.inputs.pickupLocation || '?'} → {item.inputs.deliveryLocation || '?'}</span>
                                <span className="text-[9px] text-gray-500">{item.inputs.distance} {labels.shortDist}</span>
                            </div>
                            <span className={`font-bold ${item.results.netProfit?.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                                {item.results.netProfit !== 'N/A' ? item.results.netProfit : item.results.totalCost}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-600 group-hover:text-gray-500 flex justify-between mt-1 pt-1 border-t border-gray-700/30">
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span>{item.results.cpm} {labels.cpm}</span>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default TruckPlanning;