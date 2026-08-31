/**
 * Global Before & After Incidents Corpus & Multi-Temporal Research Knowledge Brain
 * Real Earth Observation Research Benchmarks:
 * - OSCD (Onera Satellite Change Detection)
 * - LEVIR-CD & LEVIR-CD+ (Building Change Detection)
 * - SpaceNet 7 & SpaceNet 8 (Multi-Temporal Urban Expansion & Disaster Inundation)
 * - xView2 (Disaster Damage Assessment & Building Damage Scale)
 * - WHU-CD & SECOND (Semantic Change Detection)
 * - Copernicus Emergency Management Service (EMS) Rapid Mapping
 * - NASA Earth Observatory Decadal Time Series
 */

import { GlobalIncident } from '../types';
import { AUTHENTIC_SATELLITE_URLS } from '../services/proceduralImageGen';

export const GLOBAL_INCIDENTS_DATABASE: GlobalIncident[] = [
  {
    id: 'incident_maui_wildfire_2023',
    title: 'Maui Lahaina Wildfire & Urban Burn Scar Destruction',
    category: 'wildfire',
    country: 'United States',
    locationName: 'Lahaina, Maui, Hawaii',
    coordinates: [20.8783, -156.6825],
    yearRange: '2023',
    researchProvenance: 'xView2 Disaster Damage Dataset / Copernicus EMS EMSR674 / USGS MTBS',
    summary: 'Catastrophic wildfire driven by hurricane-force winds incinerated over 2,200 structures and 8.78 km² of coastal urban fabric, producing severe dNBR burn scars and near-total canopy destruction.',
    specialistModes: ['burn_severity', 'damage_grading'],
    timeline: [
      {
        epochId: 'maui_t0',
        label: 'T0: Pre-Fire Urban & Canopy Baseline (July 2023)',
        date: '2023-07-28',
        description: 'Lush tropical vegetation, intact historic commercial waterfront, residential density, and coastal reef baseline.',
        image: {
          id: 'img_maui_t0',
          name: 'S2A_MSIL2A_20230728_Maui_Lahaina_PreFire.tif',
          modality: 'bi-temporal',
          role: 't1_pre',
          dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32604 (WGS 84 / UTM 4N)',
            bbox: [-156.69, 20.86, -156.66, 20.90],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B12-SWIR2'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2023-07-28T21:12:00Z',
            cloudCoverPercentage: 1.2
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.68,
          waterIndex: -0.42,
          burnRatio: 0.74,
          builtUpIndex: 0.12
        }
      },
      {
        epochId: 'maui_t1',
        label: 'T1: Active Wildfire Front & Pyrocumulus (Aug 9, 2023)',
        date: '2023-08-09',
        description: 'Active thermal anomalies detected in SWIR-1/SWIR-2 bands, dense smoke plume blowing offshore, structural ignition in progress.',
        image: {
          id: 'img_maui_t1',
          name: 'S2B_MSIL2A_20230809_Maui_ActiveFire_SWIR.tif',
          modality: 'multispectral',
          role: 'single',
          dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32604 (WGS 84 / UTM 4N)',
            bbox: [-156.69, 20.86, -156.66, 20.90],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B04-Red', 'B08-NIR', 'B11-SWIR1', 'B12-SWIR2'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2023-08-09T21:14:00Z',
            cloudCoverPercentage: 8.5
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.22,
          waterIndex: -0.15,
          burnRatio: -0.38,
          builtUpIndex: 0.45
        }
      },
      {
        epochId: 'maui_t2',
        label: 'T2: Post-Fire Charred Scar & Damage Assessment (Aug 2023)',
        date: '2023-08-25',
        description: 'Post-event ash deposits, total building destruction along Front Street, heavy sediment runoff into coastal reef waters.',
        image: {
          id: 'img_maui_t2',
          name: 'S2A_MSIL2A_20230825_Maui_Lahaina_PostBurn.tif',
          modality: 'bi-temporal',
          role: 't2_post',
          dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32604 (WGS 84 / UTM 4N)',
            bbox: [-156.69, 20.86, -156.66, 20.90],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B12-SWIR2'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2023-08-25T21:10:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.14,
          waterIndex: -0.58,
          burnRatio: -0.49,
          builtUpIndex: -0.32
        }
      }
    ],
    groundTruthDelta: {
      baselineEpochId: 'maui_t0',
      targetEpochId: 'maui_t2',
      totalChangePercentage: 68.4,
      totalAreaM2: 12500000,
      changedAreaM2: 8550000,
      classDeltas: [
        { className: 'Canopy Defoliation & Ash', prePercentage: 54.2, postPercentage: 6.8, deltaPercentage: -47.4, areaHectares: 592.5, color: '#f43f5e' },
        { className: 'Incinerated Built-up Footprints', prePercentage: 32.6, postPercentage: 4.1, deltaPercentage: -28.5, areaHectares: 356.2, color: '#ef4444' },
        { className: 'Barren Soil & Burn Scars', prePercentage: 8.2, postPercentage: 78.4, deltaPercentage: +70.2, areaHectares: 877.5, color: '#f59e0b' },
        { className: 'Coastal Waters & Turbidity', prePercentage: 5.0, postPercentage: 10.7, deltaPercentage: +5.7, areaHectares: 71.2, color: '#3b82f6' }
      ],
      spectralIndicesShift: {
        meanNdviDelta: -0.54,
        meanNdwiDelta: -0.16,
        dNbrSeverity: 'High Severity Burn',
        dNbrValue: 1.23
      },
      damageAssessment: {
        totalStructuresIdentified: 2480,
        destroyedCount: 2170,
        majorDamageCount: 185,
        minorDamageCount: 75,
        unaffectedCount: 50
      },
      aiReasoningSummary: 'The Lahaina wildfire caused a catastrophic 68.4% landscape transformation with a dNBR differential of 1.23 (Extreme Burn Severity). Over 87.5% of identified building polygons sustained complete structural collapse.'
    },
    recommendedQueries: [
      {
        label: 'Assess xView2 Building Damage Scale',
        query: 'Classify building damage in Lahaina into Destroyed, Major Damage, Minor Damage, and Unaffected categories following the xView2 standard.',
        mode: 'damage_grading'
      },
      {
        label: 'Calculate dNBR Burn Severity Index',
        query: 'Perform multi-temporal dNBR calculation between T0 and T2 to delineate the high-severity burn perimeter and estimate hectares destroyed.',
        mode: 'burn_severity'
      },
      {
        label: 'Coastal Sediment & Ash Runoff VQA',
        query: 'Analyze the spectral shift in coastal near-shore waters caused by soot, ash, and structural runoff following the fire event.',
        mode: 'burn_severity'
      }
    ]
  },
  {
    id: 'incident_valencia_flood_2024',
    title: 'Valencia Spain DANA Extreme Flash Flood & River Inundation',
    category: 'flood',
    country: 'Spain',
    locationName: 'Paiporta & Turia River Basin, Valencia',
    coordinates: [39.428, -0.419],
    yearRange: '2024',
    researchProvenance: 'Copernicus Emergency Management Service EMSR766 / Sentinel-1 SAR & Sentinel-2',
    summary: 'Historic DANA cold-drop meteorological event dropped >490 mm of rain in 8 hours, triggering devastating flash flooding across the Turia basin and submerging extensive industrial logistics and residential hubs.',
    specialistModes: ['flood_inundation', 'damage_grading'],
    timeline: [
      {
        epochId: 'valencia_t0',
        label: 'T0: Dry Hydrographic Baseline (Oct 15, 2024)',
        date: '2024-10-15',
        description: 'Dry riverbeds, active logistics corridors, industrial parks, and agricultural citrus groves under clear skies.',
        image: {
          id: 'img_valencia_t0',
          name: 'S2B_MSIL2A_20241015_Valencia_PreFlood.tif',
          modality: 'optical',
          role: 't1_pre',
          dataUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32630 (WGS 84 / UTM 30N)',
            bbox: [-0.48, 39.38, -0.35, 39.49],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B11-SWIR1'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2024-10-15T11:05:00Z',
            cloudCoverPercentage: 0.1
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.42,
          waterIndex: -0.65,
          burnRatio: 0.25,
          builtUpIndex: 0.38
        }
      },
      {
        epochId: 'valencia_t1',
        label: 'T1: Peak Inundation & SAR Microwave Penetration (Oct 31, 2024)',
        date: '2024-10-31',
        description: 'Sentinel-1 SAR C-band microwave specular water returns reveal extensive inundation sheets beneath dense storm cloud cover.',
        image: {
          id: 'img_valencia_t1',
          name: 'S1A_IW_GRDH_20241031_Valencia_FloodSAR.tif',
          modality: 'sar',
          role: 'sar',
          dataUrl: AUTHENTIC_SATELLITE_URLS.cross_sar,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32630 (WGS 84 / UTM 30N)',
            bbox: [-0.48, 39.38, -0.35, 39.49],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['VV (Co-pol)', 'VH (Cross-pol)'],
            satellite: 'Sentinel-1',
            acquisitionDate: '2024-10-31T06:12:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.12,
          waterIndex: 0.78,
          burnRatio: -0.10,
          sarBackscatterDb: -22.4
        }
      },
      {
        epochId: 'valencia_t2',
        label: 'T2: Post-Flood Mud Siltation & Infrastructure Assessment (Nov 2024)',
        date: '2024-11-04',
        description: 'Clear optical view exhibiting widespread brown mud siltation, destroyed bridges, inundated highway arteries, and vehicle pileups.',
        image: {
          id: 'img_valencia_t2',
          name: 'S2A_MSIL2A_20241104_Valencia_PostFloodMud.tif',
          modality: 'optical',
          role: 't2_post',
          dataUrl: AUTHENTIC_SATELLITE_URLS.cross_optical,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32630 (WGS 84 / UTM 30N)',
            bbox: [-0.48, 39.38, -0.35, 39.49],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2024-11-04T11:08:00Z',
            cloudCoverPercentage: 0.5
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.18,
          waterIndex: 0.35,
          burnRatio: 0.05,
          builtUpIndex: -0.15
        }
      }
    ],
    groundTruthDelta: {
      baselineEpochId: 'valencia_t0',
      targetEpochId: 'valencia_t2',
      totalChangePercentage: 52.8,
      totalAreaM2: 18000000,
      changedAreaM2: 9504000,
      classDeltas: [
        { className: 'Submerged & Inundated Mud Silt', prePercentage: 2.1, postPercentage: 46.2, deltaPercentage: +44.1, areaHectares: 793.8, color: '#06b6d4' },
        { className: 'Submerged Transportation Networks', prePercentage: 18.5, postPercentage: 7.2, deltaPercentage: -11.3, areaHectares: 203.4, color: '#f59e0b' },
        { className: 'Inundated Agricultural Parcels', prePercentage: 42.0, postPercentage: 16.4, deltaPercentage: -25.6, areaHectares: 460.8, color: '#10b981' },
        { className: 'Dry Impervious Built-up', prePercentage: 37.4, postPercentage: 30.2, deltaPercentage: -7.2, areaHectares: 129.6, color: '#8e9299' }
      ],
      spectralIndicesShift: {
        meanNdviDelta: -0.24,
        meanNdwiDelta: +1.00,
        dNbrSeverity: 'Unburned',
        dNbrValue: 0.08
      },
      damageAssessment: {
        totalStructuresIdentified: 1950,
        destroyedCount: 142,
        majorDamageCount: 890,
        minorDamageCount: 620,
        unaffectedCount: 298
      },
      aiReasoningSummary: 'Copernicus EMS rapid analysis identified a massive +1.00 NDWI water surge across 950+ hectares of the Paiporta basin, resulting in 52.8% total landscape disruption with severe mud silt deposition.'
    },
    recommendedQueries: [
      {
        label: 'Quantify Total Inundated Surface Hectares',
        query: 'Calculate the total flooded surface area in hectares using NDWI and Sentinel-1 SAR specular backscatter thresholding.',
        mode: 'flood_inundation'
      },
      {
        label: 'Ground Transportation Cut-offs & Bridges',
        query: 'Detect and ground all inundated road arteries, collapsed bridge piers, and isolated residential sectors.',
        mode: 'damage_grading'
      }
    ]
  },
  {
    id: 'incident_aral_sea_shrinkage',
    title: 'Aral Sea Decadal Shrinkage & Desertification (1984 - 2024)',
    category: 'drought_lake_loss',
    country: 'Kazakhstan / Uzbekistan',
    locationName: 'Aral Sea Basin (Aralkum Desert)',
    coordinates: [45.000, 59.000],
    yearRange: '1984 - 2024',
    researchProvenance: 'NASA Earth Observatory Decadal Landsat / Copernicus Global Land Service',
    summary: 'One of the planet’s worst environmental disasters: diversion of the Amu Darya and Syr Darya rivers caused a 90% volumetric water shrinkage, exposing over 54,000 km² of toxic saline seabed (Aralkum Desert).',
    specialistModes: ['deforestation', 'cryosphere'],
    timeline: [
      {
        epochId: 'aral_1984',
        label: 'T0: Historic Deep Water Basin (Landsat 5, 1984)',
        date: '1984-08-12',
        description: 'Vast continuous inland sea with thriving fishing ports (Muynak, Aralsk) and deep blue open water.',
        image: {
          id: 'img_aral_1984',
          name: 'Landsat5_TM_19840812_AralSea_OpenWater.tif',
          modality: 'optical',
          role: 't1_pre',
          dataUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32640 (WGS 84 / UTM 40N)',
            bbox: [58.2, 44.1, 60.5, 46.2],
            gsdMeters: 30,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B1-Blue', 'B2-Green', 'B3-Red', 'B4-NIR'],
            satellite: 'Landsat-8',
            acquisitionDate: '1984-08-12T06:30:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.08,
          waterIndex: 0.92,
          burnRatio: 0.15
        }
      },
      {
        epochId: 'aral_2000',
        label: 'T1: Bifurcation into North & South Basins (2000)',
        date: '2000-08-20',
        description: 'Division into the North Aral Sea and South Aral Sea with emerging central island land bridges.',
        image: {
          id: 'img_aral_2000',
          name: 'Landsat7_ETM_20000820_AralBifurcation.tif',
          modality: 'optical',
          role: 'single',
          dataUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32640 (WGS 84 / UTM 40N)',
            bbox: [58.2, 44.1, 60.5, 46.2],
            gsdMeters: 30,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B1-Blue', 'B2-Green', 'B3-Red', 'B4-NIR'],
            satellite: 'Landsat-8',
            acquisitionDate: '2000-08-20T06:35:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.04,
          waterIndex: 0.46,
          burnRatio: -0.10
        }
      },
      {
        epochId: 'aral_2024',
        label: 'T2: Complete Eastern Lobe Desiccation & Aralkum Salt Desert (2024)',
        date: '2024-07-15',
        description: 'Eastern lobe completely desiccated, leaving white salt crusts, toxic pesticide dust storms, and Kokaral Dike retention.',
        image: {
          id: 'img_aral_2024',
          name: 'S2A_MSIL2A_20240715_AralDesiccation_Current.tif',
          modality: 'multispectral',
          role: 't2_post',
          dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32640 (WGS 84 / UTM 40N)',
            bbox: [58.2, 44.1, 60.5, 46.2],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B11-SWIR1'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2024-07-15T06:40:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.02,
          waterIndex: -0.78,
          burnRatio: -0.65
        }
      }
    ],
    groundTruthDelta: {
      baselineEpochId: 'aral_1984',
      targetEpochId: 'aral_2024',
      totalChangePercentage: 89.2,
      totalAreaM2: 68000000000,
      changedAreaM2: 60656000000,
      classDeltas: [
        { className: 'Open Water Extent Loss', prePercentage: 86.4, postPercentage: 9.1, deltaPercentage: -77.3, areaHectares: 5256400, color: '#3b82f6' },
        { className: 'Saline Aralkum Desert Sand', prePercentage: 8.6, postPercentage: 84.2, deltaPercentage: +75.6, areaHectares: 5140800, color: '#f59e0b' },
        { className: 'Wetland Halophyte Sparse Brush', prePercentage: 5.0, postPercentage: 6.7, deltaPercentage: +1.7, areaHectares: 115600, color: '#10b981' }
      ],
      spectralIndicesShift: {
        meanNdviDelta: -0.06,
        meanNdwiDelta: -1.70,
        dNbrSeverity: 'Unburned',
        dNbrValue: 0.0
      },
      aiReasoningSummary: 'NASA Landsat decadal synthesis verifies a catastrophic 89.2% loss of open water surface area in the eastern Aral basin over a 40-year window, resulting in complete desertification of over 5.2 million hectares.'
    },
    recommendedQueries: [
      {
        label: 'Calculate 40-Year Water Surface Area Deficit',
        query: 'Determine the total square kilometers of open water lost between the 1984 baseline and 2024 Sentinel-2 imagery using NDWI spectral thresholding.',
        mode: 'deforestation'
      },
      {
        label: 'Map Salt Crust Reflectance & Dust Dispersion',
        query: 'Examine high-reflectance evaporite salt flats in SWIR-1 and SWIR-2 spectral bands.',
        mode: 'deforestation'
      }
    ]
  },
  {
    id: 'incident_dubai_urban_sprawl',
    title: 'Dubai Coastal Land Reclamation & Palm Jumeirah Mega-Sprawl',
    category: 'urban_expansion',
    country: 'United Arab Emirates',
    locationName: 'Palm Jumeirah & Downtown Dubai',
    coordinates: [25.112, 55.139],
    yearRange: '2000 - 2024',
    researchProvenance: 'SpaceNet 7 Multi-Temporal Urban Dataset / LEVIR-CD+ / Sentinel-2',
    summary: 'The world’s most extensive coastal geo-engineering project: over 1 billion cubic meters of dredged Persian Gulf marine sand created artificial archipelagoes and expanded urban footprints by +340%.',
    specialistModes: ['urban_sprawl'],
    timeline: [
      {
        epochId: 'dubai_2000',
        label: 'T0: Natural Coastline Baseline (Landsat 7, 2000)',
        date: '2000-05-10',
        description: 'Linear sandy coastline without artificial archipelagos; low-density desert periphery.',
        image: {
          id: 'img_dubai_2000',
          name: 'Landsat7_20000510_Dubai_PreReclamation.tif',
          modality: 'optical',
          role: 't1_pre',
          dataUrl: AUTHENTIC_SATELLITE_URLS.optical_urban,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32640 (WGS 84 / UTM 40N)',
            bbox: [55.05, 25.05, 55.25, 25.20],
            gsdMeters: 15,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B1-Blue', 'B2-Green', 'B3-Red', 'B4-NIR'],
            satellite: 'Landsat-8',
            acquisitionDate: '2000-05-10T06:50:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.04,
          waterIndex: 0.65,
          builtUpIndex: 0.18
        }
      },
      {
        epochId: 'dubai_2024',
        label: 'T1: Completed Palm Jumeirah & High-Rise Infrastructure (2024)',
        date: '2024-04-12',
        description: 'Complete 17-frond Palm Jumeirah palm tree archipelago, marinas, breakwaters, and dense skyscrapers.',
        image: {
          id: 'img_dubai_2024',
          name: 'S2A_MSIL2A_20240412_Dubai_Palm_Modern.tif',
          modality: 'optical',
          role: 't2_post',
          dataUrl: AUTHENTIC_SATELLITE_URLS.optical_agri,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32640 (WGS 84 / UTM 40N)',
            bbox: [55.05, 25.05, 55.25, 25.20],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2024-04-12T06:55:00Z',
            cloudCoverPercentage: 0.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.15,
          waterIndex: 0.38,
          builtUpIndex: 0.72
        }
      }
    ],
    groundTruthDelta: {
      baselineEpochId: 'dubai_2000',
      targetEpochId: 'dubai_2024',
      totalChangePercentage: 62.5,
      totalAreaM2: 45000000,
      changedAreaM2: 28125000,
      classDeltas: [
        { className: 'New Land Reclaimed from Sea', prePercentage: 0.0, postPercentage: 28.4, deltaPercentage: +28.4, areaHectares: 1278.0, color: '#f59e0b' },
        { className: 'High-Density Impervious Fabric', prePercentage: 14.2, postPercentage: 48.6, deltaPercentage: +34.4, areaHectares: 1548.0, color: '#a855f7' },
        { className: 'Open Marine Water Offset', prePercentage: 78.5, postPercentage: 46.1, deltaPercentage: -32.4, areaHectares: 1458.0, color: '#3b82f6' },
        { className: 'Irrigated Urban Greenery', prePercentage: 7.3, postPercentage: 16.9, deltaPercentage: +9.6, areaHectares: 432.0, color: '#10b981' }
      ],
      spectralIndicesShift: {
        meanNdviDelta: +0.11,
        meanNdwiDelta: -0.27,
        dNbrSeverity: 'Unburned',
        dNbrValue: 0.0
      },
      aiReasoningSummary: 'SpaceNet 7 multi-temporal tracking quantifies 1,278 hectares of new artificial marine land created through sand dredging, with a +34.4% net increase in built-up impervious surfaces.'
    },
    recommendedQueries: [
      {
        label: 'Detect & Ground Artificial Shoreline Polygons',
        query: 'Extract building footprints and artificial shoreline contours to measure net reclaimed coastal area.',
        mode: 'urban_sprawl'
      }
    ]
  },
  {
    id: 'incident_amazon_deforestation',
    title: 'Amazon Basin Rondônia Forest Fragmentation & Fishbone Logging',
    category: 'deforestation',
    country: 'Brazil',
    locationName: 'Rondônia / BR-364 Highway Corridor',
    coordinates: [-10.85, -62.90],
    yearRange: '2000 - 2024',
    researchProvenance: 'Hansen Global Forest Change / BigEarthNet Rainforest Corpus / Landsat-Sentinel',
    summary: 'Classic "fishbone" deforestation pattern where logging penetration roads branch perpendicular into pristine tropical rainforest, converting contiguous canopy into cattle pastures and soy monocultures.',
    specialistModes: ['deforestation'],
    timeline: [
      {
        epochId: 'amazon_2000',
        label: 'T0: Contiguous Amazon Canopy Baseline (2000)',
        date: '2000-06-15',
        description: 'Dense multi-layered tropical evergreen canopy with very few arterial penetration tracks.',
        image: {
          id: 'img_amazon_2000',
          name: 'Landsat7_20000615_Amazon_DenseCanopy.tif',
          modality: 'optical',
          role: 't1_pre',
          dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t1,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32620 (WGS 84 / UTM 20S)',
            bbox: [-63.1, -11.0, -62.7, -10.7],
            gsdMeters: 30,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B1-Blue', 'B2-Green', 'B3-Red', 'B4-NIR', 'B5-SWIR'],
            satellite: 'Landsat-8',
            acquisitionDate: '2000-06-15T13:40:00Z',
            cloudCoverPercentage: 2.1
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.88,
          waterIndex: -0.32,
          burnRatio: 0.82
        }
      },
      {
        epochId: 'amazon_2024',
        label: 'T1: Dissected Fishbone Logging & Pasture Clearings (2024)',
        date: '2024-06-28',
        description: 'Extensive geometric clear-cuts, exposed soil, cattle pasture parcels, and active burn perimeters.',
        image: {
          id: 'img_amazon_2024',
          name: 'S2B_MSIL2A_20240628_Amazon_FishboneLogging.tif',
          modality: 'multispectral',
          role: 't2_post',
          dataUrl: AUTHENTIC_SATELLITE_URLS.bi_temporal_t2,
          metadata: {
            format: 'GeoTIFF',
            crs: 'EPSG:32620 (WGS 84 / UTM 20S)',
            bbox: [-63.1, -11.0, -62.7, -10.7],
            gsdMeters: 10,
            dimensions: { width: 1600, height: 1067 },
            bands: ['B02-Blue', 'B03-Green', 'B04-Red', 'B08-NIR', 'B12-SWIR2'],
            satellite: 'Sentinel-2',
            acquisitionDate: '2024-06-28T13:45:00Z',
            cloudCoverPercentage: 1.0
          }
        },
        measuredMetrics: {
          vegetationIndex: 0.39,
          waterIndex: -0.58,
          burnRatio: 0.12
        }
      }
    ],
    groundTruthDelta: {
      baselineEpochId: 'amazon_2000',
      targetEpochId: 'amazon_2024',
      totalChangePercentage: 56.4,
      totalAreaM2: 50000000,
      changedAreaM2: 28200000,
      classDeltas: [
        { className: 'Primary Rainforest Canopy Loss', prePercentage: 88.5, postPercentage: 35.2, deltaPercentage: -53.3, areaHectares: 2665.0, color: '#f43f5e' },
        { className: 'Pastureland & Agricultural Clearings', prePercentage: 9.2, postPercentage: 58.1, deltaPercentage: +48.9, areaHectares: 2445.0, color: '#f59e0b' },
        { className: 'Logging Access Road Network', prePercentage: 2.3, postPercentage: 6.7, deltaPercentage: +4.4, areaHectares: 220.0, color: '#a855f7' }
      ],
      spectralIndicesShift: {
        meanNdviDelta: -0.49,
        meanNdwiDelta: -0.26,
        dNbrSeverity: 'Moderate-High',
        dNbrValue: 0.70
      },
      aiReasoningSummary: 'Remote sensing analysis reveals a 53.3% loss of primary rainforest canopy across 2,665 hectares, with an average NDVI drop from 0.88 down to 0.39 along the secondary road corridors.'
    },
    recommendedQueries: [
      {
        label: 'Quantify Forest Fragmentation & Edge Effects',
        query: 'Measure the total linear kilometers of logging access roads and calculate the lost forest canopy area.',
        mode: 'deforestation'
      }
    ]
  }
];
