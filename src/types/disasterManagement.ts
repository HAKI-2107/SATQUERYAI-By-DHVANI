/**
 * Disaster Management System (DMS) - Types & Schemas
 * Standardized to FEMA, Copernicus Emergency Management Service (EMS), 
 * xView2 Disaster Damage Assessment, and DigitalGlobe Crisis Standards.
 */

import { RemoteSensingImage } from './index';

export type DisasterType = 
  | 'wildfire_burn' 
  | 'earthquake_collapse' 
  | 'flood_inundation' 
  | 'cyclone_storm' 
  | 'industrial_explosion' 
  | 'landslide_debris' 
  | 'tornado_path';

export type DamageGrade = 
  | 'grade_0_no_damage'      // Intact / Undamaged (Green)
  | 'grade_1_minor_damage'    // Partially affected / Minor roof/surface damage (Yellow)
  | 'grade_2_major_damage'    // Major structural compromise / partial wall collapse (Orange)
  | 'grade_3_destroyed';      // Total structural failure / flattened / rubble (Red)

export interface DisasterBuildingAssessment {
  id: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 range
  orientedBox?: {
    cx: number;
    cy: number;
    width: number;
    height: number;
    angleDeg: number;
  };
  damageGrade: DamageGrade;
  confidence: number;
  areaEstimateM2: number;
  structureType: 'residential' | 'commercial' | 'industrial' | 'critical_facility' | 'transport_hub';
  preEventReflectance: number;
  postEventReflectance: number;
  structuralCollapseRatio: number; // 0.0 to 1.0
  notes: string;
}

export interface GriddedSeverityCell {
  row: number;
  col: number;
  bounds: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  totalBuildings: number;
  destroyedBuildings: number;
  majorDamageBuildings: number;
  minorDamageBuildings: number;
  intactBuildings: number;
  diiScore: number; // Disaster Impact Index 0.0 - 1.0
  riskLevel: 'minimal' | 'moderate' | 'severe' | 'catastrophic';
  sarPriority: 'low' | 'medium' | 'high' | 'critical_immediate';
}

export interface EmergencyActionItem {
  id: string;
  category: 'search_and_rescue' | 'ingress_egress' | 'evacuation' | 'helipad_hlz' | 'triage_staging' | 'hazmat_containment';
  title: string;
  priority: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ADVISORY';
  gridReference: string;
  coordinates?: [number, number];
  description: string;
  recommendedAction: string;
  accessibilityStatus: 'open' | 'partially_blocked' | 'impassable';
}

export interface TrainingDatasetGrounding {
  benchmarkName: string;
  provenance: string;
  trainingSamplesCount: string;
  f1Score: number;
  iouScore: number;
  damageGradingAccuracy: number;
  calibrationNotes: string;
}

export interface DisasterIncidentExaminationResult {
  incidentId: string;
  incidentTitle: string;
  disasterType: DisasterType;
  timestamp: string;
  sensorGsdMeters: number;
  
  // Executive Overview
  overallDiiScore: number; // Disaster Impact Index (0.00 to 1.00)
  overallSeverity: 'minimal' | 'moderate' | 'severe' | 'catastrophic';
  summaryReport: string;
  
  // Building & Structure Damage Metrics
  buildingStats: {
    totalStructures: number;
    destroyedCount: number;
    majorDamageCount: number;
    minorDamageCount: number;
    intactCount: number;
    destructionPercentage: number;
    totalFootprintAreaM2: number;
    damagedFootprintAreaM2: number;
    estimatedDebrisVolumeM3: number;
  };
  
  // Terrain & Environmental Alterations
  terrainStats: {
    affectedTerrainHa: number;
    vegetationLossHa: number;
    vegetationLossPercentage: number;
    floodInundationHa?: number;
    ashBurnScarHa?: number;
    debrisFieldHa: number;
    meanNdviDelta: number;
    meanNdwiDelta: number;
  };
  
  // High-Resolution Objects & Contours
  buildings: DisasterBuildingAssessment[];
  griddedMatrix: GriddedSeverityCell[][]; // 8x8 or 16x16 grid
  
  // Emergency Management Directives
  emergencyPlan: EmergencyActionItem[];
  
  // Dataset Provenance & Approximations
  datasetGrounding: TrainingDatasetGrounding[];
  
  // Renderable Artifacts
  pixelwiseChangeMaskUrl?: string;
  frapImpactMaskUrl?: string;
  heatmapOverlayUrl?: string;
}

export interface DisasterPresetIncident {
  id: string;
  title: string;
  subtitle: string;
  disasterType: DisasterType;
  location: string;
  country: string;
  date: string;
  satelliteSensor: string;
  gsdMeters: number;
  description: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  defaultDii: number;
  datasetReference: string;
}
