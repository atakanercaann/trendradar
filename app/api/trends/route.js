export const runtime = 'nodejs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizePlatform(value) {
  if (!value) return 'INSTAGRAM';
  const v = String(value).toUpperCase();
  if (v.includes('TIK')) return 'TIKTOK';
  return 'INSTAGRAM';
}

function formatNumber(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x : 0;
}

function timeIso(value) {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapItem(item, platform, idx = 0) {
  const creatorHandle =
    item.username ||
    item.ownerUsername ||
    item.authorUsername ||
    item.authorMeta?.name ||
    item.authorMeta?.nickName ||
    item.ownerFullName ||
    item.handle ||
    `creator_${idx + 1}`;

  const followers =
    item.authorMeta?.fans ||
    item.authorMeta?.followers ||
    item.followersCount ||
    item.ownerFollowers ||
    item.followerCount ||
    0;

  const views =
    item.playCount ||
    item.videoPlayCount ||
    item.viewsCount ||
    item.viewCount ||
    item.videoViewCount ||
    0;

  const likes =
    item.diggCount ||
    item.likesCount ||
    item.likeCount ||
    item.likes ||
    0;

  const comments =
    item.commentCount ||
    item.commentsCount ||
    item.comments ||
    0;

  const shares =
    item.shareCount ||
    item.sharesCount ||
    item.shares ||
    0;

  const saves =
    item.saveCount ||
    item.savesCount ||
    item.saves ||
    0;

  const caption =
    item.text ||
    item.caption ||
    item.title ||
    item.description ||
    'No caption';

  const thumbnail =
    item.coverUrl ||
    item.displayUrl ||
    item.thumbnailUrl ||
    item.imageUrl ||
    item.videoMeta?.coverUrl ||
    'https://picsum.photos/seed/fallbacktrend/400/600';

  const postedAt =
    item.createTimeISO ||
    item.timestamp ||
    item.takenAtTimestamp ||
    item.createTime ||
    item.publishedAt ||
    new Date().toISOString();

  const engagementRate = views > 0 ? ((likes + comments + shares + saves) / views) * 100 : 0;
  const breakout = followers > 0 ? views / followers : 0;

  const reach = Math.min(99, Math.round(Math.log10(Math.max(views, 1)) * 20));
  const engagement = Math.min(99, Math.round(engagementRate * 12));
  const velocity = Math.min(99, Math.round(Math.min(breakout * 8, 99)));
  const freshness = 85;
  const repro = Math.min(99, Math.max(40, Math.round(70 + engagementRate * 3)));
  const satRisk = Math.max(5, 100 - velocity);
  const opportunity = Math.min(99, Math.round((engagement + velocity + repro) / 3));
  const local = 75;
  const fit = Math.min(99, Math.round((opportunity + engagement) / 2));
  const trend = Math.min(99, Math.round((reach + engagement + velocity) / 3));

  let stage = 'RISING';
  if (opportunity >= 85 && velocity >= 80) stage = 'EMERGING';
  else if (trend >= 80) stage = 'RISING';
  else if (trend >= 65) stage = 'HOT';
  else if (trend >= 45) stage = 'PEAK';
  else stage = 'SATURATED';

  return {
    id: String(item.id || item.shortCode || item.code || idx + 1),
    platform,
    thumbnail,
    caption,
    postedAt: timeIso(postedAt),
    category: item.type || item.productType || 'GENERAL',
    audio: item.musicInfo?.title || item.musicMeta?.musicName || item.musicName || null,
    audioTrending: Boolean(item.isTrend || item.isTrending || false),
    creator: {
      handle: creatorHandle,
      name: item.fullName || item.ownerFullName || creatorHandle,
      followers: formatNumber(followers),
      bucket:
        followers < 10000 ? 'NANO' :
        followers < 100000 ? 'MICRO' :
        followers < 1000000 ? 'MACRO' : 'MEGA',
    },
    metrics: {
      views: formatNumber(views),
      likes: formatNumber(likes),
      comments: formatNumber(comments),
      shares: formatNumber(shares),
      saves: formatNumber(saves),
    },
    scores: {
      reach,
      engagement,
      velocity,
      freshness,
      repro,
      satRisk,
      opportunity,
      local,
      fit,
      trend,
      stage,
      breakout: `${breakout.toFixed(1)}x`,
    },
    insight: {
      whyTrending: `High engagement and breakout performance detected from live ${platform} data.`,
      signals: [
        `${breakout.toFixed(1)}x follower breakout`,
        `${engagementRate.toFixed(1)}% engagement rate`,
        `${formatNumber(shares)} shares`,
      ],
      worthAdapting: opportunity >= 70,
      satWarning: opportunity < 45 ? 'Low opportunity compared with current leaders.' : null,
      ideas: [
        'Create your own version with a stronger first-2-second hook',
        'Reuse the format but localize the angle for your audience',
        'Test a shorter cut with clearer on-screen text',
      ],
      tips: 'Lead with the strongest visual immediately and keep the caption specific.',
    },
  };
}

async function runTask(taskIdOrName, token, input = null) {
  const url = `https://api.apify.com/v2/actor-tasks/${encodeURIComponent(taskIdOrName)}/run-sync-get-dataset-items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input || {}),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify task failed: ${taskIdOrName} | ${res.status} | ${text}`);
  }

  return res.json();
}

export async function GET(request) {
  try {
    const token = process.env.APIFY_API_TOKEN;
    const tiktokTask = process.env.TIKTOK_TASK_NAME;
    const instagramTask = process.env.INSTAGRAM_TASK_NAME;

    if (!token || !tiktokTask || !instagramTask) {
      return json(
        { error: 'Missing APIFY_API_TOKEN, TIKTOK_TASK_NAME, or INSTAGRAM_TASK_NAME' },
        500
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get('platform') || 'ALL').toUpperCase();

    const jobs = [];
    if (platform === 'ALL' || platform === 'TIKTOK') {
      jobs.push(
        runTask(tiktokTask, token).then(items =>
          items.map((item, idx) => mapItem(item, 'TIKTOK', idx))
        )
      );
    }
    if (platform === 'ALL' || platform === 'INSTAGRAM') {
      jobs.push(
        runTask(instagramTask, token).then(items =>
          items.map((item, idx) => mapItem(item, 'INSTAGRAM', idx))
        )
      );
    }

    const results = await Promise.all(jobs);
    const videos = results.flat().sort((a, b) => b.scores.opportunity - a.scores.opportunity);

    return json({ videos });
  } catch (err) {
    return json(
      {
        error: 'Failed to load trends',
        details: err.message,
      },
      500
    );
  }
}
