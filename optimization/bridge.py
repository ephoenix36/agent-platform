"""
Python bridge for TypeScript <-> Python communication via stdio
Handles optimization requests from the TypeScript layer
"""
import sys
import json
from typing import Dict, Any, List
from optimizer import handle_optimize_request


class StdioBridge:
    """Handles stdio-based communication with TypeScript layer"""
    
    def __init__(self):
        self.handlers: Dict[str, Any] = {}
        # Register default handlers
        self.register_handler('optimize', handle_optimize_request)
    
    def register_handler(self, command: str, handler: Any):
        """Register a command handler"""
        self.handlers[command] = handler
    
    def start(self):
        """Start listening for commands on stdin"""
        for line in sys.stdin:
            try:
                request = json.loads(line.strip())
                response = self.handle_request(request)
                self.send_response(response)
            except Exception as e:
                self.send_error(str(e))
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming request"""
        command = request.get('command')
        data = request.get('data', {})
        
        if command not in self.handlers:
            raise ValueError(f"Unknown command: {command}")
        
        handler = self.handlers[command]
        result = handler(data)
        
        return {
            'success': True,
            'command': command,
            'result': result
        }
    
    def send_response(self, response: Dict[str, Any]):
        """Send response to TypeScript layer"""
        print(json.dumps(response), flush=True)
    
    def send_error(self, error: str):
        """Send error response"""
        response = {
            'success': False,
            'error': error
        }
        print(json.dumps(response), flush=True)


# Initialize bridge
bridge = StdioBridge()

if __name__ == '__main__':
    # Start the bridge
    bridge.start()
