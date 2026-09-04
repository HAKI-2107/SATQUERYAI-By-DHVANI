import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// Users table (anchored to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Orbital search & NLQ analysis queries table
export const orbitalQueries = pgTable('orbital_queries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  prompt: text('prompt').notNull(),
  aoiName: text('aoi_name'),
  satelliteSource: text('satellite_source').default('SENTINEL_2'),
  cloudCoverThreshold: doublePrecision('cloud_cover_threshold').default(20.0),
  resultsCount: integer('results_count').default(0),
  summary: text('summary'),
  dspyCompiled: text('dspy_compiled'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Saved Satellite Scenes & GeoJSON data
export const savedScenes = pgTable('saved_scenes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sceneId: text('scene_id').notNull(),
  title: text('title').notNull(),
  satellite: text('satellite').notNull(),
  acquisitionDate: text('acquisition_date').notNull(),
  cloudCover: doublePrecision('cloud_cover'),
  quicklookUrl: text('quicklook_url'),
  geoJson: jsonb('geojson'),
  driveFileId: text('drive_file_id'),
  driveFileName: text('drive_file_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// DSPy Teleprompter & Self-Learning Model Training runs
export const dspyRuns = pgTable('dspy_runs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  taskName: text('task_name').notNull(),
  datasetSource: text('dataset_source').notNull(), // Kaggle / NASA / ISRO
  metricScore: doublePrecision('metric_score').default(0.0),
  teleprompterType: text('teleprompter_type').default('BootstrapFewShotWithRandomSearch'),
  status: text('status').default('COMPLETED'),
  compiledPrompt: text('compiled_prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Google Workspace / Drive imports
export const driveImports = pgTable('drive_imports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  fileId: text('file_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  featureCount: integer('feature_count').default(0),
  importedAt: timestamp('imported_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  orbitalQueries: many(orbitalQueries),
  savedScenes: many(savedScenes),
  dspyRuns: many(dspyRuns),
  driveImports: many(driveImports),
}));

export const orbitalQueriesRelations = relations(orbitalQueries, ({ one }) => ({
  user: one(users, {
    fields: [orbitalQueries.userId],
    references: [users.id],
  }),
}));

export const savedScenesRelations = relations(savedScenes, ({ one }) => ({
  user: one(users, {
    fields: [savedScenes.userId],
    references: [users.id],
  }),
}));

export const dspyRunsRelations = relations(dspyRuns, ({ one }) => ({
  user: one(users, {
    fields: [dspyRuns.userId],
    references: [users.id],
  }),
}));

export const driveImportsRelations = relations(driveImports, ({ one }) => ({
  user: one(users, {
    fields: [driveImports.userId],
    references: [users.id],
  }),
}));
