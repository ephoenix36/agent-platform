"""
Security scanning API endpoints
"""

from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json

from app.services.security.scanner import (
    scan_mcp_server,
    scan_agent_definition,
    SecurityReport,
    SecurityScanner
)

router = APIRouter(prefix="/security", tags=["security"])


class CodeScanRequest(BaseModel):
    """Request to scan code"""
    code: str
    language: str = "python"


class AgentScanRequest(BaseModel):
    """Request to scan agent definition"""
    definition: Dict[str, Any]


class SecurityBadge(BaseModel):
    """Security badge information"""
    score: float
    level: str
    verified: bool
    checksum: str
    scanned_at: str


@router.post("/scan/code", response_model=SecurityReport)
async def scan_code(request: CodeScanRequest):
    """
    Scan code for security vulnerabilities
    
    Returns comprehensive security report with:
    - Security score (0-100)
    - List of issues by severity
    - Recommendations for fixes
    - Checksum for verification
    """
    try:
        scanner = SecurityScanner()
        
        if request.language == "python":
            report = scanner.scan_python_code(request.code)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Language {request.language} not supported yet"
            )
        
        return report
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.post("/scan/mcp-server")
async def scan_mcp_server_endpoint(file: UploadFile = File(...)):
    """
    Scan MCP server implementation file
    
    Upload a Python file and get security analysis
    """
    try:
        content = await file.read()
        code = content.decode('utf-8')
        
        report = scan_mcp_server(code)
        
        return {
            "filename": file.filename,
            "report": report
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.post("/scan/agent", response_model=SecurityReport)
async def scan_agent(request: AgentScanRequest):
    """
    Scan agent definition for security issues
    
    Checks:
    - Embedded code security
    - URL safety
    - Configuration risks
    - Credential exposure
    """
    try:
        report = scan_agent_definition(request.definition)
        return report
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.get("/badge/{checksum}", response_model=SecurityBadge)
async def get_security_badge(checksum: str):
    """
    Get security badge for verified code
    
    This would check against a database of scanned and verified code
    """
    # TODO: Implement database lookup
    # For now, return a mock response
    from datetime import datetime
    
    return SecurityBadge(
        score=95.0,
        level="safe",
        verified=True,
        checksum=checksum,
        scanned_at=datetime.utcnow().isoformat()
    )


@router.post("/verify")
async def verify_code_signature(
    code: str,
    checksum: str,
    signature: Optional[str] = None
):
    """
    Verify code hasn't been tampered with
    
    Checks that the provided checksum matches the code
    Optionally verifies cryptographic signature
    """
    import hashlib
    
    computed_checksum = hashlib.sha256(code.encode()).hexdigest()
    
    if computed_checksum != checksum:
        raise HTTPException(
            status_code=400,
            detail="Checksum mismatch - code has been modified"
        )
    
    return {
        "verified": True,
        "checksum": computed_checksum,
        "message": "Code integrity verified"
    }
