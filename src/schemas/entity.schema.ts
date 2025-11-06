/**
 * 实体数据 Zod Schema 定义
 * 处理后端脏数据：字符串数值转换、null处理、字段重命名
 */

import { z } from 'zod';

// ============ 辅助转换函数 ============

/**
 * 字符串转数字（处理脏数据，支持 null）
 */
const stringToNumber = z
  .union([z.string(), z.number(), z.null()])
  .transform((val) => {
    if (val === null) return 0;
    if (typeof val === 'number') return val;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  })
  .default(0);

/**
 * 可选的字符串转数字
 */
const optionalStringToNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const num = Number(val);
    return isNaN(num) ? null : num;
  })
  .nullable();

// ============ 共享 Schema ============

/**
 * 价格图表数据点 Schema
 */
const priceDataPointSchema = z.object({
  timestamp: z.number(),
  datetime: z.string(),
  price: z.number(),
});

/**
 * 价格图表数据 Schema
 */
const priceChartSchema = z
  .object({
    coin_id: z.string().optional(),
    time_range: z.any().optional(),
    price: z
      .object({
        current: z.number().optional(),
        start: z.number().optional(),
        change: z.number().optional(),
        change_percentage: z.number().optional(),
        high: z.number().optional(),
        low: z.number().optional(),
        data: z.array(priceDataPointSchema).optional(),
      })
      .optional(),
    market_cap: z.any().optional(),
    volume: z.any().optional(),
  })
  .optional();

// ============ Project Schema ============

/**
 * CyberScore Schema
 */
const cyberScoreSchema = z.object({
  score: z.number().default(0),
  percentile: z.number().default(0),
});

/**
 * X账号 Schema（snake_case → camelCase）
 */
const xAccountSchema = z
  .object({
    id: z.number(),
    profile_image: z.string().default(''),
    handle: z.string().default(''),
    display_name: z.string().default(''),
    description: z.string().default(''),
    followers_count: z.number().default(0),
    smart_followers_count: z.number().default(0),
    cyber_score: cyberScoreSchema,
  })
  .transform((data) => ({
    id: data.id,
    profileImage: data.profile_image,
    handle: data.handle,
    displayName: data.display_name,
    description: data.description,
    followersCount: data.followers_count,
    smartFollowersCount: data.smart_followers_count,
    cyberScore: data.cyber_score,
  }));

/**
 * Project Token Schema
 */
const projectTokenSchema = z
  .object({
    name: z.string(),
    symbol: z.string(),
    logo: z.string().optional(),
    price: z.number().optional(),
    market_cap: z.number().optional(),
    volume_24h: z.number().optional(),
    holders: z.number().optional(),
    contract_address: z.string().optional(),
  })
  .loose();

/**
 * Project Event Schema
 */
const projectEventSchema = z
  .object({
    title: z.string(),
    date: z.string().optional(),
    description: z.string().optional(),
  })
  .loose();

/**
 * Project News Schema
 */
const projectNewsSchema = z
  .object({
    title: z.string(),
    url: z.string(),
    source: z.string().optional(),
    publish_time: z.string().optional(),
  })
  .loose();

/**
 * Team Member Schema
 */
const teamMemberSchema = z
  .object({
    name: z.string(),
    title: z.string().optional(),
    avatar: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  })
  .loose();

/**
 * Project Contract Schema
 */
const projectContractSchema = z
  .object({
    chain: z.string(),
    address: z.string(),
    explorer_url: z.string().optional(),
  })
  .loose();

/**
 * Exchange Schema
 */
const exchangeSchema = z
  .object({
    name: z.string(),
    logo: z.string().optional(),
    url: z.string().optional(),
  })
  .loose();

/**
 * Similar Project Schema
 */
const similarProjectSchema = z
  .object({
    name: z.string(),
    logo: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .loose();

/**
 * Project Link Schema
 */
const projectLinkSchema = z
  .object({
    type: z.string(),
    value: z.string(),
  })
  .loose();

/**
 * Project Detail Schema
 * 将后端返回的 snake_case 项目数据转换为统一格式
 */
export const projectDetailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    name: z.string().default(''),
    image: z.string().default(''),
    description: z.string().default(''),
    tags: z.array(z.string()).default([]),
    total_funding: stringToNumber,
    x_accounts: z.array(xAccountSchema).default([]),
    tokens: z.array(projectTokenSchema).optional(),
    events: z.array(projectEventSchema).optional(),
    news: z.array(projectNewsSchema).optional(),
    team_members: z.array(teamMemberSchema).optional(),
    contracts: z.array(projectContractSchema).optional(),
    exchanges: z.array(exchangeSchema).optional(),
    similar_projects: z.array(similarProjectSchema).optional(),
    links: z.array(projectLinkSchema).default([]),
    coingecko_data: z
      .object({
        market_chart: priceChartSchema,
      })
      .optional(),
  })
  .passthrough()
  .transform((data) => {
    // 计算 Key Metrics
    const keyMetrics: Array<{ label: string; value: string }> = [];

    // Total Funding
    if (data.total_funding && data.total_funding > 0) {
      const funding = data.total_funding;
      const formattedFunding =
        funding >= 1000000
          ? `$${(funding / 1000000).toFixed(1)}M`
          : funding >= 1000
            ? `$${(funding / 1000).toFixed(1)}K`
            : `$${funding}`;
      keyMetrics.push({ label: 'Total Funding', value: formattedFunding });
    }

    // X Followers
    const mainXAccount = data.x_accounts?.[0];
    if (mainXAccount?.followersCount) {
      const followers = mainXAccount.followersCount;
      const formattedFollowers =
        followers >= 1000000
          ? `${(followers / 1000000).toFixed(1)}M`
          : followers >= 1000
            ? `${(followers / 1000).toFixed(1)}K`
            : followers.toString();
      keyMetrics.push({ label: 'X Followers', value: formattedFollowers });
    }

    // Smart Followers
    if (mainXAccount?.smartFollowersCount) {
      const smartFollowers = mainXAccount.smartFollowersCount;
      const formattedSmartFollowers =
        smartFollowers >= 1000000
          ? `${(smartFollowers / 1000000).toFixed(1)}M`
          : smartFollowers >= 1000
            ? `${(smartFollowers / 1000).toFixed(1)}K`
            : smartFollowers.toString();
      keyMetrics.push({ label: 'Smart Followers', value: formattedSmartFollowers });
    }

    // Market Cap (from tokens)
    const firstToken = data.tokens?.[0] as any;
    if (firstToken?.market_data?.market_cap) {
      const marketCap = parseFloat(firstToken.market_data.market_cap);
      const formattedMarketCap =
        marketCap >= 1000000000
          ? `$${(marketCap / 1000000000).toFixed(2)}B`
          : marketCap >= 1000000
            ? `$${(marketCap / 1000000).toFixed(1)}M`
            : marketCap >= 1000
              ? `$${(marketCap / 1000).toFixed(1)}K`
              : `$${marketCap}`;
      keyMetrics.push({ label: 'Market Cap', value: formattedMarketCap });
    }

    // FDV (from tokens)
    if (firstToken?.market_data?.fully_diluted_valuation) {
      const fdv = parseFloat(firstToken.market_data.fully_diluted_valuation);
      const formattedFdv =
        fdv >= 1000000000
          ? `$${(fdv / 1000000000).toFixed(2)}B`
          : fdv >= 1000000
            ? `$${(fdv / 1000000).toFixed(1)}M`
            : fdv >= 1000
              ? `$${(fdv / 1000).toFixed(1)}K`
              : `$${fdv}`;
      keyMetrics.push({ label: 'FDV', value: formattedFdv });
    }

    // Exchanges Count
    if (data.exchanges && data.exchanges.length > 0) {
      keyMetrics.push({
        label: 'Exchanges',
        value: data.exchanges.length.toString(),
      });
    }

    // Milestones Count
    if (data.events && data.events.length > 0) {
      keyMetrics.push({
        label: 'Milestones',
        value: data.events.length.toString(),
      });
    }

    return {
      type: 'PROJECT' as const,
      id: data.id,
      name: data.name,
      image: data.image,
      description: data.description,
      projectData: {
        totalFunding: data.total_funding,
        tags: data.tags,
        xAccounts: data.x_accounts,
        tokens: data.tokens,
        events: data.events || [],
        news: data.news || [],
        teamMembers: data.team_members || [],
        contracts: data.contracts || [],
        exchanges: data.exchanges || [],
        similarProjects: data.similar_projects || [],
        links: data.links || [],
        priceChart: data.coingecko_data?.market_chart,
        keyMetrics,
      },
    };
  });

/**
 * Backend Project Response Schema
 */
export const backendProjectResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable().optional(),
  data: z.object({
    project: projectDetailSchema,
  }),
});

// ============ Token Schema ============

/**
 * Token Image Schema
 */
const tokenImageSchema = z.object({
  thumb: z.string().default(''),
  small: z.string().default(''),
  large: z.string().default(''),
});

/**
 * Token Market Data Schema（字符串 → 数字）
 */
const tokenMarketDataSchema = z
  .object({
    current_price: stringToNumber,
    market_cap: stringToNumber,
    fully_diluted_valuation: stringToNumber,
    total_volume: stringToNumber,
    high_24h: stringToNumber,
    low_24h: stringToNumber,
    price_change_percentage_1h: stringToNumber,
    price_change_percentage_24h: stringToNumber,
    price_change_percentage_7d: stringToNumber,
    price_change_percentage_30d: stringToNumber,
    circulating_supply: stringToNumber,
    total_supply: stringToNumber,
    max_supply: optionalStringToNumber,
    ath: stringToNumber,
    ath_change_percentage: stringToNumber,
    ath_date: z.string().default(''),
    atl: stringToNumber,
    atl_change_percentage: stringToNumber,
    atl_date: z.string().default(''),
  })
  .transform((data) => ({
    currentPrice: data.current_price,
    marketCap: data.market_cap,
    fullyDilutedValuation: data.fully_diluted_valuation,
    totalVolume: data.total_volume,
    high24h: data.high_24h,
    low24h: data.low_24h,
    priceChangePercentage1h: data.price_change_percentage_1h,
    priceChangePercentage24h: data.price_change_percentage_24h,
    priceChangePercentage7d: data.price_change_percentage_7d,
    priceChangePercentage30d: data.price_change_percentage_30d,
    circulatingSupply: data.circulating_supply,
    totalSupply: data.total_supply,
    maxSupply: data.max_supply,
    ath: data.ath,
    athChangePercentage: data.ath_change_percentage,
    athDate: data.ath_date,
    atl: data.atl,
    atlChangePercentage: data.atl_change_percentage,
    atlDate: data.atl_date,
  }));

/**
 * Token Community Data Schema
 */
const tokenCommunityDataSchema = z
  .object({
    facebook_likes: z.number().nullable().default(null),
    reddit_average_posts_48h: z.number().default(0),
    reddit_average_comments_48h: z.number().default(0),
    reddit_subscribers: z.number().default(0),
    reddit_accounts_active_48h: z.number().default(0),
    telegram_channel_user_count: z.number().nullable().default(null),
  })
  .transform((data) => ({
    facebookLikes: data.facebook_likes,
    redditAveragePosts48h: data.reddit_average_posts_48h,
    redditAverageComments48h: data.reddit_average_comments_48h,
    redditSubscribers: data.reddit_subscribers,
    redditAccountsActive48h: data.reddit_accounts_active_48h,
    telegramChannelUserCount: data.telegram_channel_user_count,
  }));

/**
 * Token Developer Data Schema
 */
const tokenDeveloperDataSchema = z
  .object({
    forks: z.number().default(0),
    stars: z.number().default(0),
    subscribers: z.number().default(0),
    total_issues: z.number().default(0),
    closed_issues: z.number().default(0),
    pull_requests_merged: z.number().default(0),
    pull_request_contributors: z.number().default(0),
    code_additions_deletions_4_weeks: z
      .object({
        additions: z.number().nullable().default(null),
        deletions: z.number().nullable().default(null),
      })
      .default({ additions: null, deletions: null }),
    commit_count_4_weeks: z.number().default(0),
    last_4_weeks_commit_activity_series: z.array(z.number()).default([]),
  })
  .transform((data) => ({
    forks: data.forks,
    stars: data.stars,
    subscribers: data.subscribers,
    totalIssues: data.total_issues,
    closedIssues: data.closed_issues,
    pullRequestsMerged: data.pull_requests_merged,
    pullRequestContributors: data.pull_request_contributors,
    codeAdditionsDeletions4Weeks: data.code_additions_deletions_4_weeks,
    commitCount4Weeks: data.commit_count_4_weeks,
    last4WeeksCommitActivitySeries: data.last_4_weeks_commit_activity_series,
  }));

/**
 * Token Links Schema
 */
const tokenLinksSchema = z
  .object({
    homepage: z.string().default(''),
    blockchain_site: z.array(z.string()).default([]),
    official_forum_url: z.array(z.string()).default([]),
    chat_url: z.array(z.string()).default([]),
    announcement_url: z.array(z.string()).default([]),
    twitter_screen_name: z.string().default(''),
    facebook_username: z.string().default(''),
    telegram_channel_identifier: z.string().default(''),
    subreddit_url: z.string().nullable().default(null),
    repos_url: z
      .object({
        github: z.array(z.string()).default([]),
        bitbucket: z.array(z.string()).default([]),
      })
      .default({ github: [], bitbucket: [] }),
  })
  .transform((data) => ({
    homepage: data.homepage,
    blockchainSite: data.blockchain_site,
    officialForumUrl: data.official_forum_url,
    chatUrl: data.chat_url,
    announcementUrl: data.announcement_url,
    twitterScreenName: data.twitter_screen_name,
    facebookUsername: data.facebook_username,
    telegramChannelIdentifier: data.telegram_channel_identifier,
    subredditUrl: data.subreddit_url,
    reposUrl: data.repos_url,
  }));

/**
 * Token Detail Schema
 * 将后端返回的 Token 数据转换为统一格式
 */
export const tokenDetailSchema = z
  .object({
    id: z.string(),
    symbol: z.string().default(''),
    name: z.string().default(''),
    image: tokenImageSchema,
    market_cap_rank: z.number().default(0),
    market_data: tokenMarketDataSchema,
    community_data: tokenCommunityDataSchema.optional(),
    developer_data: tokenDeveloperDataSchema.optional(),
    links: tokenLinksSchema.optional(),
    description: z.string().default(''),
    categories: z.array(z.string()).default([]),
    platforms: z.record(z.string(), z.string()).default({}),
    market_chart: priceChartSchema,
  })
  .passthrough()
  .transform((data) => ({
    type: 'TOKEN' as const,
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    image: data.image.large, // 从 image.large 提取字符串值
    description: data.description,
    tokenData: {
      marketCapRank: data.market_cap_rank,
      marketData: data.market_data,
      communityData: data.community_data,
      developerData: data.developer_data,
      links: data.links,
      categories: data.categories,
      platforms: data.platforms,
      priceChart: data.market_chart,
    },
  }));

/**
 * Backend Token Response Schema
 */
export const backendTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable().optional(),
  data: tokenDetailSchema,
});

// ============ 类型导出 ============

export type ProjectDetailInput = z.input<typeof projectDetailSchema>;
export type ProjectDetailOutput = z.infer<typeof projectDetailSchema>;

export type TokenDetailInput = z.input<typeof tokenDetailSchema>;
export type TokenDetailOutput = z.infer<typeof tokenDetailSchema>;

export type BackendProjectResponse = z.infer<typeof backendProjectResponseSchema>;
export type BackendTokenResponse = z.infer<typeof backendTokenResponseSchema>;
