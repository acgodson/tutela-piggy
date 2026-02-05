import { pgTable, serial, varchar, timestamp, integer, real, boolean, jsonb, text, date, index } from 'drizzle-orm/pg-core';

// Pig registry - farmer's pig identification system
export const pigRegistry = pgTable('pig_registry', {
    id: serial('id').primaryKey(),
    pigId: varchar('pig_id', { length: 50 }).notNull().unique(),
    pigNumber: integer('pig_number').notNull(), // Primary identifier (1-30)
    pigName: varchar('pig_name', { length: 100 }),
    markerColors: text('marker_colors').array(), // Legacy/backup - now optional
    birthDate: date('birth_date'),
    penId: varchar('pen_id', { length: 50 }).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    pigIdIdx: index('registry_pig_id_idx').on(table.pigId),
    pigNumberIdx: index('registry_pig_number_idx').on(table.pigNumber),
    penIdIdx: index('registry_pen_id_idx').on(table.penId),
}));

// Frame-level detections (raw data from each video frame)
export const pigDetections = pgTable('pig_detections', {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    frameNumber: integer('frame_number').notNull(),
    cameraId: varchar('camera_id', { length: 50 }).notNull(),
    batchId: varchar('batch_id', { length: 100 }), // Links to video session

    // Pig identification - NUMBER BASED (primary)
    pigNumber: integer('pig_number'), // 1-30, null if unidentified
    numberConfidence: real('number_confidence'), // Gemini's confidence in number reading
    pigId: varchar('pig_id', { length: 50 }), // Legacy reference to pig_registry

    // Detection confidence
    confidence: real('confidence').notNull(),

    // Legacy color markers (optional)
    markerColors: text('marker_colors').array(),

    // Bounding box coordinates
    bboxX: integer('bbox_x').notNull(),
    bboxY: integer('bbox_y').notNull(),
    bboxWidth: integer('bbox_width').notNull(),
    bboxHeight: integer('bbox_height').notNull(),

    // Segmentation data
    maskArea: integer('mask_area'),
    maskCompactness: real('mask_compactness'),

    // LLM behavior analysis
    posture: varchar('posture', { length: 50 }), // standing, lying_down, sitting, unknown
    activity: varchar('activity', { length: 50 }), // eating, drinking, walking, resting, socializing, unknown
    orientation: real('orientation'), // body angle 0-360 degrees
    movementDetected: boolean('movement_detected'),
    behaviorConfidence: real('behavior_confidence'),

    // Tracking data
    trackId: integer('track_id'),
    movementSpeed: real('movement_speed'),
    activityLevel: varchar('activity_level', { length: 20 }), // resting, walking, active, running
}, (table) => ({
    timestampIdx: index('detections_timestamp_idx').on(table.timestamp),
    pigNumberIdx: index('detections_pig_number_idx').on(table.pigNumber),
    batchIdIdx: index('detections_batch_id_idx').on(table.batchId),
    frameNumberIdx: index('detections_frame_number_idx').on(table.frameNumber),
    cameraIdIdx: index('detections_camera_id_idx').on(table.cameraId),
}));

// Aggregated daily tracking data (processed from raw detections)
export const pigTracking = pgTable('pig_tracking', {
    id: serial('id').primaryKey(),
    pigId: varchar('pig_id', { length: 50 }).notNull(),
    date: date('date').notNull(),

    // Movement metrics
    totalDistanceMoved: real('total_distance_moved'),
    avgSpeed: real('avg_speed'),
    maxSpeed: real('max_speed'),
    activeTimeMinutes: integer('active_time_minutes'),
    restingTimeMinutes: integer('resting_time_minutes'),

    // Behavioral patterns
    feedingVisits: integer('feeding_visits'),
    waterVisits: integer('water_visits'),
    socialInteractions: integer('social_interactions'),

    // Health indicators
    mobilityScore: real('mobility_score'), // 0-100 scale
    activityLevel: varchar('activity_level', { length: 20 }), // low, normal, high
    healthAlerts: integer('health_alerts'),

    // Territory analysis
    preferredZones: text('preferred_zones').array(),
    territorySize: real('territory_size'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    pigIdDateIdx: index('pig_id_date_idx').on(table.pigId, table.date),
    dateIdx: index('date_idx').on(table.date),
}));

// Real-time alerts for farmers
export const pigAlerts = pgTable('pig_alerts', {
    id: serial('id').primaryKey(),
    pigId: varchar('pig_id', { length: 50 }).notNull(),
    alertType: varchar('alert_type', { length: 50 }).notNull(), // health_concern, behavioral, feeding_absence, low_mobility
    severity: varchar('severity', { length: 20 }).notNull(), // low, medium, high, critical
    message: text('message').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    resolved: boolean('resolved').default(false).notNull(),
    resolvedAt: timestamp('resolved_at'),

    // Evidence and context
    evidenceFrames: integer('evidence_frames').array(),
    movementData: jsonb('movement_data'),
    recommendations: text('recommendations').array(),

    // Farmer response
    farmerNotes: text('farmer_notes'),
    actionTaken: varchar('action_taken', { length: 100 }),
}, (table) => ({
    pigIdIdx: index('alerts_pig_id_idx').on(table.pigId),
    timestampIdx: index('alerts_timestamp_idx').on(table.timestamp),
    resolvedIdx: index('alerts_resolved_idx').on(table.resolved),
    severityIdx: index('alerts_severity_idx').on(table.severity),
}));

// Camera and pen configuration
export const cameraConfig = pgTable('camera_config', {
    id: serial('id').primaryKey(),
    cameraId: varchar('camera_id', { length: 50 }).notNull().unique(),
    cameraName: varchar('camera_name', { length: 100 }).notNull(),
    penId: varchar('pen_id', { length: 50 }).notNull(),

    // Camera settings
    streamUrl: varchar('stream_url', { length: 255 }),
    resolution: varchar('resolution', { length: 20 }), // 1920x1080, 1280x720, etc.
    fps: integer('fps').default(30),

    // Pen dimensions for heat map calculations
    penWidth: integer('pen_width'), // in pixels or meters
    penHeight: integer('pen_height'),

    // Zone definitions (feeding area, water area, etc.)
    zoneDefinitions: jsonb('zone_definitions'),

    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    cameraIdIdx: index('config_camera_id_idx').on(table.cameraId),
    penIdIdx: index('config_pen_id_idx').on(table.penId),
}));

// Video processing sessions
export const videoSessions = pgTable('video_sessions', {
    id: serial('id').primaryKey(),
    batchId: varchar('batch_id', { length: 100 }).notNull().unique(), // Unique batch identifier
    filename: varchar('filename', { length: 255 }),
    cameraId: varchar('camera_id', { length: 50 }),
    sessionType: varchar('session_type', { length: 20 }).default('video'), // 'video' or 'live_camera'

    // Processing details
    totalFrames: integer('total_frames'),
    processedFrames: integer('processed_frames').default(0),
    targetFps: integer('target_fps').default(2),
    status: varchar('status', { length: 20 }).default('processing'), // processing, completed, error

    // Timestamps
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),

    // Results summary
    totalPigsDetected: integer('total_pigs_detected').default(0),
    avgConfidence: real('avg_confidence'),
    processingTimeSeconds: real('processing_time_seconds'),

    // Pig number tracking summary (from Gemini identification)
    pigTrackingSummary: jsonb('pig_tracking_summary'), // {pigNumber: {appearances, avgConfidence}}
    uniquePigsIdentified: integer('unique_pigs_identified').default(0),
}, (table) => ({
    batchIdIdx: index('sessions_batch_id_idx').on(table.batchId),
    statusIdx: index('sessions_status_idx').on(table.status),
    startedAtIdx: index('sessions_started_at_idx').on(table.startedAt),
    sessionTypeIdx: index('sessions_type_idx').on(table.sessionType),
}));
export const farmConfig = pgTable('farm_config', {
    id: serial('id').primaryKey(),
    farmId: varchar('farm_id', { length: 50 }).notNull().unique(),
    farmName: varchar('farm_name', { length: 100 }).notNull(),
    farmerName: varchar('farmer_name', { length: 100 }).notNull(),
    farmerEmail: varchar('farmer_email', { length: 100 }),
    farmerPhone: varchar('farmer_phone', { length: 20 }),

    // Alert preferences
    alertPreferences: jsonb('alert_preferences'), // SMS, email, app notifications
    alertThresholds: jsonb('alert_thresholds'), // Custom thresholds for different alert types

    // System settings
    timezone: varchar('timezone', { length: 50 }).default('UTC'),
    language: varchar('language', { length: 10 }).default('en'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});



// Export types for TypeScript
export type PigRegistry = typeof pigRegistry.$inferSelect;
export type NewPigRegistry = typeof pigRegistry.$inferInsert;

export type PigDetection = typeof pigDetections.$inferSelect;
export type NewPigDetection = typeof pigDetections.$inferInsert;

export type PigTracking = typeof pigTracking.$inferSelect;
export type NewPigTracking = typeof pigTracking.$inferInsert;

export type PigAlert = typeof pigAlerts.$inferSelect;
export type NewPigAlert = typeof pigAlerts.$inferInsert;

export type CameraConfig = typeof cameraConfig.$inferSelect;
export type NewCameraConfig = typeof cameraConfig.$inferInsert;

export type FarmConfig = typeof farmConfig.$inferSelect;
export type NewFarmConfig = typeof farmConfig.$inferInsert;

export type VideoSession = typeof videoSessions.$inferSelect;
export type NewVideoSession = typeof videoSessions.$inferInsert;