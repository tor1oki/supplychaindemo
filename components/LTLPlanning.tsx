
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LTLItem, VehicleDimensions, LTLPlacement, UnitSystem, CurrencySymbol } from '../types';
import { Truck, Plus, Trash2, Scale, Ruler, AlertTriangle, CheckCircle2, Settings2, Pencil, X, Save, BoxSelect, RotateCcw, RotateCw, Maximize2, Minimize2, MonitorX, Download, Info, MousePointer2, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface LTLPlanningProps {
  items: LTLItem[];
  onItemsUpdate: (items: LTLItem[]) => void;
  placements: LTLPlacement[];
  onPlacementsUpdate: (placements: LTLPlacement[]) => void;
  vehicle: VehicleDimensions;
  onVehicleUpdate: (vehicle: VehicleDimensions) => void;
  unitSystem: UnitSystem;
  currency: CurrencySymbol;
}

interface PlacedItemRenderData {
  id: string; 
  x: number; 
  y: number; 
  width: number;
  length: number;
  item: LTLItem;
  color: string;
  rotated: boolean;
  stackIds: number[]; 
  coveringIds: number[]; 
  isTopmost: boolean; 
  overlapType: 'none' | 'perfect' | 'messy';
}

const VEHICLE_PRESETS: VehicleDimensions[] = [
  { name: "53' Dry Van", lengthInches: 636, widthInches: 102, heightInches: 110, maxWeightLbs: 45000 },
  { name: "53' Reef", lengthInches: 636, widthInches: 102, heightInches: 105, maxWeightLbs: 44000 },
  { name: "53' Flatbed", lengthInches: 636, widthInches: 102, heightInches: 102, maxWeightLbs: 48000 },
  { name: "53' Step Deck", lengthInches: 636, widthInches: 102, heightInches: 120, maxWeightLbs: 46000 },
  { name: "48' Flatbed", lengthInches: 576, widthInches: 102, heightInches: 102, maxWeightLbs: 48000 },
  { name: "26' Box Truck", lengthInches: 312, widthInches: 96, heightInches: 96, maxWeightLbs: 10000 },
  { name: "Sprinter Van", lengthInches: 170, widthInches: 70, heightInches: 75, maxWeightLbs: 3500 },
  { name: "40' Container", lengthInches: 474, widthInches: 92, heightInches: 94, maxWeightLbs: 59000 },
  { name: "20' Container", lengthInches: 232, widthInches: 92, heightInches: 94, maxWeightLbs: 48000 },
  { name: "Custom", lengthInches: 0, widthInches: 0, heightInches: 0, maxWeightLbs: 0 },
];

const COLORS = [
  '#22d3ee', 
  '#c084fc', 
  '#f472b6', 
  '#fbbf24', 
  '#a3e635', 
  '#60a5fa', 
  '#f87171', 
  '#34d399', 
];

const SNAP_THRESHOLD = 5; 

const checkIntersection = (r1: {x:number, y:number, w:number, l:number}, r2: {x:number, y:number, w:number, l:number}) => {
  return (
      r1.y < r2.y + r2.l &&
      r1.y + r1.l > r2.y &&
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x
  );
};

const LTLPlanning: React.FC<LTLPlanningProps> = ({ items, onItemsUpdate, placements, onPlacementsUpdate, vehicle, onVehicleUpdate, unitSystem, currency }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mapUnit, setMapUnit] = useState<'in' | 'ft'>('ft');
  
  const svgRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [pan, setPan] = useState({ x: -4, y: -4 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [newItem, setNewItem] = useState({
    description: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    quantity: '1',
    stackable: false
  });

  const [calculationResult, setCalculationResult] = useState({
    linearFeetUsed: 0,
    linearFeetPercent: 0,
    totalWeight: 0,
    totalDimWeight: 0,
    weightPercent: 0,
    cubicFeetUsed: 0,
    fitStatus: 'Fits',
    warnings: [] as string[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked;
    
    setNewItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const labels = unitSystem === 'US' ? {
    len: 'L (in)',
    wid: 'W (in)',
    hei: 'H (in)',
    wgt: 'Weight (lbs)',
    dim: 'Dim (in)',
    vol: 'ft³',
    linear: 'Linear Space (ft)',
    shortLinear: 'ft',
    shortWgt: 'lbs'
  } : {
    len: 'L (cm)',
    wid: 'W (cm)',
    hei: 'H (cm)',
    wgt: 'Weight (kg)',
    dim: 'Dim (cm)',
    vol: 'm³',
    linear: 'Linear Space (m)',
    shortLinear: 'm',
    shortWgt: 'kg'
  };

  const handleExportPDF = async () => {
    if (!mapRef.current) return;
    setIsExporting(true);

    try {
        const canvas = await html2canvas(mapRef.current, {
            backgroundColor: '#151515',
            scale: 2
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.setFontSize(16);
        pdf.text("LTL Load Plan Manifest", 10, 10);
        
        pdf.setFontSize(10);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 10, 16);
        pdf.text(`Vehicle: ${vehicle.name}`, 10, 21);
        pdf.text(`Total Weight: ${calculationResult.totalWeight.toLocaleString()} / ${vehicle.maxWeightLbs.toLocaleString()} ${labels.shortWgt}`, 80, 21);
        pdf.text(`Linear Space: ${calculationResult.linearFeetUsed} ${labels.shortLinear}`, 10, 26);
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfImgWidth = pageWidth - 20;
        const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

        let finalWidth = pdfImgWidth;
        let finalHeight = pdfImgHeight;
        
        if (finalHeight > 100) {
            finalHeight = 100;
            finalWidth = (imgProps.width * finalHeight) / imgProps.height;
        }

        pdf.addImage(imgData, 'PNG', 10, 35, finalWidth, finalHeight);
        let yPos = 35 + finalHeight + 10;
        pdf.setFontSize(12);
        pdf.text("Load Manifest", 10, yPos);
        yPos += 5;
        pdf.setFontSize(8);
        pdf.setFillColor(200, 200, 200);
        pdf.rect(10, yPos, pageWidth - 20, 6, 'F');
        pdf.text("Item", 12, yPos + 4);
        pdf.text(`Dimensions (LxWxH) ${labels.shortLinear}`, 80, yPos + 4);
        pdf.text("Qty", 130, yPos + 4);
        pdf.text(`Weight (${labels.shortWgt})`, 150, yPos + 4);
        pdf.text("Stackable", 180, yPos + 4);
        yPos += 8;

        items.forEach(item => {
             if (yPos > pageHeight - 10) {
                pdf.addPage();
                yPos = 10;
            }
            pdf.text(item.description, 12, yPos);
            pdf.text(`${item.length} x ${item.width} x ${item.height} ${labels.shortLinear === 'ft' ? 'in' : 'cm'}`, 80, yPos);
            pdf.text(item.quantity.toString(), 130, yPos);
            pdf.text(`${item.weight * item.quantity} ${labels.shortWgt}`, 150, yPos);
            pdf.text(item.stackable ? 'Yes' : 'No', 180, yPos);
            pdf.setDrawColor(200, 200, 200);
            pdf.line(10, yPos + 2, pageWidth - 10, yPos + 2);
            yPos += 6;
        });

        pdf.save('ltl_load_plan.pdf');
    } catch(err) {
        console.error(err);
    } finally {
        setIsExporting(false);
    }
  };

  const handleAddOrUpdate = () => {
    if (!newItem.length || !newItem.width || !newItem.height) return;

    if (editingId) {
      const updatedItems = items.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            description: newItem.description || `Item ${items.indexOf(item) + 1}`,
            length: parseFloat(newItem.length),
            width: parseFloat(newItem.width),
            height: parseFloat(newItem.height),
            weight: parseFloat(newItem.weight) || 0,
            quantity: parseInt(newItem.quantity) || 1,
            stackable: newItem.stackable
          };
        }
        return item;
      });
      onItemsUpdate(updatedItems);
      setEditingId(null);
    } else {
      const item: LTLItem = {
        id: Date.now().toString(),
        description: newItem.description || `Item ${items.length + 1}`,
        length: parseFloat(newItem.length),
        width: parseFloat(newItem.width),
        height: parseFloat(newItem.height),
        weight: parseFloat(newItem.weight) || 0,
        quantity: parseInt(newItem.quantity) || 1,
        stackable: newItem.stackable
      };
      onItemsUpdate([...items, item]);
    }

    setNewItem({
      description: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      quantity: '1',
      stackable: false
    });
  };

  const startEditing = (item: LTLItem) => {
    setEditingId(item.id);
    setNewItem({
      description: item.description,
      length: item.length.toString(),
      width: item.width.toString(),
      height: item.height.toString(),
      weight: item.weight.toString(),
      quantity: item.quantity.toString(),
      stackable: item.stackable
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewItem({
      description: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      quantity: '1',
      stackable: false
    });
  };

  const removeItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onItemsUpdate(items.filter(i => i.id !== id));
    onPlacementsUpdate(placements.filter(p => p.itemId !== id));
    if (editingId === id) cancelEditing();
  };

  const handleVehiclePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = VEHICLE_PRESETS.find(v => v.name === e.target.value);
    if (selected) {
      if (selected.name === 'Custom') {
        onVehicleUpdate({ ...vehicle, name: 'Custom' });
      } else {
        onVehicleUpdate(selected);
      }
    }
  };

  const handleVehicleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    onVehicleUpdate({ ...vehicle, name: 'Custom', [name]: numValue });
  };

  useEffect(() => {
    let totalWeight = 0;
    let totalDimWeight = 0;
    let totalCubicInches = 0;
    let maxItemHeight = 0;
    let warnings: string[] = [];

    const expandedItems: {l: number, w: number, h: number}[] = [];

    items.forEach((item) => {
      const w = item.weight * item.quantity;
      totalWeight += w;
      const cubic = (item.length * item.width * item.height) * item.quantity;
      totalCubicInches += cubic;
      totalDimWeight += cubic / 139;

      if (item.height > maxItemHeight) maxItemHeight = item.height;
      if (item.height > vehicle.heightInches) {
        if (!warnings.includes('Height Exceeded')) warnings.push(`Item height (${item.height}") exceeds vehicle height (${vehicle.heightInches}")`);
      }
      if (item.width > vehicle.widthInches) {
         if (!warnings.includes('Width Exceeded')) warnings.push(`Item width (${item.width}") exceeds vehicle width (${vehicle.widthInches}")`);
      }

      for(let i=0; i<item.quantity; i++) expandedItems.push({ l: item.length, w: item.width, h: item.height });
    });

    expandedItems.sort((a, b) => b.l - a.l);
    let currentLinearInches = 0; 
    let currentRowLength = 0;
    let currentRowWidthUsed = 0; 
    
    expandedItems.forEach((ex) => {
      if (currentRowWidthUsed + ex.w <= vehicle.widthInches) {
        currentRowWidthUsed += ex.w;
        if (ex.l > currentRowLength) currentRowLength = ex.l;
      } else {
        currentLinearInches += currentRowLength;
        currentRowLength = ex.l;
        currentRowWidthUsed = ex.w;
      }
    });
    currentLinearInches += currentRowLength;

    const linearFeet = currentLinearInches / 12;
    const vehicleLinearFeet = vehicle.lengthInches / 12;
    
    let status = 'Fits';
    if (linearFeet > vehicleLinearFeet) status = 'No Fit (Length)';
    if (totalWeight > vehicle.maxWeightLbs) status = 'Overweight';
    if (warnings.length > 0) status = 'Dimension Alert';

    setCalculationResult({
      linearFeetUsed: parseFloat(linearFeet.toFixed(1)),
      linearFeetPercent: vehicleLinearFeet > 0 ? Math.min((linearFeet / vehicleLinearFeet) * 100, 100) : 0,
      totalWeight: totalWeight,
      totalDimWeight: Math.round(totalDimWeight),
      weightPercent: vehicle.maxWeightLbs > 0 ? Math.min((totalWeight / vehicle.maxWeightLbs) * 100, 100) : 0,
      cubicFeetUsed: parseFloat((totalCubicInches / 1728).toFixed(1)),
      fitStatus: status,
      warnings
    });
  }, [items, vehicle]);

  const placedItemsRender: PlacedItemRenderData[] = (placements.map((p, pIdx): PlacedItemRenderData | null => {
    const item = items.find(i => i.id === p.itemId);
    if (!item) return null;
    
    const isRotated = p.rotated || false;
    const w = isRotated ? item.length : item.width;
    const l = isRotated ? item.width : item.length;

    let overlapType: 'none' | 'perfect' | 'messy' = 'none';
    const stackIds: number[] = [];
    const coveringIds: number[] = [];
    const myRect = { x: p.x, y: p.y, w, l };

    const intersections: number[] = []; 

    placements.forEach((o, oIdx) => {
      const oItem = items.find(i => i.id === o.itemId);
      if (!oItem) return;
      const oRotated = o.rotated || false;
      const oW = oRotated ? oItem.length : oItem.width;
      const oL = oRotated ? oItem.width : oItem.length;
      const oRect = { x: o.x, y: o.y, w: oW, l: oL };

      const intersects = checkIntersection(myRect, oRect);
      if (intersects) {
        intersections.push(oIdx);
        const isPerfect = Math.abs(p.x - o.x) < 0.1 && Math.abs(p.y - o.y) < 0.1 && Math.abs(w - oW) < 0.1 && Math.abs(l - oL) < 0.1;
        
        if (o.id !== p.id) {
          if (isPerfect) overlapType = (overlapType === 'messy' ? 'messy' : 'perfect');
          else overlapType = 'messy';
          
          if (pIdx > oIdx) {
            coveringIds.push(items.indexOf(oItem) + 1);
          }
        }
        if (isPerfect) stackIds.push(items.indexOf(oItem) + 1);
      }
    });

    stackIds.sort((a,b) => a - b);
    coveringIds.sort((a,b) => a - b);

    const isTopmost = pIdx === Math.max(...intersections);

    return {
      id: p.id,
      x: p.x, 
      y: p.y, 
      width: w,
      length: l,
      item: item,
      color: COLORS[items.indexOf(item) % COLORS.length],
      rotated: isRotated,
      stackIds,
      coveringIds,
      isTopmost,
      overlapType
    };
  }).filter((i): i is PlacedItemRenderData => i !== null));


  const handleAddPlacement = (item: LTLItem) => {
    let bestX = 0; let bestY = 0;
    const effectiveW = item.width; const effectiveL = item.length;
    
    const existingRects = placements.map(p => {
        const existingItem = items.find(i => i.id === p.itemId);
        if(!existingItem) return null;
        const pRotated = p.rotated || false;
        return { x: p.x, y: p.y, w: pRotated ? existingItem.length : existingItem.width, l: pRotated ? existingItem.width : existingItem.length };
    }).filter((r): r is {x:number,y:number,w:number,l:number} => r !== null);

    let candidates: {x: number, y: number}[] = [{x: 0, y: 0}];
    existingRects.forEach(r => { candidates.push({ x: r.x + r.w, y: r.y }); candidates.push({ x: 0, y: r.y + r.l }); candidates.push({ x: r.x, y: r.y + r.l }); });

    candidates = candidates.filter(c => c.x + effectiveW <= vehicle.widthInches && c.y + effectiveL <= vehicle.lengthInches);
    candidates.sort((a, b) => (Math.abs(a.y - b.y) > 0.1) ? a.y - b.y : a.x - b.x);

    for (const c of candidates) {
        const candidateRect = { x: c.x, y: c.y, w: effectiveW, l: effectiveL };
        if (!existingRects.some(r => checkIntersection(candidateRect, r))) {
            bestX = c.x; bestY = c.y; break;
        }
    }
    onPlacementsUpdate([...placements, { id: `${item.id}_${Date.now()}`, itemId: item.id, x: bestX, y: bestY, rotated: false }]);
  };

  const handleRotatePlacement = (e: React.MouseEvent | null, placementId: string) => {
    e?.stopPropagation(); e?.preventDefault();
    
    // ATOMIC UPDATE: Merge rotation logic and reordering into one state change
    // This prevents the 'bringToFront' call from overwriting rotation with stale data
    const others = placements.filter(p => p.id !== placementId);
    const target = placements.find(p => p.id === placementId);
    
    if (target) {
        const item = items.find(i => i.id === target.itemId);
        if (item) {
            const newRotated = !target.rotated;
            
            // Swap width and length dimensions
            const newW = newRotated ? item.length : item.width;
            const newL = newRotated ? item.width : item.length;

            let newX = target.x;
            let newY = target.y;
            
            // Boundary adjustment to keep pallet within truck bounds after swap
            if (newX + newW > vehicle.widthInches) newX = Math.max(0, vehicle.widthInches - newW);
            if (newY + newL > vehicle.lengthInches) newY = Math.max(0, vehicle.lengthInches - newL);
            
            const updated = { ...target, rotated: newRotated, x: newX, y: newY };
            onPlacementsUpdate([...others, updated]);
            setSelectedPlacementId(placementId);
        }
    }
  };

  const handleRemovePlacement = (placementId: string) => {
    onPlacementsUpdate(placements.filter(p => p.id !== placementId));
    if (selectedPlacementId === placementId) setSelectedPlacementId(null);
  };
  
  const resetLayout = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onPlacementsUpdate([]); setSelectedPlacementId(null);
  };

  const resetMapTransform = (e?: React.MouseEvent) => {
    e?.stopPropagation(); setPan({ x: -4, y: -4 }); setZoom(1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!showMap) return;
    const delta = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    setZoom(prev => Math.max(0.2, Math.min(5, prev * delta)));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    setSelectedPlacementId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, placementId: string, xPos: number, yPos: number) => {
    e.stopPropagation(); e.preventDefault();
    
    // Atomic reorder on drag start
    const others = placements.filter(p => p.id !== placementId);
    const target = placements.find(p => p.id === placementId);
    if (target) {
        onPlacementsUpdate([...others, target]);
    }
    
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    setDraggingId(placementId);
    // xPos is width axis (SVG Y), yPos is length axis (SVG X)
    setDragOffset({ x: svgP.x - yPos, y: svgP.y - xPos });
  };

  const handleMouseDownMap = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId && svgRef.current) {
      e.preventDefault();
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      onPlacementsUpdate(placements.map(p => {
        if (p.id === draggingId) {
          const item = items.find(i => i.id === p.itemId);
          if (!item) return p;
          const isRotated = p.rotated || false;
          const currentW = isRotated ? item.length : item.width;
          const currentL = isRotated ? item.width : item.length;

          // Mapping: SVG X -> Y (Length), SVG Y -> X (Width)
          let nX = svgP.y - dragOffset.y;
          let nY = svgP.x - dragOffset.x;

          const snapX: number[] = [0, vehicle.widthInches - currentW];
          const snapY: number[] = [0, vehicle.lengthInches - currentL];
          placements.forEach(o => {
            if (o.id === draggingId) return;
            const oI = items.find(i => i.id === o.itemId); if (!oI) return;
            const oW = (o.rotated ? oI.length : oI.width);
            const oL = (o.rotated ? oI.width : oI.length);
            snapX.push(o.x, o.x + oW, o.x - currentW, o.x + oW - currentW);
            snapY.push(o.y, o.y + oL, o.y - currentL, o.y + oL - currentL);
          });

          for (const sx of snapX) if (Math.abs(nX - sx) < SNAP_THRESHOLD) { nX = sx; break; }
          for (const sy of snapY) if (Math.abs(nY - sy) < SNAP_THRESHOLD) { nY = sy; break; }

          nX = Math.max(0, Math.min(nX, vehicle.widthInches - currentW));
          nY = Math.max(0, Math.min(nY, vehicle.lengthInches - currentL));
          return { ...p, x: nX, y: nY };
        }
        return p;
      }));
    } else if (isPanning) {
      const dx = (e.clientX - panStart.x) * zoom;
      const dy = (e.clientY - panStart.y) * zoom;
      setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => { setDraggingId(null); setIsPanning(false); };

  const selectedPlacement = placedItemsRender.find(p => p.id === selectedPlacementId);
  const selectedIntersections = selectedPlacement 
    ? placedItemsRender.filter(p => p.id !== selectedPlacement.id && checkIntersection(
        {x: selectedPlacement.x, y: selectedPlacement.y, w: selectedPlacement.width, l: selectedPlacement.length},
        {x: p.x, y: p.y, w: p.width, l: p.length}
    ))
    : [];

  const viewBox = useMemo(() => {
    const baseW = vehicle.lengthInches + 80;
    const baseH = vehicle.widthInches + 80;
    return `${pan.x} ${pan.y} ${baseW * zoom} ${baseH * zoom}`;
  }, [pan, zoom, vehicle]);

  const lengthMarkers = useMemo(() => {
    const isUS = unitSystem === 'US'; const isL = mapUnit === 'ft';
    const step = isL ? (isUS ? 12 : 100) : (isUS ? 5 : 10);
    const total = Math.ceil(vehicle.lengthInches / step);
    return Array.from({ length: total + 1 }).map((_, i) => ({ pos: i * step, label: isL ? i : i * step, showLabel: i % 5 === 0 }));
  }, [vehicle.lengthInches, mapUnit, unitSystem]);

  const widthMarkers = useMemo(() => {
    const isUS = unitSystem === 'US'; const isL = mapUnit === 'ft';
    const step = isL ? (isUS ? 12 : 100) : (isUS ? 5 : 10);
    const total = Math.ceil(vehicle.widthInches / step);
    return Array.from({ length: total + 1 }).map((_, i) => ({ pos: i * step, label: i * step, showLabel: i % 5 === 0 }));
  }, [vehicle.widthInches, mapUnit, unitSystem]);

  return (
    <>
      <div className="md:hidden h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-[#262626] border border-gray-800 rounded-3xl">
        <MonitorX size={48} className="mb-4 text-red-400"/>
        <h2 className="text-xl font-bold text-gray-200 mb-2">Device Not Supported</h2>
        <p>This page isn't supported with mobile phones. Please use a PC or tablet.</p>
      </div>

      <div className="hidden md:flex bg-[#404040] rounded-3xl p-4 md:p-6 shadow-lg h-full flex-col overflow-hidden relative">
        <div className="flex justify-between items-center mb-4 shrink-0 px-1"><h2 className="text-gray-200 font-medium">LTL / Partial Planner</h2></div>
        <div className="flex flex-col lg:flex-row gap-6 h-full min-0 overflow-y-auto lg:overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-y-auto custom-scrollbar pr-2">
            <div className="bg-[#2a2a2a] p-4 rounded-2xl border border-gray-700 shrink-0 shadow-lg">
              <div className="flex items-center gap-2 mb-3 text-cyan-400"><Settings2 size={16} /><span className="text-xs font-bold uppercase tracking-wider">Vehicle Setup</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col"><label className="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1">Preset</label><div className="relative"><Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/><select value={VEHICLE_PRESETS.some(v => v.name === vehicle.name) ? vehicle.name : 'Custom'} onChange={handleVehiclePresetChange} className="w-full bg-[#333] text-gray-200 text-xs rounded-lg py-2.5 pl-9 pr-3 border border-transparent focus:border-cyan-400 outline-none appearance-none">{VEHICLE_PRESETS.map(v => (<option key={v.name} value={v.name}>{v.name}</option>))}</select></div></div>
                <div className="flex flex-col"><label className="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1">Max Wgt ({labels.shortWgt})</label><input type="number" name="maxWeightLbs" value={vehicle.maxWeightLbs} onChange={handleVehicleDimensionChange} className="w-full bg-[#333] text-gray-200 text-xs rounded-lg px-3 py-2.5 border border-transparent focus:border-cyan-400 outline-none"/></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['lengthInches', 'widthInches', 'heightInches'].map((dim, idx) => (
                  <div key={dim}><label className="text-[10px] text-gray-500 uppercase font-bold ml-1">{[labels.len, labels.wid, labels.hei][idx]}</label><input type="number" name={dim} value={(vehicle as any)[dim]} onChange={handleVehicleDimensionChange} className="w-full bg-[#333] text-gray-200 text-xs rounded-lg px-3 py-2 border border-transparent focus:border-cyan-400 outline-none"/></div>
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shrink-0 transition-colors ${editingId ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-[#2a2a2a]/50 border-gray-700/50'}`}>
              <div className="flex items-center justify-between mb-3"><div className={`flex items-center gap-2 ${editingId ? 'text-cyan-400' : 'text-gray-400'}`}>{editingId ? <Pencil size={16} /> : <Plus size={16} />}<span className="text-xs font-bold uppercase tracking-wider">{editingId ? 'Edit Freight' : 'Add Freight'}</span></div>{editingId && (<button onClick={cancelEditing} className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 bg-[#333] px-2 py-1 rounded-md transition-colors"><X size={12} /> Cancel</button>)}</div>
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="col-span-2"><label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Type/Desc</label><input type="text" name="description" value={newItem.description} onChange={handleInputChange} placeholder="e.g. Pallet" className="w-full bg-[#333] text-gray-200 text-xs rounded-lg px-3 py-2 border border-transparent focus:border-cyan-400 outline-none"/></div>
                {['length', 'width', 'height', 'quantity'].map((field, idx) => (
                  <div key={field}><label className="text-[10px] text-gray-500 uppercase font-bold ml-1">{(field === 'quantity' ? 'Qty' : [labels.len, labels.wid, labels.hei][idx]).split(' ')[0]}</label><input type="number" name={field} value={(newItem as any)[field]} onChange={handleInputChange} className="w-full bg-[#333] text-gray-200 text-xs rounded-lg px-2 py-2 border border-transparent focus:border-cyan-400 outline-none"/></div>
                ))}
              </div>
              <div className="flex flex-col md:flex-row gap-2 items-center">
                <div className="flex-1 w-full"><input type="number" name="weight" value={newItem.weight} onChange={handleInputChange} placeholder={`${labels.wgt} per item`} className="w-full bg-[#333] text-gray-200 text-xs rounded-lg px-3 py-2 border border-transparent focus:border-cyan-400 outline-none"/></div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start"><label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" name="stackable" checked={newItem.stackable} onChange={handleInputChange} className="w-4 h-4 rounded bg-[#333] border-gray-600 text-cyan-400 focus:ring-cyan-400"/><span className="text-[10px] text-gray-400 uppercase font-bold">Stackable</span></label><button onClick={handleAddOrUpdate} className={`text-black font-bold py-2 px-6 rounded-lg text-xs flex items-center gap-1 transition-colors ${editingId ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-cyan-400 hover:bg-cyan-300'}`}>{editingId ? <Save size={14} /> : <Plus size={14} />} {editingId ? 'Update' : 'Add'}</button></div>
              </div>
            </div>

            <div className="bg-[#2a2a2a]/30 border border-gray-700/30 rounded-2xl flex-1 overflow-y-auto custom-scrollbar p-1 min-h-[150px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#333] sticky top-0 z-10"><tr><th className="py-2 px-3 text-[10px] text-gray-400 uppercase font-bold rounded-tl-lg">Item</th><th className="py-2 px-2 text-[10px] text-gray-400 uppercase font-bold">{labels.dim}</th><th className="py-2 px-2 text-[10px] text-gray-400 uppercase font-bold">Qty</th><th className="py-2 px-2 text-[10px] text-gray-400 uppercase font-bold">Total {labels.shortWgt}</th><th className="py-2 px-2 text-[10px] text-gray-400 uppercase font-bold rounded-tr-lg"></th></tr></thead>
                <tbody className="text-sm">
                  {items.length === 0 && (<tr><td colSpan={5} className="py-8 text-center text-gray-600 text-xs">Add freight items to calculate space</td></tr>)}
                  {items.map(item => (
                    <tr key={item.id} onClick={() => startEditing(item)} onMouseEnter={() => setHoveredItemId(item.id)} onMouseLeave={() => setHoveredItemId(null)} className={`border-b border-gray-700/50 cursor-pointer transition-colors ${editingId === item.id ? 'bg-cyan-900/20 border-cyan-500/20' : hoveredItemId === item.id ? 'bg-[#333]' : 'hover:bg-[#333]/50'}`}>
                      <td className="py-3 px-3 text-gray-300 font-medium"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[items.indexOf(item) % COLORS.length] }}></div><div className="flex items-center gap-1">{item.description}{item.stackable && <span className="text-[9px] bg-green-900/30 text-green-400 border border-green-400/30 px-1 rounded">STACK</span>}</div></div></td><td className="py-3 px-2 text-gray-400 text-xs">{item.length}x{item.width}x{item.height}</td><td className="py-3 px-2 text-gray-300">{item.quantity}</td><td className="py-3 px-2 text-gray-400 text-xs">{item.weight * item.quantity} {labels.shortWgt}</td><td className="py-3 px-2 text-right"><button onClick={(e) => removeItem(e, item.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-full lg:w-[320px] bg-[#1e1e1e] rounded-3xl p-6 border border-gray-800 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar h-[500px] lg:h-auto">
            <div className="text-center"><div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Status</div><div className={`text-3xl font-light tracking-tight flex items-center justify-center gap-2 ${calculationResult.fitStatus === 'Fits' ? 'text-green-400' : calculationResult.fitStatus === 'Dimension Alert' ? 'text-yellow-400' : 'text-red-400'}`}>{calculationResult.fitStatus === 'Fits' && <CheckCircle2 size={24} />}{calculationResult.fitStatus !== 'Fits' && <AlertTriangle size={24} />}{calculationResult.fitStatus}</div>{calculationResult.warnings.map((w, i) => (<div key={i} className="text-xs text-red-400 mt-1 bg-red-900/20 py-1 px-2 rounded">{w}</div>))}</div>
            <div className="w-full hidden md:block"><button onClick={() => setShowMap(true)} className="w-full bg-[#2a2a2a] hover:bg-[#333] text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 rounded-xl py-3 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group"><BoxSelect size={18} className="group-hover:scale-110 transition-transform"/><span className="font-bold text-sm">Open Visual Load Map</span></button></div>
            <div className="w-full h-px bg-gray-800"></div>
            <div><div className="flex justify-between items-end mb-2"><div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase"><Ruler size={14} className="text-cyan-400"/> {labels.linear}</div><div className="text-right"><span className="text-xl font-medium text-gray-200">{calculationResult.linearFeetUsed}</span><span className="text-gray-500 text-xs ml-1">/ {(vehicle.lengthInches / 12).toFixed(1)} {labels.shortLinear}</span></div></div><div className="h-3 w-full bg-[#333] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${calculationResult.linearFeetPercent > 100 ? 'bg-red-500' : 'bg-cyan-400'}`} style={{ width: `${Math.min(calculationResult.linearFeetPercent, 100)}%` }}></div></div></div>
            <div><div className="flex justify-between items-end mb-2"><div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase"><Scale size={14} className="text-purple-400"/> Payload Weight</div><div className="text-right"><span className="text-xl font-medium text-gray-200">{calculationResult.totalWeight.toLocaleString()}</span><span className="text-gray-500 text-xs ml-1">/ {vehicle.maxWeightLbs.toLocaleString()} {labels.shortWgt}</span></div></div><div className="h-3 w-full bg-[#333] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${calculationResult.weightPercent > 100 ? 'bg-red-500' : 'bg-purple-400'}`} style={{ width: `${Math.min(calculationResult.weightPercent, 100)}%` }}></div></div></div>
            <div className="grid grid-cols-2 gap-3 mt-2"><div className="bg-[#262626] p-3 rounded-2xl border border-gray-800/50 flex flex-col items-center"><div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Volume</div><div className="text-gray-200 font-medium text-lg">{calculationResult.cubicFeetUsed} <span className="text-xs text-gray-500">{labels.vol}</span></div></div><div className="bg-[#262626] p-3 rounded-2xl border border-gray-800/50 flex flex-col items-center"><div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Dim Weight</div><div className="text-gray-200 font-medium text-lg">{calculationResult.totalDimWeight.toLocaleString()} <span className="text-xs text-gray-500">{labels.shortWgt}</span></div></div></div>
            <div className="bg-[#262626]/50 p-3 rounded-xl text-[10px] text-gray-500 leading-relaxed border border-gray-800">Estimates only. Actual costs and load fit may vary. Users are responsible for verifying all details prior to dispatch.</div>
          </div>
        </div>

        {showMap && (
          <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all animate-in fade-in duration-200 ${isFullScreen ? 'p-0' : 'p-8'}`} onClick={() => { setShowMap(false); setSelectedPlacementId(null); }}>
            <div className={`bg-[#1e1e1e] border border-gray-700 flex flex-col shadow-2xl relative transition-all duration-300 ${isFullScreen ? 'w-full h-full rounded-none border-0' : 'rounded-3xl p-6 w-full max-w-5xl h-[90%]'}`} onClick={e => e.stopPropagation()}>
              <div className={`flex justify-between items-center shrink-0 ${isFullScreen ? 'p-6 pb-2' : 'mb-6'}`}>
                  <div className="flex items-center gap-3"><BoxSelect size={24} className="text-cyan-400"/><div className="flex flex-col"><h3 className="text-xl font-medium text-gray-200">Visual Load Map</h3><p className="text-[10px] text-gray-500 uppercase font-bold">Zoom with wheel • Drag space to pan • Drag items to move</p></div></div>
                  <div className="flex gap-2 items-center">
                    <div className="hidden sm:flex items-center gap-3 bg-[#262626] px-4 py-2 rounded-xl border border-gray-700 mr-2 shadow-inner">
                        <div className="flex flex-col border-r border-gray-700 pr-3"><span className="text-[8px] text-gray-500 uppercase font-black leading-none mb-0.5">Length</span><span className="text-[12px] font-black text-cyan-400">{unitSystem === 'US' ? (vehicle.lengthInches / 12).toFixed(1) + ' ft' : (vehicle.lengthInches / 100).toFixed(2) + ' m'}</span></div>
                        <div className="flex flex-col"><span className="text-[8px] text-gray-500 uppercase font-black leading-none mb-0.5">Width</span><span className="text-[12px] font-black text-cyan-400">{unitSystem === 'US' ? (vehicle.widthInches / 12).toFixed(1) + ' ft' : (vehicle.widthInches / 100).toFixed(2) + ' m'}</span></div>
                    </div>
                    <div className="flex bg-[#2a2a2a] rounded-lg border border-gray-700 p-0.5 mr-2"><button onClick={() => setMapUnit('in')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${mapUnit === 'in' ? 'bg-cyan-400 text-black' : 'text-gray-500 hover:text-gray-300'}`}>{unitSystem === 'US' ? 'IN' : 'CM'}</button><button onClick={() => setMapUnit('ft')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${mapUnit === 'ft' ? 'bg-cyan-400 text-black' : 'text-gray-500 hover:text-gray-300'}`}>{unitSystem === 'US' ? 'FT' : 'M'}</button></div>
                    <button onClick={() => resetMapTransform()} className="bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 text-[10px] font-bold uppercase transition-all flex items-center gap-2" title="Reset View"><MousePointer2 size={16}/> Reset</button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="bg-cyan-900/40 hover:bg-cyan-400 hover:text-black text-cyan-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 border border-cyan-500/30" title="Export PDF"><Download size={16}/> {isExporting ? 'Saving...' : 'PDF'}</button>
                    <div className="w-px bg-gray-700 mx-1"></div>
                    <button onClick={resetLayout} disabled={placements.length === 0} className={`text-xs flex items-center gap-1 px-3 py-2 rounded-full border transition-colors ${placements.length === 0 ? 'bg-gray-700/50 text-gray-600 border-gray-700 cursor-not-allowed' : 'bg-red-400/10 text-red-400 border-red-400/30 hover:bg-red-400/20'}`}><Trash2 size={14}/> Clear Load</button>
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="bg-[#333] hover:bg-gray-600 text-gray-300 p-2 rounded-full transition-colors">{isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
                    <button onClick={() => { setShowMap(false); setSelectedPlacementId(null); }} className="bg-[#333] hover:bg-gray-600 text-gray-300 p-2 rounded-full transition-colors"><X size={20} /></button>
                  </div>
              </div>

              <div ref={mapRef} className={`flex-1 bg-[#151515] border border-gray-800 flex justify-center shadow-inner relative ${isFullScreen ? 'mx-6 rounded-2xl overflow-hidden items-center' : 'rounded-2xl overflow-hidden items-start p-8'}`} onClick={() => setSelectedPlacementId(null)}>
                  {vehicle.widthInches > 0 && vehicle.lengthInches > 0 ? (
                    <div className="w-full h-full flex justify-center items-center overflow-hidden">
                      <svg ref={svgRef} viewBox={viewBox} className={`drop-shadow-2xl select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseDown={handleMouseDownMap} onWheel={handleWheel} onClick={handleCanvasClick}>
                        <rect x="0" y="0" width={vehicle.lengthInches} height={vehicle.widthInches} fill="#262626" stroke="#444" strokeWidth="2"/>
                        
                        {lengthMarkers.map((m, i) => (
                            <g key={`l-${i}`}>
                              <line x1={m.pos} y1={-15} x2={m.pos} y2={vehicle.widthInches} stroke={m.showLabel || i === 0 ? "#555" : "#333"} strokeWidth={m.showLabel || i === 0 ? "1" : "0.5"} strokeDasharray={m.showLabel ? "" : "2 2"}/>
                              {m.showLabel && (<text x={m.pos} y={-22} fill={m.label === 0 ? "#888" : "#666"} fontSize="9" textAnchor="middle" fontWeight={m.label === 0 ? "bold" : "normal"}>{m.label}{i === 0 ? (unitSystem === 'US' ? (mapUnit === 'ft' ? '\'' : '"') : (mapUnit === 'ft' ? 'm' : 'cm')) : ''}</text>)}
                            </g>
                        ))}
                        {widthMarkers.map((m, i) => (
                            <g key={`w-${i}`}>
                                <line x1={-15} y1={m.pos} x2={vehicle.lengthInches} y2={m.pos} stroke={m.showLabel || i === 0 ? "#555" : "#333"} strokeWidth={m.showLabel || i === 0 ? "1" : "0.5"} strokeDasharray={m.showLabel ? "" : "2 2"}/>
                                {m.showLabel && (<text x={-22} y={m.pos} dy="3" fill={m.label === 0 ? "#888" : "#666"} fontSize="9" textAnchor="end" fontWeight={m.label === 0 ? "bold" : "normal"}>{m.label}{i === 0 ? (unitSystem === 'US' ? (mapUnit === 'ft' ? '\'' : '"') : (mapUnit === 'ft' ? 'm' : 'cm')) : ''}</text>)}
                            </g>
                        ))}

                        <text x={vehicle.lengthInches / 2} y={vehicle.widthInches + 55} fill="#777" fontSize="14" fontWeight="bold" textAnchor="middle">Length: {unitSystem === 'US' ? (vehicle.lengthInches / 12).toFixed(1) + ' ft' : (vehicle.lengthInches / 100).toFixed(2) + ' m'}</text>
                        <text x={vehicle.lengthInches + 65} y={vehicle.widthInches / 2} fill="#777" fontSize="14" fontWeight="bold" textAnchor="start" transform={`rotate(90, ${vehicle.lengthInches + 65}, ${vehicle.widthInches / 2})`}>Width: {unitSystem === 'US' ? (vehicle.widthInches / 12).toFixed(1) + ' ft' : (vehicle.widthInches / 100).toFixed(2) + ' m'}</text>
                        
                        {placedItemsRender.map((p, idx) => {
                          const isHovered = hoveredItemId === p.item.id;
                          const isSelected = selectedPlacementId === p.id;
                          const isDragging = draggingId === p.id;
                          const isMessy = p.overlapType === 'messy' && p.isTopmost;
                          
                          const strokeColor = isMessy ? '#ef4444' : (isDragging || isHovered || isSelected ? 'white' : '#151515');
                          const fillColor = p.color;

                          return (
                            <g key={p.id} onMouseDown={(e) => handleMouseDown(e, p.id, p.x, p.y)} onClick={(e) => { e.stopPropagation(); setSelectedPlacementId(p.id); }} className="cursor-grab active:cursor-grabbing group">
                              <rect x={p.y} y={p.x} width={p.length} height={p.width} fill={fillColor} fillOpacity={isDragging ? 0.9 : isHovered ? 1 : 0.8} stroke={strokeColor} strokeWidth={isDragging || isSelected || isMessy ? 3 : isHovered ? 2 : 1} className="transition-all duration-200" onMouseEnter={() => setHoveredItemId(p.item.id)} onMouseLeave={() => setHoveredItemId(null)}/>
                              
                              <g onMouseDown={(e) => handleRotatePlacement(e, p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" transform={`translate(${p.y + p.length - 20}, ${p.x + 2})`}>
                                <title>Rotate Item</title>
                                <rect width="18" height="18" rx="4" fill="rgba(0,0,0,0.7)" />
                                <RotateCw x="3" y="3" size={12} className="text-white"/>
                              </g>

                              {p.isTopmost && (
                                <>
                                  {(p.stackIds.length > 1 || p.coveringIds.length > 0) && (
                                    <g transform={`translate(${p.y + p.length - 24}, ${p.x + p.width - 24})`}>
                                      <circle r="10" cx="12" cy="12" fill={isMessy ? "#ef4444" : "#8b5cf6"} />
                                      <text x="12" y="15" textAnchor="middle" fill="white" fontSize="9" fontWeight="black">
                                        x{p.stackIds.length + (isMessy ? p.coveringIds.length : 0)}
                                      </text>
                                      <Layers x="-15" y="0" size={12} className={isMessy ? "text-red-400" : "text-purple-400"} opacity="0.8" />
                                    </g>
                                  )}

                                  <text x={p.y + p.length/2} y={p.x + p.width/2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(8, Math.min(p.width, p.length) / (p.stackIds.length > 2 ? 4 : 3))} fill="white" fontWeight="black" pointerEvents="none" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9)' }}>
                                    {p.stackIds.length > 1 ? p.stackIds.join(', ') : (items.indexOf(p.item) + 1)}
                                  </text>
                                  
                                  {p.coveringIds.length > 0 && isMessy && (
                                    <text x={p.y + p.length/2} y={p.x + p.width - 6} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" pointerEvents="none" style={{ textShadow: '0px 1px 2px rgba(0,0,0,1)' }}>
                                       COVERING: {p.coveringIds.join(', ')}
                                    </text>
                                  )}
                                </>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  ) : (<div className="flex flex-col items-center justify-center text-gray-600 h-full"><BoxSelect size={48} className="mb-4 opacity-50"/><p className="text-lg font-medium">Configure vehicle dimensions to view map</p></div>)}

                  {selectedPlacement && (
                      <div className="absolute bottom-10 right-10 bg-[#2a2a2a]/95 border border-cyan-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-72 animate-in slide-in-from-bottom-4 duration-300 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedPlacement.color }}></div><h4 className="text-sm font-bold text-gray-100 truncate w-40">{selectedPlacement.item.description}</h4></div><button onClick={() => setSelectedPlacementId(null)} className="text-gray-500 hover:text-white"><X size={16}/></button></div>
                          <div className="space-y-3">
                              {(selectedIntersections.length > 0) && (
                                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-3 mb-2">
                                      <div className="flex items-center gap-2 text-purple-400 mb-2"><Layers size={12}/><span className="text-[10px] font-black uppercase tracking-widest">Stack Composition</span></div>
                                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                          <div className="text-[10px] px-2.5 py-1 rounded-md border font-black bg-cyan-400 text-black border-cyan-400 shadow-lg">
                                               #{items.findIndex(i => i.id === selectedPlacement.item.id) + 1}
                                          </div>
                                          {selectedIntersections.map((si) => (
                                              <div key={si.id} className="text-[10px] px-2.5 py-1 rounded-md border font-black bg-[#1a1a1a] text-gray-400 border-gray-700 hover:border-gray-500 cursor-pointer" onClick={() => { setSelectedPlacementId(si.id); }}>
                                                  #{items.findIndex(i => i.id === si.item.id) + 1}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                              <div className="grid grid-cols-3 gap-2">
                                  {['Length', 'Width', 'Height'].map((d, i) => {
                                    const val = (selectedPlacement.rotated && (d === 'Length' || d === 'Width')) 
                                      ? (d === 'Length' ? selectedPlacement.item.width : selectedPlacement.item.length)
                                      : (selectedPlacement as any).item[d.toLowerCase()];
                                    return (
                                      <div key={d} className="bg-[#1a1a1a] p-2 rounded-lg border border-gray-700">
                                        <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">{d}</div>
                                        <div className="text-xs text-gray-200">{val}{unitSystem === 'US' ? '"' : 'cm'}</div>
                                      </div>
                                    );
                                  })}
                              </div>
                              <div className="bg-cyan-900/20 p-3 rounded-xl border border-cyan-500/20 flex justify-between items-center"><div className="flex items-center gap-2 text-cyan-400"><Scale size={14}/><span className="text-[10px] uppercase font-bold">Weight</span></div><span className="text-sm font-bold text-gray-100">{selectedPlacement.item.weight.toLocaleString()} {labels.shortWgt}</span></div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleRotatePlacement(null, selectedPlacement.id)} className="flex-1 bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                    <RotateCw size={16}/> Rotate
                                  </button>
                                  <button onClick={() => handleRemovePlacement(selectedPlacement.id)} className="p-2 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
                                    <Trash2 size={16}/>
                                  </button>
                              </div>
                              <div className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${selectedPlacement.item.stackable ? 'bg-green-900/10 border-green-500/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>{selectedPlacement.item.stackable ? 'Stackable' : 'Non-Stackable'}</div>
                          </div>
                      </div>
                  )}
              </div>
              
              <div className={`flex flex-col gap-2 shrink-0 ${isFullScreen ? 'mx-6 mb-6 mt-4' : 'mt-4'}`}>
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">Dock (Unloaded Items)</h4>
                  <div data-html2canvas-ignore="true" className="flex gap-4 overflow-x-auto p-2 bg-[#101010] rounded-xl border border-gray-800 min-h-[80px] items-center custom-scrollbar">
                      {items.map((item, idx) => {
                        const remaining = item.quantity - placements.filter(p => p.itemId === item.id).length;
                        if (remaining <= 0) return null;
                        return (
                          <div key={item.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-[#262626] border border-gray-700 shrink-0 group hover:border-cyan-500/50 transition-colors ${hoveredItemId === item.id ? 'ring-1 ring-cyan-400' : ''}`} onMouseEnter={() => setHoveredItemId(item.id)} onMouseLeave={() => setHoveredItemId(null)}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <div className="flex flex-col"><span className="text-xs text-gray-200 font-medium whitespace-nowrap">{idx + 1}. {item.description}</span><span className="text-[10px] text-gray-500">{item.length}x{item.width}x{item.height} • {remaining} left</span></div>
                            <button onClick={() => handleAddPlacement(item)} className="bg-cyan-900/40 hover:bg-cyan-400 text-cyan-400 hover:text-black p-1.5 rounded-md transition-all ml-2" title="Add to Load Map"><Plus size={16} /></button>
                          </div>
                        );
                      })}
                      {items.every(item => (placements.filter(p => p.itemId === item.id).length >= item.quantity)) && items.length > 0 && (<div className="text-gray-500 text-xs italic px-4">All items loaded</div>)}
                      {items.length === 0 && (<div className="text-gray-500 text-xs italic px-4">No freight manifest data</div>)}
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LTLPlanning;
