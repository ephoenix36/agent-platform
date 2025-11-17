/**
 * Collection Service
 * 
 * Manages collections with querying, versioning, permissions, and lifecycle hooks
 */

import { Logger } from '../utils/logging.js';
import {
  CollectionConfig,
  Collection,
  CollectionItem,
  CollectionQuery,
  CollectionQueryResult,
  CollectionTransaction,
  CollectionError,
  CollectionValidationError,
  CollectionNotFoundError,
  CollectionPermissionError,
  CollectionPermission,
  CollectionItemVersion,
  CollectionExportFormat
} from '../types/collection.js';
import { EventEmitter } from 'events';
import Ajv from 'ajv';

const ajv = new Ajv();

export class CollectionService extends EventEmitter {
  private collections: Map<string, Collection> = new Map();
  private transactions: Map<string, CollectionTransaction> = new Map();
  
  constructor(private logger: Logger) {
    super();
  }

  /**
   * Create a new collection
   */
  createCollection(config: CollectionConfig): Collection {
    this.logger.info(`Creating collection: ${config.id}`);

    // Validate configuration
    this.validateCollectionConfig(config);

    // Check if already exists
    if (this.collections.has(config.id)) {
      throw new CollectionError(
        `Collection already exists: ${config.id}`,
        config.id
      );
    }

    const collection: Collection = {
      id: config.id,
      name: config.name,
      description: config.description,
      schema: config.schema,
      items: new Map(),
      indexes: config.indexes || [],
      permissions: config.permissions || {},
      versioning: config.versioning,
      validators: config.validators || [],
      hooks: config.hooks || {},
      ttl: config.ttl,
      archiving: config.archiving,
      metadata: config.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      itemCount: 0,
      versions: new Map(),
      stats: {
        totalReads: 0,
        totalWrites: 0,
        totalDeletes: 0,
        averageQueryTime: 0,
        lastQueryTime: 0,
        cacheHitRate: 0,
        indexHitRate: 0
      },
      queryCache: new Map()
    };

    this.collections.set(config.id, collection);
    this.emit('collection:created', collection);

    return collection;
  }

  /**
   * Get collection by ID
   */
  getCollection(collectionId: string): Collection {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(
        `Collection not found: ${collectionId}`,
        collectionId
      );
    }
    return collection;
  }

  /**
   * Create item in collection
   */
  async createItem(
    collectionId: string,
    data: any,
    userId?: string
  ): Promise<CollectionItem> {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'write', userId);

    // Run beforeCreate hook
    if (collection.hooks.beforeCreate) {
      data = await this.runHook(collection.hooks.beforeCreate, { data });
    }

    // Validate data
    await this.validateItem(collection, data);

    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const item: CollectionItem = {
      id: itemId,
      data,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        version: 1,
        tags: [],
        relations: {}
      }
    };

    collection.items.set(itemId, item);
    collection.itemCount++;
    collection.updatedAt = now;
    collection.stats.totalWrites++;

    // Store version if versioning enabled
    if (collection.versioning?.enabled) {
      this.storeVersion(collection, item);
    }

    // Run afterCreate hook
    if (collection.hooks.afterCreate) {
      await this.runHook(collection.hooks.afterCreate, { item });
    }

    this.logger.debug(`Created item ${itemId} in collection ${collectionId}`);
    this.emit('collection:item:created', { collection, item });

    return item;
  }

  /**
   * Update item in collection
   */
  async updateItem(
    collectionId: string,
    itemId: string,
    data: any,
    userId?: string
  ): Promise<CollectionItem> {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'write', userId);

    const item = collection.items.get(itemId);
    if (!item) {
      throw new CollectionNotFoundError(
        `Item not found: ${itemId}`,
        collectionId,
        itemId
      );
    }

    // Run beforeUpdate hook
    if (collection.hooks.beforeUpdate) {
      data = await this.runHook(collection.hooks.beforeUpdate, { item, data });
    }

    // Validate data
    await this.validateItem(collection, data);

    // Update item
    item.data = { ...item.data, ...data };
    item.metadata.updatedAt = new Date();
    item.metadata.updatedBy = userId;
    item.metadata.version++;

    collection.updatedAt = new Date();
    collection.stats.totalWrites++;

    // Store version if versioning enabled
    if (collection.versioning?.enabled) {
      this.storeVersion(collection, item);
    }

    // Run afterUpdate hook
    if (collection.hooks.afterUpdate) {
      await this.runHook(collection.hooks.afterUpdate, { item });
    }

    // Clear query cache
    collection.queryCache.clear();

    this.logger.debug(`Updated item ${itemId} in collection ${collectionId}`);
    this.emit('collection:item:updated', { collection, item });

    return item;
  }

  /**
   * Delete item from collection
   */
  async deleteItem(
    collectionId: string,
    itemId: string,
    userId?: string
  ): Promise<void> {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'delete', userId);

    const item = collection.items.get(itemId);
    if (!item) {
      throw new CollectionNotFoundError(
        `Item not found: ${itemId}`,
        collectionId,
        itemId
      );
    }

    // Run beforeDelete hook
    if (collection.hooks.beforeDelete) {
      await this.runHook(collection.hooks.beforeDelete, { item });
    }

    collection.items.delete(itemId);
    collection.itemCount--;
    collection.updatedAt = new Date();
    collection.stats.totalDeletes++;

    // Run afterDelete hook
    if (collection.hooks.afterDelete) {
      await this.runHook(collection.hooks.afterDelete, { itemId });
    }

    // Clear query cache
    collection.queryCache.clear();

    this.logger.debug(`Deleted item ${itemId} from collection ${collectionId}`);
    this.emit('collection:item:deleted', { collection, itemId });
  }

  /**
   * Query collection
   */
  async query(
    collectionId: string,
    query: CollectionQuery,
    userId?: string
  ): Promise<CollectionQueryResult> {
    const collection = this.getCollection(collectionId);
    const startTime = Date.now();
    
    // Check permissions
    this.checkPermission(collection, 'read', userId);

    // Check cache
    const cacheKey = JSON.stringify(query);
    const cached = collection.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
      collection.stats.totalReads++;
      collection.stats.cacheHitRate = (collection.stats.cacheHitRate * 0.9) + 0.1;
      return { ...cached.result, fromCache: true };
    }

    let items = Array.from(collection.items.values());

    // Apply filter
    if (query.filter) {
      items = items.filter(item => this.matchesFilter(item.data, query.filter!));
    }

    const total = items.length;

    // Apply sorting
    if (query.sort) {
      items = this.sortItems(items, query.sort);
    }

    // Apply pagination
    const limit = query.limit || 100;
    const skip = query.skip || 0;
    const paginatedItems = items.slice(skip, skip + limit);

    // Apply populate
    if (query.populate) {
      for (const item of paginatedItems) {
        await this.populateRelations(item, query.populate);
      }
    }

    // Apply aggregation
    let aggregations: Record<string, any> | undefined;
    if (query.aggregations) {
      aggregations = this.runAggregations(items, query.aggregations);
    }

    const executionTime = Date.now() - startTime;

    const result: CollectionQueryResult = {
      items: paginatedItems,
      total,
      hasMore: skip + limit < total,
      skip,
      limit,
      aggregations,
      executionTime
    };

    // Update stats
    collection.stats.totalReads++;
    collection.stats.lastQueryTime = executionTime;
    collection.stats.averageQueryTime = 
      (collection.stats.averageQueryTime * 0.9) + (executionTime * 0.1);

    // Cache result
    collection.queryCache.set(cacheKey, { result, timestamp: Date.now() });

    this.logger.debug(`Queried collection ${collectionId}: ${paginatedItems.length}/${total} items in ${executionTime}ms`);

    return result;
  }

  /**
   * Get item by ID
   */
  getItem(collectionId: string, itemId: string, userId?: string): CollectionItem {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'read', userId);

    const item = collection.items.get(itemId);
    if (!item) {
      throw new CollectionNotFoundError(
        `Item not found: ${itemId}`,
        collectionId,
        itemId
      );
    }

    collection.stats.totalReads++;
    return item;
  }

  /**
   * Start transaction
   */
  beginTransaction(collectionId: string): CollectionTransaction {
    const collection = this.getCollection(collectionId);
    
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: CollectionTransaction = {
      id: transactionId,
      collectionId,
      operations: [],
      status: 'pending',
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);
    this.logger.debug(`Started transaction ${transactionId} for collection ${collectionId}`);

    return transaction;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transactionId: string, userId?: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new CollectionError(`Transaction not found: ${transactionId}`, 'unknown');
    }

    try {
      for (const op of transaction.operations) {
        if (op.type === 'create') {
          await this.createItem(transaction.collectionId, op.data, userId);
        } else if (op.type === 'update') {
          await this.updateItem(transaction.collectionId, op.itemId!, op.data, userId);
        } else if (op.type === 'delete') {
          await this.deleteItem(transaction.collectionId, op.itemId!, userId);
        }
      }

      transaction.status = 'committed';
      transaction.completedAt = new Date();
      
      this.logger.info(`Committed transaction ${transactionId} with ${transaction.operations.length} operations`);
      this.emit('collection:transaction:committed', transaction);
    } catch (error: any) {
      transaction.status = 'failed';
      transaction.error = error.message;
      transaction.completedAt = new Date();
      
      this.logger.error(`Transaction ${transactionId} failed:`, error);
      throw new CollectionError(
        `Transaction failed: ${error.message}`,
        transaction.collectionId
      );
    } finally {
      this.transactions.delete(transactionId);
    }
  }

  /**
   * Rollback transaction
   */
  rollbackTransaction(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new CollectionError(`Transaction not found: ${transactionId}`, 'unknown');
    }

    transaction.status = 'rolled_back';
    transaction.completedAt = new Date();
    this.transactions.delete(transactionId);

    this.logger.info(`Rolled back transaction ${transactionId}`);
    this.emit('collection:transaction:rolled_back', transaction);
  }

  /**
   * Export collection
   */
  async export(
    collectionId: string,
    format: CollectionExportFormat,
    userId?: string
  ): Promise<string> {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'read', userId);

    const items = Array.from(collection.items.values());

    if (format === 'json') {
      return JSON.stringify(items, null, 2);
    } else if (format === 'csv') {
      return this.exportToCSV(items);
    } else if (format === 'ndjson') {
      return items.map(item => JSON.stringify(item)).join('\n');
    }

    throw new CollectionError(`Unsupported export format: ${format}`, collectionId);
  }

  /**
   * Import collection data
   */
  async import(
    collectionId: string,
    data: string,
    format: CollectionExportFormat,
    userId?: string
  ): Promise<number> {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'write', userId);

    let items: any[];
    
    if (format === 'json') {
      items = JSON.parse(data);
    } else if (format === 'ndjson') {
      items = data.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    } else {
      throw new CollectionError(`Unsupported import format: ${format}`, collectionId);
    }

    let imported = 0;
    for (const itemData of items) {
      await this.createItem(collectionId, itemData.data || itemData, userId);
      imported++;
    }

    this.logger.info(`Imported ${imported} items into collection ${collectionId}`);
    return imported;
  }

  /**
   * Get item versions
   */
  getItemVersions(
    collectionId: string,
    itemId: string,
    userId?: string
  ): CollectionItemVersion[] {
    const collection = this.getCollection(collectionId);
    
    // Check permissions
    this.checkPermission(collection, 'read', userId);

    if (!collection.versioning?.enabled) {
      throw new CollectionError(
        'Versioning not enabled for this collection',
        collectionId
      );
    }

    const versions = collection.versions.get(itemId) || [];
    return versions;
  }

  // ========== Private Helper Methods ==========

  /**
   * Validate collection configuration
   */
  private validateCollectionConfig(config: CollectionConfig): void {
    const errors: string[] = [];

    if (!config.id) errors.push('Collection ID is required');
    if (!config.name) errors.push('Collection name is required');
    if (!config.schema) errors.push('Collection schema is required');

    if (errors.length > 0) {
      throw new CollectionValidationError(
        'Collection configuration validation failed',
        config.id || 'unknown',
        errors
      );
    }
  }

  /**
   * Validate item against schema
   */
  private async validateItem(collection: Collection, data: any): Promise<void> {
    const errors: string[] = [];

    // JSON Schema validation
    const validate = ajv.compile(collection.schema);
    if (!validate(data)) {
      errors.push(...(validate.errors?.map(e => `${e.schemaPath} ${e.message}`) || []));
    }

    // Custom validators
    for (const validator of collection.validators) {
      try {
        const validatorFn = new Function('data', validator.code);
        const result = await validatorFn.call(null, data);
        if (!result) {
          errors.push(validator.message || 'Custom validation failed');
        }
      } catch (error: any) {
        errors.push(`Validator error: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new CollectionValidationError(
        'Item validation failed',
        collection.id,
        errors
      );
    }
  }

  /**
   * Run lifecycle hook
   */
  private async runHook(code: string, context: any): Promise<any> {
    try {
      const hookFn = new Function('context', `return (${code})(context)`);
      return await hookFn.call(null, context);
    } catch (error: any) {
      this.logger.error('Hook execution error:', error);
      throw error;
    }
  }

  /**
   * Store item version
   */
  private storeVersion(collection: Collection, item: CollectionItem): void {
    if (!collection.versions.has(item.id)) {
      collection.versions.set(item.id, []);
    }

    const versions = collection.versions.get(item.id)!;
    const version: CollectionItemVersion = {
      version: item.metadata.version,
      data: JSON.parse(JSON.stringify(item.data)),
      timestamp: new Date(),
      userId: item.metadata.updatedBy
    };

    versions.push(version);

    // Limit versions if configured
    const maxVersions = collection.versioning?.maxVersions || 10;
    if (versions.length > maxVersions) {
      versions.shift();
    }
  }

  /**
   * Match filter
   */
  private matchesFilter(data: any, filter: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Operators: $eq, $ne, $gt, $lt, $gte, $lte, $in, $nin, $regex
        for (const [op, val] of Object.entries(value)) {
          if (op === '$eq' && data[key] !== val) return false;
          if (op === '$ne' && data[key] === val) return false;
          if (op === '$gt' && !(data[key] > (val as any))) return false;
          if (op === '$lt' && !(data[key] < (val as any))) return false;
          if (op === '$gte' && !(data[key] >= (val as any))) return false;
          if (op === '$lte' && !(data[key] <= (val as any))) return false;
          if (op === '$in' && (!Array.isArray(val) || !val.includes(data[key]))) return false;
          if (op === '$nin' && Array.isArray(val) && val.includes(data[key])) return false;
          if (op === '$regex' && !new RegExp(val as string).test(data[key])) return false;
        }
      } else {
        if (data[key] !== value) return false;
      }
    }
    return true;
  }

  /**
   * Sort items
   */
  private sortItems(items: CollectionItem[], sort: Record<string, 1 | -1>): CollectionItem[] {
    return items.sort((a, b) => {
      for (const [key, order] of Object.entries(sort)) {
        const aVal = a.data[key];
        const bVal = b.data[key];
        
        if (aVal < bVal) return order === 1 ? -1 : 1;
        if (aVal > bVal) return order === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Populate relations
   */
  private async populateRelations(item: CollectionItem, populate: string[]): Promise<void> {
    for (const path of populate) {
      const relations = item.metadata.relations?.[path];
      if (relations && Array.isArray(relations)) {
        item.data[path] = await Promise.all(
          relations.map(async rel => {
            try {
              return this.getItem(rel.collectionId, rel.itemId);
            } catch {
              return null;
            }
          })
        );
      }
    }
  }

  /**
   * Run aggregations
   */
  private runAggregations(items: CollectionItem[], aggregations: any[]): Record<string, any> {
    const results: Record<string, any> = {};

    for (const agg of aggregations) {
      if (agg.$count) {
        results[agg.$count] = items.length;
      }
      if (agg.$sum) {
        const field = agg.$sum;
        results[`sum_${field}`] = items.reduce((sum, item) => sum + (item.data[field] || 0), 0);
      }
      if (agg.$avg) {
        const field = agg.$avg;
        const sum = items.reduce((sum, item) => sum + (item.data[field] || 0), 0);
        results[`avg_${field}`] = items.length > 0 ? sum / items.length : 0;
      }
      if (agg.$min) {
        const field = agg.$min;
        results[`min_${field}`] = Math.min(...items.map(item => item.data[field] || 0));
      }
      if (agg.$max) {
        const field = agg.$max;
        results[`max_${field}`] = Math.max(...items.map(item => item.data[field] || 0));
      }
    }

    return results;
  }

  /**
   * Export to CSV
   */
  private exportToCSV(items: CollectionItem[]): string {
    if (items.length === 0) return '';

    const headers = Object.keys(items[0].data);
    const rows = items.map(item => 
      headers.map(h => JSON.stringify(item.data[h] || '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(collectionId: string): any {
    const collection = this.getCollection(collectionId);
    return {
      itemCount: collection.itemCount,
      stats: collection.stats,
      cacheSize: collection.queryCache.size,
      versionCount: Array.from(collection.versions.values())
        .reduce((sum, versions) => sum + versions.length, 0)
    };
  }

  /**
   * List all collections
   */
  listCollections(): Collection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Delete a collection
   */
  deleteCollection(collectionId: string): void {
    if (!this.collections.has(collectionId)) {
      throw new CollectionNotFoundError(
        `Collection not found: ${collectionId}`,
        collectionId
      );
    }
    
    this.collections.delete(collectionId);
    this.emit('collection:deleted', collectionId);
    this.logger.info(`Collection deleted: ${collectionId}`);
  }

  /**
   * Check user permission (public wrapper)
   */
  checkPermission(
    collection: Collection,
    permission: keyof CollectionPermission,
    userId?: string
  ): void {
    if (!userId) return; // No user means system access

    const userPermissions = collection.permissions[userId];
    if (!userPermissions || !userPermissions[permission]) {
      throw new CollectionPermissionError(
        `User ${userId} does not have ${permission} permission`,
        collection.id,
        userId,
        permission
      );
    }
  }
}
