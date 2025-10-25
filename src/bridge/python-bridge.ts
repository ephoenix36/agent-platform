import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface BridgeRequest {
  command: string;
  data: any;
}

export interface BridgeResponse {
  success: boolean;
  command?: string;
  result?: any;
  error?: string;
}

/**
 * Python bridge for optimization operations
 */
export class PythonBridge {
  private process: ChildProcess | null = null;
  private pythonPath: string;
  private bridgeScript: string;

  constructor(pythonPath: string = 'python', bridgeScript: string = './optimization/bridge.py') {
    this.pythonPath = pythonPath;
    this.bridgeScript = bridgeScript;
  }

  /**
   * Start the Python bridge process
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.pythonPath, [this.bridgeScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.on('error', (error) => {
        reject(new Error(`Failed to start Python bridge: ${error.message}`));
      });

      // Give it a moment to initialize
      setTimeout(() => resolve(), 100);
    });
  }

  /**
   * Send a request to Python and wait for response
   */
  async request(command: string, data: any = {}): Promise<BridgeResponse> {
    if (!this.process || !this.process.stdin || !this.process.stdout) {
      throw new Error('Python bridge not started');
    }

    return new Promise((resolve, reject) => {
      const request: BridgeRequest = { command, data };
      const requestJson = JSON.stringify(request) + '\n';

      let responseData = '';
      
      const onData = (chunk: Buffer) => {
        responseData += chunk.toString();
        
        // Check if we have a complete JSON response
        try {
          const response: BridgeResponse = JSON.parse(responseData);
          this.process!.stdout!.removeListener('data', onData);
          resolve(response);
        } catch (e) {
          // Not yet a complete JSON, wait for more data
        }
      };

      const onError = (error: Error) => {
        this.process!.stdout!.removeListener('data', onData);
        this.process!.stderr!.removeListener('data', onError);
        reject(error);
      };

      this.process!.stdout!.on('data', onData);
      this.process!.stderr!.on('data', onError);

      // Send the request
      this.process!.stdin!.write(requestJson);
    });
  }

  /**
   * Stop the Python bridge process
   */
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
