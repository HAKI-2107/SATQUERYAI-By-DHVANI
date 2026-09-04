import { db } from './index';
import { orbitalQueries, savedScenes, dspyRuns, driveImports, users } from './schema';
import { desc, eq } from 'drizzle-orm';

export async function saveOrbitalQueryRecord(data: {
  userId?: number;
  prompt: string;
  aoiName?: string;
  satelliteSource?: string;
  cloudCoverThreshold?: number;
  resultsCount?: number;
  summary?: string;
  dspyCompiled?: string;
}) {
  try {
    const res = await db.insert(orbitalQueries).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Error saving orbital query to Cloud SQL:', error);
    throw new Error('Failed to save orbital query to Cloud SQL', { cause: error });
  }
}

export async function getRecentOrbitalQueries(limit = 20) {
  try {
    return await db.select({
      id: orbitalQueries.id,
      prompt: orbitalQueries.prompt,
      aoiName: orbitalQueries.aoiName,
      satelliteSource: orbitalQueries.satelliteSource,
      cloudCoverThreshold: orbitalQueries.cloudCoverThreshold,
      resultsCount: orbitalQueries.resultsCount,
      summary: orbitalQueries.summary,
      createdAt: orbitalQueries.createdAt,
      userEmail: users.email
    })
    .from(orbitalQueries)
    .leftJoin(users, eq(orbitalQueries.userId, users.id))
    .orderBy(desc(orbitalQueries.createdAt))
    .limit(limit);
  } catch (error) {
    console.error('Error fetching orbital queries from Cloud SQL:', error);
    throw new Error('Failed to fetch orbital queries from Cloud SQL', { cause: error });
  }
}

export async function saveSatelliteSceneRecord(data: {
  userId?: number;
  sceneId: string;
  title: string;
  satellite: string;
  acquisitionDate: string;
  cloudCover?: number;
  quicklookUrl?: string;
  geoJson?: any;
  driveFileId?: string;
  driveFileName?: string;
  notes?: string;
}) {
  try {
    const res = await db.insert(savedScenes).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Error saving satellite scene to Cloud SQL:', error);
    throw new Error('Failed to save scene', { cause: error });
  }
}

export async function getSavedScenes(limit = 30) {
  try {
    return await db.select().from(savedScenes).orderBy(desc(savedScenes.createdAt)).limit(limit);
  } catch (error) {
    console.error('Error fetching saved scenes from Cloud SQL:', error);
    throw new Error('Failed to fetch scenes', { cause: error });
  }
}

export async function saveDspyRunRecord(data: {
  userId?: number;
  taskName: string;
  datasetSource: string;
  metricScore?: number;
  teleprompterType?: string;
  status?: string;
  compiledPrompt?: string;
}) {
  try {
    const res = await db.insert(dspyRuns).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Error saving DSPy run to Cloud SQL:', error);
    throw new Error('Failed to save DSPy run', { cause: error });
  }
}

export async function getDspyRuns(limit = 20) {
  try {
    return await db.select().from(dspyRuns).orderBy(desc(dspyRuns.createdAt)).limit(limit);
  } catch (error) {
    console.error('Error fetching DSPy runs from Cloud SQL:', error);
    throw new Error('Failed to fetch DSPy runs', { cause: error });
  }
}

export async function saveDriveImportRecord(data: {
  userId?: number;
  fileId: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  featureCount?: number;
}) {
  try {
    const res = await db.insert(driveImports).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Error saving Drive import record:', error);
    throw new Error('Failed to save drive import', { cause: error });
  }
}

export async function getDriveImports(limit = 20) {
  try {
    return await db.select().from(driveImports).orderBy(desc(driveImports.importedAt)).limit(limit);
  } catch (error) {
    console.error('Error fetching drive imports:', error);
    throw new Error('Failed to fetch drive imports', { cause: error });
  }
}
