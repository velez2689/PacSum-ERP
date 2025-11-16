'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface FHSCardProps {
  orgId: string;
  score?: number;
}

/**
 * Financial Health Score card component
 */
export function FHSCard({ orgId: _orgId, score = 72 }: FHSCardProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Financial Health Score
        </CardTitle>
        <CardDescription>Overall organization financial health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6">
          {/* Circular Progress */}
          <div className="relative w-32 h-32 mb-4">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                className={getScoreColor(score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
          </div>

          <p className="text-lg font-semibold text-white mb-1">{getScoreLabel(score)}</p>
          <p className="text-sm text-slate-400 text-center">
            Your financial health is {getScoreLabel(score).toLowerCase()}
          </p>
        </div>

        {/* Key Factors */}
        <div className="space-y-3 mt-4">
          <FactorItem label="Cash Flow" value={85} />
          <FactorItem label="Debt Ratio" value={68} />
          <FactorItem label="Profitability" value={72} />
          <FactorItem label="Liquidity" value={64} />
        </div>
      </CardContent>
    </Card>
  );
}

interface FactorItemProps {
  label: string;
  value: number;
}

function FactorItem({ label, value }: FactorItemProps) {
  const getColor = (value: number): string => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-medium text-white">{value}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`${getColor(value)} h-2 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
