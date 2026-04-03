import { NextResponse } from 'next/server'

type Platform = 'tiktok' | 'instagram'

type VideoInput = {
  id?: string
  platform: Platform
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  followerCount: number
  ageHours: number
  viewsPerHourNow: number
  viewsPerHourBefore: number
  similarContentCount: number
  category: string
  city?: string
  region?: string
  country?: string
  language?: string
  creatorStyleFit?: {
    nicheMatch: number
    formatMatch: number
    productionMatch: number
    languageMatch: number
    regionMatch: number
  }
  reproducibilitySignals?: {
    easyToFilm: number
    easyToEdit: number
    repeatable: number
    homeFriendly: number
    templateFriendly: number
    celebrityBased?: number
    expensive?: number
    oneTimeEvent?: number
    highProduction?: number
  }
}

type ScoreContext = {
  rawViewsPercentile: number
  viewsToFollowerPercentile: number
  categoryPercentile: number
  ageBucketPercentile: number
  vNowPercentile: number
  accelerationPercentile: number
  similarContentPercentile: number
  localLevel: 'city' | 'region' | 'country' | 'language' | 'global' | 'mismatch'
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))

function normalizeToBand(value: number, low: number, high: number) {
  if (value <= 0) return 0
  if (value <= low) return clamp((value / low) * 60)
  if (value >= high) return 100
  return clamp(60 + ((value - low) / (high - low)) * 40)
}

function percentile(value: number, arr: number[]) {
  if (!arr.length) return 50
  const sorted = [...arr].sort((a, b) => a - b)
  const count = sorted.filter(v => v <= value).length
  return Math.round((count / sorted.length) * 100)
}

function getAgeBucket(ageHours: number) {
  if (ageHours <= 24) return '0_24'
  if (ageHours <= 72) return '24_72'
  if (ageHours <= 168) return '72_168'
  return '168_plus'
}

function getLocalLevel(video: VideoInput, creatorRegion?: { city?: string; region?: string; country?: string; language?: string }): ScoreContext['localLevel'] {
  if (!creatorRegion) return 'global'
  if (video.city && creatorRegion.city && video.city === creatorRegion.city) return 'city'
  if (video.region && creatorRegion.region && video.region === creatorRegion.region) return 'region'
  if (video.country && creatorRegion.country && video.country === creatorRegion.country) return 'country'
  if (video.language && creatorRegion.language && video.language === creatorRegion.language) return 'language'
  return 'global'
}

function getLocalScore(level: ScoreContext['localLevel']) {
  switch (level) {
    case 'city': return 100
    case 'region': return 85
    case 'country': return 70
    case 'language': return 55
    case 'global': return 35
    default: return 10
  }
}

function getEngagementWeights(category: string) {
  const c = category.toLowerCase()
  if (['beauty', 'fashion', 'food', 'lifestyle', 'education', 'tutorial'].includes(c)) {
    return { like: 0.15, comment: 0.20, share: 0.25, save: 0.40 }
  }
  if (['humor', 'memes', 'relatable'].includes(c)) {
    return { like: 0.15, comment: 0.30, share: 0.40, save: 0.15 }
  }
  if (['storytelling'].includes(c)) {
    return { like: 0.15, comment: 0.35, share: 0.35, save: 0.15 }
  }
  if (['product review', 'product_review', 'review'].includes(c)) {
    return { like: 0.15, comment: 0.30, share: 0.20, save: 0.35 }
  }
  return { like: 0.20, comment: 0.25, share: 0.30, save: 0.25 }
}

function getMetricBands(platform: Platform) {
  if (platform === 'tiktok') {
    return {
      like: [0.04, 0.08],
      comment: [0.002, 0.008],
      share: [0.005, 0.01],
      save: [0.003, 0.01],
    } as const
  }

  return {
    like: [0.02, 0.05],
    comment: [0.001, 0.005],
    share: [0.003, 0.01],
    save: [0.005, 0.015],
  } as const
}

function scoreVideo(video: VideoInput, ctx: ScoreContext) {
  const views = Math.max(video.views, 1)
  const followers = Math.max(video.followerCount, 1)
  const age = Math.max(video.ageHours, 1)

  const likeRate = video.likes / views
  const commentRate = video.comments / views
  const shareRate = video.shares / views
  const saveRate = video.saves / views
  const viewsToFollower = views / followers
  const acceleration = video.viewsPerHourNow / Math.max(video.viewsPerHourBefore, 1)

  const reachScore = clamp(
    0.30 * ctx.rawViewsPercentile +
    0.35 * ctx.viewsToFollowerPercentile +
    0.20 * ctx.categoryPercentile +
    0.15 * ctx.ageBucketPercentile
  )

  const w = getEngagementWeights(video.category)
  const bands = getMetricBands(video.platform)

  const likeScore = normalizeToBand(likeRate, bands.like[0], bands.like[1])
  const commentScore = normalizeToBand(commentRate, bands.comment[0], bands.comment[1])
  const shareScore = normalizeToBand(shareRate, bands.share[0], bands.share[1])
  const saveScore = normalizeToBand(saveRate, bands.save[0], bands.save[1])

  const engagementQualityScore = clamp(
    w.like * likeScore +
    w.comment * commentScore +
    w.share * shareScore +
    w.save * saveScore
  )

  const earlyMomentumBonus = age <= 24 ? 15 : age <= 72 ? 8 : 2

  const velocityScore = clamp(
    0.55 * ctx.vNowPercentile +
    0.30 * ctx.accelerationPercentile +
    0.15 * earlyMomentumBonus * (ctx.vNowPercentile / 100)
  )

  let freshnessScore = 10
  if (age <= 24) freshnessScore = 100 - age * 0.4
  else if (age <= 72) freshnessScore = 90 - (age - 24) * 0.4
  else if (age <= 168) freshnessScore = 70 - (age - 72) * 0.22
  else if (age <= 336) freshnessScore = 45 - (age - 168) * 0.15

  const rep = video.reproducibilitySignals ?? {
    easyToFilm: 0.5,
    easyToEdit: 0.5,
    repeatable: 0.5,
    homeFriendly: 0.5,
    templateFriendly: 0.5,
  }

  const reproducibilityScore = clamp(
    20 * rep.easyToFilm +
    20 * rep.easyToEdit +
    20 * rep.repeatable +
    20 * rep.homeFriendly +
    20 * rep.templateFriendly -
    10 * (rep.celebrityBased ?? 0) -
    10 * (rep.expensive ?? 0) -
    10 * (rep.oneTimeEvent ?? 0) -
    10 * (rep.highProduction ?? 0)
  )

  const agePenaltyScore = age <= 24 ? 10 : age <= 72 ? 25 : age <= 168 ? 50 : age <= 336 ? 75 : 90

  const saturationRiskScore = clamp(
    0.65 * ctx.similarContentPercentile +
    0.35 * agePenaltyScore
  )

  const localRelevanceScore = getLocalScore(ctx.localLevel)

  const fit = video.creatorStyleFit ?? {
    nicheMatch: 50,
    formatMatch: 50,
    productionMatch: 50,
    languageMatch: 50,
    regionMatch: 50,
  }

  const creatorFitScore = clamp(
    0.30 * fit.nicheMatch +
    0.25 * fit.formatMatch +
    0.20 * fit.productionMatch +
    0.15 * fit.languageMatch +
    0.10 * fit.regionMatch
  )

  const opportunityScore = clamp(
    0.25 * velocityScore +
    0.20 * freshnessScore +
    0.20 * engagementQualityScore +
    0.20 * reproducibilityScore +
    0.10 * reachScore +
    0.10 * localRelevanceScore +
    0.10 * creatorFitScore +
    0.15 * (100 - saturationRiskScore)
  )

  const trendScore = clamp(
    0.20 * reachScore +
    0.20 * engagementQualityScore +
    0.20 * velocityScore +
    0.15 * freshnessScore +
    0.10 * reproducibilityScore +
    0.05 * localRelevanceScore +
    0.05 * creatorFitScore +
    0.05 * opportunityScore +
    0.10 * (100 - saturationRiskScore)
  )

  const stage =
    freshnessScore <= 30 && velocityScore <= 40 ? 'Declining' :
    saturationRiskScore >= 70 ? 'Saturated' :
    reachScore >= 85 && trendScore >= 75 && ctx.accelerationPercentile < 45 ? 'Peak' :
    trendScore >= 80 && reachScore >= 75 && engagementQualityScore >= 70 && velocityScore >= 70 ? 'Hot' :
    opportunityScore >= 70 && velocityScore >= 65 && saturationRiskScore <= 50 ? 'Rising' :
    freshnessScore >= 80 && velocityScore >= 70 && saturationRiskScore <= 35 ? 'Emerging' :
    'Rising'

  const eligible =
    reachScore >= 70 ||
    ctx.viewsToFollowerPercentile >= 80 ||
    engagementQualityScore >= 70 ||
    velocityScore >= 70 ||
    localRelevanceScore >= 80 ||
    opportunityScore >= 72

  return {
    eligible,
    stage,
    viewsToFollower,
    acceleration,
    scores: {
      reachScore,
      engagementQualityScore,
      velocityScore,
      freshnessScore,
      reproducibilityScore,
      saturationRiskScore,
      localRelevanceScore,
      creatorFitScore,
      opportunityScore,
      trendScore,
    },
  }
}

export async function GET() {
  try {
    const response = await fetch(process.env.DATA_SOURCE_URL as string, {
      headers: {
        Authorization: `Bearer ${process.env.DATA_SOURCE_API_KEY}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Upstream API failed' }, { status: 502 })
    }

    const items = (await response.json()) as VideoInput[]

    const creatorRegion = {
      city: 'Vaughan',
      region: 'Ontario',
      country: 'Canada',
      language: 'en',
    }

    const enriched = items.map(video => {
      const platformPool = items.filter(v => v.platform === video.platform)
      const categoryPool = platformPool.filter(v => v.category === video.category)
      const bucketPool = platformPool.filter(v => getAgeBucket(v.ageHours) === getAgeBucket(video.ageHours))

      const ctx: ScoreContext = {
        rawViewsPercentile: percentile(video.views, platformPool.map(v => v.views)),
        viewsToFollowerPercentile: percentile(
          video.views / Math.max(video.followerCount, 1),
          platformPool.map(v => v.views / Math.max(v.followerCount, 1))
        ),
        categoryPercentile: percentile(video.views, categoryPool.map(v => v.views)),
        ageBucketPercentile: percentile(video.views, bucketPool.map(v => v.views)),
        vNowPercentile: percentile(video.viewsPerHourNow, platformPool.map(v => v.viewsPerHourNow)),
        accelerationPercentile: percentile(
          video.viewsPerHourNow / Math.max(video.viewsPerHourBefore, 1),
          platformPool.map(v => v.viewsPerHourNow / Math.max(v.viewsPerHourBefore, 1))
        ),
        similarContentPercentile: percentile(video.similarContentCount, platformPool.map(v => v.similarContentCount)),
        localLevel: getLocalLevel(video, creatorRegion),
      }

      return {
        ...video,
        scoring: scoreVideo(vid
