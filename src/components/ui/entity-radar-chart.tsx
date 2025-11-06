/**
 * 实体雷达图组件
 * 用于展示 Token 和 Project 的多维度评分
 */

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { RadarScores } from "@/utils/entity-scores";

interface EntityRadarChartProps {
  scores: RadarScores;
  title?: string;
  className?: string;
}

export function EntityRadarChart({
  scores,
  className = "",
}: EntityRadarChartProps) {
  if (!scores.dimensions || scores.dimensions.length === 0) {
    return null;
  }

  // 转换为 Recharts 需要的格式
  const chartData = scores.dimensions.map((dim) => ({
    dimension: dim.name,
    value: dim.value,
    grade: dim.grade,
    fullMark: 100,
  }));

  // 自定义维度标签渲染
  const CustomLabel = ({ x, y, payload, index, cx }: any) => {
    return (
      <g>
        <text
          x={x}
          y={y}
          fill="#888"
          fontSize={13}
          fontWeight={500}
          textAnchor={x > cx ? "start" : x === cx ? "middle" : "end"}
          dominantBaseline="central"
        >
          {payload.value}
        </text>
        <text
          x={x}
          y={y + 18}
          fill="#9ca3af"
          fontSize={16}
          fontWeight={700}
          textAnchor={x > cx ? "start" : x === cx ? "middle" : "end"}
          dominantBaseline="central"
        >
          {chartData[index].grade}
        </text>
      </g>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={450}>
        <RadarChart cx="50%" cy="50%" outerRadius="78%" data={chartData}>
          {/* 网格 */}
          <PolarGrid stroke="#374151" strokeWidth={1} gridType="polygon" />

          {/* 维度标签 */}
          <PolarAngleAxis
            dataKey="dimension"
            tick={<CustomLabel />}
            tickLine={false}
            axisLine={false}
          />

          {/* 隐藏半径轴刻度 */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />

          {/* 雷达区域 */}
          <Radar
            name="Score"
            dataKey="value"
            stroke="#a3a024"
            strokeWidth={2}
            fill="#a3a024"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
