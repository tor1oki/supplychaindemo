import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Calculator from './components/Calculator';
import TruckPlanning from './components/TruckPlanning';
import LTLPlanning from './components/LTLPlanning';
import SupplyChainModeling from './components/SupplyChainModeling';
import KPIs from './components/KPIs';
import Settings from './components/Settings';
import { TabName, CalculationHistory, TruckPlanningData, RouteHistoryItem, LTLItem, VehicleDimensions, LTLPlacement, PlannedRoute, SCNode, SCLink, KPIItem, UnitSystem, CurrencySymbol } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Route calculator');
  
  // Settings State
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('trucker_unit_system');
    return (saved as UnitSystem) || 'US';
  });

  const [currency, setCurrency] = useState<CurrencySymbol>(() => {
    const saved = localStorage.getItem('trucker_currency');
    return (saved as CurrencySymbol) || '$';
  });

  // State initialization with localStorage checks
  const [calcHistory, setCalcHistory] = useState<CalculationHistory[]>(() => {
    const saved = localStorage.getItem('trucker_calc_history');
    return saved ? JSON.parse(saved) : [];
  });

  // KPI State
  const [kpiItems, setKpiItems] = useState<KPIItem[]>(() => {
    const saved = localStorage.getItem('trucker_kpis');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Current Input Draft (Top Container)
  const [truckDraft, setTruckDraft] = useState<TruckPlanningData>(() => {
    const saved = localStorage.getItem('trucker_planning_draft');
    const defaultDraft = {
      pickupLocation: '',
      deliveryLocation: '',
      distance: '',
      mpg: '6.5',
      fuelPrice: '',
      driverPay: '',
      shipmentPrice: '',
      otherExpenses: ''
    };
    return saved ? JSON.parse(saved) : defaultDraft;
  });

  // 2. Saved Comparisons (Bottom Container - Max 5)
  const [truckRoutes, setTruckRoutes] = useState<PlannedRoute[]>(() => {
    const saved = localStorage.getItem('trucker_planning_routes');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && 'results' in parsed[0]) {
        return parsed;
      }
      return [];
    } catch(e) {
      return [];
    }
  });

  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>(() => {
    const saved = localStorage.getItem('trucker_route_history');
    return saved ? JSON.parse(saved) : [];
  });

  // LTL State
  const [ltlItems, setLtlItems] = useState<LTLItem[]>(() => {
    const saved = localStorage.getItem('trucker_ltl_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [ltlPlacements, setLtlPlacements] = useState<LTLPlacement[]>(() => {
    const saved = localStorage.getItem('trucker_ltl_placements');
    return saved ? JSON.parse(saved) : [];
  });

  const [ltlVehicle, setLtlVehicle] = useState<VehicleDimensions>(() => {
    const saved = localStorage.getItem('trucker_ltl_vehicle');
    return saved ? JSON.parse(saved) : { 
      name: "53' Dry Van", 
      lengthInches: 636, 
      widthInches: 102, 
      heightInches: 110, 
      maxWeightLbs: 45000 
    };
  });

  // Supply Chain Modeling State
  const [scNodes, setScNodes] = useState<SCNode[]>(() => {
    const saved = localStorage.getItem('trucker_sc_nodes');
    return saved ? JSON.parse(saved) : [];
  });

  const [scLinks, setScLinks] = useState<SCLink[]>(() => {
    const saved = localStorage.getItem('trucker_sc_links');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('trucker_unit_system', unitSystem);
  }, [unitSystem]);

  useEffect(() => {
    localStorage.setItem('trucker_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('trucker_calc_history', JSON.stringify(calcHistory));
  }, [calcHistory]);

  useEffect(() => {
    localStorage.setItem('trucker_kpis', JSON.stringify(kpiItems));
  }, [kpiItems]);

  useEffect(() => {
    localStorage.setItem('trucker_planning_draft', JSON.stringify(truckDraft));
  }, [truckDraft]);

  useEffect(() => {
    localStorage.setItem('trucker_planning_routes', JSON.stringify(truckRoutes));
  }, [truckRoutes]);

  useEffect(() => {
    localStorage.setItem('trucker_route_history', JSON.stringify(routeHistory));
  }, [routeHistory]);

  useEffect(() => {
    localStorage.setItem('trucker_ltl_items', JSON.stringify(ltlItems));
  }, [ltlItems]);

  useEffect(() => {
    localStorage.setItem('trucker_ltl_placements', JSON.stringify(ltlPlacements));
  }, [ltlPlacements]);

  useEffect(() => {
    localStorage.setItem('trucker_ltl_vehicle', JSON.stringify(ltlVehicle));
  }, [ltlVehicle]);

  useEffect(() => {
    localStorage.setItem('trucker_sc_nodes', JSON.stringify(scNodes));
  }, [scNodes]);

  useEffect(() => {
    localStorage.setItem('trucker_sc_links', JSON.stringify(scLinks));
  }, [scLinks]);

  return (
    <div className="h-screen w-screen bg-[#262626] flex flex-col p-2 md:p-4 overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 h-full min-h-0">
        
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <div className="flex-1 h-full min-h-0 relative">
          {activeTab === 'Calculator' && (
            <div className="flex justify-center h-full overflow-y-auto custom-scrollbar">
              <Calculator 
                history={calcHistory} 
                onHistoryUpdate={setCalcHistory} 
              />
            </div>
          )}

          {activeTab === 'Route calculator' && (
             <TruckPlanning 
               draft={truckDraft}
               onUpdateDraft={setTruckDraft}
               routes={truckRoutes}
               onUpdateRoutes={setTruckRoutes}
               history={routeHistory}
               onHistoryUpdate={setRouteHistory}
               unitSystem={unitSystem}
               currency={currency}
             />
          )}

          {activeTab === 'LTL / Partial' && (
            <LTLPlanning 
              items={ltlItems}
              onItemsUpdate={setLtlItems}
              placements={ltlPlacements}
              onPlacementsUpdate={setLtlPlacements}
              vehicle={ltlVehicle}
              onVehicleUpdate={setLtlVehicle}
              unitSystem={unitSystem}
              currency={currency}
            />
          )}

          {activeTab === 'Supply Chain Modeling' && (
            <SupplyChainModeling 
              nodes={scNodes}
              onNodesUpdate={setScNodes}
              links={scLinks}
              onLinksUpdate={setScLinks}
              unitSystem={unitSystem}
              currency={currency}
            />
          )}

          {activeTab === 'KPIs' && (
            <KPIs 
              items={kpiItems}
              onItemsUpdate={setKpiItems}
              currency={currency}
            />
          )}

          {activeTab === 'Settings' && (
            <Settings 
              unitSystem={unitSystem}
              setUnitSystem={setUnitSystem}
              currency={currency}
              setCurrency={setCurrency}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;