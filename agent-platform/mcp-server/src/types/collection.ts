/**
 * Collection Type System
 * 
 * Comprehensive support for collections with versioning, querying, and management
 */

/**
 * Collection item
 */
export interface CollectionItem {
  id: string;
  data: any;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;  // agent ID or user ID
    updatedBy?: string;
    version: number;
    tags?: string[];
    category?: string;
    [key: string]: any;
  };
  relations?: {
    parentId?: string;
    childIds?: string[];
    linkedIds?: string[];
  };
}

/**
 * Collection permission
 */
export interface CollectionPermission {
  read: boolean;
  write: boolean;
  delete: boolean;
}

/**
 * Collection item version
 */
export interface CollectionItemVersion {
  version: number;
  data: any;
  timestamp: Date;
  userId?: string;
}

/**
 * Collection export format
 */
export type CollectionExportFormat = 'json' | 'csv' | 'ndjson';

/**
 * Collection configuration
 */
export interface CollectionConfig {
  id: string;
  name: string;
  description?: string;
  
  // Schema
  schema: Record<string, any>;  // JSON Schema for validation
  strictMode?: boolean;  // enforce schema validation
  
  // Indexing
  indexes?: Array<{
    field: string;
    type: 'text' | 'number' | 'date' | 'geo' | 'composite';
    unique?: boolean;
  }>;
  
  // Versioning
  versioning?: {
    enabled: boolean;
    maxVersions?: number;  // 0 = unlimited
  };
  
  // Permissions (userId -> permissions)
  permissions?: Record<string, CollectionPermission>;
  
  // Lifecycle
  ttl?: number;  // time-to-live in milliseconds
  archiving?: {
    enabled: boolean;
    archiveAfter: number;  // milliseconds
  };
  
  // Validation
  validators?: Array<{
    field: string;
    code: string;  // JavaScript function code
    message: string;
  }>;
  
  // Hooks
  hooks?: {
    beforeCreate?: string;  // JavaScript function code
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Collection instance (runtime state)
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, any>;
  items: Map<string, CollectionItem>;
  indexes: Array<{
    field: string;
    type: 'text' | 'number' | 'date' | 'geo' | 'composite';
    unique?: boolean;
  }>;
  permissions: Record<string, CollectionPermission>;
  versioning?: {
    enabled: boolean;
    maxVersions?: number;
  };
  validators: Array<{
    field: string;
    code: string;
    message: string;
  }>;
  hooks: {
    beforeCreate?: string;
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
  ttl?: number;
  archiving?: {
    enabled: boolean;
    archiveAfter: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  versions: Map<string, CollectionItemVersion[]>;  // itemId -> versions
  
  // Statistics
  stats: {
    totalReads: number;
    totalWrites: number;
    totalDeletes: number;
    averageQueryTime: number;
    lastQueryTime: number;
    cacheHitRate: number;
    indexHitRate: number;
  };
  
  // Cache
  queryCache: Map<string, {
    result: CollectionQueryResult;
    timestamp: number;
  }>;
}

/**
 * Collection query
 */
export interface CollectionQuery {
  // Filter
  filter?: Record<string, any>;  // MongoDB-style query
  
  // Pagination
  limit?: number;
  skip?: number;
  
  // Sorting
  sort?: Record<string, 1 | -1>;  // field -> 1 (asc) or -1 (desc)
  
  // Projection
  fields?: string[];  // fields to include
  exclude?: string[];  // fields to exclude
  
  // Full-text search
  search?: string;
  
  // Aggregation
  aggregations?: any[];
  
  // Relations
  populate?: string[];  // relation fields to populate
}

/**
 * Collection query result
 */
export interface CollectionQueryResult {
  items: CollectionItem[];
  total: number;
  hasMore: boolean;
  skip?: number;
  limit?: number;
  aggregations?: Record<string, any>;
  executionTime: number;  // milliseconds
  fromCache?: boolean;
}

/**
 * Collection operation result
 */
export interface CollectionOperationResult {
  success: boolean;
  itemId?: string;
  version?: number;
  message?: string;
  error?: string;
  affectedCount?: number;
}

/**
 * Collection transaction
 */
export interface CollectionTransaction {
  id: string;
  collectionId: string;
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    itemId?: string;
    data?: any;
  }>;
  status: 'pending' | 'committed' | 'rolled_back' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Collection error classes
 */
export class CollectionError extends Error {
  constructor(
    message: string,
    public collectionId: string,
    public code?: string
  ) {
    super(message);
    this.name = 'CollectionError';
  }
}

export class CollectionValidationError extends CollectionError {
  constructor(
    message: string,
    collectionId: string,
    public validationErrors: any[]
  ) {
    super(message, collectionId, 'VALIDATION_ERROR');
    this.name = 'CollectionValidationError';
  }
}

export class CollectionNotFoundError extends CollectionError {
  constructor(
    message: string,
    collectionId: string,
    public itemId?: string
  ) {
    super(message, collectionId, 'NOT_FOUND');
    this.name = 'CollectionNotFoundError';
  }
}

export class CollectionPermissionError extends CollectionError {
  constructor(
    message: string,
    collectionId: string,
    public userId?: string,
    public operation?: string
  ) {
    super(message, collectionId, 'PERMISSION_DENIED');
    this.name = 'CollectionPermissionError';
  }
}

/**
 * Collection export/import formats
 */
export interface CollectionExport {
  config: CollectionConfig;
  items: CollectionItem[];
  versions?: Map<string, CollectionItem[]>;
  exportedAt: Date;
  format: 'json' | 'csv' | 'ndjson';
}

/**
 * Collection templates
 */
export interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Partial<CollectionConfig>;
  sampleData?: any[];
  exampleUsage: string;
}
