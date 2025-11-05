"""
Skill Registry - Central management for all skills in the platform

Provides:
- Skill registration and storage
- CRUD operations
- JSON persistence
- Search and filtering
- Performance analytics
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict

from src.skills.models import Skill, SkillDomain


logger = logging.getLogger(__name__)


class SkillRegistry:
    """
    Central registry for all skills in the AI Agent Platform
    
    Manages skill lifecycle, persistence, and provides search/analytics capabilities.
    
    Example:
        >>> registry = SkillRegistry(storage_path="data/skills.json")
        >>> skill = Skill(name="Type Hints", domain=SkillDomain.CODING, ...)
        >>> registry.register(skill)
        >>> top_skills = registry.get_top_performers(limit=10)
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize skill registry
        
        Args:
            storage_path: Path to JSON file for persistence. If provided,
                         skills will be auto-saved and loaded from this file.
        """
        self.skills: Dict[str, Skill] = {}
        self.storage_path = storage_path
        
        if storage_path:
            self.load()
    
    def register(self, skill: Skill) -> str:
        """
        Register a new skill or update existing
        
        If a skill with the same ID exists, it will be updated.
        Automatically saves to disk if storage_path is configured.
        
        Args:
            skill: Skill instance to register
            
        Returns:
            Skill ID
        """
        self.skills[skill.id] = skill
        
        if self.storage_path:
            self.save()
        
        logger.info(f"Registered skill: {skill.name} (ID: {skill.id})")
        return skill.id
    
    def get(self, skill_id: str) -> Optional[Skill]:
        """
        Get skill by ID
        
        Args:
            skill_id: Unique skill identifier
            
        Returns:
            Skill instance or None if not found
        """
        return self.skills.get(skill_id)
    
    def delete(self, skill_id: str) -> bool:
        """
        Delete a skill from the registry
        
        Args:
            skill_id: ID of skill to delete
            
        Returns:
            True if deleted, False if skill not found
        """
        if skill_id in self.skills:
            del self.skills[skill_id]
            
            if self.storage_path:
                self.save()
            
            logger.info(f"Deleted skill: {skill_id}")
            return True
        
        logger.warning(f"Attempted to delete nonexistent skill: {skill_id}")
        return False
    
    def get_by_domain(
        self,
        domain: SkillDomain,
        limit: int = 10
    ) -> List[Skill]:
        """
        Get skills by domain, sorted by performance
        
        Args:
            domain: Skill domain to filter by
            limit: Maximum number of skills to return
            
        Returns:
            List of skills in domain, sorted by performance (descending)
        """
        domain_skills = [
            skill for skill in self.skills.values()
            if skill.domain == domain
        ]
        
        # Sort by performance score (descending)
        domain_skills.sort(key=lambda s: s.performance_score, reverse=True)
        
        return domain_skills[:limit]
    
    def search_by_tags(self, tags: List[str]) -> List[Skill]:
        """
        Search skills by tags (AND logic)
        
        Returns skills that have ALL specified tags.
        
        Args:
            tags: List of tags to search for
            
        Returns:
            List of matching skills
        """
        matching_skills = []
        
        for skill in self.skills.values():
            if all(tag in skill.tags for tag in tags):
                matching_skills.append(skill)
        
        return matching_skills
    
    def get_top_performers(self, limit: int = 10) -> List[Skill]:
        """
        Get top-performing skills across all domains
        
        Args:
            limit: Maximum number of skills to return
            
        Returns:
            List of skills sorted by performance score (descending)
        """
        all_skills = list(self.skills.values())
        all_skills.sort(key=lambda s: s.performance_score, reverse=True)
        
        return all_skills[:limit]
    
    def count(self) -> int:
        """Get total number of skills in registry"""
        return len(self.skills)
    
    def get_domain_distribution(self) -> Dict[SkillDomain, int]:
        """
        Get distribution of skills by domain
        
        Returns:
            Dictionary mapping domain to skill count
        """
        distribution = defaultdict(int)
        
        for skill in self.skills.values():
            distribution[skill.domain] += 1
        
        return dict(distribution)
    
    def get_average_score(self) -> float:
        """
        Calculate average performance score across all skills
        
        Returns:
            Average score (0.0 if no skills)
        """
        if not self.skills:
            return 0.0
        
        total_score = sum(skill.performance_score for skill in self.skills.values())
        return total_score / len(self.skills)
    
    def save(self) -> None:
        """
        Save registry to JSON file
        
        Creates directory structure if it doesn't exist.
        Raises:
            IOError: If save fails
        """
        if not self.storage_path:
            logger.warning("No storage path configured, skipping save")
            return
        
        try:
            # Create directory if needed
            storage_file = Path(self.storage_path)
            storage_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Convert skills to JSON-serializable format
            skills_data = [
                skill.to_dict()
                for skill in self.skills.values()
            ]
            
            # Write to file
            with open(storage_file, 'w', encoding='utf-8') as f:
                json.dump(skills_data, f, indent=2, default=str)
            
            logger.info(f"Saved {len(self.skills)} skills to {self.storage_path}")
            
        except Exception as e:
            logger.error(f"Failed to save skills: {e}")
            raise IOError(f"Failed to save skills to {self.storage_path}: {e}")
    
    def load(self) -> None:
        """
        Load registry from JSON file
        
        If file doesn't exist or is malformed, starts with empty registry.
        Logs warnings for recoverable errors.
        """
        if not self.storage_path:
            logger.warning("No storage path configured, skipping load")
            return
        
        storage_file = Path(self.storage_path)
        
        if not storage_file.exists():
            logger.info(f"Storage file {self.storage_path} does not exist, starting fresh")
            return
        
        try:
            with open(storage_file, 'r', encoding='utf-8') as f:
                skills_data = json.load(f)
            
            # Reconstruct skills from data
            self.skills = {}
            for skill_dict in skills_data:
                try:
                    skill = Skill.from_dict(skill_dict)
                    self.skills[skill.id] = skill
                except Exception as e:
                    logger.warning(f"Skipping invalid skill during load: {e}")
                    continue
            
            logger.info(f"Loaded {len(self.skills)} skills from {self.storage_path}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Corrupted JSON in {self.storage_path}: {e}")
            logger.info("Starting with empty registry")
            self.skills = {}
        
        except Exception as e:
            logger.error(f"Failed to load skills: {e}")
            logger.info("Starting with empty registry")
            self.skills = {}
    
    def export_for_agent(self, skill_ids: List[str]) -> str:
        """
        Export skills formatted for injection into agent prompt
        
        Args:
            skill_ids: List of skill IDs to export
            
        Returns:
            Formatted string ready for prompt injection
        """
        instructions = []
        
        for skill_id in skill_ids:
            skill = self.get(skill_id)
            if skill:
                instructions.append(f"- {skill.instruction}")
        
        if not instructions:
            return ""
        
        return "\n".join([
            "",
            "## Domain Skills:",
            *instructions
        ])
    
    def __len__(self) -> int:
        """Support len() function"""
        return len(self.skills)
    
    def __contains__(self, skill_id: str) -> bool:
        """Support 'in' operator"""
        return skill_id in self.skills
    
    def __repr__(self) -> str:
        """Developer-friendly representation"""
        return (
            f"SkillRegistry(skills={len(self.skills)}, "
            f"storage_path={self.storage_path!r})"
        )
