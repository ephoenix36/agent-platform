"""
Quick test script for telemetry endpoint
"""
import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Test direct import
try:
    from telemetry.routes import router as telemetry_router
    from documents.routes import router as documents_router  
    from workflows.routes import router as workflows_router
    print("✅ All imports successful!")
    print(f"✅ Telemetry router prefix: {telemetry_router.prefix}")
    print(f"✅ Documents router prefix: {documents_router.prefix}")
    print(f"✅ Workflows router prefix: {workflows_router.prefix}")
    
    # Check routes
    for route in telemetry_router.routes:
        print(f"  - {route.methods} {telemetry_router.prefix}{route.path}")
    
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
