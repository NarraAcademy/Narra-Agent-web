"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export default function AnalyticsPage() {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search query:", query);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Crypto Data Center</h1>
          <p className="text-muted-foreground">
            Search cryptocurrency data, market analysis and blockchain information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search tokens, projects or market data..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 rounded-xl pr-24 h-12 text-base focus-visible:ring-0 focus-visible:border-input"
          />
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">Market Overview</h3>
            <p className="text-sm text-muted-foreground">
              View real-time market data and trends
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">Hot Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Explore trending cryptocurrencies and projects
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">Data Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Deep dive into on-chain data and metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
