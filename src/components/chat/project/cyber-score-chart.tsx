"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface CyberScoreChartProps {
  score: number;
  percentile: number;
}

/**
 * Cyber Score环形进度图组件
 * 使用Recharts的RadialBarChart展示Cyber Score的percentile
 * - score: Cyber Score分数
 * - percentile: 百分位数（例如6.58表示top 6.58%）
 */
export function CyberScoreChart({ score, percentile }: CyberScoreChartProps) {
  // 将percentile转换为完成度（top 6.58% = 93.42%完成度）
  const completion = 100 - percentile;

  // 图表数据
  const data = [
    {
      name: 'Cyber Score',
      value: completion,
      fill: 'hsl(var(--primary))',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 环形图 */}
      <div className="relative">
        <RadialBarChart
          width={120}
          height={120}
          cx={60}
          cy={60}
          innerRadius={40}
          outerRadius={55}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            fill="hsl(var(--primary))"
          />
        </RadialBarChart>

        {/* 中心文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-foreground">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
      </div>

      {/* 百分位说明 */}
      <div className="text-center">
        <div className="text-sm font-semibold text-primary">
          Top {percentile.toFixed(2)}%
        </div>
        <div className="text-xs text-muted-foreground">
          Elite Performance
        </div>
      </div>
    </div>
  );
}
