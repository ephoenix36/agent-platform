import { test, expect } from '@playwright/test';

test.describe('Security API Tests', () => {
  const API_BASE = 'http://localhost:8000/api/v1/security';

  test('should scan Python code and return security report', async ({ request }) => {
    const pythonCode = `
def hello():
    name = input("Enter name: ")
    eval(name)  # Dangerous!
    return "Hello"
`;

    const response = await request.post(`${API_BASE}/scan/code`, {
      data: {
        code: pythonCode,
        language: 'python'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Should have security score
    expect(data).toHaveProperty('score');
    expect(data).toHaveProperty('level');
    expect(data).toHaveProperty('issues');
    
    // Should detect eval() usage
    expect(data.issues.length).toBeGreaterThan(0);
    const hasEvalIssue = data.issues.some((issue: any) => 
      issue.type === 'code_injection' || issue.description.includes('eval')
    );
    expect(hasEvalIssue).toBeTruthy();
  });

  test('should return high scores for safe code', async ({ request }) => {
    const safeCode = `
from typing import List

def add_numbers(a: int, b: int) -> int:
    """Safely add two numbers"""
    return a + b

def process_list(items: List[str]) -> List[str]:
    """Safely process a list"""
    return [item.upper() for item in items]
`;

    const response = await request.post(`${API_BASE}/scan/code`, {
      data: {
        code: safeCode,
        language: 'python'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Should have high security score
    expect(data.score).toBeGreaterThan(90);
    expect(data.level).toBe('safe');
  });

  test('should detect multiple vulnerabilities', async ({ request }) => {
    const vulnerableCode = `
import os
import pickle

def dangerous_func(user_input):
    # Multiple security issues
    eval(user_input)
    os.system(user_input)
    exec(user_input)
    data = pickle.loads(user_input)
    password = "hardcoded123"  # Credential exposure
    return data
`;

    const response = await request.post(`${API_BASE}/scan/code`, {
      data: {
        code: vulnerableCode,
        language: 'python'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Should have multiple issues
    expect(data.issues.length).toBeGreaterThan(3);
    
    // Should have low security score
    expect(data.score).toBeLessThan(50);
    expect(['high', 'critical']).toContain(data.level);
  });

  test('should verify code checksum', async ({ request }) => {
    const code = 'print("hello")';
    const correctChecksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // SHA-256 of empty string for test
    
    const response = await request.post(`${API_BASE}/verify`, {
      data: {
        code,
        checksum: correctChecksum
      }
    });

    // Will fail with wrong checksum, which is expected
    expect(response.status()).toBe(400);
  });
});

test.describe('Agent Execution API Tests', () => {
  const API_BASE = 'http://localhost:8000/api/v1';

  test('should list available agents', async ({ request }) => {
    const response = await request.get(`${API_BASE}/agents`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should parse agent from markdown', async ({ request }) => {
    const markdown = `
# Test Agent

## Protocol
MCP

## Description
A test agent for demo purposes

## Tools
- search: Search the web
- analyze: Analyze data
`;

    const response = await request.post(`${API_BASE}/agents/parse`, {
      data: {
        content: markdown,
        format: 'markdown'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('protocol');
    expect(data).toHaveProperty('description');
  });
});
