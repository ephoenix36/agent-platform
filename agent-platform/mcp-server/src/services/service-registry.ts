/**
 * Service Registry
 * 
 * Central registry for accessing service instances across the application.
 * Provides dependency injection for services.
 */

import { SkillsService } from './skills-service.js';
import { CollectionService } from './collection-service.js';
import { ToolkitManager } from './toolkit-manager.js';
import { Logger } from '../utils/logging.js';

let skillsService: SkillsService | null = null;
let collectionService: CollectionService | null = null;
let toolkitManager: ToolkitManager | null = null;

/**
 * Initialize the skills service
 */
export function initializeSkillsService(tm: ToolkitManager, logger: Logger, storageDir?: string): SkillsService {
  skillsService = new SkillsService(tm, logger, storageDir);
  return skillsService;
}

/**
 * Get the skills service instance
 */
export function getSkillsService(): SkillsService {
  if (!skillsService) {
    throw new Error('Skills service not initialized. Call initializeSkillsService first.');
  }
  return skillsService;
}

/**
 * Initialize the collection service
 */
export function initializeCollectionService(logger: Logger): CollectionService {
  collectionService = new CollectionService(logger);
  return collectionService;
}

/**
 * Get the collection service instance
 */
export function getCollectionService(): CollectionService {
  if (!collectionService) {
    throw new Error('Collection service not initialized. Call initializeCollectionService first.');
  }
  return collectionService;
}

/**
 * Set the toolkit manager instance
 */
export function setToolkitManager(tm: ToolkitManager): void {
  toolkitManager = tm;
}

/**
 * Get the toolkit manager instance
 */
export function getToolkitManager(): ToolkitManager {
  if (!toolkitManager) {
    throw new Error('Toolkit manager not initialized. Call setToolkitManager first.');
  }
  return toolkitManager;
}
