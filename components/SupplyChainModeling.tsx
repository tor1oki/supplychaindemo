import React, { useState, useRef, useMemo, useEffect } from 'react';
import { SCNode, SCLink, SCCustomField, UnitSystem, CurrencySymbol } from '../types';
import { Plus, Trash2, Factory, Warehouse, Users, ShoppingCart, ArrowRight, ArrowLeft, ArrowLeftRight, DollarSign, Package, Maximize2, Minimize2, X, Anchor, Plane, TrainFront, Store, Shuffle, Hexagon, ChevronDown, ChevronUp, MonitorX, Download, Table2, Pickaxe, Sprout, TreePine, Construction, Fuel, Box, Truck, Globe, ShoppingBag, Store as StoreIcon, Building2, Landmark, Waves, ThermometerSnowflake, Layers, Trash, RotateCcw, Scale, MapPin, Calendar, MoveRight, MoveLeft, Grab, MousePointer2, ListFilter, ClipboardList, PackageSearch, Clock, Truck as TruckIcon, Cpu, Gauge, BarChart3, Binary, Percent, ClipboardEdit, LayoutList, Settings, EyeOff, Hash, Type as TypeIcon, Network, ArrowUpRight, ArrowDownLeft, Info, LayoutGrid, FileText, TrendingUp, Search, Link as LinkIcon, ChevronLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SupplyChainModelingProps {
  nodes: SCNode[];
  onNodesUpdate: (nodes: SCNode[]) => void;
  links: SCLink[];
  onLinksUpdate: (links: SCLink[]) => void;
  unitSystem: UnitSystem;
  currency: CurrencySymbol;
}

const CATEGORIES = [
  {
    name: "Raw Material & Source",
    types: ["Mine", "Farm / Plantation", "Forest", "Supplier"],
    icon: <PackageSearch size={14}/>,
    label: "Sourcing Detail"
  },
  {
    name: "Manufacturing & Production",
    types: ["Manufacturer", "Factory / Plant", "Assembly Plant", "Processing Facility", "Refinery", "Packaging Facility", "Contract Manufacturer"],
    icon: <Cpu size={14}/>,
    label: "Production Planning"
  },
  {
    name: "Storage & Consolidation",
    types: ["Warehouse", "Regional Warehouse", "Central Warehouse", "Distribution Center (DC)", "Fulfillment Center", "Cross-Dock Facility", "Bonded Warehouse", "Cold Storage"],
    icon: <Warehouse size={14}/>,
    label: "Storage Logistics"
  },
  {
    name: "Logistics Hubs",
    types: ["Port", "Airport", "Rail Terminal", "Intermodal Terminal", "Truck Terminal", "Freight Forwarder Hub", "Logistics Hub / 3PL Hub"],
    icon: <Shuffle size={14}/>,
    label: "Hub Operations"
  },
  {
    name: "Retail & Sales",
    types: ["Retail Store", "Supermarket", "E-commerce Warehouse", "Marketplace Fulfillment Center", "Showroom", "Customer"],
    icon: <ShoppingBag size={14}/>,
    label: "Retail Distribution"
  }
];

interface AddNodeDropdownProps {
  show: boolean;
  setShow: (show: boolean) => void;
  customInput: string;
  setCustomInput: (val: string) => void;
  onAddNode: (type?: string) => void;
  onAddCustomNode: () => void;
}

const AddNodeDropdown: React.FC<AddNodeDropdownProps> = ({ 
  show, 
  setShow, 
  customInput, 
  setCustomInput, 
  onAddNode, 
  onAddCustomNode 
}) => (
  <div className="relative">
    <button 
      onClick={() => setShow(!show)}
      className="bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg transition-all"
    >
      <Plus size={16}/> Add Node <ChevronDown size={14} className={`transition-transform ${show ? 'rotate-180' : ''}`} />
    </button>
    
    {show && (
      <div className="absolute right-0 mt-2 w-64 bg-[#2a2a2a] border border-gray-700 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
         <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
           {CATEGORIES.map(cat => (
             <div key={cat.name} className="mb-4 last:mb-0">
               <div className="px-3 py-1.5 text-[9px] text-cyan-500 font-black uppercase tracking-widest border-b border-gray-800 mb-1">
                 {cat.name}
               </div>
               <div className="grid grid-cols-1 gap-0.5">
                 {cat.types.map(type => (
                   <button
                     key={type}
                     onClick={() => onAddNode(type)}
                     className="flex items-center gap-3 px-3 py-2 text-[11px] text-gray-300 hover:bg-[#333] hover:text-white rounded-lg transition-colors text-left"
                   >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getNodeColor(type) }}></div>
                      <span className="truncate">{type}</span>
                   </button>
                 ))}
               </div>
             </div>
           ))}
           <div className="mt-2 pt-2 border-t border-gray-800">
              <div className="px-3 py-1.5 text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">Custom Node</div>
              <div className="p-2 bg-[#1a1a1a] rounded-xl border border-gray-800">
                <input 
                  type="text" 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)} 
                  placeholder="Type name..."
                  className="w-full bg-[#1e1e1e] text-white text-[10px] rounded p-2 border border-gray-700 focus:border-cyan-400 outline-none mb-2"
                />
                <button 
                  onClick={onAddCustomNode}
                  className="w-full bg-cyan-900/50 hover:bg-cyan-400 hover:text-black text-cyan-400 py-1.5 text-[10px] font-black uppercase rounded-lg border border-cyan-500/30 transition-all"
                >
                  Add Custom
                </button>
              </div>
           </div>
         </div>
      </div>
    )}
  </div>
);

const getNodeColor = (type: string) => {
  const cat = CATEGORIES.find(c => c.types.includes(type));
  if (cat) {
    if (cat.name.includes("Raw")) return '#22d3ee';
    if (cat.name.includes("Manufacturing")) return '#c084fc';
    if (cat.name.includes("Storage")) return '#fbbf24';
    if (cat.name.includes("Logistics")) return '#3b82f6';
    if (cat.name.includes("Retail")) return '#4ade80';
  }
  return '#9ca3af';
};

const LinkLogisticsInputs: React.FC<{ 
  prefix: string, 
  values: SCLink, 
  update: (upd: Partial<SCLink>) => void,
  unitSystem: UnitSystem,
  currency: CurrencySymbol
}> = ({ prefix, values, update, unitSystem, currency }) => {
  const isRev = prefix === 'Reverse';
  const pieces = isRev ? (values.volumeReverse ?? 0) : (values.volume ?? 0);
  const tType = isRev ? values.transportTypeReverse : values.transportType;
  const customTType = isRev ? values.customTransportTypeReverse : values.customTransportType;
  const gType = isRev ? values.groundTypeReverse : values.groundType;
  const miles = isRev ? (values.milesReverse ?? 0) : (values.miles ?? 0);
  const price = isRev ? (values.transportPriceReverse ?? 0) : (values.transportPrice ?? 0);
  const weight = isRev ? (values.weightReverse ?? 0) : (values.weight ?? 0);
  const equip = isRev ? (values.equipmentTypeReverse ?? '') : (values.equipmentType ?? '');
  const trips = isRev ? (values.tripCountReverse ?? 0) : (values.tripCount ?? 0);
  const days = isRev ? (values.daysReverse ?? 0) : (values.days ?? 0);

  const cpm = (miles > 0 && price > 0) ? (price / miles).toFixed(2) : '0.00';
  const costPerPiece = (pieces > 0) ? ((price * (trips || 1)) / pieces).toFixed(2) : '0.00';
  
  const getField = (name: string) => isRev ? `${name}Reverse` : name;

  const labels = unitSystem === 'US' ? {
    dist: 'Miles',
    wgt: 'Weight (lbs)',
    cpm: 'Cost Per Mile'
  } : {
    dist: 'Kilometers',
    wgt: 'Weight (kg)',
    cpm: 'Cost Per KM'
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Pieces</label>
          <input 
            type="number" 
            value={pieces === 0 ? '' : pieces} 
            onChange={(e) => update({ [isRev ? 'volumeReverse' : 'volume']: e.target.value === '' ? 0 : parseFloat(e.target.value) })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Transp. Cost/Piece</label>
          <div className="bg-purple-950/20 p-1.5 rounded-lg border border-purple-500/20 text-center">
             <span className="text-purple-400 font-bold text-xs">{currency}{costPerPiece}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800">
        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Transport</label>
        <div className="grid grid-cols-1 gap-2 mt-1">
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={tType || 'Ground'} 
              onChange={(e) => update({ [getField('transportType')]: e.target.value as any })}
              className="w-full bg-[#262626] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none"
            >
              <option value="Ground">Ground</option>
              <option value="Air">Air</option>
              <option value="Ocean">Ocean</option>
              <option value="Custom">Custom</option>
            </select>
            {tType === 'Ground' && (
              <select 
                value={gType || 'Road'} 
                onChange={(e) => update({ [getField('groundType')]: e.target.value as any })}
                className="w-full bg-[#262626] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none"
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
              </select>
            )}
          </div>
          {tType === 'Custom' && (
            <input 
              type="text" 
              value={customTType || ''} 
              maxLength={50}
              onChange={(e) => update({ [getField('customTransportType')]: e.target.value })}
              placeholder="Custom transport (max 50 chars)"
              className="w-full bg-[#262626] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-[10px] focus:border-cyan-400 outline-none"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">{labels.dist}</label>
          <input 
            type="number" 
            value={miles === 0 ? '' : miles} 
            onChange={(e) => update({ [getField('miles')]: e.target.value === '' ? 0 : parseFloat(e.target.value) })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Price per Trip {currency}</label>
          <input 
            type="number" 
            value={price === 0 ? '' : price} 
            onChange={(e) => update({ [getField('transportPrice')]: e.target.value === '' ? 0 : parseFloat(e.target.value) })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="0"
          />
        </div>
      </div>

      <div className="bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20 flex justify-between items-center px-3">
        <span className="text-[9px] text-cyan-500 font-bold uppercase">{labels.cpm}</span>
        <span className="text-cyan-400 font-bold text-sm">{currency}{cpm}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">{labels.wgt}</label>
          <input 
            type="number" 
            value={weight === 0 ? '' : weight} 
            onChange={(e) => update({ [getField('weight')]: e.target.value === '' ? 0 : parseFloat(e.target.value) })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Trip Count</label>
          <input 
            type="number" 
            value={trips === 0 ? '' : trips} 
            onChange={(e) => update({ [getField('tripCount')]: e.target.value === '' ? 0 : parseInt(e.target.value) })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Days</label>
          <input 
            type="number" 
            value={days === 0 ? '' : days} 
            onChange={(e) => update({ [getField('days')]: e.target.value === '' ? 0 : parseFloat(e.target.value) })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Equipment</label>
          <input 
            type="text" 
            value={equip} 
            onChange={(e) => update({ [getField('equipmentType')]: e.target.value })} 
            className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
            placeholder="e.g. 53' Dry Van"
          />
        </div>
      </div>
    </div>
  );
};

const SupplyChainModeling: React.FC<SupplyChainModelingProps> = ({ nodes, onNodesUpdate, links, onLinksUpdate, unitSystem, currency }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataModalTab, setDataModalTab] = useState<'lanes' | 'nodes' | 'network' | 'summary'>('lanes');
  const [summaryViewMode, setSummaryViewMode] = useState<'grid' | 'table'>('grid');
  const [networkViewMode, setNetworkViewMode] = useState<'grid' | 'table'>('grid');
  const [nodesViewMode, setNodesViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedNetworkNodes, setExpandedNetworkNodes] = useState<string[]>([]);
  const [expandedDataNodes, setExpandedDataNodes] = useState<string[]>([]);
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [viewMode, setViewMode] = useState<'inline' | 'modal' | 'fullscreen'>('inline');
  const [mainViewType, setMainViewType] = useState<'map' | 'sheet'>('map');
  const [nodeSearchQuery, setNodeSearchQuery] = useState('');
  
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [newNodeType, setNewNodeType] = useState<string>('Factory / Plant');
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showAddNodeDropdown, setShowAddNodeDropdown] = useState(false);

  // Field Configurator Modal State
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [newCustomFieldType, setNewCustomFieldType] = useState<'text' | 'number'>('text');

  const { totalCost, totalVolume } = useMemo(() => links.reduce((acc, link) => {
    let cost = (link.transportPrice || 0) * (link.tripCount || 1);
    let vol = link.volume || 0;
    if (link.type === 'RoundTrip') {
      cost += (link.transportPriceReverse || 0) * (link.tripCountReverse || 1);
      vol += (link.volumeReverse || 0);
    }
    return {
      totalCost: acc.totalCost + cost,
      totalVolume: acc.totalVolume + vol
    };
  }, { totalCost: 0, totalVolume: 0 }), [links]);

  // Summary Aggregate Stats
  const summaryStats = useMemo(() => {
    let materialCost = 0;
    let manufacturingCost = 0;
    let storageWarehouseCost = 0;
    let handlingWarehouseCost = 0;
    let storageHubCost = 0;
    let handlingHubCost = 0;
    let transportationCost = totalCost;

    nodes.forEach(n => {
      const cat = CATEGORIES.find(c => c.types.includes(n.type));
      if (cat?.name === "Raw Material & Source") {
        materialCost += (n.quantityValue || 0) * (n.costPerUnit || 0);
      } else if (cat?.name === "Manufacturing & Production") {
        manufacturingCost += (n.currentOrders || 0) * (n.costPerUnit || 0);
      } else if (cat?.name === "Storage & Consolidation") {
        storageWarehouseCost += (n.currentInventory || 0) * (n.storageCost || 0);
        handlingWarehouseCost += (n.currentInventory || 0) * (n.handlingCost || 0);
      } else if (cat?.name === "Logistics Hubs") {
        storageHubCost += (n.currentInventory || 0) * (n.storageCost || 0);
        handlingHubCost += (n.currentInventory || 0) * (n.handlingCost || 0);
      }
    });

    return [
      { id: 'mat', label: 'Material Source Total', value: materialCost, type: 'currency', category: 'Sourcing' },
      { id: 'mfg', label: 'Manufacturing Total', value: manufacturingCost, type: 'currency', category: 'Production' },
      { id: 'sto_w', label: 'Warehouse Storage Total', value: storageWarehouseCost, type: 'currency', category: 'Storage' },
      { id: 'hnd_w', label: 'Warehouse Handling Total', value: handlingWarehouseCost, type: 'currency', category: 'Storage' },
      { id: 'sto_h', label: 'Hub Storage Total', value: storageHubCost, type: 'currency', category: 'Hubs' },
      { id: 'hnd_h', label: 'Hub Handling Total', value: handlingHubCost, type: 'currency', category: 'Hubs' },
      { id: 'trans', label: 'Transportation Total', value: transportationCost, type: 'currency', category: 'Logistics' }
    ];
  }, [nodes, totalCost]);

  const weightUnit = unitSystem === 'US' ? 'lbs' : 'kg';
  const distUnit = unitSystem === 'US' ? 'Miles' : 'KM';

  // Unified Template Field Mapper for Categories
  const getFullTemplateFields = (node: SCNode) => {
    const cat = CATEGORIES.find(c => c.types.includes(node.type));
    if (!cat) return [];

    if (cat.name === "Raw Material & Source") {
      return [
        { label: "Mat. Type", key: "materialType", type: "text", placeholder: "Organic, Recycled..." },
        { label: "Material", key: "materialName", type: "text", placeholder: "Steel, Wood..." },
        { label: "Unit", key: "unit", type: "text", placeholder: "kg, lb, box..." },
        { label: `Cost / Unit ${currency}`, key: "costPerUnit", type: "number", placeholder: "0.00" },
        { label: "Qty", key: "quantityValue", type: "number", placeholder: "0" },
        { label: `Wgt / Unit (${weightUnit})`, key: "weightPerUnit", type: "number", placeholder: "0" }
      ];
    } else if (cat.name === "Manufacturing & Production") {
      return [
        { label: "Input", key: "materialName", type: "text", placeholder: "Raw Materials..." },
        { label: "Output", key: "outputName", type: "text", placeholder: "Finished Goods..." },
        { label: "Maximum Capacity", key: "quantityValue", type: "number", placeholder: "0" },
        { label: "Current Orders", key: "currentOrders", type: "number", placeholder: "0" },
        { label: `Mfg Cost / Unit ${currency}`, key: "costPerUnit", type: "number", placeholder: "0.00" },
        { label: `Wgt / Unit (${weightUnit})`, key: "weightPerUnit", type: "number", placeholder: "0" }
      ];
    } else if (cat.name === "Storage & Consolidation") {
      return [
        { label: "Storage Type", key: "materialType", type: "text", placeholder: "Cold, Bonded..." },
        { label: "Maximum Capacity", key: "quantityValue", type: "number", placeholder: "0" },
        { label: "Curr. Inventory", key: "currentInventory", type: "number", placeholder: "0" },
        { label: "Inbound Thru", key: "inboundThroughput", type: "number", placeholder: "0" },
        { label: "Outbound Thru", key: "outboundThroughput", type: "number", placeholder: "0" },
        { label: `Storage / Day ${currency}`, key: "storageCost", type: "number", placeholder: "0.00" },
        { label: `Handling / Pallet ${currency}`, key: "handlingCost", type: "number", placeholder: "0.00" }
      ];
    } else if (cat.name === "Logistics Hubs") {
      return [
        { label: "Maximum Capacity", key: "quantityValue", type: "number", placeholder: "0" },
        { label: "Curr. Inventory", key: "currentInventory", type: "number", placeholder: "0" },
        { label: "Inbound Modes", key: "inboundModes", type: "text", placeholder: "Ship, Rail..." },
        { label: "Outbound Modes", key: "outboundModes", type: "text", placeholder: "Truck, Rail..." },
        { label: `Handling Cost ${currency}`, key: "handlingCost", type: "number", placeholder: "0.00" },
        { label: `Storage / Day ${currency}`, key: "storageCost", type: "number", placeholder: "0.00" },
        { label: "Customs Clear.", key: "customsClearance", type: "text", placeholder: "Bonded, Standard..." },
        { label: "Operating Hrs", key: "operatingHours", type: "text", placeholder: "24/7, 08-17..." },
        { label: "Primary Role", key: "primaryRole", type: "text", placeholder: "Consolidation..." },
        { label: "Intl / Domestic", key: "scope", type: "text", placeholder: "Import/Export..." }
      ];
    } else if (cat.name === "Retail & Sales") {
      return [
        { label: "Product Category", key: "productCategory", type: "text", placeholder: "Electronics..." },
        { label: "Daily Demand / Day", key: "dailyDemand", type: "number", placeholder: "450" },
        { label: "Current Inventory", key: "avgInventory", type: "number", placeholder: "3200" },
        { label: "Maximum Inventory", key: "quantityValue", type: "number", placeholder: "5000" },
        { label: "Replenish. Freq", key: "replenishmentFreq", type: "text", placeholder: "Daily, Weekly..." },
        { label: "Stockout Rate %", key: "stockoutRate", type: "number", placeholder: "3" },
        { label: `Sales Price / Unit ${currency}`, key: "salesPrice", type: "number", placeholder: "120" },
        { label: "Primary Supply Source", key: "supplySource", type: "text", placeholder: "Regional DC..." },
        { label: "Last-Mile Transp.", key: "lastMileTransport", type: "text", placeholder: "Ground..." }
      ];
    }
    return [];
  };

  const getTemplateFields = (node: SCNode) => {
      const full = getFullTemplateFields(node);
      const deleted = node.deletedDefaultFields || [];
      // Pull "Storage Type" (materialType) out of the grid for Storage & Consolidation
      const isStorage = CATEGORIES.find(c => c.types.includes(node.type))?.name === "Storage & Consolidation";
      return full.filter(f => !deleted.includes(f.key) && (!isStorage || f.key !== 'materialType'));
  };

  const handleExportPDF = async () => {
    if (!canvasContainerRef.current) return;
    setIsExporting(true);
    
    try {
        const canvas = await html2canvas(canvasContainerRef.current, {
            backgroundColor: '#1e1e1e', 
            scale: 2, 
            useCORS: true
        });
        const mapImgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 12;
        let yPos = margin;

        const fillPageBackground = (p: jsPDF) => {
            p.setFillColor(30, 30, 30); 
            p.rect(0, 0, pageWidth, pageHeight, 'F');
        };

        const checkNewPage = (neededHeight: number) => {
            if (yPos + neededHeight > pageHeight - margin) {
                pdf.addPage();
                fillPageBackground(pdf);
                yPos = margin;
                return true;
            }
            return false;
        };

        fillPageBackground(pdf);

        // Header Section
        pdf.setFillColor(34, 211, 238); 
        pdf.rect(margin, yPos, 3, 15, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(22);
        pdf.setTextColor(243, 244, 246);
        pdf.text("Supply Chain Network Manifest", margin + 7, yPos + 10);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Project Analysis: ${new Date().toLocaleString()}`, pageWidth - margin, yPos + 6, { align: 'right' });
        yPos += 22;

        // KPI Summary Area
        const cardWidth = (pageWidth - (margin * 2) - 8) / 3;
        const cardHeight = 20;
        const drawKPI = (x: number, label: string, val: string, color: [number, number, number]) => {
            pdf.setDrawColor(55, 65, 81);
            pdf.setFillColor(42, 42, 42); 
            pdf.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'FD');
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(107, 114, 128);
            pdf.text(label.toUpperCase(), x + 4, yPos + 7);
            pdf.setFontSize(13);
            pdf.setTextColor(color[0], color[1], color[2]);
            pdf.text(val, x + 4, yPos + 15);
        };

        drawKPI(margin, "Projected Spend", `${currency}${totalCost.toLocaleString()}`, [34, 211, 238]);
        drawKPI(margin + cardWidth + 4, "Asset Count", nodes.length.toString(), [243, 244, 246]);
        drawKPI(margin + (cardWidth * 2) + 8, "Flow Lanes", links.length.toString(), [243, 244, 246]);
        yPos += cardHeight + 12;

        // Visual Topology Overview
        pdf.setFontSize(11);
        pdf.setTextColor(243, 244, 246);
        pdf.setFont("helvetica", "bold");
        pdf.text("I. Network Topology Overview", margin, yPos);
        yPos += 6;
        const imgProps = pdf.getImageProperties(mapImgData);
        const mapRatio = imgProps.height / imgProps.width;
        const mapWidth = pageWidth - (margin * 2);
        const mapHeight = mapWidth * mapRatio;
        pdf.setDrawColor(55, 65, 81);
        pdf.rect(margin - 0.2, yPos - 0.2, mapWidth + 0.4, mapHeight + 0.4);
        pdf.addImage(mapImgData, 'PNG', margin, yPos, mapWidth, mapHeight);
        yPos += mapHeight + 15;

        // NEW: Network Performance Aggregates
        pdf.setFontSize(11);
        pdf.setTextColor(243, 244, 246);
        pdf.setFont("helvetica", "bold");
        pdf.text("II. Network Performance Aggregates", margin, yPos);
        yPos += 6;
        
        const sumColW = (pageWidth - (margin * 2)) / 2;
        summaryStats.forEach((stat, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const sx = margin + (col * sumColW);
            const sy = yPos + (row * 10);
            
            pdf.setFillColor(42, 42, 42);
            pdf.roundedRect(sx, sy, sumColW - 4, 8, 1, 1, 'F');
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(150, 150, 150);
            pdf.text(stat.label.toUpperCase() + ":", sx + 2, sy + 5.5);
            pdf.setTextColor(34, 211, 238);
            pdf.text(`${currency}${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sx + sumColW - 6, sy + 5.5, { align: 'right' });
        });
        yPos += Math.ceil(summaryStats.length / 2) * 10 + 15;

        // Detailed Modular Node Manifest
        pdf.setFontSize(14);
        pdf.setTextColor(243, 244, 246);
        pdf.text("III. Modular Node-Lane Manifest", margin, yPos);
        yPos += 8;

        const sortedNodes = [...nodes].sort((a, b) => (a.displayId || 0) - (b.displayId || 0));

        sortedNodes.forEach((node) => {
            const nodeLegs: { dir: string, partner: string, mode: string, spend: string, vol: string, color: [number, number, number] }[] = [];
            links.forEach(l => {
                const partner = (l.sourceId === node.id) ? nodes.find(n => n.id === l.targetId) : nodes.find(n => n.id === l.sourceId);
                if (!partner) return;
                
                if (l.sourceId === node.id) {
                    nodeLegs.push({ 
                        dir: "OUT", 
                        partner: partner.name, 
                        mode: l.transportType === 'Ground' ? (l.groundType || 'Road') : (l.transportType || 'Ground'), 
                        spend: `${currency}${((l.transportPrice || 0) * (l.tripCount || 1)).toLocaleString()}`, 
                        vol: (l.volume || 0).toLocaleString(),
                        color: [34, 211, 238] 
                    });
                    if (l.type === 'RoundTrip') {
                        nodeLegs.push({ 
                            dir: "IN", 
                            partner: partner.name, 
                            mode: l.transportTypeReverse === 'Ground' ? (l.groundTypeReverse || 'Road') : (l.transportTypeReverse || 'Ground'), 
                            spend: `${currency}${((l.transportPriceReverse || 0) * (l.tripCountReverse || 1)).toLocaleString()}`, 
                            vol: (l.volumeReverse || 0).toLocaleString(),
                            color: [192, 132, 252] 
                        });
                    }
                } else if (l.targetId === node.id) {
                    nodeLegs.push({ 
                        dir: "IN", 
                        partner: partner.name, 
                        mode: l.transportType === 'Ground' ? (l.groundType || 'Road') : (l.transportType || 'Ground'), 
                        spend: `${currency}${((l.transportPrice || 0) * (l.tripCount || 1)).toLocaleString()}`, 
                        vol: (l.volume || 0).toLocaleString(),
                        color: [192, 132, 252] 
                    });
                    if (l.type === 'RoundTrip') {
                        nodeLegs.push({ 
                            dir: "OUT", 
                            partner: partner.name, 
                            mode: l.transportTypeReverse === 'Ground' ? (l.groundTypeReverse || 'Road') : (l.transportTypeReverse || 'Ground'), 
                            spend: `${currency}${((l.transportPriceReverse || 0) * (l.tripCountReverse || 1)).toLocaleString()}`, 
                            vol: (l.volumeReverse || 0).toLocaleString(),
                            color: [34, 211, 238]
                        });
                    }
                }
            });

            const activeTemplate = getTemplateFields(node);
            const custom = node.customFields || [];
            const allProps = [
              ...activeTemplate.map(f => ({ label: f.label, value: (node as any)[f.key] })),
              ...(!(node.deletedDefaultFields?.includes('location')) ? [{ label: 'Location', value: node.location }] : []),
              ...(!(node.deletedDefaultFields?.includes('leadTime')) ? [{ label: 'Lead/Hand', value: node.leadTime || node.handlingTime }] : []),
              ...(!(node.deletedDefaultFields?.includes('primaryTransport')) ? [{ label: 'Mode', value: node.primaryTransport }] : []),
              ...custom.map(f => ({ label: f.name, value: f.value }))
            ].filter(p => p.value !== undefined && p.value !== '');

            const gridRows = Math.ceil(allProps.length / 3);
            const gridHeight = allProps.length > 0 ? (gridRows * 10) + 12 : 0;
            const flowTableHeight = nodeLegs.length > 0 ? (nodeLegs.length * 8) + 15 : 12;
            const strategyHeight = node.comment ? 20 : 0;
            const totalNodeHeight = 15 + gridHeight + flowTableHeight + strategyHeight + 10;

            checkNewPage(totalNodeHeight);

            // Node Identity Ribbon
            pdf.setDrawColor(55, 65, 81);
            pdf.setFillColor(42, 42, 42);
            pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), 10, 2, 2, 'FD');
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(243, 244, 246);
            pdf.text(`#${node.displayId} - ${node.name}`, margin + 5, yPos + 6.5);
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text(node.type.toUpperCase(), pageWidth - margin - 5, yPos + 6.5, { align: 'right' });
            yPos += 14;

            // Property Grid (3 columns)
            if (allProps.length > 0) {
                pdf.setFontSize(7);
                pdf.setTextColor(156, 163, 175);
                pdf.text("ASSET ATTRIBUTES", margin, yPos - 2);
                const colW = (pageWidth - (margin * 2)) / 3;
                allProps.forEach((p, i) => {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const x = margin + (col * colW);
                    const y = yPos + (row * 10);
                    
                    pdf.setFillColor(35, 35, 35);
                    pdf.rect(x, y, colW - 2, 8, 'F');
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(120, 120, 120);
                    pdf.text(p.label.toUpperCase() + ":", x + 2, y + 5.5);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(34, 211, 238);
                    pdf.text(p.value.toString(), x + colW - 4, y + 5.5, { align: 'right' });
                });
                yPos += gridHeight;
            }

            // Flow Lanes Table
            pdf.setFontSize(7);
            pdf.setTextColor(156, 163, 175);
            pdf.text("ACTIVE LOGISTICS FLOWS", margin, yPos - 2);
            
            if (nodeLegs.length > 0) {
                const drawRow = (cols: string[], colors: [number, number, number][], isH = false) => {
                    const cw = [15, 60, 30, 40, 40];
                    let cx = margin;
                    if (isH) {
                        pdf.setFillColor(31, 31, 31);
                        pdf.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
                        pdf.setFont("helvetica", "bold");
                        pdf.setTextColor(100, 100, 100);
                    } else {
                        pdf.setFont("helvetica", "normal");
                    }
                    cols.forEach((c, idx) => {
                        if (!isH) pdf.setTextColor(colors[idx][0], colors[idx][1], colors[idx][2]);
                        pdf.text(c, cx + 2, yPos + 5);
                        cx += cw[idx];
                    });
                    yPos += 7;
                };

                drawRow(["LEG", "PARTNER NODE", "MODE", "VOL THROUGH", "LEG SPEND"], Array(5).fill([100, 100, 100]), true);
                nodeLegs.forEach(leg => {
                    const legColor = leg.color;
                    drawRow(
                        [leg.dir, leg.partner, leg.mode, leg.vol, leg.spend], 
                        [legColor, [200, 200, 200], [150, 150, 150], [200, 200, 200], [34, 211, 238]]
                    );
                });
            } else {
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont("helvetica", "italic");
                pdf.text("No active connected flow paths for this asset position.", margin + 2, yPos + 5);
                yPos += 8;
            }
            yPos += 4;

            // Strategy Notes
            if (node.comment) {
                pdf.setFontSize(7);
                pdf.setTextColor(156, 163, 175);
                pdf.setFont("helvetica", "bold");
                pdf.text("OPERATIONAL STRATEGY NOTES", margin, yPos);
                yPos += 3;
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(8);
                pdf.setTextColor(180, 180, 180);
                const splitText = pdf.splitTextToSize(node.comment, pageWidth - (margin * 2) - 8);
                pdf.setFillColor(25, 25, 25);
                pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), (splitText.length * 4) + 6, 1, 1, 'F');
                pdf.text(splitText, margin + 4, yPos + 5);
                yPos += (splitText.length * 4) + 12;
            } else {
                yPos += 6;
            }
            
            pdf.setDrawColor(45, 45, 45);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
        });

        pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      // footer for pdf 
        pdf.text("", pageWidth / 2, pageHeight - 8, { align: 'center' });
        
        pdf.save(`network_modeling_${Date.now()}.pdf`);
    } catch (err) {
        console.error("PDF Export failed", err);
    } finally {
        setIsExporting(false);
    }
  };

  const handleAddNode = (type?: string) => {
    const typeToAdd = type || newNodeType;
    let x = pan.x + 400; 
    let y = pan.y + 300;
    if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        x = pan.x + (rect.width / 2) * zoom;
        y = pan.y + (rect.height / 2) * zoom;
    }
    
    const maxId = nodes.reduce((max, node) => Math.max(max, node.displayId || 0), 0);
    
    const newNode: SCNode = {
      id: Date.now().toString(),
      displayId: maxId + 1,
      name: `New ${typeToAdd}`,
      type: typeToAdd,
      x,
      y,
      comment: ''
    };
    onNodesUpdate([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedLinkId(null);
    setShowAddNodeDropdown(false);
  };

  const handleAddCustomNode = () => {
      if (!customTypeInput.trim()) return;
      handleAddNode(customTypeInput.trim());
      setCustomTypeInput('');
      setNewNodeType(customTypeInput.trim());
      setShowAddNodeDropdown(false);
  };

  const handleDeleteNode = (id: string) => {
    onNodesUpdate(nodes.filter(n => n.id !== id));
    onLinksUpdate(links.filter(l => l.sourceId !== id && l.targetId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (linkingSourceId === id) setLinkingSourceId(null);
  };

  const handleDeleteLink = (id: string) => {
    onLinksUpdate(links.filter(l => l.id !== id));
    if (selectedLinkId === id) setSelectedLinkId(null);
  };

  const handleUpdateNode = (id: string, updates: Partial<SCNode>) => {
    onNodesUpdate(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleUpdateLink = (id: string, updates: Partial<SCLink>) => {
    onLinksUpdate(links.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleMoveNodeRow = (indexInSortedList: number, direction: 'up' | 'down') => {
    const sortedNodes = [...nodes].sort((a, b) => (a.displayId || 0) - (b.displayId || 0));
    const targetIdx = direction === 'up' ? indexInSortedList - 1 : indexInSortedList + 1;
    
    if (targetIdx < 0 || targetIdx >= sortedNodes.length) return;
    
    const nodeA = sortedNodes[indexInSortedList];
    const nodeB = sortedNodes[targetIdx];
    
    const tempId = nodeA.displayId;
    nodeA.displayId = nodeB.displayId;
    nodeB.displayId = tempId;
    
    onNodesUpdate(nodes.map(n => {
        if (n.id === nodeA.id) return { ...n, displayId: nodeA.displayId };
        if (n.id === nodeB.id) return { ...n, displayId: nodeB.displayId };
        return n;
    }));
  };

  const handleMoveLinkRow = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;
    onLinksUpdate(newLinks);
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const createLink = (sourceId: string, targetId: string) => {
    const exists = links.find(l => l.sourceId === sourceId && l.targetId === targetId);
    if (!exists) {
        const newLink: SCLink = {
            id: `${sourceId}-${targetId}-${Date.now()}`,
            sourceId: sourceId,
            targetId: targetId,
            volume: 0, 
            costPerUnit: 0,
            type: 'OneWay',
            volumeReverse: 0,
            costPerUnitReverse: 0,
            transportType: 'Ground',
            groundType: 'Road',
            miles: 0,
            transportPrice: 0,
            weight: 0,
            equipmentType: '53\' Dry Van',
            tripCount: 1,
            days: 0
        };
        onLinksUpdate([...links, newLink]);
        return newLink;
    }
    return exists;
  };

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (linkingSourceId) {
      if (linkingSourceId !== id) {
        createLink(linkingSourceId, id);
      }
      setLinkingSourceId(null);
      return;
    }
    setDraggingId(id);
    setSelectedNodeId(id);
    setSelectedLinkId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const x = (e.clientX - CTM.e) / CTM.a;
        const y = (e.clientY - CTM.f) / CTM.d;
        onNodesUpdate(nodes.map(n => n.id === draggingId ? { ...n, x, y } : n));
      }
    } else if (isPanning) {
      const dx = (e.clientX - panStart.x) * zoom;
      const dy = (e.clientY - panStart.y) * zoom;
      setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = 1.1;
    const delta = e.deltaY > 0 ? scaleFactor : 1 / scaleFactor;
    setZoom(prev => Math.max(0.2, Math.min(5, prev * delta)));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    setSelectedNodeId(null);
    setSelectedLinkId(null);
    setLinkingSourceId(null);
  };

  const startLinking = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setLinkingSourceId(id);
      setSelectedNodeId(id);
      setSelectedLinkId(null);
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleViewToggle = () => {
      if (viewMode === 'inline') setViewMode('modal');
      else if (viewMode === 'modal') setViewMode('fullscreen');
      else setViewMode('modal');
  };

  const handleCloseModal = () => setViewMode('inline');

  const getNodeIcon = (type: string) => {
    if (type.includes('Mine')) return <Pickaxe size={16} color="white" />;
    if (type.includes('Farm')) return <Sprout size={16} color="white" />;
    if (type.includes('Forest')) return <TreePine size={16} color="white" />;
    if (type.includes('Supplier')) return <ShoppingCart size={16} color="white" />;
    if (type.includes('Factory') || type.includes('Plant') || type.includes('Manufacturer')) return <Factory size={16} color="white" />;
    if (type.includes('Refinery')) return <Fuel size={16} color="white" />;
    if (type.includes('Packaging')) return <Box size={16} color="white" />;
    if (type.includes('Assembly')) return <Construction size={16} color="white" />;
    if (type.includes('Processing')) return <Layers size={16} color="white" />;
    if (type.includes('Warehouse') || type.includes('Distribution') || type.includes('Fulfillment')) return <Warehouse size={16} color="white" />;
    if (type.includes('Cross-Dock')) return <Shuffle size={16} color="white" />;
    if (type.includes('Cold Storage')) return <ThermometerSnowflake size={16} color="white" />;
    if (type.includes('Bonded')) return <Landmark size={16} color="white" />;
    if (type.includes('Port')) return <Anchor size={16} color="white" />;
    if (type.includes('Airport')) return <Plane size={16} color="white" />;
    if (type.includes('Rail')) return <TrainFront size={16} color="white" />;
    if (type.includes('Truck Terminal')) return <TruckIcon size={16} color="white" />;
    if (type.includes('Logistics')) return <Globe size={16} color="white" />;
    if (type.includes('Intermodal')) return <Waves size={16} color="white" />;
    if (type.includes('Store') || type.includes('Marketplace') || type.includes('Supermarket')) return <StoreIcon size={16} color="white" />;
    if (type.includes('Showroom')) return <Building2 size={16} color="white" />;
    if (type.includes('Customer')) return <Users size={16} color="white" />;
    return <Hexagon size={16} color="white" />;
  };

  const outerClasses = viewMode !== 'inline' ? `fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 ${viewMode === 'fullscreen' ? 'p-0' : 'p-8'}` : 'h-full';
  const containerClasses = viewMode !== 'inline' ? `bg-[#404040] shadow-2xl flex flex-col relative overflow-hidden border border-gray-700 ${viewMode === 'fullscreen' ? 'w-full h-full rounded-none border-0' : 'rounded-3xl p-6 w-full max-w-[95%] h-[90%]'}` : 'bg-[#404040] shadow-lg flex flex-col relative overflow-hidden rounded-3xl p-4 md:p-6 h-full';

  const currentLink = selectedLinkId ? links.find(l => l.id === selectedLinkId) : null;
  const currentNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const linkingSourceNode = linkingSourceId ? nodes.find(n => n.id === linkingSourceId) : null;
  const currentNodeCategory = currentNode ? CATEGORIES.find(c => c.types.includes(currentNode.type)) : null;

  const viewBox = useMemo(() => {
    if (!svgRef.current) return `0 0 800 600`;
    const rect = svgRef.current.getBoundingClientRect();
    return `${pan.x} ${pan.y} ${rect.width * zoom} ${rect.height * zoom}`;
  }, [pan, zoom]);

  const handleToggleDefaultField = (nodeId: string, key: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const deleted = node.deletedDefaultFields || [];
      const updated = deleted.includes(key) 
        ? deleted.filter(k => k !== key)
        : [...deleted, key];
      handleUpdateNode(nodeId, { deletedDefaultFields: updated });
  };

  const handleAddCustomField = (nodeId: string) => {
      if (!newCustomFieldName.trim()) return;
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const custom = node.customFields || [];
      if (custom.length >= 5) return;

      const newField: SCCustomField = {
          id: Date.now().toString(),
          name: newCustomFieldName.trim(),
          value: newCustomFieldType === 'number' ? 0 : '',
          type: newCustomFieldType
      };

      handleUpdateNode(nodeId, { customFields: [...custom, newField] });
      setNewCustomFieldName('');
  };

  const handleDeleteCustomField = (nodeId: string, fieldId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const custom = node.customFields || [];
      handleUpdateNode(nodeId, { customFields: custom.filter(f => f.id !== fieldId) });
  };

  const handleUpdateCustomFieldValue = (nodeId: string, fieldId: string, value: string | number) => {
      const node = nodes.find(n => nodeId === n.id);
      if (!node) return;
      const custom = node.customFields || [];
      const updated = custom.map(f => f.id === fieldId ? { ...f, value } : f);
      handleUpdateNode(nodeId, { customFields: updated });
  };

  const toggleNetworkNodeExpansion = (id: string) => {
    setExpandedNetworkNodes(prev => 
      prev.includes(id) ? prev.filter(nodeId => nodeId !== id) : [...prev, id]
    );
  };

  const toggleDataNodeExpansion = (id: string) => {
    setExpandedDataNodes(prev => 
      prev.includes(id) ? prev.filter(nodeId => nodeId !== id) : [...prev, id]
    );
  };

  const filteredNodes = useMemo(() => {
    if (!nodeSearchQuery) return nodes;
    const q = nodeSearchQuery.toLowerCase();
    return nodes.filter(n => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
  }, [nodes, nodeSearchQuery]);

  const filteredLinks = useMemo(() => {
    if (!nodeSearchQuery) return links;
    const q = nodeSearchQuery.toLowerCase();
    return links.filter(l => {
      const source = nodes.find(n => n.id === l.sourceId);
      const target = nodes.find(n => n.id === l.targetId);
      return source?.name.toLowerCase().includes(q) || target?.name.toLowerCase().includes(q);
    });
  }, [links, nodes, nodeSearchQuery]);

  return (
    <>
      <div className="md:hidden h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-[#262626] border border-gray-800 rounded-3xl">
        <MonitorX size={48} className="mb-4 text-red-400"/>
        <h2 className="text-xl font-bold text-gray-200 mb-2">Device Not Supported</h2>
        <p>This page isn't supported with mobile phones.</p>
        <p className="text-sm mt-1 text-gray-500">Please use a PC or tablet.</p>
      </div>

      <div className={`hidden md:block ${viewMode === 'inline' ? 'h-full' : ''}`}>
        <div className={outerClasses}>
          <div className={containerClasses} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 shrink-0 px-1 border-b border-gray-700/50 pb-4">
                <div className="flex flex-col">
                    <h2 className="text-gray-200 font-medium text-lg">Supply Chain Network</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Interactive Modeling Workbench</p>
                </div>
                <div className="flex items-center gap-6">
                    {/* View Switch */}
                    <div className="bg-[#2a2a2a] p-1 rounded-xl border border-gray-700 flex">
                       <button onClick={() => setMainViewType('map')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mainViewType === 'map' ? 'bg-cyan-900/40 text-cyan-400 shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                          <Globe size={12}/> Map
                       </button>
                       <button onClick={() => setMainViewType('sheet')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mainViewType === 'sheet' ? 'bg-cyan-900/40 text-cyan-400 shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                          <Table2 size={12}/> Sheet
                       </button>
                    </div>

                    <div className="h-6 w-px bg-gray-700 mx-2"></div>
                    
                    <div className="flex gap-2">
                        <button onClick={handleExportPDF} disabled={isExporting} className="bg-cyan-900/40 hover:bg-cyan-400 hover:text-black text-cyan-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 border border-cyan-500/30">
                            <Download size={16}/> {isExporting ? 'Saving...' : 'PDF'}
                        </button>
                        <button onClick={() => setShowDataModal(true)} className="bg-cyan-900/40 hover:bg-cyan-400 hover:text-black text-cyan-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all border border-cyan-500/30">
                            <Table2 size={16}/> Data
                        </button>
                        <div className="w-px bg-gray-700 mx-1"></div>
                        <button onClick={handleViewToggle} className={`text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg ${viewMode !== 'inline' ? 'bg-[#333] text-gray-200' : ''}`}>
                            {viewMode === 'fullscreen' ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                        </button>
                        {viewMode !== 'inline' && (
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                                <X size={20}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full min-0 overflow-hidden">
                {mainViewType === 'map' ? (
                  <div id="sc-canvas-container" className="border border-gray-800 relative overflow-hidden shadow-inner group flex-1 bg-[#1e1e1e] rounded-3xl" ref={canvasContainerRef}>
                      <div data-html2canvas-ignore="true" className="absolute top-4 right-4 z-10 flex gap-2">
                          <AddNodeDropdown 
                            show={showAddNodeDropdown} 
                            setShow={setShowAddNodeDropdown}
                            customInput={customTypeInput}
                            setCustomInput={setCustomTypeInput}
                            onAddNode={handleAddNode}
                            onAddCustomNode={handleAddCustomNode}
                          />
                          <button onClick={resetView} className="bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 text-[10px] font-bold uppercase transition-all flex items-center gap-2">
                              <MousePointer2 size={12}/> Center
                          </button>
                      </div>

                      <svg 
                        ref={svgRef} 
                        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} 
                        viewBox={viewBox}
                        onMouseMove={handleMouseMove} 
                        onMouseUp={handleMouseUp} 
                        onMouseLeave={handleMouseUp}
                        onMouseDown={handleMouseDownCanvas}
                        onWheel={handleWheel}
                        onClick={handleCanvasClick}
                      >
                          <defs>
                              <marker id="arrowhead" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="8" refX="30" refY="4" orient="auto"><polygon points="0 0, 12 4, 0 8" fill="#555" /></marker>
                              <marker id="arrowhead-selected" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="8" refX="30" refY="4" orient="auto"><polygon points="0 0, 12 4, 0 8" fill="#22d3ee" /></marker>
                              <marker id="arrowhead-reverse" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="8" refX="-18" refY="4" orient="auto"><polygon points="12 0, 0 4, 12 8" fill="#555" /></marker>
                              <marker id="arrowhead-selected-reverse" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="8" refX="-18" refY="4" orient="auto"><polygon points="12 0, 0 4, 12 8" fill="#22d3ee" /></marker>
                          </defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a2a2a" strokeWidth="0.5"/>
                          </pattern>
                          <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />
                          {links.map(link => {
                              const source = nodes.find(n => n.id === link.sourceId);
                              const target = nodes.find(n => n.id === link.targetId);
                              if (!source || !target) return null;
                              const isSelected = selectedLinkId === link.id;
                              const isRT = link.type === 'RoundTrip';
                              
                              const hasReciprocal = links.some(l => l.sourceId === link.targetId && l.targetId === link.sourceId);
                              
                              if (hasReciprocal) {
                                  const dx = target.x - source.x;
                                  const dy = target.y - source.y;
                                  const len = Math.sqrt(dx * dx + dy * dy);
                                  const nx = -dy / len;
                                  const ny = dx / len;
                                  const offset = 25;
                                  const midX = (source.x + target.x) / 2;
                                  const midY = (source.y + target.y) / 2;
                                  const cpX = midX + nx * offset;
                                  const cpY = midY + ny * offset;
                                  const pathData = `M ${source.x} ${source.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`;
                                  return (
                                      <g key={link.id} onClick={(e) => { e.stopPropagation(); setSelectedLinkId(link.id); setSelectedNodeId(null); }} className="cursor-pointer group">
                                          <path d={pathData} fill="none" stroke={isSelected ? "#22d3ee" : "#444"} strokeWidth={Math.max(2, Math.min(8, (link.volume || 0) / 500))} markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"} markerStart={isRT ? (isSelected ? "url(#arrowhead-selected-reverse)" : "url(#arrowhead-reverse)") : undefined} />
                                          <path d={pathData} fill="none" stroke="transparent" strokeWidth="15" />
                                      </g>
                                  );
                              } else {
                                  return (
                                      <g key={link.id} onClick={(e) => { e.stopPropagation(); setSelectedLinkId(link.id); setSelectedNodeId(null); }} className="cursor-pointer group">
                                          <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={isSelected ? "#22d3ee" : "#444"} strokeWidth={Math.max(2, Math.min(8, (link.volume || 0) / 500))} markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"} markerStart={isRT ? (isSelected ? "url(#arrowhead-selected-reverse)" : "url(#arrowhead-reverse)") : undefined} />
                                          <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="transparent" strokeWidth="15" />
                                      </g>
                                  );
                              }
                          })}
                          {nodes.map(node => {
                              const isSelected = selectedNodeId === node.id;
                              const isLinking = linkingSourceId === node.id;
                              return (
                                  <g key={node.id} transform={`translate(${node.x},${node.y})`} onMouseDown={(e) => handleMouseDownNode(e, node.id)} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => { e.preventDefault(); startLinking(e, node.id); }} className="cursor-grab active:cursor-grabbing hover:opacity-90">
                                      <circle r={isLinking ? 22 : 20} fill="#262626" stroke={isLinking ? '#fff' : isSelected ? '#fff' : getNodeColor(node.type)} strokeWidth={isSelected || isLinking ? 3 : 2} />
                                      <foreignObject x="-10" y="-10" width="20" height="20" style={{ pointerEvents: 'none' }}>
                                          <div className="flex items-center justify-center w-full h-full">{getNodeIcon(node.type)}</div>
                                      </foreignObject>
                                      <text y="35" textAnchor="middle" fill="#ccc" fontSize="10" className="pointer-events-none select-none font-medium shadow-black drop-shadow-md">{node.name}</text>
                                  </g>
                              );
                          })}
                      </svg>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-3xl border border-gray-800 overflow-hidden shadow-inner">
                      {/* Sheet Controls */}
                      <div className="p-4 bg-[#2a2a2a] border-b border-gray-800 flex justify-between items-center gap-4">
                          <div className="relative flex-1 max-w-md">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                              <input 
                                  type="text" 
                                  value={nodeSearchQuery} 
                                  onChange={(e) => setNodeSearchQuery(e.target.value)} 
                                  placeholder="Search nodes by name or type..." 
                                  className="w-full bg-[#1e1e1e] text-gray-200 text-xs rounded-xl py-2 pl-9 pr-4 border border-gray-700 focus:border-cyan-400 outline-none transition-all"
                              />
                          </div>
                          <div className="flex items-center gap-2">
                              {linkingSourceId && (
                                <button 
                                  onClick={() => setLinkingSourceId(null)} 
                                  className="bg-red-900/40 text-red-400 px-3 py-2 rounded-lg text-xs font-bold border border-red-500/30 flex items-center gap-2"
                                >
                                  <X size={14}/> Cancel Linking
                                </button>
                              )}
                              <AddNodeDropdown 
                                show={showAddNodeDropdown} 
                                setShow={setShowAddNodeDropdown}
                                customInput={customTypeInput}
                                setCustomInput={setCustomTypeInput}
                                onAddNode={handleAddNode}
                                onAddCustomNode={handleAddCustomNode}
                              />
                          </div>
                      </div>

                      <div className="flex-1 overflow-auto custom-scrollbar">
                          <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-[#1a1a1a] text-gray-500 uppercase font-bold sticky top-0 z-10 shadow-sm">
                                  <tr>
                                      <th className="px-6 py-3 w-16">ID</th>
                                      <th className="px-6 py-3">Node</th>
                                      <th className="px-6 py-3">Type</th>
                                      <th className="px-6 py-3">Location</th>
                                      <th className="px-6 py-3 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                  {filteredNodes.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-6 py-12 text-center text-gray-600 italic">
                                        No assets matching the search query.
                                      </td>
                                    </tr>
                                  ) : (
                                    filteredNodes.map(node => {
                                      const isSelected = selectedNodeId === node.id;
                                      const isLinkingSource = linkingSourceId === node.id;
                                      const canBeLinkingTarget = linkingSourceId && linkingSourceId !== node.id;
                                      const hasConnection = linkingSourceId && links.some(l => (l.sourceId === linkingSourceId && l.targetId === node.id));

                                      return (
                                        <tr 
                                          key={node.id} 
                                          onClick={() => { setSelectedNodeId(node.id); setSelectedLinkId(null); }}
                                          className={`hover:bg-[#2d2d2d] transition-all cursor-pointer group ${isSelected ? 'bg-cyan-900/10 border-l-4 border-cyan-400' : 'bg-[#1e1e1e]'} ${isLinkingSource ? 'bg-purple-900/10' : ''}`}
                                        >
                                          <td className="px-6 py-4">
                                            <span className="text-gray-500 font-mono">#{node.displayId}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                              <div className="p-1.5 rounded bg-gray-700/30 text-gray-300">{getNodeIcon(node.type)}</div>
                                              <span className={`font-bold transition-colors ${isSelected ? 'text-cyan-400' : 'text-gray-200'}`}>{node.name}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="text-gray-400">{node.type}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="text-gray-500">{node.location || '—'}</span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              {canBeLinkingTarget ? (
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); createLink(linkingSourceId!, node.id); setLinkingSourceId(null); }}
                                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${hasConnection ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-purple-400 text-black hover:bg-purple-300'}`}
                                                  disabled={!!hasConnection}
                                                >
                                                  {hasConnection ? 'Connected' : 'Connect Here'}
                                                </button>
                                              ) : (
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); setLinkingSourceId(node.id); setSelectedNodeId(node.id); }}
                                                  className={`p-2 rounded-lg transition-all ${isLinkingSource ? 'bg-purple-400 text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-[#333]'}`}
                                                  title="Start Linking"
                                                >
                                                  <LinkIcon size={14}/>
                                                </button>
                                              )}
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Node"
                                              >
                                                <Trash2 size={14}/>
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
                )}

                <div className="bg-[#2a2a2a] rounded-3xl p-5 border border-gray-700/50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all w-full lg:w-[350px]">
                    {currentLink ? (
                        (() => {
                            const source = nodes.find(n => n.id === currentLink.sourceId);
                            const target = nodes.find(n => n.id === currentLink.targetId);
                            const isRT = currentLink.type === 'RoundTrip';
                            const forwardCost = ((currentLink.transportPrice || 0) * (currentLink.tripCount || 1));
                            const reverseCost = isRT ? (((currentLink.transportPriceReverse || 0) * (currentLink.tripCountReverse || 1))) : 0;
                            const grandTotal = forwardCost + reverseCost;
                            
                            return (
                                <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
                                    <div className="flex items-center gap-2 text-gray-200 mb-2 shrink-0">
                                      {linkingSourceId && (
                                        <button onClick={() => setSelectedLinkId(null)} className="p-1.5 rounded-lg bg-[#333] text-gray-400 hover:text-white mr-1">
                                          <ChevronLeft size={16}/>
                                        </button>
                                      )}
                                      <div className="p-2 rounded-lg bg-[#333]">{isRT ? <ArrowLeftRight size={16} className="text-cyan-400"/> : <ArrowRight size={16} className="text-cyan-400"/>}</div>
                                      <div className="overflow-hidden"><div className="text-[10px] text-gray-500 uppercase font-bold">Link Properties</div><div className="text-xs text-gray-400 truncate w-full">{source?.name} {isRT ? '↔' : '→'} {target?.name}</div></div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                      <div><label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Direction Type</label><div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-gray-700"><button onClick={() => handleUpdateLink(currentLink.id, { type: 'OneWay' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md transition-colors ${currentLink.type === 'OneWay' ? 'bg-cyan-900/40 text-cyan-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}><ArrowRight size={12}/> One Way</button><button onClick={() => handleUpdateLink(currentLink.id, { type: 'RoundTrip' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md transition-colors ${currentLink.type === 'RoundTrip' ? 'bg-cyan-900/40 text-cyan-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}><ArrowLeftRight size={12}/> Round Trip</button></div></div>
                                      
                                      <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 overflow-hidden mt-4">
                                        <div className="p-4 space-y-8">
                                          <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider border-b border-gray-800 pb-2">
                                              <MoveRight size={14} /> Primary: {source?.name} → {target?.name}
                                            </div>
                                            <LinkLogisticsInputs key={`fwd-logistics-${currentLink.id}`} prefix="Forward" values={currentLink} update={(upd) => handleUpdateLink(currentLink.id, upd)} unitSystem={unitSystem} currency={currency} />
                                          </div>
                                          {isRT && (
                                            <div className="space-y-4 pt-4 border-t border-gray-700/50">
                                              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider border-b border-gray-800 pb-2">
                                                <MoveLeft size={14} /> Return: {target?.name} → {source?.name}
                                              </div>
                                              <LinkLogisticsInputs key={`rev-logistics-${currentLink.id}`} prefix="Reverse" values={currentLink} update={(upd) => handleUpdateLink(currentLink.id, upd)} unitSystem={unitSystem} currency={currency} />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-cyan-950/40 p-4 rounded-xl border border-cyan-500/30 flex justify-between items-center shadow-lg mt-4 shrink-0">
                                      <span className="text-cyan-400 text-[10px] font-bold uppercase">Total</span>
                                      <span className="text-cyan-400 font-bold text-lg">{currency}{grandTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-700 shrink-0 mt-4"><button onClick={() => handleDeleteLink(currentLink.id)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><Trash2 size={14}/> Delete Link</button></div>
                                </div>
                            );
                        })()
                    ) : (linkingSourceId && linkingSourceNode) ? (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-900/20 border border-purple-500/30 text-purple-400"><Network size={20}/></div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Connection Manager</div>
                                        <div className="font-bold text-gray-100">{linkingSourceNode.name}</div>
                                    </div>
                                </div>
                                <button onClick={() => setLinkingSourceId(null)} className="text-gray-500 hover:text-white p-1" title="Back to Properties"><X size={20}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 mb-6 flex items-start gap-3">
                                    <Info size={16} className="text-cyan-400 shrink-0 mt-0.5"/>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Select a partner node from the sheet to create a new lane, or manage existing connections below.
                                    </p>
                                </div>

                                <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><LayoutList size={14}/> Active Network Lanes</h5>
                                
                                <div className="space-y-2">
                                    {links.filter(l => l.sourceId === linkingSourceId || l.targetId === linkingSourceId).map(link => {
                                        const isSource = link.sourceId === linkingSourceId;
                                        const partnerId = isSource ? link.targetId : link.sourceId;
                                        const partner = nodes.find(n => n.id === partnerId);
                                        const isRT = link.type === 'RoundTrip';
                                        const mode = isSource 
                                            ? (link.transportType === 'Ground' ? link.groundType : (link.transportType === 'Custom' ? (link.customTransportType || 'Custom') : link.transportType))
                                            : (isRT ? (link.transportTypeReverse === 'Ground' ? link.groundTypeReverse : (link.transportTypeReverse === 'Custom' ? (link.customTransportTypeReverse || 'Custom') : link.transportTypeReverse)) : 'Inbound Only');
                                        
                                        return (
                                            <button 
                                                key={link.id}
                                                onClick={() => setSelectedLinkId(link.id)}
                                                className="w-full bg-[#1e1e1e] border border-gray-700 hover:border-cyan-500/50 rounded-xl p-3 flex items-center justify-between group transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg border ${isRT ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' : isSource ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' : 'bg-purple-900/20 border-purple-500/30 text-purple-400'}`}>
                                                        {isRT ? <ArrowLeftRight size={14}/> : isSource ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-gray-200">#{partner?.displayId} {partner?.name}</div>
                                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">{mode}</div>
                                                    </div>
                                                </div>
                                                <ChevronDown size={14} className="text-gray-600 group-hover:text-cyan-400 -rotate-90 transition-colors"/>
                                            </button>
                                        );
                                    })}
                                    {links.filter(l => l.sourceId === linkingSourceId || l.targetId === linkingSourceId).length === 0 && (
                                        <div className="text-center py-10 bg-[#1e1e1e] rounded-2xl border border-gray-800 border-dashed">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3 opacity-50"><LinkIcon size={20} className="text-gray-500"/></div>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase">No Active Lanes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-700 shrink-0">
                                <button onClick={() => setLinkingSourceId(null)} className="w-full bg-[#333] hover:bg-gray-700 text-gray-300 p-2 rounded-lg text-xs font-bold transition-all">
                                    Done Managing Links
                                </button>
                            </div>
                        </div>
                    ) : currentNode ? (
                        <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <div className="flex items-center gap-2 text-gray-200">
                                    <div className="p-2 rounded-lg bg-[#333]">{getNodeIcon(currentNode.type)}</div>
                                    <div><div className="text-[10px] text-gray-500 uppercase font-bold">Node Properties (ID: {currentNode.displayId})</div><div className="font-bold">{currentNode.type}</div></div>
                                </div>
                                <button onClick={() => setLinkingSourceId(currentNode.id)} className="p-2 rounded-lg bg-purple-900/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-black transition-all" title="Manage Connections">
                                    <Network size={16}/>
                                </button>
                            </div>
                            
                            <div className="shrink-0 mb-4">
                              <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Name</label>
                              <input 
                                type="text" 
                                value={currentNode.name} 
                                onChange={(e) => handleUpdateNode(currentNode.id, { name: e.target.value })} 
                                className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 p-2 text-sm focus:border-cyan-400 outline-none" 
                              />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-4">
                              <div className="space-y-4 pt-2">
                                <div className="h-px bg-gray-700/50 my-2"></div>
                                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                  {CATEGORIES.find(c => c.types.includes(currentNode.type))?.icon || <LayoutList size={14}/>}
                                  <span className="text-[10px] font-bold uppercase tracking-wider">{CATEGORIES.find(c => c.types.includes(currentNode.type))?.label || "Node Details"}</span>
                                </div>
                                
                                {!(currentNode.deletedDefaultFields?.includes('location')) && (
                                  <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold ml-1 flex items-center gap-1"><MapPin size={8}/> Location</label>
                                    <input 
                                      type="text" 
                                      placeholder="City, Complex, Region..."
                                      value={currentNode.location || ''} 
                                      onChange={(e) => handleUpdateNode(currentNode.id, { location: e.target.value })} 
                                      className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
                                    />
                                  </div>
                                )}

                                {CATEGORIES.find(c => c.types.includes(currentNode.type))?.name === "Storage & Consolidation" && !(currentNode.deletedDefaultFields?.includes('materialType')) && (
                                  <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold ml-1 flex items-center gap-1"><Box size={8}/> Storage Type</label>
                                    <input 
                                      type="text" 
                                      placeholder="Cold, Bonded, Standard..."
                                      value={currentNode.materialType || ''} 
                                      onChange={(e) => handleUpdateNode(currentNode.id, { materialType: e.target.value })} 
                                      className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
                                    />
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                  {getTemplateFields(currentNode).map(field => (
                                    <div key={field.key}>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">{field.label}</label>
                                      <input 
                                        type={field.type} 
                                        placeholder={field.placeholder}
                                        value={(currentNode as any)[field.key] || ''} 
                                        onChange={(e) => handleUpdateNode(currentNode.id, { [field.key]: e.target.type === 'number' ? (e.target.value === '' ? undefined : parseFloat(e.target.value)) : e.target.value })} 
                                        className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
                                      />
                                    </div>
                                  ))}
                                  {(currentNode.customFields || []).map(field => (
                                    <div key={field.id}>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">{field.name}</label>
                                      <input 
                                        type={field.type} 
                                        value={field.value} 
                                        onChange={(e) => handleUpdateCustomFieldValue(currentNode.id, field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} 
                                        className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {!(currentNode.deletedDefaultFields?.includes('leadTime')) && (
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1 flex items-center gap-1"><Clock size={8}/> Lead Time / Hand. Time</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. 5 days / 4 hrs"
                                        value={currentNode.leadTime || currentNode.handlingTime || ''} 
                                        onChange={(e) => handleUpdateNode(currentNode.id, { leadTime: e.target.value })} 
                                        className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
                                      />
                                    </div>
                                  )}
                                  {!(currentNode.deletedDefaultFields?.includes('primaryTransport')) && (
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1 flex items-center gap-1"><TruckIcon size={8}/> Primary Transport</label>
                                      <input 
                                        type="text" 
                                        placeholder="Truck, Rail..."
                                        value={currentNode.primaryTransport || ''} 
                                        onChange={(e) => handleUpdateNode(currentNode.id, { primaryTransport: e.target.value })} 
                                        className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 py-1.5 px-2 text-xs focus:border-cyan-400 outline-none" 
                                      />
                                    </div>
                                  )}
                                </div>
                                {CATEGORIES.find(c => c.types.includes(currentNode.type))?.name === "Raw Material & Source" && (
                                  <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-3">
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total Material cost</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-cyan-500/20 text-cyan-400 font-bold text-sm">
                                        {currency}{((currentNode.quantityValue || 0) * (currentNode.costPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total weight</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-purple-500/20 text-purple-400 font-bold text-sm">
                                        {((currentNode.quantityValue || 0) * (currentNode.weightPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {weightUnit}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {CATEGORIES.find(c => c.types.includes(currentNode.type))?.name === "Manufacturing & Production" && (
                                  <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-3">
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total Mfg Cost</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-cyan-500/20 text-cyan-400 font-bold text-sm">
                                        {currency}{((currentNode.currentOrders || 0) * (currentNode.costPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total weight</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-purple-500/20 text-purple-400 font-bold text-sm">
                                        {((currentNode.currentOrders || 0) * (currentNode.weightPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {weightUnit}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Utilization Rate</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-amber-500/20 text-amber-400 font-bold text-sm">
                                        {currentNode.quantityValue && currentNode.quantityValue > 0 
                                          ? (((currentNode.currentOrders || 0) / currentNode.quantityValue) * 100).toFixed(1) 
                                          : '0.0'}%
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {CATEGORIES.find(c => c.types.includes(currentNode.type))?.name === "Storage & Consolidation" && (
                                  <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total Storage Cost</label>
                                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-cyan-500/20 text-cyan-400 font-bold text-sm">
                                          {currency}{((currentNode.currentInventory || 0) * (currentNode.storageCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total Hand. Cost</label>
                                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-purple-500/20 text-purple-400 font-bold text-sm">
                                          {currency}{((currentNode.currentInventory || 0) * (currentNode.handlingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Storage Util. %</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-amber-500/20 text-amber-400 font-bold text-sm">
                                        {currentNode.quantityValue && currentNode.quantityValue > 0 
                                          ? (((currentNode.currentInventory || 0) / currentNode.quantityValue) * 100).toFixed(1) 
                                          : '0.0'}%
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {CATEGORIES.find(c => c.types.includes(currentNode.type))?.name === "Logistics Hubs" && (
                                  <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total Storage Cost</label>
                                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-cyan-500/20 text-cyan-400 font-bold text-sm">
                                          {currency}{((currentNode.currentInventory || 0) * (currentNode.storageCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Total Hand. Cost</label>
                                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-purple-500/20 text-purple-400 font-bold text-sm">
                                          {currency}{((currentNode.currentInventory || 0) * (currentNode.handlingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Hub Util. %</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-amber-500/20 text-amber-400 font-bold text-sm">
                                        {currentNode.quantityValue && currentNode.quantityValue > 0 
                                          ? (((currentNode.currentInventory || 0) / currentNode.quantityValue) * 100).toFixed(1) 
                                          : '0.0'}%
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {CATEGORIES.find(c => c.types.includes(currentNode.type))?.name === "Retail & Sales" && (
                                  <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-3">
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Daily Demand / Day</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-cyan-500/20 text-cyan-400 font-bold text-sm">
                                        {currentNode.dailyDemand?.toLocaleString() || '0'}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Storage Util. %</label>
                                      <div className="bg-[#1a1a1a] p-2 rounded-lg border border-amber-500/20 text-amber-400 font-bold text-sm">
                                        {currentNode.quantityValue && currentNode.quantityValue > 0 
                                          ? (((currentNode.avgInventory || 0) / currentNode.quantityValue) * 100).toFixed(1) 
                                          : '0.0'}%
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col mt-4">
                                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Comment</label>
                                <textarea 
                                  value={currentNode.comment || ''} 
                                  onChange={(e) => handleUpdateNode(currentNode.id, { comment: e.target.value })} 
                                  className="w-full bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-700 p-2 text-sm focus:border-cyan-400 outline-none resize-none custom-scrollbar min-h-[100px]" 
                                  placeholder="Add notes..." 
                                />
                                <div className="text-[9px] text-gray-500 text-right mt-1 shrink-0">{(currentNode.comment?.length || 0)} chars</div>
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-700 shrink-0 space-y-2">
                              <button onClick={() => setShowFieldConfig(true)} className="w-full bg-cyan-900/40 hover:bg-cyan-400 hover:text-black text-cyan-400 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-cyan-500/30">
                                <Settings size={14}/> Edit Fields
                              </button>
                              <button onClick={() => handleDeleteNode(currentNode.id)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                <Trash2 size={14}/> Delete Node
                              </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 animate-in fade-in duration-500"><div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center mb-2"><Factory size={24} className="opacity-50"/></div><p className="text-sm font-medium">No Selection</p><p className="text-xs text-center px-4">Select a node or link to edit properties.</p></div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {showFieldConfig && currentNode && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowFieldConfig(false)}>
              <div className="bg-[#1e1e1e] border border-gray-700 rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                   <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-[#2a2a2a] shrink-0">
                       <div className="flex items-center gap-3">
                           <Settings size={20} className="text-cyan-400"/>
                           <div>
                               <h3 className="text-lg font-medium text-gray-200">Configure Node Fields</h3>
                               <p className="text-[10px] text-gray-500 uppercase font-bold">Customize properties for {currentNode.name}</p>
                           </div>
                       </div>
                       <button onClick={() => setShowFieldConfig(false)} className="bg-[#333] hover:bg-gray-600 text-gray-300 p-1.5 rounded-full transition-colors"><X size={16}/></button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                        <div>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-3">Sequence Identification</span>
                            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800/50">
                                <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Custom Display ID #</label>
                                <input 
                                    type="number" 
                                    value={currentNode.displayId || ''} 
                                    onChange={(e) => handleUpdateNode(currentNode.id, { displayId: parseInt(e.target.value) || 0 })} 
                                    className="w-full bg-[#262626] text-white text-xs rounded-lg p-2 border border-gray-700 focus:border-cyan-400 outline-none" 
                                />
                                <p className="text-[8px] text-gray-600 mt-2">Sets the default sorting order in the data tables.</p>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-3">Template Fields (Click to delete/restore)</span>
                            <div className="flex flex-wrap gap-2">
                                {[{ label: 'Location', key: 'location' }, { label: 'Lead Time', key: 'leadTime' }, { label: 'Primary Transport', key: 'primaryTransport' }, ...getFullTemplateFields(currentNode)].map(field => {
                                    const isDeleted = currentNode.deletedDefaultFields?.includes(field.key);
                                    return (
                                        <button 
                                            key={field.key} 
                                            onClick={() => handleToggleDefaultField(currentNode.id, field.key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${isDeleted ? 'bg-red-950/20 text-red-500 border-red-500/20 line-through' : 'bg-[#2a2a2a] text-gray-300 border-gray-700 hover:border-cyan-400'}`}
                                        >
                                            {isDeleted ? <EyeOff size={12}/> : <Plus size={12}/>} {field.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-6">
                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-3">Custom Properties (Max 5)</span>
                            <div className="space-y-2 mb-4">
                                {(currentNode.customFields || []).map(field => (
                                    <div key={field.id} className="flex items-center gap-2 bg-[#2a2a2a] p-2 rounded-xl border border-gray-700 group">
                                        <div className="flex-1">
                                            <div className="text-[9px] text-gray-500 uppercase font-bold">{field.name}</div>
                                            <div className="text-xs text-gray-300">{field.type === 'number' ? 'Numeric' : 'Text'} value</div>
                                        </div>
                                        <button onClick={() => handleDeleteCustomField(currentNode.id, field.id)} className="text-gray-600 hover:text-red-400 p-2 transition-colors opacity-0 group-hover:opacity-100"><Trash size={14}/></button>
                                    </div>
                                ))}
                                {(currentNode.customFields || []).length === 0 && (
                                    <div className="text-center py-4 text-xs text-gray-600 italic">No custom properties added.</div>
                                )}
                            </div>

                            {((currentNode.customFields || []).length < 5) ? (
                                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800/50">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="text-[9px] text-gray-500 uppercase font-bold ml-1">Property Name</label>
                                            <input 
                                                type="text" 
                                                value={newCustomFieldName} 
                                                onChange={(e) => setNewCustomFieldName(e.target.value)} 
                                                placeholder="e.g. Serial Number, Grade..." 
                                                className="w-full bg-[#262626] text-white text-xs rounded-lg p-2 border border-gray-700 focus:border-cyan-400 outline-none" 
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setNewCustomFieldType('text')} 
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${newCustomFieldType === 'text' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-[#262626] text-gray-500 border-gray-700'}`}
                                            >
                                                <TypeIcon size={14}/> Text
                                            </button>
                                            <button 
                                                onClick={() => setNewCustomFieldType('number')} 
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${newCustomFieldType === 'number' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/30' : 'bg-[#262626] text-gray-500 border-gray-700'}`}
                                            >
                                                <Hash size={14}/> Number
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => handleAddCustomField(currentNode.id)} 
                                            className="w-full bg-cyan-900/40 hover:bg-cyan-400 hover:text-black text-cyan-400 border border-cyan-500/30 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1 transition-all mt-1"
                                        >
                                            <Plus size={14}/> Add Property
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-950/20 text-yellow-500 border border-yellow-500/20 p-3 rounded-xl text-center text-xs">
                                    Maximum limit of 5 custom properties reached.
                                </div>
                            )}
                        </div>
                   </div>
                   <div className="p-5 border-t border-gray-800 bg-[#2a2a2a] text-center">
                        <button onClick={() => setShowFieldConfig(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-2 rounded-xl text-xs font-bold transition-all">Done</button>
                   </div>
              </div>
          </div>
      )}

      {showDataModal && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowDataModal(false)}>
              <div className="bg-[#1e1e1e] border border-gray-700 w-full h-full flex flex-col shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                   <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-[#2a2a2a] shrink-0">
                       <div className="flex items-center gap-3">
                           <Table2 size={24} className="text-cyan-400"/>
                           <div>
                               <h3 className="text-xl font-medium text-gray-200">Network Analysis Data</h3>
                               <p className="text-xs text-gray-500">Breakdown of lane pieces, costs, and logistics modes.</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-2">
                           <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-gray-700 mr-4">
                               <button onClick={() => setDataModalTab('lanes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${dataModalTab === 'lanes' ? 'bg-cyan-900/40 text-cyan-400 shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}><ListFilter size={14}/> Lanes</button>
                               <button onClick={() => setDataModalTab('nodes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${dataModalTab === 'nodes' ? 'bg-cyan-900/40 text-cyan-400 shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}><ClipboardList size={14}/> Nodes</button>
                               <button onClick={() => setDataModalTab('network')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${dataModalTab === 'network' ? 'bg-cyan-900/40 text-cyan-400 shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}><Network size={14}/> Network</button>
                               <button onClick={() => setDataModalTab('summary')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${dataModalTab === 'summary' ? 'bg-cyan-900/40 text-cyan-400 shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}><TrendingUp size={14}/> Summary</button>
                           </div>
                           <button onClick={() => setShowDataModal(false)} className="bg-[#333] hover:bg-gray-600 text-gray-300 p-2 rounded-full transition-colors"><X size={20}/></button>
                       </div>
                   </div>
                   <div className="flex-1 overflow-auto p-6 bg-[#151515] custom-scrollbar">
                       {dataModalTab !== 'summary' && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="bg-[#262626] p-4 rounded-2xl border border-gray-800"><div className="text-gray-500 text-xs font-bold uppercase mb-1">Network Spend</div><div className="text-2xl font-bold text-cyan-400">{currency}{totalCost.toLocaleString()}</div></div>
                              <div className="bg-[#262626] p-4 rounded-2xl border border-gray-800"><div className="text-gray-500 text-xs font-bold uppercase mb-1">Active Nodes</div><div className="text-2xl font-bold text-gray-200">{nodes.length}</div></div>
                              <div className="bg-[#262626] p-4 rounded-2xl border border-gray-800"><div className="text-gray-500 text-xs font-bold uppercase mb-1">Active Lanes</div><div className="text-2xl font-bold text-gray-200">{links.length}</div></div>
                         </div>
                       )}

                       {dataModalTab !== 'summary' && (
                          <div className="mb-6">
                              <div className="relative max-w-md">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                  <input 
                                      type="text" 
                                      value={nodeSearchQuery} 
                                      onChange={(e) => setNodeSearchQuery(e.target.value)} 
                                      placeholder="Search by node name or type..." 
                                      className="w-full bg-[#2a2a2a] text-gray-200 text-xs rounded-xl py-2.5 pl-9 pr-4 border border-gray-700 focus:border-cyan-400 outline-none transition-all shadow-inner"
                                  />
                              </div>
                          </div>
                       )}
                       
                       {dataModalTab === 'lanes' ? (
                           <div className="bg-[#262626] border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-300">
                               <div className="overflow-x-auto">
                                   <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                       <thead className="bg-[#1e1e1e] text-xs text-gray-500 uppercase font-bold">
                                           <tr><th className="px-6 py-4 w-20">Order</th><th className="px-6 py-4">Lane / Leg</th><th className="px-6 py-4">Origin</th><th className="px-6 py-4">Destination</th><th className="px-6 py-4">Mode</th><th className="px-6 py-4 text-right">Trips</th><th className="px-6 py-4 text-right">Days</th><th className="px-6 py-4 text-right">Pieces</th><th className="px-6 py-4 text-right">Cost/Piece</th><th className="px-6 py-4 text-right bg-[#333]/30">Transport Total</th></tr>
                                       </thead>
                                       {filteredLinks.map((link, idx) => { 
                                           const source = nodes.find(n => n.id === link.sourceId); 
                                           const target = nodes.find(n => n.id === link.targetId); 
                                           if (!source || !target) return null; 
                                           const fwdTrips = link.tripCount || 1; 
                                           const fwdTransp = (link.transportPrice || 0) * fwdTrips; 
                                           const fwdCostPiece = link.volume > 0 ? (fwdTransp / link.volume).toFixed(2) : '0.00'; 
                                           return (
                                               <tbody key={link.id} className="border-t-2 border-gray-800 bg-[#262626] group">
                                                   <tr className="hover:bg-[#2d2d2d] transition-colors"><td className="px-6 py-4"><div className="flex flex-col gap-0.5"><button disabled={idx === 0} onClick={() => handleMoveLinkRow(idx, 'up')} className={`p-0.5 rounded transition-colors ${idx === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-cyan-500 hover:bg-cyan-950/30'}`}><ChevronUp size={16}/></button><button disabled={idx === links.length - 1} onClick={() => handleMoveLinkRow(idx, 'down')} className={`p-0.5 rounded transition-colors ${idx === links.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-cyan-500 hover:bg-cyan-950/30'}`}><ChevronDown size={16}/></button></div></td><td className="px-6 py-4"><span className="bg-cyan-900/40 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">Primary</span></td><td className="px-6 py-4 font-medium text-gray-300">#{source.displayId} {source.name}</td><td className="px-6 py-4 font-medium text-gray-300">#{target.displayId} {target.name}</td><td className="px-6 py-4 text-xs"><span className="text-gray-400">{link.transportType === 'Ground' ? link.groundType : (link.transportType === 'Custom' ? (link.customTransportType || 'Custom') : link.transportType)}</span></td><td className="px-6 py-4 text-right text-gray-300">{fwdTrips}</td><td className="px-6 py-4 text-right text-gray-400">{link.days || 0}</td><td className="px-6 py-4 text-right text-gray-400">{link.volume?.toLocaleString()}</td><td className="px-6 py-4 text-right text-gray-300">{currency}{fwdCostPiece}</td><td className="px-6 py-4 text-right font-bold text-cyan-400 bg-cyan-950/20">{currency}{fwdTransp.toLocaleString()}</td></tr>
                                                   {link.type === 'RoundTrip' && (() => {
                                                       const revTrips = link.tripCountReverse || 1; const revTransp = (link.transportPriceReverse || 0) * revTrips; const revCostPiece = (link.volumeReverse || 0) > 0 ? (revTransp / (link.volumeReverse || 0)).toFixed(2) : '0.00'; 
                                                       return (<tr className="hover:bg-[#2d2d2d] transition-colors border-t border-gray-800/50"><td className="px-6 py-4"></td><td className="px-6 py-4"><span className="bg-purple-900/40 text-purple-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">Return</span></td><td className="px-6 py-4 font-medium text-gray-300 italic">#{target.displayId} {target.name}</td><td className="px-6 py-4 font-medium text-gray-300 italic">#{source.displayId} {source.name}</td><td className="px-6 py-4 text-xs"><span className="text-gray-400">{link.transportTypeReverse === 'Ground' ? link.groundTypeReverse : (link.transportTypeReverse === 'Custom' ? (link.customTransportType || 'Custom') : link.transportTypeReverse)}</span></td><td className="px-6 py-4 text-right text-gray-300">{revTrips}</td><td className="px-6 py-4 text-right text-gray-400">{(link.volumeReverse || 0).toLocaleString()}</td><td className="px-6 py-4 text-right text-gray-300">{currency}{revCostPiece}</td><td className="px-6 py-4 text-right font-bold text-purple-400 bg-purple-950/20">{currency}{revTransp.toLocaleString()}</td></tr>);
                                                   })()}
                                               </tbody>
                                           );
                                       })}
                                   </table>
                               </div>
                           </div>
                       ) : dataModalTab === 'nodes' ? (
                           <div className="flex flex-col animate-in fade-in duration-300">
                               <div className="flex justify-end mb-6 shrink-0">
                                 <div className="bg-[#2a2a2a] p-1 rounded-xl border border-gray-700 flex">
                                   <button onClick={() => setNodesViewMode('grid')} className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${nodesViewMode === 'grid' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                                     <LayoutGrid size={14} /> <span>Grid</span>
                                   </button>
                                   <button onClick={() => setNodesViewMode('table')} className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${nodesViewMode === 'table' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                                     <Table2 size={14} /> <span>Sheet</span>
                                   </button>
                                 </div>
                               </div>

                               {nodesViewMode === 'grid' ? (
                                 <div className="space-y-6">
                                     {[...filteredNodes].sort((a, b) => (a.displayId || 0) - (b.displayId || 0)).map((node, nodeIdx) => { 
                                         const activeTemplateFields = getTemplateFields(node);
                                         const customFields = node.customFields || [];
                                         const connectedLanesCount = links.filter(l => l.sourceId === node.id || l.targetId === node.id).length;
                                         const allProps = [
                                           ...activeTemplateFields.map(f => ({ label: f.label, value: (node as any)[f.key] })),
                                           ...(!(node.deletedDefaultFields?.includes('location')) ? [{ label: 'Location', value: node.location }] : []),
                                           ...(!(node.deletedDefaultFields?.includes('leadTime')) ? [{ label: 'Lead/Hand', value: node.leadTime || node.handlingTime }] : []),
                                           ...(!(node.deletedDefaultFields?.includes('primaryTransport')) ? [{ label: 'Transp.', value: node.primaryTransport }] : []),
                                           ...customFields.map(f => ({ label: f.name, value: f.value }))
                                         ].filter(d => d.value !== undefined && d.value !== '');

                                         const calculatedTotals = [];
                                         const cat = CATEGORIES.find(c => c.types.includes(node.type));
                                         if (cat?.name === "Raw Material & Source") {
                                             calculatedTotals.push({ label: "Total Material Cost", value: `${currency}${((node.quantityValue || 0) * (node.costPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                             calculatedTotals.push({ label: "Total weight", value: `${((node.quantityValue || 0) * (node.weightPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${weightUnit}` });
                                         } else if (cat?.name === "Manufacturing & Production") {
                                             calculatedTotals.push({ label: "Total Mfg Cost", value: `${currency}${((node.currentOrders || 0) * (node.costPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                             calculatedTotals.push({ label: "Total weight", value: `${((node.currentOrders || 0) * (node.weightPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${weightUnit}` });
                                             calculatedTotals.push({ label: "Utilization Rate", value: node.quantityValue && node.quantityValue > 0 ? (((node.currentOrders || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                         } else if (cat?.name === "Storage & Consolidation") {
                                             calculatedTotals.push({ label: "Total Storage Cost", value: `${currency}${((node.currentInventory || 0) * (node.storageCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                             calculatedTotals.push({ label: "Total Handling Cost", value: `${currency}${((node.currentInventory || 0) * (node.handlingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                             calculatedTotals.push({ label: "Storage Util. %", value: node.quantityValue && node.quantityValue > 0 ? (((node.currentInventory || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                         } else if (cat?.name === "Logistics Hubs") {
                                             calculatedTotals.push({ label: "Total Storage Cost", value: `${currency}${((node.currentInventory || 0) * (node.storageCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                             calculatedTotals.push({ label: "Total Handling Cost", value: `${currency}${((node.currentInventory || 0) * (node.handlingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                             calculatedTotals.push({ label: "Hub Utilization %", value: node.quantityValue && node.quantityValue > 0 ? (((node.currentInventory || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                         } else if (cat?.name === "Retail & Sales") {
                                             calculatedTotals.push({ label: "Daily Demand / Day", value: (node.dailyDemand || 0).toLocaleString() });
                                             calculatedTotals.push({ label: "Storage Util. %", value: node.quantityValue && node.quantityValue > 0 ? (((node.avgInventory || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                         }

                                         return (
                                           <div key={node.id} className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                                               <div className="bg-[#2a2a2a] p-5 border-b border-gray-800 flex items-center justify-between">
                                                   <div className="flex items-center gap-4">
                                                       <div className="flex flex-col items-center gap-1 bg-[#1a1a1a] p-2 rounded-lg border border-gray-700 min-w-[50px]">
                                                           <button disabled={nodeIdx === 0} onClick={() => handleMoveNodeRow(nodeIdx, 'up')} className={`p-0.5 rounded transition-colors ${nodeIdx === 0 ? 'text-gray-800' : 'text-cyan-500 hover:bg-cyan-950/30'}`}><ChevronUp size={20}/></button>
                                                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">POS {nodeIdx + 1}</span>
                                                           <button disabled={nodeIdx === nodes.length - 1} onClick={() => handleMoveNodeRow(nodeIdx, 'down')} className={`p-0.5 rounded transition-colors ${nodeIdx === nodes.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-cyan-500 hover:bg-cyan-950/30'}`}><ChevronDown size={20}/></button>
                                                       </div>
                                                       <div className="p-3 rounded-xl bg-[#333] border border-gray-700 shadow-inner">{getNodeIcon(node.type)}</div>
                                                       <div>
                                                           <h4 className="text-xl font-black text-gray-100 tracking-tight">#{node.displayId} {node.name}</h4>
                                                           <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{node.type}</span>
                                                       </div>
                                                   </div>
                                                   <div className="flex items-center gap-3">
                                                       <div className="bg-cyan-950/20 px-4 py-2 rounded-full border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase">
                                                           {connectedLanesCount} Connected Lanes
                                                       </div>
                                                   </div>
                                               </div>

                                               <div className="p-6 bg-[#1a1a1a]/50">
                                                   <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><LayoutList size={14}/> Asset Attributes</h5>
                                                   {allProps.length > 0 ? (
                                                       <div className="w-full border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                                                           <div className="overflow-x-auto custom-scrollbar">
                                                               <table className="w-full text-xs text-left border-collapse bg-[#151515]">
                                                                   <thead className="bg-[#222] text-gray-500 font-bold uppercase">
                                                                       <tr className="divide-x divide-gray-800">
                                                                           {allProps.map((p, i) => <th key={i} className="px-4 py-3 whitespace-nowrap border-b border-gray-800">{p.label}</th>)}
                                                                       </tr>
                                                                   </thead>
                                                                   <tbody>
                                                                       <tr className="divide-x divide-gray-800 hover:bg-white/5 transition-colors">
                                                                           {allProps.map((p, i) => <td key={i} className="px-4 py-3 text-cyan-400 font-black whitespace-nowrap">{p.value}</td>)}
                                                                       </tr>
                                                                   </tbody>
                                                               </table>
                                                           </div>
                                                       </div>
                                                   ) : (
                                                       <div className="text-sm text-gray-600 italic bg-[#151515] p-4 rounded-xl border border-gray-800 border-dashed">No structured attributes defined.</div>
                                                   )}

                                                   {calculatedTotals.length > 0 && (
                                                      <div className="mt-6">
                                                          <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><BarChart3 size={14}/> Calculated Performance Totals</h5>
                                                          <div className="w-full border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                                                              <div className="overflow-x-auto custom-scrollbar">
                                                                  <table className="w-full text-xs text-left border-collapse bg-[#151515]">
                                                                      <thead className="bg-[#222] text-gray-500 font-bold uppercase">
                                                                          <tr className="divide-x divide-gray-800">
                                                                              {calculatedTotals.map((p, i) => <th key={i} className="px-4 py-3 whitespace-nowrap border-b border-gray-800">{p.label}</th>)}
                                                                          </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                          <tr className="divide-x divide-gray-800 hover:bg-white/5 transition-colors">
                                                                              {calculatedTotals.map((p, i) => <td key={i} className="px-4 py-3 text-cyan-400 font-black whitespace-nowrap">{p.value}</td>)}
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </div>
                                                          </div>
                                                      </div>
                                                   )}
                                               </div>

                                               <div className="px-6 pb-6 pt-2 bg-[#1a1a1a]/50">
                                                   <h5 className="text-[10px] text-gray-500 font-black uppercase mb-2 flex items-center gap-2"><Info size={14}/> Notes</h5>
                                                   <div className="bg-[#151515] p-4 rounded-xl border border-gray-800 text-gray-400 text-sm italic leading-relaxed">
                                                       {node.comment || "No specific commentary available."}
                                                   </div>
                                               </div>
                                           </div>
                                         ); 
                                     })}
                                 </div>
                               ) : (
                                 <div className="bg-[#262626] border border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-300">
                                     <div className="overflow-x-auto">
                                         <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                             <thead className="bg-[#1e1e1e] text-xs text-gray-500 uppercase font-bold">
                                                 <tr>
                                                     <th className="px-6 py-4 w-20">Pos</th>
                                                     <th className="px-6 py-4">Asset Identity</th>
                                                     <th className="px-6 py-4">Type</th>
                                                     <th className="px-6 py-4">Location</th>
                                                     <th className="px-6 py-4 text-center">Attributes</th>
                                                     <th className="px-6 py-4 text-right">Details</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {[...filteredNodes].sort((a, b) => (a.displayId || 0) - (b.displayId || 0)).map((node, nodeIdx) => {
                                                     const activeFieldsCount = getTemplateFields(node).length + (node.customFields || []).length;
                                                     const isExpanded = expandedDataNodes.includes(node.id);
                                                     
                                                     return (
                                                       <React.Fragment key={node.id}>
                                                         <tr className="hover:bg-white/5 transition-colors border-t border-gray-800/50 group">
                                                             <td className="px-6 py-4">
                                                                 <div className="flex flex-col gap-0.5">
                                                                     <button disabled={nodeIdx === 0} onClick={() => handleMoveNodeRow(nodeIdx, 'up')} className={`p-0.5 rounded transition-colors ${nodeIdx === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-cyan-500 hover:bg-cyan-950/30'}`}><ChevronUp size={16}/></button>
                                                                     <button disabled={nodeIdx === nodes.length - 1} onClick={() => handleMoveNodeRow(nodeIdx, 'down')} className={`p-0.5 rounded transition-colors ${nodeIdx === nodes.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-cyan-500 hover:bg-cyan-950/30'}`}><ChevronDown size={16}/></button>
                                                                 </div>
                                                             </td>
                                                             <td className="px-6 py-4">
                                                                 <div className="flex items-center gap-3">
                                                                     <div className="p-1.5 rounded bg-gray-700/30 text-gray-300">{getNodeIcon(node.type)}</div>
                                                                     <div className="flex flex-col">
                                                                         <span className="font-bold text-gray-200">#{node.displayId} {node.name}</span>
                                                                     </div>
                                                                 </div>
                                                             </td>
                                                             <td className="px-6 py-4 text-xs">
                                                                 <span className="text-gray-400 font-medium">{node.type}</span>
                                                             </td>
                                                             <td className="px-6 py-4 text-xs">
                                                                 <span className="text-gray-500">{node.location || 'Not Specified'}</span>
                                                             </td>
                                                             <td className="px-6 py-4 text-center">
                                                                 <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-[10px] font-bold uppercase border border-gray-700">
                                                                     {activeFieldsCount} Fields
                                                                 </span>
                                                             </td>
                                                             <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                  <button 
                                                                      onClick={() => toggleDataNodeExpansion(node.id)}
                                                                      className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-cyan-400 text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                                                      title="Toggle More Information"
                                                                  >
                                                                      {isExpanded ? <Minimize2 size={16}/> : <Plus size={16}/>}
                                                                  </button>
                                                                  <button 
                                                                      onClick={() => handleDeleteNode(node.id)}
                                                                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                                                                      title="Delete Node"
                                                                  >
                                                                      <Trash2 size={16}/>
                                                                  </button>
                                                                </div>
                                                             </td>
                                                         </tr>
                                                         {isExpanded && (
                                                           <tr className="bg-[#151515] animate-in slide-in-from-top-2 duration-300">
                                                             <td colSpan={6} className="px-4 py-6 border-b border-gray-800">
                                                               <div className="space-y-6">
                                                                 {(() => {
                                                                   const activeTemplateFields = getTemplateFields(node);
                                                                   const customFields = node.customFields || [];
                                                                   const allProps = [
                                                                     ...activeTemplateFields.map(f => ({ label: f.label, value: (node as any)[f.key] })),
                                                                     ...(!(node.deletedDefaultFields?.includes('location')) ? [{ label: 'Location', value: node.location }] : []),
                                                                     ...(!(node.deletedDefaultFields?.includes('leadTime')) ? [{ label: 'Lead/Hand', value: node.leadTime || node.handlingTime }] : []),
                                                                     ...(!(node.deletedDefaultFields?.includes('primaryTransport')) ? [{ label: 'Transp.', value: node.primaryTransport }] : []),
                                                                     ...customFields.map(f => ({ label: f.name, value: f.value }))
                                                                   ].filter(d => d.value !== undefined && d.value !== '');

                                                                   const calculatedTotals = [];
                                                                   const cat = CATEGORIES.find(c => c.types.includes(node.type));
                                                                   if (cat?.name === "Raw Material & Source") {
                                                                       calculatedTotals.push({ label: "Total Material Cost", value: `${currency}${((node.quantityValue || 0) * (node.costPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                                                       calculatedTotals.push({ label: "Total weight", value: `${((node.quantityValue || 0) * (node.weightPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${weightUnit}` });
                                                                   } else if (cat?.name === "Manufacturing & Production") {
                                                                       calculatedTotals.push({ label: "Total Mfg Cost", value: `${currency}${((node.currentOrders || 0) * (node.costPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                                                       calculatedTotals.push({ label: "Total weight", value: `${((node.currentOrders || 0) * (node.weightPerUnit || 0)).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${weightUnit}` });
                                                                       calculatedTotals.push({ label: "Utilization Rate", value: node.quantityValue && node.quantityValue > 0 ? (((node.currentOrders || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                                                   } else if (cat?.name === "Storage & Consolidation") {
                                                                       calculatedTotals.push({ label: "Total Storage Cost", value: `${currency}${((node.currentInventory || 0) * (node.storageCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                                                       calculatedTotals.push({ label: "Total Handling Cost", value: `${currency}${((node.currentInventory || 0) * (node.handlingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                                                       calculatedTotals.push({ label: "Storage Util. %", value: node.quantityValue && node.quantityValue > 0 ? (((node.currentInventory || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                                                   } else if (cat?.name === "Logistics Hubs") {
                                                                       calculatedTotals.push({ label: "Total Storage Cost", value: `${currency}${((node.currentInventory || 0) * (node.storageCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                                                       calculatedTotals.push({ label: "Total Handling Cost", value: `${currency}${((node.currentInventory || 0) * (node.handlingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                                                                       calculatedTotals.push({ label: "Hub Utilization %", value: node.quantityValue && node.quantityValue > 0 ? (((node.currentInventory || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                                                   } else if (cat?.name === "Retail & Sales") {
                                                                       calculatedTotals.push({ label: "Daily Demand / Day", value: (node.dailyDemand || 0).toLocaleString() });
                                                                       calculatedTotals.push({ label: "Storage Util. %", value: node.quantityValue && node.quantityValue > 0 ? (((node.avgInventory || 0) / node.quantityValue) * 100).toFixed(1) + '%' : '0.0%' });
                                                                   }

                                                                   return (
                                                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
                                                                       <div className="space-y-6 min-w-0">
                                                                         <div className="min-w-0">
                                                                           <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><LayoutList size={14}/> Node Attribute Matrix</h5>
                                                                           {allProps.length > 0 ? (
                                                                               <div className="w-full border border-gray-800 rounded-xl overflow-hidden shadow-sm bg-[#1a1a1a]">
                                                                                 <div className="overflow-x-auto custom-scrollbar">
                                                                                   <table className="w-full text-xs text-left border-collapse">
                                                                                       <thead className="bg-[#222] text-gray-500 font-bold uppercase">
                                                                                           <tr className="divide-x divide-gray-800">
                                                                                               {allProps.map((p, i) => <th key={i} className="px-4 py-3 whitespace-nowrap border-b border-gray-800">{p.label}</th>)}
                                                                                           </tr>
                                                                                       </thead>
                                                                                       <tbody>
                                                                                           <tr className="divide-x divide-gray-800 hover:bg-white/5 transition-colors">
                                                                                               {allProps.map((p, i) => <td key={i} className="px-4 py-3 text-cyan-400 font-black whitespace-nowrap">{p.value}</td>)}
                                                                                           </tr>
                                                                                       </tbody>
                                                                                   </table>
                                                                                 </div>
                                                                               </div>
                                                                           ) : (
                                                                               <div className="text-xs text-gray-600 italic">No attributes defined.</div>
                                                                           )}
                                                                         </div>
                                                                         {calculatedTotals.length > 0 && (
                                                                           <div className="min-w-0">
                                                                             <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><BarChart3 size={14}/> Analytical Performance Overview</h5>
                                                                             <div className="w-full border border-gray-800 rounded-xl shadow-2xl overflow-hidden bg-[#1a1a1a]">
                                                                               <div className="overflow-x-auto custom-scrollbar">
                                                                                 <table className="w-full text-xs text-left border-collapse">
                                                                                     <thead className="bg-[#222] text-gray-500 font-bold uppercase">
                                                                                         <tr className="divide-x divide-gray-800">
                                                                                             {calculatedTotals.map((p, i) => <th key={i} className="px-4 py-3 whitespace-nowrap border-b border-gray-800">{p.label}</th>)}
                                                                                         </tr>
                                                                                     </thead>
                                                                                     <tbody>
                                                                                         <tr className="divide-x divide-gray-800 hover:bg-white/5 transition-colors">
                                                                                             {calculatedTotals.map((p, i) => <td key={i} className="px-4 py-3 text-cyan-400 font-black whitespace-nowrap">{p.value}</td>)}
                                                                                         </tr>
                                                                                     </tbody>
                                                                                 </table>
                                                                               </div>
                                                                             </div>
                                                                           </div>
                                                                         )}
                                                                       </div>
                                                                       <div className="flex flex-col h-full min-w-0">
                                                                         <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><Info size={14}/> Operational Strategy Notes</h5>
                                                                         <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 text-gray-400 text-sm italic leading-relaxed h-full flex items-center min-h-[120px]">
                                                                           {node.comment || "Strategic commentary for this asset has not been recorded."}
                                                                         </div>
                                                                       </div>
                                                                     </div>
                                                                   );
                                                                 })()}
                                                               </div>
                                                             </td>
                                                           </tr>
                                                         )}
                                                       </React.Fragment>
                                                     ); 
                                                 })}
                                                 {filteredNodes.length === 0 && (
                                                     <tr>
                                                         <td colSpan={6} className="px-6 py-12 text-center text-gray-600 italic">No matching network nodes found.</td>
                                                     </tr>
                                                 )}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>
                               )}
                           </div>
                       ) : dataModalTab === 'network' ? (
                           <div className="flex flex-col animate-in fade-in duration-300">
                               <div className="flex justify-end mb-6 shrink-0">
                                 <div className="bg-[#2a2a2a] p-1 rounded-xl border border-gray-700 flex">
                                   <button onClick={() => setNetworkViewMode('grid')} className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${networkViewMode === 'grid' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                                     <LayoutGrid size={14} /> <span>Grid</span>
                                   </button>
                                   <button onClick={() => setNetworkViewMode('table')} className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${networkViewMode === 'table' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                                     <Table2 size={14} /> <span>Sheet</span>
                                   </button>
                                 </div>
                               </div>

                               {networkViewMode === 'grid' ? (
                                 <div className="space-y-6">
                                     {[...filteredNodes].sort((a, b) => (a.displayId || 0) - (b.displayId || 0)).map((node, nodeIdx) => {
                                         const nodeLegs: { direction: 'In' | 'Out', partnerId: string, link: SCLink, isForward: boolean }[] = [];
                                         links.forEach(l => {
                                           if (l.sourceId === node.id) {
                                             nodeLegs.push({ direction: 'Out', partnerId: l.targetId, link: l, isForward: true });
                                             if (l.type === 'RoundTrip') nodeLegs.push({ direction: 'In', partnerId: l.targetId, link: l, isForward: false });
                                           } else if (l.targetId === node.id) {
                                             nodeLegs.push({ direction: 'In', partnerId: l.sourceId, link: l, isForward: true });
                                             if (l.type === 'RoundTrip') nodeLegs.push({ direction: 'Out', partnerId: l.sourceId, link: l, isForward: false });
                                           }
                                         });

                                         const activeTemplateFields = getTemplateFields(node);
                                         const customFields = node.customFields || [];
                                         const allProps = [
                                           ...activeTemplateFields.map(f => ({ label: f.label, value: (node as any)[f.key] })),
                                           ...(!(node.deletedDefaultFields?.includes('location')) ? [{ label: 'Location', value: node.location }] : []),
                                           ...(!(node.deletedDefaultFields?.includes('leadTime')) ? [{ label: 'Lead/Hand', value: node.leadTime || node.handlingTime }] : []),
                                           ...(!(node.deletedDefaultFields?.includes('primaryTransport')) ? [{ label: 'Transp.', value: node.primaryTransport }] : []),
                                           ...customFields.map(f => ({ label: f.name, value: f.value }))
                                         ].filter(d => d.value !== undefined && d.value !== '');

                                         return (
                                           <div key={node.id} className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                                               <div className="bg-[#2a2a2a] p-5 border-b border-gray-800 flex items-center justify-between">
                                                   <div className="flex items-center gap-4">
                                                       <div className="p-3 rounded-xl bg-[#333] border border-gray-700 shadow-inner">{getNodeIcon(node.type)}</div>
                                                       <div>
                                                           <h4 className="text-xl font-black text-gray-100 tracking-tight">#{node.displayId} {node.name}</h4>
                                                           <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{node.type}</span>
                                                       </div>
                                                   </div>
                                                   <div className="bg-cyan-950/20 px-4 py-2 rounded-full border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase">
                                                       {nodeLegs.length} Active Flow Legs
                                                   </div>
                                               </div>

                                               <div className="p-6 bg-[#1a1a1a]/50 border-b border-gray-800">
                                                   <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><LayoutList size={14}/> Full Asset Property Grid</h5>
                                                   {allProps.length > 0 ? (
                                                       <div className="w-full border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                                                           <div className="overflow-x-auto custom-scrollbar">
                                                               <table className="w-full text-xs text-left border-collapse bg-[#151515]">
                                                                   <thead className="bg-[#222] text-gray-500 font-bold uppercase">
                                                                       <tr className="divide-x divide-gray-800">
                                                                           {allProps.map((p, i) => <th key={i} className="px-4 py-3 whitespace-nowrap border-b border-gray-800">{p.label}</th>)}
                                                                       </tr>
                                                                   </thead>
                                                                   <tbody>
                                                                       <tr className="divide-x divide-gray-800 hover:bg-white/5 transition-colors">
                                                                           {allProps.map((p, i) => <td key={i} className="px-4 py-3 text-cyan-400 font-black whitespace-nowrap">{p.value}</td>)}
                                                                       </tr>
                                                                   </tbody>
                                                               </table>
                                                           </div>
                                                       </div>
                                                   ) : (
                                                       <div className="text-sm text-gray-600 italic bg-[#151515] p-4 rounded-xl border border-gray-800 border-dashed">No structured attributes defined.</div>
                                                   )}
                                               </div>

                                               <div className="p-6 flex flex-col lg:flex-row gap-6">
                                                   <div className="flex-1">
                                                       <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><Shuffle size={14}/> Logistics Flow Analysis</h5>
                                                       {nodeLegs.length > 0 ? (
                                                           <div className="space-y-3">
                                                               {nodeLegs.map((leg, lIdx) => {
                                                                   const partner = nodes.find(n => n.id === leg.partnerId);
                                                                   const l = leg.link;
                                                                   const isFwd = leg.isForward;
                                                                   const mode = isFwd 
                                                                      ? (l.transportType === 'Ground' ? l.groundType : (l.transportType === 'Custom' ? (l.customTransportType || 'Custom') : l.transportType))
                                                                      : (l.transportTypeReverse === 'Ground' ? l.groundTypeReverse : (l.transportTypeReverse === 'Custom' ? (l.customTransportTypeReverse || 'Custom') : l.transportTypeReverse));
                                                                   const spend = isFwd 
                                                                      ? (l.transportPrice || 0) * (l.tripCount || 1)
                                                                      : (l.transportPriceReverse || 0) * (l.tripCountReverse || 1);
                                                                   const volume = isFwd ? (l.volume || 0) : (l.volumeReverse || 0);

                                                                   return (
                                                                     <div key={lIdx} className="bg-[#262626] border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-cyan-500/30 transition-all shadow-lg">
                                                                         <div className="flex items-center gap-4">
                                                                             <div className={`p-2 rounded-lg border shrink-0 ${leg.direction === 'Out' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' : 'bg-purple-900/20 border-purple-500/30 text-purple-400'}`}>
                                                                                 {leg.direction === 'Out' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                                                                             </div>
                                                                             <div>
                                                                                 <div className="flex items-center gap-2">
                                                                                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${leg.direction === 'Out' ? 'bg-cyan-400 text-black' : 'bg-purple-400 text-black'}`}>
                                                                                        {leg.direction === 'Out' ? 'Outbound Flow' : 'Inbound Flow'}
                                                                                     </span>
                                                                                     <span className="text-gray-200 font-black text-sm tracking-tight">#{partner?.displayId} {partner?.name}</span>
                                                                                 </div>
                                                                             </div>
                                                                         </div>
                                                                         <div className="flex flex-col md:items-center gap-1">
                                                                             <span className="text-[10px] bg-[#1a1a1a] text-gray-400 border border-gray-700 px-3 py-1 rounded-md font-black uppercase tracking-widest">{mode || 'Standard Mode'}</span>
                                                                             <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                                 Spend: <span className="text-cyan-400 font-black">{currency}{spend.toLocaleString()}</span>
                                                                             </div>
                                                                         </div>
                                                                         <div className="flex flex-col items-end min-w-[120px]">
                                                                             <span className="text-2xl font-black text-gray-100 tracking-tighter">{volume.toLocaleString()}</span>
                                                                             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Throughput</span>
                                                                         </div>
                                                                     </div>
                                                                   );
                                                               })}
                                                           </div>
                                                       ) : (
                                                           <div className="flex items-center gap-3 text-gray-600 italic text-sm bg-[#151515] p-5 rounded-xl border border-dashed border-gray-800">
                                                               <span>Isolated asset position.</span>
                                                           </div>
                                                       )}
                                                   </div>
                                               </div>
                                           </div>
                                         );
                                     })}
                                 </div>
                               ) : (
                                 <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                                      <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[700px]">
                                        <thead className="bg-[#2a2a2a] text-[10px] text-gray-500 uppercase font-black tracking-widest sticky top-0 z-10">
                                          <tr>
                                            <th className="px-6 py-4 border-b border-gray-800">Asset Identity</th>
                                            <th className="px-6 py-4 border-b border-gray-800">Type</th>
                                            <th className="px-6 py-4 border-b border-gray-800 text-center">Active Flows</th>
                                            <th className="px-6 py-4 border-b border-gray-800 text-right">Details</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-[#262626]">
                                          {[...filteredNodes].sort((a, b) => (a.displayId || 0) - (b.displayId || 0)).map((node) => {
                                            const nodeLegs: { direction: 'In' | 'Out', partnerId: string, link: SCLink, isForward: boolean }[] = [];
                                            links.forEach(l => {
                                              if (l.sourceId === node.id) {
                                                nodeLegs.push({ direction: 'Out', partnerId: l.targetId, link: l, isForward: true });
                                                if (l.type === 'RoundTrip') nodeLegs.push({ direction: 'In', partnerId: l.targetId, link: l, isForward: false });
                                              } else if (l.targetId === node.id) {
                                                nodeLegs.push({ direction: 'In', partnerId: l.sourceId, link: l, isForward: true });
                                                if (l.type === 'RoundTrip') nodeLegs.push({ direction: 'Out', partnerId: l.sourceId, link: l, isForward: false });
                                              }
                                            });
                                            const isExpanded = expandedNetworkNodes.includes(node.id);

                                            return (
                                              <React.Fragment key={node.id}>
                                                <tr className="hover:bg-white/5 transition-colors border-b border-gray-800/50 group">
                                                  <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                      <div className="p-1.5 rounded bg-gray-700/30 text-gray-300">{getNodeIcon(node.type)}</div>
                                                      <span className="font-bold text-gray-200">#{node.displayId} {node.name}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4 text-xs text-gray-400">{node.type}</td>
                                                  <td className="px-6 py-4 text-center">
                                                    <span className="bg-cyan-950/20 px-3 py-1 rounded-full border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase">
                                                      {nodeLegs.length} Legs
                                                    </span>
                                                  </td>
                                                  <td className="px-6 py-4 text-right">
                                                    <button 
                                                      onClick={() => toggleNetworkNodeExpansion(node.id)}
                                                      className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                                    >
                                                      {isExpanded ? <Minimize2 size={16}/> : <Plus size={16}/>}
                                                    </button>
                                                  </td>
                                                </tr>
                                                {isExpanded && (
                                                  <tr className="bg-[#151515]">
                                                    <td colSpan={4} className="p-6">
                                                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                        <h5 className="text-[10px] text-gray-500 font-black uppercase mb-3 flex items-center gap-2"><Shuffle size={14}/> Logistics Flow Analysis for {node.name}</h5>
                                                        {nodeLegs.length > 0 ? (
                                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {nodeLegs.map((leg, lIdx) => {
                                                              const partner = nodes.find(n => n.id === leg.partnerId);
                                                              const l = leg.link;
                                                              const isFwd = leg.isForward;
                                                              const mode = isFwd 
                                                                ? (l.transportType === 'Ground' ? l.groundType : (l.transportType === 'Custom' ? (l.customTransportType || 'Custom') : l.transportType))
                                                                : (l.transportTypeReverse === 'Ground' ? l.groundTypeReverse : (l.transportTypeReverse === 'Custom' ? (l.customTransportTypeReverse || 'Custom') : l.transportTypeReverse));
                                                              const spend = isFwd 
                                                                ? (l.transportPrice || 0) * (l.tripCount || 1)
                                                                : (l.transportPriceReverse || 0) * (l.tripCountReverse || 1);
                                                              const volume = isFwd ? (l.volume || 0) : (l.volumeReverse || 0);

                                                              return (
                                                                <div key={lIdx} className="bg-[#262626] border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-4">
                                                                  <div className="flex items-center gap-3">
                                                                    <div className={`p-1.5 rounded-lg border shrink-0 ${leg.direction === 'Out' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' : 'bg-purple-900/20 border-purple-500/30 text-purple-400'}`}>
                                                                      {leg.direction === 'Out' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                                                                    </div>
                                                                    <div>
                                                                      <div className="text-[9px] font-black uppercase text-gray-500">{leg.direction === 'Out' ? 'Outbound' : 'Inbound'}</div>
                                                                      <div className="text-gray-200 font-bold text-xs">#{partner?.displayId} {partner?.name}</div>
                                                                    </div>
                                                                  </div>
                                                                  <div className="text-right">
                                                                    <div className="text-[10px] text-cyan-400 font-black">{currency}{spend.toLocaleString()}</div>
                                                                    <div className="text-[9px] text-gray-500 uppercase">{volume.toLocaleString()} units</div>
                                                                  </div>
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        ) : (
                                                          <div className="text-xs text-gray-600 italic">No connected flow paths.</div>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                 </div>
                               )}
                           </div>
                       ) : (
                         <div className="flex flex-col animate-in fade-in duration-300">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 border-b border-gray-800 pb-4 gap-4">
                             <div className="flex flex-col">
                               <h2 className="text-gray-200 font-medium text-lg">Network Totals Summary</h2>
                               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Aggregated performance across all assets</p>
                             </div>
                             <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="bg-[#2a2a2a] p-1 rounded-xl border border-gray-700 flex flex-1 sm:flex-none">
                                  <button onClick={() => setSummaryViewMode('grid')} className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${summaryViewMode === 'grid' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                                    <LayoutGrid size={14} /> <span>Grid</span>
                                  </button>
                                  <button onClick={() => setSummaryViewMode('table')} className={`p-2 rounded-lg transition-all flex flex-1 sm:flex-none items-center justify-center gap-2 text-[11px] font-bold ${summaryViewMode === 'table' ? 'bg-gray-600 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}>
                                    <Table2 size={14} /> <span>Sheet</span>
                                  </button>
                                </div>
                             </div>
                           </div>

                           <div ref={summaryRef} className="flex-1 min-h-0">
                             {summaryViewMode === 'grid' ? (
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-1 pb-4">
                                 {summaryStats.map(stat => (
                                   <div key={stat.id} className="bg-[#2a2a2a] border border-gray-700/50 rounded-2xl p-5 flex flex-col justify-between group hover:border-cyan-500/30 transition-all shadow-md min-h-[160px]">
                                      <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                          <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.category}</h3>
                                            <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
                                          </div>
                                        </div>
                                        <div className="py-2">
                                          <div className="text-3xl font-black text-gray-100 tracking-tighter break-words leading-tight">
                                            {currency}{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </div>
                                        </div>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
                                  <div className="overflow-x-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[500px]">
                                      <thead className="bg-[#2a2a2a] text-[10px] text-gray-500 uppercase font-black tracking-widest sticky top-0 z-10">
                                        <tr>
                                          <th className="px-6 py-4 border-b border-gray-800">Category</th>
                                          <th className="px-6 py-4 border-b border-gray-800">Metric Description</th>
                                          <th className="px-6 py-4 border-b border-gray-800 text-right">Aggregated Network Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-[#262626]">
                                        {summaryStats.map(stat => (
                                          <tr key={stat.id} className="hover:bg-white/5 transition-colors border-b border-gray-800/50 group">
                                            <td className="px-6 py-4">
                                              <span className="font-bold text-gray-200">{stat.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-400">{stat.label}</td>
                                            <td className="px-6 py-4 text-right">
                                              <span className="text-lg font-black tracking-tighter text-cyan-400">
                                                {currency}{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                               </div>
                             )}
                           </div>
                         </div>
                       )}
                   </div>
              </div>
          </div>
      )}
    </>
  );
};

export default SupplyChainModeling;
