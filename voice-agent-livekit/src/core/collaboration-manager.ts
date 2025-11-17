/**
 * Multi-Agent Collaboration Manager
 * Coordinates with expert advisors, validators, and investigator agents
 */

import type {
  CollaborationConfig,
  AgentCollaboration,
  ExpertAdvisor,
  Consultation,
} from '../types.js';
import { log, PerfTimer } from '../utils/logger.js';
import { EventEmitter } from 'events';

interface ExpertRequest {
  domain: string;
  query: string;
  context?: Record<string, unknown>;
  priority?: number;
}

interface ValidationRequest {
  content: string;
  criteria: string[];
  strictness?: 'low' | 'medium' | 'high';
}

interface InvestigationRequest {
  topic: string;
  depth: number;
  sources?: string[];
}

export class CollaborationManager extends EventEmitter {
  private config: CollaborationConfig;
  private collaboration: AgentCollaboration;
  private advisorEndpoint: string;
  
  constructor(config: CollaborationConfig) {
    super();
    this.config = config;
    this.advisorEndpoint = config.advisorEndpoint || 'http://localhost:8000/api/v1/agents';
    
    this.collaboration = {
      primary: 'voice-agent',
      advisors: [],
      consultations: [],
    };
  }
  
  /**
   * Initialize collaboration framework
   */
  async initialize(): Promise<void> {
    const timer = new PerfTimer('collaboration.initialize');
    
    if (!this.config.enableAdvisors) {
      log.info('Multi-agent collaboration disabled');
      return;
    }
    
    try {
      log.info('Initializing multi-agent collaboration');
      
      // Discover available advisor agents
      await this.discoverAdvisors();
      
      timer.end({
        advisorsFound: this.collaboration.advisors.length,
      });
      
      log.info('Collaboration initialized', {
        advisors: this.collaboration.advisors.length,
      });
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to initialize collaboration', error as Error);
      // Non-critical, continue without collaboration
    }
  }
  
  /**
   * Consult an expert advisor on a specific domain
   */
  async consultExpert(request: ExpertRequest): Promise<string> {
    const timer = new PerfTimer('collaboration.consult_expert');
    
    try {
      // Find suitable advisor
      const advisor = this.findAdvisor(request.domain);
      
      if (!advisor) {
        log.warn(`No advisor found for domain: ${request.domain}`);
        throw new Error(`No expert available for domain: ${request.domain}`);
      }
      
      log.info('Consulting expert advisor', {
        domain: request.domain,
        advisorId: advisor.id,
      });
      
      // Create consultation
      const consultation: Consultation = {
        id: this.generateConsultationId(),
        advisorId: advisor.id,
        query: request.query,
        status: 'in-progress',
        startedAt: new Date(),
      };
      
      this.collaboration.consultations.push(consultation);
      
      // Call advisor endpoint
      const response = await this.callAdvisor(advisor, request);
      
      // Update consultation
      consultation.status = 'completed';
      consultation.response = response;
      consultation.endedAt = new Date();
      
      const duration = consultation.endedAt.getTime() - consultation.startedAt.getTime();
      
      timer.end({
        domain: request.domain,
        advisorId: advisor.id,
        duration,
      });
      
      this.emit('consultation.completed', {
        consultationId: consultation.id,
        advisorId: advisor.id,
        domain: request.domain,
        duration,
      });
      
      return response;
      
    } catch (error) {
      timer.end({ success: false, domain: request.domain });
      log.error('Expert consultation failed', error as Error, {
        domain: request.domain,
      });
      throw error;
    }
  }
  
  /**
   * Request validation from validator agent
   */
  async requestValidation(request: ValidationRequest): Promise<{
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const timer = new PerfTimer('collaboration.validate');
    
    try {
      log.info('Requesting validation');
      
      const response = await this.makeRequest(`${this.advisorEndpoint}/validate`, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' },
      });
      
      timer.end({ score: response.score });
      
      return response;
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Validation request failed', error as Error);
      throw error;
    }
  }
  
  /**
   * Request investigation from investigator agent
   */
  async requestInvestigation(request: InvestigationRequest): Promise<{
    findings: string[];
    sources: string[];
    confidence: number;
    summary: string;
  }> {
    const timer = new PerfTimer('collaboration.investigate');
    
    try {
      log.info('Requesting investigation', {
        topic: request.topic,
        depth: request.depth,
      });
      
      const response = await this.makeRequest(`${this.advisorEndpoint}/investigate`, {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          depth: request.depth || this.config.investigationDepth,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      timer.end({ findingsCount: response.findings.length });
      
      return response;
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Investigation request failed', error as Error);
      throw error;
    }
  }
  
  /**
   * Get expert recommendation for complex queries
   */
  async getExpertRecommendation(query: string): Promise<{
    recommendedExperts: string[];
    reasoning: string;
  }> {
    try {
      // Analyze query to determine required expertise
      const keywords = this.extractKeywords(query);
      const relevantDomains = this.mapKeywordsToDomains(keywords);
      
      const recommendations = relevantDomains.map(domain => {
        const advisor = this.findAdvisor(domain);
        return advisor?.name || domain;
      });
      
      return {
        recommendedExperts: recommendations,
        reasoning: `Based on the query keywords: ${keywords.join(', ')}`,
      };
      
    } catch (error) {
      log.error('Failed to get expert recommendation', error as Error);
      throw error;
    }
  }
  
  /**
   * Get collaboration statistics
   */
  getStats(): {
    advisorsAvailable: number;
    totalConsultations: number;
    avgResponseTime: number;
    consultationsByDomain: Record<string, number>;
  } {
    const consultationsByDomain: Record<string, number> = {};
    let totalTime = 0;
    let completedCount = 0;
    
    for (const consultation of this.collaboration.consultations) {
      if (consultation.status === 'completed' && consultation.endedAt) {
        const advisor = this.collaboration.advisors.find(a => a.id === consultation.advisorId);
        if (advisor) {
          consultationsByDomain[advisor.domain] = (consultationsByDomain[advisor.domain] || 0) + 1;
          totalTime += consultation.endedAt.getTime() - consultation.startedAt.getTime();
          completedCount++;
        }
      }
    }
    
    return {
      advisorsAvailable: this.collaboration.advisors.filter(a => a.available).length,
      totalConsultations: this.collaboration.consultations.length,
      avgResponseTime: completedCount > 0 ? totalTime / completedCount : 0,
      consultationsByDomain,
    };
  }
  
  /**
   * Discover available advisor agents
   */
  private async discoverAdvisors(): Promise<void> {
    try {
      const response = await this.makeRequest(`${this.advisorEndpoint}/list`);
      
      if (response.agents && Array.isArray(response.agents)) {
        this.collaboration.advisors = response.agents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          domain: agent.domain || 'general',
          endpoint: `${this.advisorEndpoint}/${agent.id}`,
          available: agent.status === 'active',
          avgResponseTimeMs: agent.avgResponseTimeMs || 1000,
        }));
        
        log.info('Discovered advisors', {
          count: this.collaboration.advisors.length,
        });
      }
      
    } catch (error) {
      log.error('Failed to discover advisors', error as Error);
      // Use default advisors if discovery fails
      this.useDefaultAdvisors();
    }
  }
  
  /**
   * Use default advisor configuration
   */
  private useDefaultAdvisors(): void {
    this.collaboration.advisors = [
      {
        id: 'expert-advisor-1',
        name: 'Technical Expert',
        domain: 'technical',
        endpoint: `${this.advisorEndpoint}/technical`,
        available: true,
        avgResponseTimeMs: 1000,
      },
      {
        id: 'expert-advisor-2',
        name: 'Business Expert',
        domain: 'business',
        endpoint: `${this.advisorEndpoint}/business`,
        available: true,
        avgResponseTimeMs: 1000,
      },
      {
        id: 'expert-advisor-3',
        name: 'Research Expert',
        domain: 'research',
        endpoint: `${this.advisorEndpoint}/research`,
        available: true,
        avgResponseTimeMs: 1500,
      },
    ];
    
    log.info('Using default advisors', {
      count: this.collaboration.advisors.length,
    });
  }
  
  /**
   * Find advisor by domain
   */
  private findAdvisor(domain: string): ExpertAdvisor | undefined {
    return this.collaboration.advisors.find(
      a => a.available && a.domain.toLowerCase() === domain.toLowerCase()
    ) || this.collaboration.advisors.find(a => a.available);
  }
  
  /**
   * Call advisor endpoint
   */
  private async callAdvisor(advisor: ExpertAdvisor, request: ExpertRequest): Promise<string> {
    const response = await this.makeRequest(advisor.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        query: request.query,
        context: request.context,
      }),
      headers: { 'Content-Type': 'application/json' },
      timeout: this.config.validatorTimeout,
    });
    
    return response.response || response.text || '';
  }
  
  /**
   * Make HTTP request with timeout
   */
  private async makeRequest(url: string, options?: any): Promise<any> {
    const controller = new AbortController();
    const timeout = options?.timeout || this.config.validatorTimeout || 3000;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were']);
    
    return words.filter(word => word.length > 3 && !stopWords.has(word));
  }
  
  /**
   * Map keywords to expert domains
   */
  private mapKeywordsToDomains(keywords: string[]): string[] {
    const domainKeywords: Record<string, string[]> = {
      technical: ['code', 'programming', 'software', 'development', 'algorithm', 'debug'],
      business: ['strategy', 'marketing', 'sales', 'revenue', 'customer', 'market'],
      research: ['study', 'analysis', 'research', 'investigate', 'data', 'findings'],
      legal: ['law', 'legal', 'contract', 'compliance', 'regulation'],
      finance: ['finance', 'accounting', 'budget', 'investment', 'financial'],
    };
    
    const domains = new Set<string>();
    
    for (const keyword of keywords) {
      for (const [domain, domainWords] of Object.entries(domainKeywords)) {
        if (domainWords.some(dw => keyword.includes(dw) || dw.includes(keyword))) {
          domains.add(domain);
        }
      }
    }
    
    return Array.from(domains);
  }
  
  /**
   * Generate unique consultation ID
   */
  private generateConsultationId(): string {
    return `consult_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
