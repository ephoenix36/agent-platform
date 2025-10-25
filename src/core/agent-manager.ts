import { AgentInstruction } from '../types/schema.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Core agent management operations
 */
export class AgentManager {
  private collectionsPath: string;

  constructor(collectionsPath: string = './collections') {
    this.collectionsPath = collectionsPath;
  }

  /**
   * Load an agent instruction from disk
   */
  async loadAgent(collection: string, subsection: string, agentName: string): Promise<AgentInstruction> {
    const agentPath = path.join(
      this.collectionsPath,
      collection,
      subsection,
      `${agentName}.json`
    );

    const data = await fs.readFile(agentPath, 'utf-8');
    return JSON.parse(data) as AgentInstruction;
  }

  /**
   * Save an agent instruction to disk
   */
  async saveAgent(agent: AgentInstruction): Promise<void> {
    const agentPath = path.join(
      this.collectionsPath,
      agent.collection,
      agent.subsection,
      `${agent.id}.json`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(agentPath), { recursive: true });

    // Update timestamp
    agent.updatedAt = new Date().toISOString();

    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));
  }

  /**
   * List all agents in a collection/subsection
   */
  async listAgents(collection?: string, subsection?: string): Promise<AgentInstruction[]> {
    const agents: AgentInstruction[] = [];
    
    const basePath = collection 
      ? subsection 
        ? path.join(this.collectionsPath, collection, subsection)
        : path.join(this.collectionsPath, collection)
      : this.collectionsPath;

    try {
      const entries = await this.walkDirectory(basePath);
      
      for (const entry of entries) {
        if (entry.endsWith('.json')) {
          const data = await fs.readFile(entry, 'utf-8');
          agents.push(JSON.parse(data) as AgentInstruction);
        }
      }
    } catch (error) {
      console.error(`Error listing agents: ${error}`);
    }

    return agents;
  }

  /**
   * Search agents by tags or description
   */
  async searchAgents(query: string): Promise<AgentInstruction[]> {
    const allAgents = await this.listAgents();
    const lowerQuery = query.toLowerCase();

    return allAgents.filter(agent => 
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.description.toLowerCase().includes(lowerQuery) ||
      agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Delete an agent
   */
  async deleteAgent(collection: string, subsection: string, agentName: string): Promise<void> {
    const agentPath = path.join(
      this.collectionsPath,
      collection,
      subsection,
      `${agentName}.json`
    );

    await fs.unlink(agentPath);
  }

  /**
   * Recursively walk directory
   */
  private async walkDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...await this.walkDirectory(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is not readable
    }

    return files;
  }

  /**
   * Get collections list
   */
  async getCollections(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.collectionsPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get subsections for a collection
   */
  async getSubsections(collection: string): Promise<string[]> {
    const collectionPath = path.join(this.collectionsPath, collection);
    
    try {
      const entries = await fs.readdir(collectionPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      return [];
    }
  }
}
