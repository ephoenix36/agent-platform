"""
API Integration Tests
Tests all major endpoints and features
"""

import pytest
import httpx
import asyncio
from datetime import datetime

BASE_URL = "http://localhost:8000"

@pytest.fixture
async def client():
    """HTTP client fixture"""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        yield client

class TestHealthAndInfo:
    """Test basic endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "endpoints" in data
        assert "features" in data

class TestLLMProviders:
    """Test LLM provider endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_providers(self, client):
        """Test getting available providers"""
        response = await client.get("/api/providers")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        
        # Check for key providers
        provider_ids = [p["id"] for p in data["providers"]]
        assert "xai" in provider_ids
        assert "openrouter" in provider_ids

class TestTelemetry:
    """Test telemetry endpoints"""
    
    @pytest.mark.asyncio
    async def test_record_agent_event(self, client):
        """Test recording agent telemetry event"""
        event = {
            "event_id": f"test_{datetime.utcnow().timestamp()}",
            "agent_id": "test-agent",
            "event_type": "agent_start",
            "timestamp": datetime.utcnow().isoformat(),
            "success": True,
        }
        
        response = await client.post("/api/telemetry/events/agent", json=event)
        assert response.status_code == 200
        data = response.json()
        assert "event_id" in data
        assert data["status"] == "recorded"
    
    @pytest.mark.asyncio
    async def test_get_dashboard_overview(self, client):
        """Test dashboard overview endpoint"""
        response = await client.get("/api/telemetry/dashboard/overview?hours=24")
        assert response.status_code == 200
        data = response.json()
        assert "time_range" in data
        assert "total_executions" in data
        assert "total_cost" in data
    
    @pytest.mark.asyncio
    async def test_cost_analysis(self, client):
        """Test cost analysis endpoint"""
        response = await client.get("/api/telemetry/analytics/cost-analysis?days=7")
        assert response.status_code == 200
        data = response.json()
        assert "time_range" in data
        assert "total_cost" in data
        assert "breakdown" in data

class TestWorkflows:
    """Test workflow endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_workflow(self, client):
        """Test workflow creation"""
        workflow = {
            "id": f"test-wf-{datetime.utcnow().timestamp()}",
            "name": "Test Workflow",
            "description": "A test workflow",
            "nodes": [
                {
                    "id": "node1",
                    "type": "llm",
                    "name": "Test Node",
                    "config": {
                        "provider": "xai",
                        "model": "grok-4-fast",
                        "prompt": "Test prompt",
                    },
                }
            ],
        }
        
        response = await client.post("/api/workflows/create", json=workflow)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "created"
    
    @pytest.mark.asyncio
    async def test_list_workflows(self, client):
        """Test listing workflows"""
        response = await client.get("/api/workflows/list")
        assert response.status_code == 200
        data = response.json()
        assert "workflows" in data
        assert "total" in data

class TestDocuments:
    """Test document processing endpoints"""
    
    @pytest.mark.asyncio
    async def test_upload_document(self, client):
        """Test document upload"""
        files = {"file": ("test.txt", b"Test content", "text/plain")}
        response = await client.post("/api/documents/upload", files=files)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "url" in data

class TestMCPTools:
    """Test MCP tools endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_registry(self, client):
        """Test getting MCP tools registry"""
        response = await client.get("/api/mcp-tools/registry")
        assert response.status_code == 200
        data = response.json()
        assert "tools" in data
    
    @pytest.mark.asyncio
    async def test_install_tool(self, client):
        """Test installing MCP tool"""
        payload = {
            "toolId": "test-tool",
            "version": "1.0.0",
        }
        
        response = await client.post("/api/mcp-tools/install", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "installed"

class TestSettings:
    """Test settings endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_settings(self, client):
        """Test getting settings"""
        response = await client.get("/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "defaultProvider" in data
        assert "providers" in data
        assert "telemetry" in data

# Run all tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
