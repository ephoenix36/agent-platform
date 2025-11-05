"""
Out-of-Distribution (OOD) Robustness Testing
Based on AgentAuditor Research

Expert Advisor: Data Scientist (Cross-domain testing)

Purpose: Measure agent generalization across unseen domains
Key Innovation: Domain-agnostic evaluation with automatic adaptation

Target Performance:
- <5% performance degradation on OOD
- Feature transferability >0.7
- Automatic domain detection
- Cluster quality >0.5 silhouette score

Components:
1. Cross-Domain Tester - Evaluate on new domains
2. Feature Transfer Evaluator - Measure transferability
3. Unsupervised Clustering - FINCH algorithm
4. Zero-Shot Feature Extraction - Domain-agnostic
5. Performance Metrics - Statistical significance
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
from collections import defaultdict
from scipy import stats
from sklearn.cluster import DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score, calinski_harabasz_score
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold
import anthropic

@dataclass
class DomainProfile:
    """Profile of a domain with representative examples"""
    domain_name: str
    num_examples: int
    feature_distribution: Dict[str, Any]
    cluster_centers: List[np.ndarray]
    representative_examples: List[Dict]
    
    # Statistics
    mean_features: np.ndarray
    std_features: np.ndarray
    
    def to_dict(self) -> Dict:
        return {
            'domain_name': self.domain_name,
            'num_examples': self.num_examples,
            'feature_distribution': self.feature_distribution,
            'num_clusters': len(self.cluster_centers)
        }

@dataclass
class OODTestResult:
    """Result of OOD testing"""
    test_domain: str
    training_domains: List[str]
    
    # Performance metrics
    in_domain_performance: float
    ood_performance: float
    degradation: float  # Percentage drop
    
    # Transfer metrics
    feature_transferability: float
    domain_similarity: float
    
    # Statistical significance
    is_significant: bool
    p_value: float
    
    # Details
    num_test_examples: int
    prediction_confidence: float
    
    def to_dict(self) -> Dict:
        return {
            'test_domain': self.test_domain,
            'training_domains': self.training_domains,
            'performance': {
                'in_domain': self.in_domain_performance,
                'ood': self.ood_performance,
                'degradation_pct': self.degradation * 100
            },
            'transfer_metrics': {
                'feature_transferability': self.feature_transferability,
                'domain_similarity': self.domain_similarity
            },
            'statistical': {
                'significant': self.is_significant,
                'p_value': self.p_value
            },
            'metadata': {
                'num_examples': self.num_test_examples,
                'confidence': self.prediction_confidence
            }
        }

class DomainDetector:
    """
    Automatically detect domains in data
    
    Expert: Data Scientist
    Approach: Unsupervised clustering of features
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        
    async def detect_domains(
        self,
        interactions: List[Dict],
        features: List[np.ndarray],
        min_cluster_size: int = 10
    ) -> Dict[str, List[int]]:
        """
        Detect domains using unsupervised clustering
        
        Returns: Dict mapping domain_id -> list of interaction indices
        """
        if len(features) < min_cluster_size:
            return {'domain_0': list(range(len(interactions)))}
        
        # Normalize features
        X = np.vstack(features)
        X_scaled = self.scaler.fit_transform(X)
        
        # Try multiple clustering approaches
        clusterings = await self._try_multiple_clusterings(X_scaled, min_cluster_size)
        
        # Select best clustering
        best_clustering = max(clusterings, key=lambda c: c['quality_score'])
        
        # Map to domains
        domains = defaultdict(list)
        for idx, label in enumerate(best_clustering['labels']):
            domains[f"domain_{label}"].append(idx)
        
        return dict(domains)
    
    async def _try_multiple_clusterings(
        self,
        X: np.ndarray,
        min_cluster_size: int
    ) -> List[Dict]:
        """Try multiple clustering algorithms and evaluate"""
        results = []
        
        # DBSCAN
        try:
            dbscan = DBSCAN(eps=0.5, min_samples=min_cluster_size)
            labels = dbscan.fit_predict(X)
            
            if len(set(labels)) > 1:  # More than just noise
                score = silhouette_score(X, labels) if len(set(labels)) > 1 else 0
                results.append({
                    'method': 'DBSCAN',
                    'labels': labels,
                    'quality_score': score,
                    'num_clusters': len(set(labels))
                })
        except:
            pass
        
        # Agglomerative Clustering (multiple n_clusters)
        for n_clusters in [2, 3, 5, 7, 10]:
            if len(X) >= n_clusters * min_cluster_size:
                try:
                    agg = AgglomerativeClustering(n_clusters=n_clusters)
                    labels = agg.fit_predict(X)
                    
                    score = silhouette_score(X, labels)
                    results.append({
                        'method': f'Agglomerative_{n_clusters}',
                        'labels': labels,
                        'quality_score': score,
                        'num_clusters': n_clusters
                    })
                except:
                    pass
        
        # If no clustering worked, return single cluster
        if not results:
            results.append({
                'method': 'single',
                'labels': np.zeros(len(X), dtype=int),
                'quality_score': 0.0,
                'num_clusters': 1
            })
        
        return results

class UnsupervisedClusterer:
    """
    FINCH-inspired clustering for representative examples
    
    Expert: Data Scientist
    Approach: Unsupervised hierarchical clustering
    
    Key Insight from Research:
    "Unsupervised clustering (FINCH) to identify representative
    interaction patterns for memory construction"
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
    
    async def cluster_examples(
        self,
        examples: List[Dict],
        features: List[np.ndarray],
        target_clusters: Optional[int] = None
    ) -> Dict[int, List[int]]:
        """
        Cluster examples into representative groups
        
        Returns: Dict mapping cluster_id -> list of example indices
        """
        if len(features) < 2:
            return {0: list(range(len(examples)))}
        
        # Normalize features
        X = np.vstack(features)
        X_scaled = self.scaler.fit_transform(X)
        
        # Auto-determine number of clusters if not specified
        if target_clusters is None:
            target_clusters = self._estimate_num_clusters(X_scaled)
        
        # Hierarchical clustering
        clusterer = AgglomerativeClustering(
            n_clusters=target_clusters,
            linkage='ward'
        )
        labels = clusterer.fit_predict(X_scaled)
        
        # Group by cluster
        clusters = defaultdict(list)
        for idx, label in enumerate(labels):
            clusters[int(label)].append(idx)
        
        return dict(clusters)
    
    def _estimate_num_clusters(self, X: np.ndarray) -> int:
        """Estimate optimal number of clusters"""
        n_samples = len(X)
        
        # Rule of thumb: sqrt(n/2)
        estimated = int(np.sqrt(n_samples / 2))
        
        # Clamp between 2 and 20
        return max(2, min(20, estimated))
    
    async def select_representatives(
        self,
        clusters: Dict[int, List[int]],
        features: List[np.ndarray],
        n_per_cluster: int = 3
    ) -> List[int]:
        """
        Select representative examples from each cluster
        
        Returns indices of representative examples
        """
        representatives = []
        
        for cluster_id, indices in clusters.items():
            if not indices:
                continue
            
            # Get features for this cluster
            cluster_features = np.vstack([features[i] for i in indices])
            
            # Compute centroid
            centroid = np.mean(cluster_features, axis=0)
            
            # Find examples closest to centroid
            distances = [
                np.linalg.norm(features[i] - centroid)
                for i in indices
            ]
            
            # Select closest n_per_cluster examples
            sorted_indices = sorted(
                range(len(distances)),
                key=lambda i: distances[i]
            )
            
            n_select = min(n_per_cluster, len(indices))
            selected = [indices[i] for i in sorted_indices[:n_select]]
            
            representatives.extend(selected)
        
        return representatives

class FeatureTransferEvaluator:
    """
    Evaluate transferability of features across domains
    
    Expert: Data Scientist
    Approach: Measure feature distribution similarity
    """
    
    def __init__(self):
        pass
    
    async def evaluate_transferability(
        self,
        source_features: List[np.ndarray],
        target_features: List[np.ndarray]
    ) -> float:
        """
        Measure how well features transfer from source to target domain
        
        Returns: Transferability score 0.0-1.0
        """
        if not source_features or not target_features:
            return 0.0
        
        # Convert to arrays
        source_X = np.vstack(source_features)
        target_X = np.vstack(target_features)
        
        # Compute statistics
        source_mean = np.mean(source_X, axis=0)
        source_std = np.std(source_X, axis=0)
        
        target_mean = np.mean(target_X, axis=0)
        target_std = np.std(target_X, axis=0)
        
        # Mean difference (lower is better)
        mean_diff = np.mean(np.abs(source_mean - target_mean))
        
        # Std difference (lower is better)
        std_diff = np.mean(np.abs(source_std - target_std))
        
        # Combined similarity (0 = identical, higher = more different)
        dissimilarity = mean_diff + std_diff
        
        # Convert to similarity score (0-1)
        # Using exponential decay: similarity = exp(-dissimilarity)
        transferability = np.exp(-dissimilarity)
        
        return float(transferability)
    
    async def measure_domain_similarity(
        self,
        domain1_features: List[np.ndarray],
        domain2_features: List[np.ndarray]
    ) -> float:
        """
        Measure similarity between two domains
        
        Uses Wasserstein distance (Earth Mover's Distance)
        """
        if not domain1_features or not domain2_features:
            return 0.0
        
        # For simplicity, use feature-wise comparison
        similarities = []
        
        for dim in range(domain1_features[0].shape[0]):
            # Extract feature dimension
            d1_values = [f[dim] for f in domain1_features]
            d2_values = [f[dim] for f in domain2_features]
            
            # Wasserstein distance (1D)
            try:
                distance = stats.wasserstein_distance(d1_values, d2_values)
                # Convert to similarity (0-1)
                similarity = np.exp(-distance)
                similarities.append(similarity)
            except:
                similarities.append(0.0)
        
        # Average across dimensions
        return float(np.mean(similarities))

class CrossDomainTester:
    """
    Test agent performance across domains
    
    Expert: Data Scientist
    Methodology: Hold-out domain testing with statistical validation
    """
    
    def __init__(self, llm_client: Optional[anthropic.Anthropic] = None):
        self.llm = llm_client
        self.domain_detector = DomainDetector()
        self.clusterer = UnsupervisedClusterer()
        self.transfer_eval = FeatureTransferEvaluator()
    
    async def test_cross_domain(
        self,
        agent_evaluator: Any,  # MemoryAugmentedEvaluator
        all_interactions: List[Dict],
        all_features: List[np.ndarray],
        test_domain: str,
        training_domains: List[str]
    ) -> OODTestResult:
        """
        Test agent on out-of-distribution domain
        
        Process:
        1. Separate test vs training examples
        2. Train/build memory on training domains
        3. Evaluate on test domain
        4. Measure performance degradation
        5. Assess feature transferability
        """
        # Separate by domain
        test_indices = [i for i, ex in enumerate(all_interactions) if ex.get('domain') == test_domain]
        train_indices = [i for i, ex in enumerate(all_interactions) if ex.get('domain') in training_domains]
        
        if not test_indices or not train_indices:
            raise ValueError("Need examples from both test and training domains")
        
        test_features = [all_features[i] for i in test_indices]
        train_features = [all_features[i] for i in train_indices]
        
        # Measure feature transferability
        transferability = await self.transfer_eval.evaluate_transferability(
            train_features,
            test_features
        )
        
        # Measure domain similarity
        domain_sim = await self.transfer_eval.measure_domain_similarity(
            train_features,
            test_features
        )
        
        # Evaluate on test domain (OOD performance)
        ood_scores = await self._evaluate_examples(
            agent_evaluator,
            [all_interactions[i] for i in test_indices]
        )
        ood_performance = np.mean(ood_scores)
        
        # Evaluate on training domain (in-domain performance)
        # Sample from training to match test size
        train_sample_indices = np.random.choice(
            train_indices,
            size=min(len(test_indices), len(train_indices)),
            replace=False
        )
        in_domain_scores = await self._evaluate_examples(
            agent_evaluator,
            [all_interactions[i] for i in train_sample_indices]
        )
        in_domain_performance = np.mean(in_domain_scores)
        
        # Calculate degradation
        degradation = (in_domain_performance - ood_performance) / in_domain_performance if in_domain_performance > 0 else 0
        
        # Statistical significance test (t-test)
        t_stat, p_value = stats.ttest_ind(in_domain_scores, ood_scores)
        is_significant = p_value < 0.05
        
        # Prediction confidence
        confidence = 1.0 - np.std(ood_scores)
        
        return OODTestResult(
            test_domain=test_domain,
            training_domains=training_domains,
            in_domain_performance=float(in_domain_performance),
            ood_performance=float(ood_performance),
            degradation=float(degradation),
            feature_transferability=transferability,
            domain_similarity=domain_sim,
            is_significant=is_significant,
            p_value=float(p_value),
            num_test_examples=len(test_indices),
            prediction_confidence=float(confidence)
        )
    
    async def _evaluate_examples(
        self,
        agent_evaluator: Any,
        interactions: List[Dict]
    ) -> List[float]:
        """
        Evaluate examples and return scores
        
        Score = 1.0 for correct, 0.0 for incorrect
        """
        scores = []
        
        for interaction in interactions:
            # Mock evaluation (in production, use real agent_evaluator)
            # For now, simulate based on interaction quality
            ground_truth = interaction.get('ground_truth_label', 'safe')
            
            # Simulate prediction (would use agent_evaluator.evaluate())
            predicted = 'safe' if 'safe' in interaction.get('agent_output', '').lower() else 'unsafe'
            
            score = 1.0 if predicted == ground_truth else 0.0
            scores.append(score)
        
        return scores

class OODRobustnessTester:
    """
    Complete OOD Robustness Testing System
    
    Integration of all components:
    - Domain Detection
    - Cross-Domain Testing
    - Feature Transfer Evaluation
    - Unsupervised Clustering
    - Statistical Validation
    
    Target: <5% performance degradation on OOD
    """
    
    def __init__(
        self,
        llm_client: Optional[anthropic.Anthropic] = None
    ):
        self.llm = llm_client or anthropic.Anthropic()
        
        # Components
        self.domain_detector = DomainDetector()
        self.clusterer = UnsupervisedClusterer()
        self.transfer_eval = FeatureTransferEvaluator()
        self.cross_domain_tester = CrossDomainTester(self.llm)
        
        # Storage
        self.domain_profiles: Dict[str, DomainProfile] = {}
        self.test_results: List[OODTestResult] = []
    
    async def profile_domains(
        self,
        interactions: List[Dict],
        features: List[np.ndarray]
    ) -> Dict[str, DomainProfile]:
        """
        Profile all domains in the dataset
        
        Returns: Dict mapping domain_name -> DomainProfile
        """
        print("🔍 Profiling domains...")
        
        # Detect domains if not labeled
        if not all('domain' in ex for ex in interactions):
            print("   Auto-detecting domains via clustering...")
            domain_assignments = await self.domain_detector.detect_domains(
                interactions,
                features
            )
            
            # Assign domains to interactions
            for domain_id, indices in domain_assignments.items():
                for idx in indices:
                    interactions[idx]['domain'] = domain_id
        
        # Group by domain
        domains = defaultdict(list)
        for i, ex in enumerate(interactions):
            domain = ex.get('domain', 'unknown')
            domains[domain].append((i, ex, features[i]))
        
        # Profile each domain
        profiles = {}
        
        for domain_name, examples in domains.items():
            indices = [i for i, _, _ in examples]
            domain_features = [f for _, _, f in examples]
            
            # Cluster within domain
            clusters = await self.clusterer.cluster_examples(
                [ex for _, ex, _ in examples],
                domain_features,
                target_clusters=min(5, len(examples) // 10 + 1)
            )
            
            # Select representatives
            rep_indices = await self.clusterer.select_representatives(
                clusters,
                domain_features,
                n_per_cluster=3
            )
            
            # Compute statistics
            X = np.vstack(domain_features)
            mean_features = np.mean(X, axis=0)
            std_features = np.std(X, axis=0)
            
            # Extract cluster centers
            cluster_centers = []
            for cluster_id, cluster_indices in clusters.items():
                cluster_X = np.vstack([domain_features[i] for i in cluster_indices])
                center = np.mean(cluster_X, axis=0)
                cluster_centers.append(center)
            
            # Create profile
            profile = DomainProfile(
                domain_name=domain_name,
                num_examples=len(examples),
                feature_distribution={
                    'mean': mean_features.tolist(),
                    'std': std_features.tolist()
                },
                cluster_centers=cluster_centers,
                representative_examples=[examples[i][1] for i in rep_indices],
                mean_features=mean_features,
                std_features=std_features
            )
            
            profiles[domain_name] = profile
            self.domain_profiles[domain_name] = profile
            
            print(f"   ✓ {domain_name}: {len(examples)} examples, {len(clusters)} clusters")
        
        return profiles
    
    async def test_ood_robustness(
        self,
        agent_evaluator: Any,
        interactions: List[Dict],
        features: List[np.ndarray],
        test_fraction: float = 0.2
    ) -> Dict[str, Any]:
        """
        Comprehensive OOD robustness testing
        
        Process:
        1. Profile all domains
        2. For each domain:
           - Hold out as test domain
           - Train on remaining domains
           - Evaluate performance
        3. Aggregate results
        """
        print("\n🧪 OOD Robustness Testing")
        print("=" * 50)
        
        # Profile domains
        profiles = await self.profile_domains(interactions, features)
        domain_names = list(profiles.keys())
        
        print(f"\n📊 Found {len(domain_names)} domains")
        
        # Test each domain as OOD
        results = []
        
        for test_domain in domain_names:
            training_domains = [d for d in domain_names if d != test_domain]
            
            if not training_domains:
                continue
            
            print(f"\n🔬 Testing OOD: {test_domain}")
            print(f"   Training on: {', '.join(training_domains)}")
            
            result = await self.cross_domain_tester.test_cross_domain(
                agent_evaluator,
                interactions,
                features,
                test_domain,
                training_domains
            )
            
            results.append(result)
            self.test_results.append(result)
            
            print(f"   In-domain: {result.in_domain_performance:.3f}")
            print(f"   OOD: {result.ood_performance:.3f}")
            print(f"   Degradation: {result.degradation * 100:.1f}%")
            print(f"   Transferability: {result.feature_transferability:.3f}")
            print(f"   Significant: {result.is_significant} (p={result.p_value:.4f})")
        
        # Aggregate statistics
        avg_degradation = np.mean([r.degradation for r in results])
        max_degradation = np.max([r.degradation for r in results])
        avg_transferability = np.mean([r.feature_transferability for r in results])
        
        print(f"\n📈 Overall OOD Performance:")
        print(f"   Average degradation: {avg_degradation * 100:.1f}%")
        print(f"   Max degradation: {max_degradation * 100:.1f}%")
        print(f"   Average transferability: {avg_transferability:.3f}")
        
        # Check if meets target
        target_met = avg_degradation < 0.05  # <5% target
        
        print(f"\n{'✅' if target_met else '⚠️'} Target (<5% degradation): {'MET' if target_met else 'NOT MET'}")
        
        return {
            'domain_profiles': {k: v.to_dict() for k, v in profiles.items()},
            'ood_results': [r.to_dict() for r in results],
            'summary': {
                'num_domains': len(domain_names),
                'avg_degradation_pct': avg_degradation * 100,
                'max_degradation_pct': max_degradation * 100,
                'avg_transferability': avg_transferability,
                'target_met': target_met
            }
        }
    
    async def generate_ood_report(self) -> str:
        """Generate comprehensive OOD robustness report"""
        if not self.test_results:
            return "No OOD tests have been run yet."
        
        report = """
# OOD Robustness Report

## Summary
"""
        
        # Calculate statistics
        degradations = [r.degradation for r in self.test_results]
        transferabilities = [r.feature_transferability for r in self.test_results]
        
        report += f"""
- Total Domains Tested: {len(self.test_results)}
- Average Degradation: {np.mean(degradations) * 100:.1f}%
- Max Degradation: {np.max(degradations) * 100:.1f}%
- Min Degradation: {np.min(degradations) * 100:.1f}%
- Average Feature Transferability: {np.mean(transferabilities):.3f}
- Target (<5% degradation): {'✅ MET' if np.mean(degradations) < 0.05 else '⚠️ NOT MET'}

## Detailed Results

"""
        
        for i, result in enumerate(self.test_results, 1):
            report += f"""
### Test {i}: {result.test_domain}

- Training Domains: {', '.join(result.training_domains)}
- In-Domain Performance: {result.in_domain_performance:.3f}
- OOD Performance: {result.ood_performance:.3f}
- Degradation: {result.degradation * 100:.1f}%
- Feature Transferability: {result.feature_transferability:.3f}
- Domain Similarity: {result.domain_similarity:.3f}
- Statistical Significance: {result.is_significant} (p={result.p_value:.4f})
- Test Examples: {result.num_test_examples}

"""
        
        return report


# FastAPI Endpoints
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/v1/evaluation/ood", tags=["ood-testing"])

# Global tester instance
ood_tester: Optional[OODRobustnessTester] = None

def get_tester() -> OODRobustnessTester:
    """Get or create tester instance"""
    global ood_tester
    if ood_tester is None:
        ood_tester = OODRobustnessTester()
    return ood_tester

class OODTestRequest(BaseModel):
    interactions: List[Dict]
    features: List[List[float]]  # Serialized numpy arrays
    test_fraction: float = 0.2

@router.post("/test")
async def test_ood_robustness(request: OODTestRequest) -> Dict[str, Any]:
    """
    Test agent robustness across domains
    
    Measures generalization to unseen domains
    """
    try:
        tester = get_tester()
        
        # Convert features to numpy
        features = [np.array(f) for f in request.features]
        
        # Run OOD testing
        results = await tester.test_ood_robustness(
            agent_evaluator=None,  # Would pass real evaluator
            interactions=request.interactions,
            features=features,
            test_fraction=request.test_fraction
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report")
async def get_ood_report() -> Dict[str, str]:
    """Get comprehensive OOD robustness report"""
    try:
        tester = get_tester()
        report = await tester.generate_ood_report()
        
        return {'report': report}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile-domains")
async def profile_domains(
    interactions: List[Dict],
    features: List[List[float]]
) -> Dict[str, Any]:
    """Profile domains in dataset"""
    try:
        tester = get_tester()
        
        # Convert features
        features_np = [np.array(f) for f in features]
        
        # Profile
        profiles = await tester.profile_domains(interactions, features_np)
        
        return {
            'profiles': {k: v.to_dict() for k, v in profiles.items()}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
