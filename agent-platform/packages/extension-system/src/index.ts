/**
 * Extension System - Main Export
 */

// Manifest schemas and types
export {
  ExtensionManifestSchema,
  ExtensionMetadataSchema,
  ExtensionDependencySchema,
  ExtensionAuthorSchema,
  ExtensionContributionSchema,
  parseManifest,
  validateManifest,
  isValidExtensionId,
  isValidVersion,
  Permission,
  ExtensionState,
  ExtensionCategory,
  type ExtensionManifest,
  type ExtensionMetadata,
  type ExtensionDependency,
  type ExtensionAuthor,
  type ExtensionContribution
} from './manifest/schema';

// Registry
export {
  ExtensionRegistry,
  RegistryError,
  RegistryEvent,
  type RegistryConfig
} from './registry/registry';

// Loader
export {
  ExtensionLoader,
  LoaderError,
  LoaderEvent,
  type ExtensionModule,
  type ExtensionContext,
  type Disposable
} from './loader/loader';
