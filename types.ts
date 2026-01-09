export type TabName = 'Calculator' | 'Route calculator' | 'LTL / Partial' | 'Supply Chain Modeling' | 'KPIs' | 'Settings';

export type UnitSystem = 'US' | 'EU';
export type CurrencySymbol = '$' | '€';

export interface KPIItem {
  id: string;
  type: 'Revenue' | 'ROI';
  result: number;
  note?: string;
  inputs: {
    unitsSold?: number;
    salesPrice?: number;
    netProfit?: number;
    cost?: number;
  };
  timestamp: number;
}

export interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
}

export interface TruckPlanningData {
  id?: string;
  pickupLocation: string;
  deliveryLocation: string;
  distance: string;
  mpg: string;
  fuelPrice: string;
  driverPay: string;
  shipmentPrice: string;
  otherExpenses: string;
}

export interface CalculationResult {
  totalCost: string;
  fuelCost: string;
  driverCost: string;
  fuelNeeded: string;
  otherCost: string;
  netProfit: string;
  rawProfit: number; 
  cpm: string;
  ppm: string;
  shipmentPrice: string;
}

export interface PlannedRoute {
  id: string;
  inputs: TruckPlanningData;
  results: CalculationResult;
  timestamp: number;
}

export interface RouteHistoryItem {
  id: string;
  inputs: TruckPlanningData;
  results: {
    totalCost: string;
    fuelCost: string;
    driverCost: string;
    fuelNeeded: string;
    otherCost: string;
    netProfit: string;
    cpm?: string;
    ppm?: string;
    shipmentPrice?: string;
  };
  timestamp: number;
}

export interface LTLItem {
  id: string;
  description: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  stackable: boolean;
}

export interface LTLPlacement {
  id: string;       // Unique ID for this specific placement instance
  itemId: string;   // Reference to the LTLItem ID
  x: number;
  y: number;
  rotated?: boolean;
}

export interface VehicleDimensions {
  name: string;
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  maxWeightLbs: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface SCCustomField {
  id: string;
  name: string;
  value: string | number;
  type: 'text' | 'number';
}

export interface SCNode {
  id: string;
  displayId?: number; // Logical sequence ID for sorting and display
  name: string;
  type: string;
  x: number;
  y: number;
  comment?: string;
  location?: string;
  primaryTransport?: string;
  
  // Sourcing / Production / General Capacity Fields
  materialType?: string;    // Also used for Hub Type, Storage Type
  materialName?: string;    // Also used for Input
  outputName?: string;      // Specifically for Manufacturing
  unit?: string;            // Unit of measure
  costPerUnit?: number;     // Material cost or Mfg cost or Storage cost
  quantityValue?: number;   // Available Qty or Capacity or Throughput
  quantityUnit?: string;    // "Per Month", "Per Day", etc.
  weightPerUnit?: number;
  leadTime?: string;
  utilizationRate?: number;
  currentOrders?: number;   // Added for manufacturing orders tracking

  // Specific Storage & Consolidation Fields
  currentInventory?: number;
  inboundThroughput?: number;
  outboundThroughput?: number;
  storageCost?: number;
  handlingCost?: number;

  // Specific Logistics Hub Fields
  inboundModes?: string;
  outboundModes?: string;
  handlingTime?: string;
  customsClearance?: string;
  operatingHours?: string;
  primaryRole?: string;
  scope?: string;

  // Specific Retail and Sales Fields
  productCategory?: string;
  dailyDemand?: number;
  avgInventory?: number;
  replenishmentFreq?: string;
  stockoutRate?: number;
  salesPrice?: number;
  supplySource?: string;
  lastMileTransport?: string;

  // Customization
  deletedDefaultFields?: string[];
  customFields?: SCCustomField[];
}

export interface SCLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'OneWay' | 'RoundTrip';
  volume: number;         
  costPerUnit: number;    
  volumeReverse?: number;       
  costPerUnitReverse?: number;  
  
  // Logistics Fields (Forward)
  transportType?: 'Air' | 'Ocean' | 'Ground' | 'Custom';
  customTransportType?: string;
  groundType?: 'Rail' | 'Road';
  miles?: number;
  transportPrice?: number;
  weight?: number;
  equipmentType?: string;
  tripCount?: number;
  days?: number;

  // Logistics Fields (Reverse)
  transportTypeReverse?: 'Air' | 'Ocean' | 'Ground' | 'Custom';
  customTransportTypeReverse?: string;
  groundTypeReverse?: 'Rail' | 'Road';
  milesReverse?: number;
  transportPriceReverse?: number;
  weightReverse?: number;
  equipmentTypeReverse?: string;
  tripCountReverse?: number;
  daysReverse?: number;
}