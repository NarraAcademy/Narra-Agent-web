"use client";

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PriceDataPoint {
  timestamp: number;
  datetime: string;
  price: number;
}

interface PriceChartData {
  current: number;
  start: number;
  change: number;
  change_percentage: number;
  high: number;
  low: number;
  data: PriceDataPoint[];
}

interface PriceChartProps {
  priceData: PriceChartData;
}

/**
 * 简洁的价格趋势图组件
 * 显示7天价格走势 + 当前价格 + 涨跌幅
 */
export function PriceChart({ priceData }: PriceChartProps) {
  const { current, change_percentage, data } = priceData;

  // 判断涨跌
  const isPositive = change_percentage >= 0;
  const changeColor = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const chartColor = isPositive ? "#16a34a" : "#dc2626";

  // 格式化价格显示
  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // 格式化百分比
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-2">
      {/* 价格和涨跌幅 */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(current)}
          </span>
          <div className={cn("flex items-center gap-1 text-sm font-medium", changeColor)}>
            {isPositive ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
            <span>{formatPercentage(change_percentage)}</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">7d</span>
      </div>

      {/* 迷你折线图 */}
      {data && data.length > 0 && (
        <div className="w-full h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Tooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(data.datetime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: chartColor }}
                        />
                        <span className="font-semibold text-sm">
                          {formatPrice(data.price)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
