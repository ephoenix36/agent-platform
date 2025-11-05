import { test, expect } from '@playwright/test';

test.describe('Agent Platform - Marketplace Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should display marketplace with agents', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('text=Agent Marketplace', { timeout: 10000 });
    
    // Check that agents are displayed
    const agentCards = page.locator('[class*="bg-gray-900"]').filter({ hasText: 'Research Agent Pro' });
    await expect(agentCards).toBeVisible();
  });

  test('should show security badges on agent cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for security score
    const securityScore = page.locator('text=Security Score');
    await expect(securityScore.first()).toBeVisible();
    
    // Look for VERIFIED badge
    const verifiedBadge = page.locator('text=VERIFIED');
    await expect(verifiedBadge.first()).toBeVisible();
    
    // Check for Shield icon with Shield class
    const shieldIcons = page.locator('svg.lucide-shield');
    expect(await shieldIcons.count()).toBeGreaterThan(0);
  });

  test('should filter agents by category', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on Research category
    await page.click('text=Research');
    
    // Wait for filtering to complete
    await page.waitForTimeout(500);
    
    // Should show research agents
    await expect(page.locator('text=Research Agent Pro')).toBeVisible();
  });

  test('should search for agents', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Research');
    
    // Wait for search to complete
    await page.waitForTimeout(500);
    
    // Should show matching agent
    await expect(page.locator('text=Research Agent Pro')).toBeVisible();
  });

  test('should display agent metrics correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for metrics (use .first() to handle multiple cards)
    await expect(page.locator('text=Success Rate').first()).toBeVisible();
    await expect(page.locator('text=Avg Time').first()).toBeVisible();
    await expect(page.locator('text=Total Runs').first()).toBeVisible();
    await expect(page.locator('text=Active Users').first()).toBeVisible();
    
    // Check for percentage values
    const successRate = page.locator('text=/\\d+\\.\\d+%/');
    await expect(successRate.first()).toBeVisible();
  });

  test('should show Try Now button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const tryNowButton = page.locator('button:has-text("Try Now")');
    await expect(tryNowButton.first()).toBeVisible();
    await expect(tryNowButton.first()).toBeEnabled();
  });

  test('should sort agents by different criteria', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Select sort dropdown
    const sortDropdown = page.locator('select');
    
    // Try different sort options
    await sortDropdown.selectOption('trending');
    await page.waitForTimeout(300);
    
    await sortDropdown.selectOption('performance');
    await page.waitForTimeout(300);
    
    // Should still show agents
    await expect(page.locator('text=Research Agent Pro')).toBeVisible();
  });
});

test.describe('Agent Platform - Security Scanner Tests', () => {
  test('should display MCP Tool Creator', async ({ page }) => {
    // This would need routing to be set up
    // For now, we'll skip this test
    test.skip();
  });
});

test.describe('Agent Platform - Performance Tests', () => {
  test('should load marketplace within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3001');
    await page.waitForSelector('text=Agent Marketplace');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001');
    
    await expect(page.locator('text=Agent Marketplace')).toBeVisible();
  });
});

test.describe('Agent Platform - Accessibility Tests', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Agent Marketplace');
  });

  test('should have clickable buttons', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });
});
