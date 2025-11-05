"""
Security Scanner for MCP Tools and Agent Code

This module provides comprehensive security analysis for:
- MCP server implementations
- Agent code (Python, JavaScript, TypeScript)
- Workflow definitions
- Configuration files
"""

import ast
import json
import re
from typing import Dict, List, Any, Optional
from enum import Enum
from dataclasses import dataclass
import hashlib


class SecurityLevel(str, Enum):
    """Security risk levels"""
    SAFE = "safe"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class VulnerabilityType(str, Enum):
    """Types of security vulnerabilities"""
    CODE_INJECTION = "code_injection"
    ARBITRARY_EXECUTION = "arbitrary_execution"
    FILE_SYSTEM_ACCESS = "file_system_access"
    NETWORK_ACCESS = "network_access"
    ENVIRONMENT_ACCESS = "environment_access"
    CREDENTIAL_EXPOSURE = "credential_exposure"
    UNSAFE_DESERIALIZATION = "unsafe_deserialization"
    PATH_TRAVERSAL = "path_traversal"
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    MALICIOUS_PACKAGE = "malicious_package"


@dataclass
class SecurityIssue:
    """Represents a security issue"""
    type: VulnerabilityType
    severity: SecurityLevel
    line_number: Optional[int]
    description: str
    recommendation: str
    code_snippet: Optional[str] = None


@dataclass
class SecurityReport:
    """Security analysis report"""
    score: float  # 0-100
    level: SecurityLevel
    issues: List[SecurityIssue]
    safe_features: List[str]
    risky_features: List[str]
    checksum: str
    scanned_at: str


class SecurityScanner:
    """Comprehensive security scanner for agent code"""
    
    # Dangerous patterns to detect
    DANGEROUS_PATTERNS = {
        # Code execution
        r'\beval\s*\(': (VulnerabilityType.CODE_INJECTION, SecurityLevel.CRITICAL, 
                         "Avoid using eval() - it can execute arbitrary code"),
        r'\bexec\s*\(': (VulnerabilityType.CODE_INJECTION, SecurityLevel.CRITICAL,
                         "Avoid using exec() - it can execute arbitrary code"),
        r'__import__\s*\(': (VulnerabilityType.ARBITRARY_EXECUTION, SecurityLevel.HIGH,
                            "Dynamic imports can be dangerous - use static imports"),
        
        # File system
        r'\bopen\s*\([^)]*[\'"]w[\'"]': (VulnerabilityType.FILE_SYSTEM_ACCESS, SecurityLevel.MEDIUM,
                                         "File write operations detected - ensure path validation"),
        r'\bos\.remove\s*\(': (VulnerabilityType.FILE_SYSTEM_ACCESS, SecurityLevel.HIGH,
                              "File deletion detected - ensure proper authorization"),
        r'\bshutil\.rmtree\s*\(': (VulnerabilityType.FILE_SYSTEM_ACCESS, SecurityLevel.HIGH,
                                  "Directory deletion detected - very dangerous"),
        
        # Path traversal
        r'\.\.\/': (VulnerabilityType.PATH_TRAVERSAL, SecurityLevel.HIGH,
                   "Path traversal pattern detected - validate all paths"),
        
        # Network access
        r'\bsubprocess\.(run|call|Popen)': (VulnerabilityType.ARBITRARY_EXECUTION, SecurityLevel.CRITICAL,
                                            "Subprocess execution detected - major security risk"),
        r'\bos\.system\s*\(': (VulnerabilityType.ARBITRARY_EXECUTION, SecurityLevel.CRITICAL,
                              "os.system() allows shell command execution"),
        
        # Credentials
        r'(password|secret|api_key|token)\s*=\s*[\'"][^\'"]+[\'"]': (
            VulnerabilityType.CREDENTIAL_EXPOSURE, SecurityLevel.CRITICAL,
            "Hard-coded credentials detected - use environment variables"),
        
        # Unsafe deserialization
        r'\bpickle\.loads?\s*\(': (VulnerabilityType.UNSAFE_DESERIALIZATION, SecurityLevel.HIGH,
                                   "pickle can execute arbitrary code during deserialization"),
        r'\byaml\.load\s*\(': (VulnerabilityType.UNSAFE_DESERIALIZATION, SecurityLevel.HIGH,
                              "Use yaml.safe_load() instead of yaml.load()"),
        
        # SQL injection
        r'(execute|cursor)\s*\([^)]*%s': (VulnerabilityType.SQL_INJECTION, SecurityLevel.CRITICAL,
                                          "SQL injection risk - use parameterized queries"),
        r'f[\'"].*SELECT.*{.*}': (VulnerabilityType.SQL_INJECTION, SecurityLevel.CRITICAL,
                                  "SQL injection via f-string - use parameterized queries"),
    }
    
    # Safe packages that are allowed
    SAFE_PACKAGES = {
        'typing', 'dataclasses', 'enum', 'datetime', 'json', 'math', 'random',
        'collections', 'itertools', 'functools', 'pathlib', 'urllib.parse',
        'pydantic', 'fastapi', 'starlette', 'requests', 'httpx', 'aiohttp',
    }
    
    # Risky packages that need review
    RISKY_PACKAGES = {
        'subprocess': SecurityLevel.CRITICAL,
        'os.system': SecurityLevel.CRITICAL,
        'eval': SecurityLevel.CRITICAL,
        'exec': SecurityLevel.CRITICAL,
        'pickle': SecurityLevel.HIGH,
        'shelve': SecurityLevel.HIGH,
        'socket': SecurityLevel.MEDIUM,
        'pty': SecurityLevel.HIGH,
    }
    
    def __init__(self):
        self.issues: List[SecurityIssue] = []
        self.safe_features: List[str] = []
        self.risky_features: List[str] = []
    
    def scan_python_code(self, code: str) -> SecurityReport:
        """Scan Python code for security issues"""
        self.issues = []
        self.safe_features = []
        self.risky_features = []
        
        # Pattern-based scanning
        for line_num, line in enumerate(code.split('\n'), 1):
            for pattern, (vuln_type, severity, description) in self.DANGEROUS_PATTERNS.items():
                if re.search(pattern, line):
                    self.issues.append(SecurityIssue(
                        type=vuln_type,
                        severity=severity,
                        line_number=line_num,
                        description=description,
                        recommendation=self._get_recommendation(vuln_type),
                        code_snippet=line.strip()
                    ))
        
        # AST-based analysis
        try:
            tree = ast.parse(code)
            self._analyze_ast(tree)
        except SyntaxError as e:
            self.issues.append(SecurityIssue(
                type=VulnerabilityType.CODE_INJECTION,
                severity=SecurityLevel.HIGH,
                line_number=e.lineno,
                description=f"Syntax error: {e.msg}",
                recommendation="Fix syntax errors before deployment"
            ))
        
        # Calculate security score
        score = self._calculate_score()
        level = self._get_security_level(score)
        
        # Generate checksum
        checksum = hashlib.sha256(code.encode()).hexdigest()
        
        from datetime import datetime
        return SecurityReport(
            score=score,
            level=level,
            issues=self.issues,
            safe_features=self.safe_features,
            risky_features=self.risky_features,
            checksum=checksum,
            scanned_at=datetime.utcnow().isoformat()
        )
    
    def _analyze_ast(self, tree: ast.AST):
        """Analyze Python AST for security issues"""
        for node in ast.walk(tree):
            # Check imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self._check_import(alias.name)
            
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    self._check_import(node.module)
            
            # Check function calls
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    self._check_function_call(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    self._check_attribute_call(node.func)
    
    def _check_import(self, module_name: str):
        """Check if an import is safe"""
        base_module = module_name.split('.')[0]
        
        if base_module in self.SAFE_PACKAGES:
            self.safe_features.append(f"Import: {module_name}")
        elif base_module in self.RISKY_PACKAGES:
            severity = self.RISKY_PACKAGES[base_module]
            self.risky_features.append(f"Import: {module_name}")
            self.issues.append(SecurityIssue(
                type=VulnerabilityType.ARBITRARY_EXECUTION,
                severity=severity,
                line_number=None,
                description=f"Risky package imported: {module_name}",
                recommendation="Consider safer alternatives or add sandboxing"
            ))
    
    def _check_function_call(self, func_name: str):
        """Check if a function call is safe"""
        dangerous_functions = {'eval', 'exec', 'compile', '__import__'}
        if func_name in dangerous_functions:
            self.issues.append(SecurityIssue(
                type=VulnerabilityType.CODE_INJECTION,
                severity=SecurityLevel.CRITICAL,
                line_number=None,
                description=f"Dangerous function call: {func_name}()",
                recommendation="Remove or replace with safer alternative"
            ))
    
    def _check_attribute_call(self, node: ast.Attribute):
        """Check attribute-based function calls"""
        if isinstance(node.value, ast.Name):
            if node.value.id == 'os' and node.attr == 'system':
                self.issues.append(SecurityIssue(
                    type=VulnerabilityType.ARBITRARY_EXECUTION,
                    severity=SecurityLevel.CRITICAL,
                    line_number=None,
                    description="os.system() allows arbitrary command execution",
                    recommendation="Use subprocess with proper validation instead"
                ))
    
    def _get_recommendation(self, vuln_type: VulnerabilityType) -> str:
        """Get security recommendation for vulnerability type"""
        recommendations = {
            VulnerabilityType.CODE_INJECTION: "Never use eval/exec with user input. Use safe alternatives.",
            VulnerabilityType.ARBITRARY_EXECUTION: "Use subprocess with shell=False and validate all inputs.",
            VulnerabilityType.FILE_SYSTEM_ACCESS: "Validate all file paths and use restricted directories.",
            VulnerabilityType.CREDENTIAL_EXPOSURE: "Use environment variables or secure vaults for credentials.",
            VulnerabilityType.SQL_INJECTION: "Always use parameterized queries, never string concatenation.",
            VulnerabilityType.PATH_TRAVERSAL: "Validate and sanitize all file paths. Use Path.resolve().",
            VulnerabilityType.UNSAFE_DESERIALIZATION: "Use JSON instead of pickle. If pickle is required, validate source.",
        }
        return recommendations.get(vuln_type, "Review this code carefully before deployment.")
    
    def _calculate_score(self) -> float:
        """Calculate security score (0-100)"""
        if not self.issues:
            return 100.0
        
        # Deduct points based on severity
        severity_penalties = {
            SecurityLevel.CRITICAL: 30,
            SecurityLevel.HIGH: 15,
            SecurityLevel.MEDIUM: 5,
            SecurityLevel.LOW: 2,
        }
        
        total_penalty = sum(severity_penalties.get(issue.severity, 0) for issue in self.issues)
        score = max(0, 100 - total_penalty)
        
        return round(score, 1)
    
    def _get_security_level(self, score: float) -> SecurityLevel:
        """Convert score to security level"""
        if score >= 90:
            return SecurityLevel.SAFE
        elif score >= 70:
            return SecurityLevel.LOW
        elif score >= 50:
            return SecurityLevel.MEDIUM
        elif score >= 30:
            return SecurityLevel.HIGH
        else:
            return SecurityLevel.CRITICAL


def scan_mcp_server(server_code: str) -> SecurityReport:
    """Scan MCP server implementation for security issues"""
    scanner = SecurityScanner()
    return scanner.scan_python_code(server_code)


def scan_agent_definition(agent_json: Dict[str, Any]) -> SecurityReport:
    """Scan agent definition JSON for security issues"""
    issues = []
    safe_features = []
    
    # Check for embedded code
    if 'code' in agent_json:
        scanner = SecurityScanner()
        code_report = scanner.scan_python_code(agent_json['code'])
        issues.extend(code_report.issues)
    
    # Check for suspicious URLs
    if 'tools' in agent_json:
        for tool in agent_json['tools']:
            if 'url' in tool:
                url = tool['url']
                if not url.startswith(('https://', 'http://localhost')):
                    issues.append(SecurityIssue(
                        type=VulnerabilityType.NETWORK_ACCESS,
                        severity=SecurityLevel.MEDIUM,
                        line_number=None,
                        description=f"Insecure URL: {url}",
                        recommendation="Use HTTPS for all external connections"
                    ))
                else:
                    safe_features.append(f"Secure URL: {url}")
    
    # Calculate score
    score = 100 - (len(issues) * 10)
    score = max(0, min(100, score))
    
    from datetime import datetime
    return SecurityReport(
        score=score,
        level=SecurityLevel.SAFE if score >= 90 else SecurityLevel.LOW,
        issues=issues,
        safe_features=safe_features,
        risky_features=[],
        checksum=hashlib.sha256(json.dumps(agent_json, sort_keys=True).encode()).hexdigest(),
        scanned_at=datetime.utcnow().isoformat()
    )
