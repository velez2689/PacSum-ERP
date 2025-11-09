/**
 * Unit Tests for Financial Health Score (FHS) Calculation
 * Tests the complex financial metrics and scoring logic
 */

describe('Financial Health Score (FHS) Calculation', () => {
  /**
   * Calculate Financial Health Score based on multiple metrics
   * FHS Components:
   * - Revenue Stability (25%)
   * - Profitability (25%)
   * - Liquidity (25%)
   * - Growth Trend (25%)
   */

  interface FinancialMetrics {
    totalRevenue: number;
    netIncome: number;
    currentAssets: number;
    currentLiabilities: number;
    revenueGrowthRate: number;
    revenueHistory: number[]; // Last 12 months
  }

  function calculateRevenueStability(revenueHistory: number[]): number {
    if (revenueHistory.length < 2) return 50;

    const mean = revenueHistory.reduce((a, b) => a + b) / revenueHistory.length;
    const variance = revenueHistory.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / revenueHistory.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation

    // Lower CV is better (more stable)
    // CV 0 = 100 points, CV 1+ = 0 points
    return Math.max(0, Math.min(100, 100 - (cv * 100)));
  }

  function calculateProfitability(netIncome: number, totalRevenue: number): number {
    if (totalRevenue === 0) return 0;

    const profitMargin = (netIncome / totalRevenue) * 100;

    // Map profit margin to score
    // 15%+ = 100, 0% = 50, -10%+ = 0
    if (profitMargin >= 15) return 100;
    if (profitMargin >= 10) return 80;
    if (profitMargin >= 5) return 60;
    if (profitMargin >= 0) return 50;
    if (profitMargin >= -5) return 25;
    return 0;
  }

  function calculateLiquidity(currentAssets: number, currentLiabilities: number): number {
    if (currentLiabilities === 0) return 100;

    const currentRatio = currentAssets / currentLiabilities;

    // Ideal current ratio is 1.5 - 3.0
    // Below 1.0 = poor liquidity
    if (currentRatio >= 2.5) return 100;
    if (currentRatio >= 2.0) return 90;
    if (currentRatio >= 1.5) return 80;
    if (currentRatio >= 1.0) return 50;
    if (currentRatio >= 0.5) return 25;
    return 0;
  }

  function calculateGrowthTrend(revenueGrowthRate: number): number {
    // Growth rate as percentage
    // 20%+ = 100, 10% = 80, 0% = 50, -10% = 25, -20%+ = 0

    if (revenueGrowthRate >= 20) return 100;
    if (revenueGrowthRate >= 10) return 80;
    if (revenueGrowthRate >= 0) return 50;
    if (revenueGrowthRate >= -10) return 25;
    return 0;
  }

  function calculateFHS(metrics: FinancialMetrics): number {
    const stabilityScore = calculateRevenueStability(metrics.revenueHistory);
    const profitabilityScore = calculateProfitability(metrics.netIncome, metrics.totalRevenue);
    const liquidityScore = calculateLiquidity(metrics.currentAssets, metrics.currentLiabilities);
    const growthScore = calculateGrowthTrend(metrics.revenueGrowthRate);

    // Equal weighting for all components
    const fhs = (stabilityScore + profitabilityScore + liquidityScore + growthScore) / 4;

    return Math.round(fhs * 10) / 10;
  }

  describe('Revenue Stability Calculation', () => {
    it('should give high score for consistent revenue', () => {
      const history = [10000, 10100, 10200, 10150, 10300];
      const score = calculateRevenueStability(history);
      expect(score).toBeGreaterThan(80);
    });

    it('should give low score for volatile revenue', () => {
      const history = [5000, 15000, 3000, 20000, 1000];
      const score = calculateRevenueStability(history);
      expect(score).toBeLessThan(50);
    });

    it('should handle single month history', () => {
      const history = [10000];
      const score = calculateRevenueStability(history);
      expect(score).toBe(50); // Default
    });

    it('should give perfect score for identical values', () => {
      const history = [10000, 10000, 10000];
      const score = calculateRevenueStability(history);
      expect(score).toBe(100);
    });
  });

  describe('Profitability Calculation', () => {
    it('should give high score for high profit margin', () => {
      const score = calculateProfitability(15000, 100000); // 15% margin
      expect(score).toBe(100);
    });

    it('should give mid score for break-even', () => {
      const score = calculateProfitability(0, 100000); // 0% margin
      expect(score).toBe(50);
    });

    it('should give low score for losses', () => {
      const score = calculateProfitability(-10000, 100000); // -10% margin
      expect(score).toBe(0);
    });

    it('should give mid score for 10% profit margin', () => {
      const score = calculateProfitability(10000, 100000);
      expect(score).toBe(80);
    });

    it('should handle zero revenue', () => {
      const score = calculateProfitability(1000, 0);
      expect(score).toBe(0);
    });

    it('should handle small positive margin', () => {
      const score = calculateProfitability(3000, 100000); // 3% margin
      expect(score).toBe(60);
    });
  });

  describe('Liquidity Calculation', () => {
    it('should give high score for strong liquidity', () => {
      const score = calculateLiquidity(250000, 100000); // 2.5x ratio
      expect(score).toBe(100);
    });

    it('should give perfect score for very high ratio', () => {
      const score = calculateLiquidity(300000, 100000); // 3.0x ratio
      expect(score).toBe(100);
    });

    it('should give mid score for 1:1 ratio', () => {
      const score = calculateLiquidity(100000, 100000);
      expect(score).toBe(50);
    });

    it('should give low score for poor liquidity', () => {
      const score = calculateLiquidity(30000, 100000); // 0.3x ratio
      expect(score).toBe(25);
    });

    it('should give perfect score when no liabilities', () => {
      const score = calculateLiquidity(100000, 0);
      expect(score).toBe(100);
    });

    it('should handle insolvency', () => {
      const score = calculateLiquidity(0, 100000);
      expect(score).toBe(0);
    });
  });

  describe('Growth Trend Calculation', () => {
    it('should give high score for strong growth', () => {
      const score = calculateGrowthTrend(25);
      expect(score).toBe(100);
    });

    it('should give mid score for moderate growth', () => {
      const score = calculateGrowthTrend(10);
      expect(score).toBe(80);
    });

    it('should give neutral score for no growth', () => {
      const score = calculateGrowthTrend(0);
      expect(score).toBe(50);
    });

    it('should give low score for decline', () => {
      const score = calculateGrowthTrend(-15);
      expect(score).toBe(25);
    });

    it('should give zero for severe decline', () => {
      const score = calculateGrowthTrend(-30);
      expect(score).toBe(0);
    });
  });

  describe('Overall FHS Calculation', () => {
    it('should calculate FHS for healthy company', () => {
      const metrics: FinancialMetrics = {
        totalRevenue: 100000,
        netIncome: 15000,
        currentAssets: 250000,
        currentLiabilities: 100000,
        revenueGrowthRate: 15,
        revenueHistory: [95000, 97000, 99000, 100000, 101000, 102000, 103000, 104000, 105000, 106000, 107000, 108000],
      };

      const fhs = calculateFHS(metrics);
      expect(fhs).toBeGreaterThan(70);
    });

    it('should calculate FHS for struggling company', () => {
      const metrics: FinancialMetrics = {
        totalRevenue: 100000,
        netIncome: -5000,
        currentAssets: 50000,
        currentLiabilities: 100000,
        revenueGrowthRate: -10,
        revenueHistory: [100000, 95000, 90000, 85000, 80000, 75000, 70000, 65000, 60000, 55000, 50000, 45000],
      };

      const fhs = calculateFHS(metrics);
      expect(fhs).toBeLessThan(40);
    });

    it('should calculate FHS for average company', () => {
      const metrics: FinancialMetrics = {
        totalRevenue: 100000,
        netIncome: 5000,
        currentAssets: 150000,
        currentLiabilities: 100000,
        revenueGrowthRate: 5,
        revenueHistory: [100000, 100500, 101000, 101500, 102000, 102500, 103000, 103500, 104000, 104500, 105000, 105500],
      };

      const fhs = calculateFHS(metrics);
      expect(fhs).toBeGreaterThan(50);
      expect(fhs).toBeLessThan(70);
    });

    it('should return number between 0 and 100', () => {
      const metrics: FinancialMetrics = {
        totalRevenue: 100000,
        netIncome: 10000,
        currentAssets: 200000,
        currentLiabilities: 100000,
        revenueGrowthRate: 10,
        revenueHistory: [100000, 101000, 102000, 103000, 104000, 105000, 106000, 107000, 108000, 109000, 110000, 111000],
      };

      const fhs = calculateFHS(metrics);
      expect(fhs).toBeGreaterThanOrEqual(0);
      expect(fhs).toBeLessThanOrEqual(100);
    });

    it('should handle edge case with zero revenue', () => {
      const metrics: FinancialMetrics = {
        totalRevenue: 0,
        netIncome: 0,
        currentAssets: 100000,
        currentLiabilities: 100000,
        revenueGrowthRate: 0,
        revenueHistory: [0, 0, 0],
      };

      const fhs = calculateFHS(metrics);
      expect(Number.isNaN(fhs)).toBe(false);
      expect(fhs).toBeLessThan(50);
    });

    it('should be deterministic', () => {
      const metrics: FinancialMetrics = {
        totalRevenue: 100000,
        netIncome: 10000,
        currentAssets: 200000,
        currentLiabilities: 100000,
        revenueGrowthRate: 10,
        revenueHistory: [100000, 101000, 102000, 103000, 104000, 105000, 106000, 107000, 108000, 109000, 110000, 111000],
      };

      const fhs1 = calculateFHS(metrics);
      const fhs2 = calculateFHS(metrics);

      expect(fhs1).toBe(fhs2);
    });
  });

  describe('FHS Sensitivity Analysis', () => {
    const baseMetrics: FinancialMetrics = {
      totalRevenue: 100000,
      netIncome: 10000,
      currentAssets: 200000,
      currentLiabilities: 100000,
      revenueGrowthRate: 10,
      revenueHistory: [100000, 101000, 102000, 103000, 104000, 105000, 106000, 107000, 108000, 109000, 110000, 111000],
    };

    it('should increase FHS with higher profitability', () => {
      const fhs1 = calculateFHS(baseMetrics);

      const betterMetrics = {
        ...baseMetrics,
        netIncome: 20000,
      };
      const fhs2 = calculateFHS(betterMetrics);

      expect(fhs2).toBeGreaterThan(fhs1);
    });

    it('should decrease FHS with lower profitability', () => {
      const fhs1 = calculateFHS(baseMetrics);

      const worseMetrics = {
        ...baseMetrics,
        netIncome: 0,
      };
      const fhs2 = calculateFHS(worseMetrics);

      expect(fhs2).toBeLessThan(fhs1);
    });

    it('should increase FHS with better liquidity', () => {
      const fhs1 = calculateFHS(baseMetrics);

      const betterMetrics = {
        ...baseMetrics,
        currentAssets: 300000,
      };
      const fhs2 = calculateFHS(betterMetrics);

      expect(fhs2).toBeGreaterThan(fhs1);
    });

    it('should increase FHS with higher growth', () => {
      const fhs1 = calculateFHS(baseMetrics);

      const betterMetrics = {
        ...baseMetrics,
        revenueGrowthRate: 20,
      };
      const fhs2 = calculateFHS(betterMetrics);

      expect(fhs2).toBeGreaterThan(fhs1);
    });
  });

  describe('FHS Category Classification', () => {
    function getFHSCategory(fhs: number): string {
      if (fhs >= 80) return 'Excellent';
      if (fhs >= 60) return 'Good';
      if (fhs >= 40) return 'Fair';
      if (fhs >= 20) return 'Poor';
      return 'Critical';
    }

    it('should classify excellent FHS', () => {
      expect(getFHSCategory(85)).toBe('Excellent');
    });

    it('should classify good FHS', () => {
      expect(getFHSCategory(70)).toBe('Good');
    });

    it('should classify fair FHS', () => {
      expect(getFHSCategory(50)).toBe('Fair');
    });

    it('should classify poor FHS', () => {
      expect(getFHSCategory(25)).toBe('Poor');
    });

    it('should classify critical FHS', () => {
      expect(getFHSCategory(10)).toBe('Critical');
    });
  });
});
