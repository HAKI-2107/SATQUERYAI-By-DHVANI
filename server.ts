import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { SAMPLE_DATASETS, BENCHMARK_SUBSETS } from './src/data/samples';
import { BIGEARTHNET_TRAINING_SAMPLES, segregateDatasetCorpusIntoPairs } from './src/data/bigEarthNetCorpus';
import { executeSatQueryPipeline } from './src/services/geminiRemoteSensing';
import { extractUploadMetadata, validateImageCompatibility } from './src/services/imageAnalysis';
import { runBenchmarkEvaluation } from './src/services/evalEngine';
import { RemoteSensingImage, SatQueryResponse } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// In-memory data store for uploaded images, query traces, and reports
const imageStore = new Map<string, RemoteSensingImage>();
const queryStore = new Map<string, SatQueryResponse>();

// Preload sample datasets and BigEarthNet training corpus into imageStore
SAMPLE_DATASETS.forEach(set => {
  set.images.forEach(img => {
    imageStore.set(img.id, img);
  });
});

BIGEARTHNET_TRAINING_SAMPLES.forEach(sample => {
  imageStore.set(sample.opticalImage.id, sample.opticalImage);
  if (sample.sarImage) {
    imageStore.set(sample.sarImage.id, sample.sarImage);
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------
// BACKEND API ENDPOINTS
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0-prototype',
    service: 'SatQuery AI Agentic Remote Sensing Assistant',
    models: {
      primary: 'gemini-3.7-flash',
      adapted: 'BigEarthNet-19-CORINE-LoRA (Sentinel-1/2)',
      router: 'gemini-3.7-flash'
    },
    trainingCorpus: {
      dataset: 'BigEarthNet Multispectral + SAR',
      reference: 'https://arxiv.org/abs/2603.29630',
      totalSamples: BIGEARTHNET_TRAINING_SAMPLES.length
    },
    benchmarks: ['VRSBench', 'RSVQA', 'CDVQA'],
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// GET Sample Datasets
app.get('/api/samples', (req, res) => {
  res.json({ samples: SAMPLE_DATASETS });
});

// GET Benchmark Subsets (VRSBench, RSVQA, CDVQA)
app.get('/api/benchmarks', (req, res) => {
  res.json({ benchmarks: BENCHMARK_SUBSETS });
});

// GET BigEarthNet Training & Fine-Tuning Corpus
app.get('/api/training/bigearthnet', (req, res) => {
  res.json({
    datasetName: 'BigEarthNet-MM (Multimodal Sentinel-1/2)',
    arxivLink: 'https://arxiv.org/abs/2603.29630',
    description: 'Primary dataset for remote-sensing adaptation using co-registered Sentinel-1 SAR, Sentinel-2 multispectral imagery, and diverse text annotations.',
    corineTaxonomy: '19-Class CORINE Land Cover (CLC)',
    samples: BIGEARTHNET_TRAINING_SAMPLES
  });
});

// POST /api/brain/segregate-pairs - AI Remote Sensing Pair Segregator
app.post('/api/brain/segregate-pairs', (req, res) => {
  try {
    const segregatedPairs = segregateDatasetCorpusIntoPairs();
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      model: 'gemini-3.7-flash-heuristic-segregator',
      totalPairsSegregated: segregatedPairs.length,
      pairs: segregatedPairs
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'AI pair segregation failed' });
  }
});

// POST /upload and /api/upload
const handleUpload = (req: express.Request, res: express.Response) => {
  try {
    const { name, dataUrl, modality, role, format, width, height, crs, gsdMeters, bands } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'dataUrl is required' });
    }

    const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const imgName = name || `Uploaded_Scene_${imageId}.tif`;
    const w = width || 512;
    const h = height || 512;

    const metadata = extractUploadMetadata(imgName, w, h, dataUrl.length);
    if (crs) metadata.crs = crs;
    if (gsdMeters) metadata.gsdMeters = Number(gsdMeters);
    if (bands && Array.isArray(bands)) metadata.bands = bands;
    if (format) metadata.format = format;

    const newImage: RemoteSensingImage = {
      id: imageId,
      name: imgName,
      modality: modality || metadata.satellite === 'Sentinel-1' ? 'sar' : 'optical',
      role: role || 'single',
      dataUrl,
      metadata
    };

    imageStore.set(imageId, newImage);

    const validation = validateImageCompatibility([newImage]);

    return res.json({
      image_id: imageId,
      image: newImage,
      validation
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

app.post('/upload', handleUpload);
app.post('/api/upload', handleUpload);

// POST /query and /api/query
const handleQuery = async (req: express.Request, res: express.Response) => {
  try {
    const { query, image_ids, images, provider, task_override, use_specialist } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query string is required' });
    }

    // Ingest any direct images passed in request body
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: RemoteSensingImage) => {
        if (img && img.id) {
          imageStore.set(img.id, img);
        }
      });
    }

    // Resolve images
    const targetImages: RemoteSensingImage[] = [];
    if (Array.isArray(image_ids) && image_ids.length > 0) {
      for (const id of image_ids) {
        const found = imageStore.get(id);
        if (found) targetImages.push(found);
      }
    }

    if (targetImages.length === 0 && Array.isArray(images) && images.length > 0) {
      targetImages.push(...images);
    }

    // Default to the first sample image if none provided
    if (targetImages.length === 0) {
      const defaultImg = SAMPLE_DATASETS[0].images[0];
      targetImages.push(defaultImg);
    }

    // Run Agentic Orchestration Pipeline
    const response = await executeSatQueryPipeline(query, targetImages, {
      provider: provider || 'gemini',
      taskOverride: task_override,
      useAdaptedSpecialist: use_specialist !== false
    });

    // Store in queryStore for trace & report retrieval
    queryStore.set(response.queryId, response);

    return res.json(response);
  } catch (error: any) {
    console.error('API Query Execution Error:', error);
    return res.status(500).json({ error: error.message || 'Query execution failed' });
  }
};

app.post('/query', handleQuery);
app.post('/api/query', handleQuery);

// GET /trace/:query_id and /api/trace/:query_id
const handleGetTrace = (req: express.Request, res: express.Response) => {
  const queryId = req.params.query_id;
  const found = queryStore.get(queryId);

  if (!found) {
    return res.status(404).json({ error: `Execution trace not found for query_id: ${queryId}` });
  }

  return res.json({
    query_id: queryId,
    execution_trace: found.executionTrace
  });
};

app.get('/trace/:query_id', handleGetTrace);
app.get('/api/trace/:query_id', handleGetTrace);

// GET /report/:query_id and /api/report/:query_id
const handleGetReport = (req: express.Request, res: express.Response) => {
  const queryId = req.params.query_id;
  const found = queryStore.get(queryId);

  if (!found) {
    return res.status(404).json({ error: `Report not found for query_id: ${queryId}` });
  }

  const format = req.query.format || 'json';

  if (format === 'json') {
    return res.json({
      report_type: 'SatQuery Remote Sensing Forensic Report',
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      query_id: queryId,
      query: found.query,
      task_type: found.taskType,
      confidence_score: found.confidence,
      assessment: found.answer,
      evidence: found.evidence,
      execution_trace: found.executionTrace,
      audited_by: 'SatQuery Agentic Vision-Language System'
    });
  }

  // Text/Markdown format
  const markdownReport = `# SatQuery AI — Remote Sensing Analysis Report
**Query ID:** \`${found.queryId}\`
**Timestamp:** ${found.executionTrace.timestamp}
**Target Task:** ${found.taskType.toUpperCase()}
**Confidence Score:** ${(found.confidence * 100).toFixed(1)}%

---

## 1. User Geospatial Query
> "${found.query}"

---

## 2. Model Assessment & Findings
${found.answer}

---

## 3. Specialist Evidence
- **Task Category:** ${found.evidence.taskType}
- **Bounding Boxes Detected:** ${found.evidence.boundingBoxes ? found.evidence.boundingBoxes.length : 0}
${found.evidence.spectralStats ? `- **Mean NDVI:** ${found.evidence.spectralStats.meanNdvi} | **Vegetation Status:** ${found.evidence.spectralStats.vegetationHealth}` : ''}
${found.evidence.changeAnalysis ? `- **Change Event:** ${found.evidence.changeAnalysis.changeType} | **Severity:** ${found.evidence.changeAnalysis.severity} | **Affected Area:** ${found.evidence.changeAnalysis.affectedAreaPercentage}%` : ''}

---

## 4. Auditable Execution Trace
- **Primary Model:** ${found.executionTrace.primaryModel}
- **Specialist Adapter:** ${found.executionTrace.adaptedModel}
- **Execution Time:** ${found.executionTrace.totalDurationMs} ms
- **Steps Logged:** ${found.executionTrace.steps.length}

*Generated automatically by SatQuery AI (BigEarthNet Adapted Pipeline).*
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="SatQuery_Report_${queryId}.md"`);
  return res.send(markdownReport);
};

app.get('/report/:query_id', handleGetReport);
app.get('/api/report/:query_id', handleGetReport);

// POST /eval/run and /api/eval/run
const handleRunEval = async (req: express.Request, res: express.Response) => {
  try {
    const { dataset } = req.body;
    const result = await runBenchmarkEvaluation(dataset || 'All');
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Benchmark evaluation failed' });
  }
};

app.post('/eval/run', handleRunEval);
app.post('/api/eval/run', handleRunEval);

// ----------------------------------------------------
// SEISMIC & TSUNAMI REAL-TIME DATA & PREDICTOR APIS
// ----------------------------------------------------
app.get('/api/seismic/live-feed', async (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || 'day_all';
    const feedUrls: Record<string, string> = {
      hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      day_all: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      day_45: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      week_45: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
      month_sig: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
    };

    const targetUrl = feedUrls[timeframe] || feedUrls.day_all;
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch upstream USGS seismic data' });
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Seismic feed fetch failed' });
  }
});

// ----------------------------------------------------
// VITE DEV / PRODUCTION MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛰️ SatQuery AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
