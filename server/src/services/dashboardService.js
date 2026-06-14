// Dashboard analytics service.
//
// Pure, taxonomy-agnostic helpers that turn a list of JournalEntry documents
// into wellness analytics. The dashboard reads CATEGORY COUNTS per day, never a
// hardcoded label, so swapping the interim anxiety-severity model for a real
// Normal/Anxiety/Depression model later is a data change, not a UI rewrite.

const CATEGORIES = ['normal', 'anxiety', 'depression'];

// Minimum classified days before we make confident trend claims.
const MIN_CONFIDENT_DAYS = 5;

/**
 * Resolve a journal entry into one wellness category.
 *
 * Priority:
 *   1. A future 3-class model writes entry.classification.category directly.
 *   2. Interim: map the current anxiety-severity model
 *        low            -> normal
 *        moderate/high  -> anxiety
 *   3. Fallback to the numeric anxietyLevel (0-1).
 *
 * Depression is only ever produced by path (1).
 */
function resolveCategory(entry) {
  const cat = String(entry?.classification?.category || '').toLowerCase();
  if (cat && CATEGORIES.includes(cat)) return cat;

  const label = entry?.anxietyLabel;
  if (label === 'low') return 'normal';
  if (label === 'moderate' || label === 'medium' || label === 'high') return 'anxiety';

  if (typeof entry?.anxietyLevel === 'number') {
    return entry.anxietyLevel < 0.4 ? 'normal' : 'anxiety';
  }

  return null;
}

function emptyCounts() {
  return { normal: 0, anxiety: 0, depression: 0, total: 0 };
}

function percentagesForCounts(counts) {
  if (!counts || counts.total === 0) {
    return { normal: 0, anxiety: 0, depression: 0 };
  }

  return {
    normal: +(counts.normal / counts.total).toFixed(4),
    anxiety: +(counts.anxiety / counts.total).toFixed(4),
    depression: +(counts.depression / counts.total).toFixed(4),
  };
}

/** YYYY-MM-DD key in Israel time so days line up with how users experience them. */
function toDateKey(date) {
  const d = new Date(date);
  // Shift to Asia/Jerusalem (UTC+2/+3). Using a fixed +3 offset is good enough
  // for day-bucketing here and avoids pulling in a tz library.
  const shifted = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Bucket entries into per-day category counts.
 * @returns {Map<string, {normal,anxiety,depression,total}>}
 */
function aggregateDaily(entries) {
  const byDay = new Map();
  for (const entry of entries) {
    const category = resolveCategory(entry);
    if (!category) continue;
    const key = toDateKey(entry.date || entry.createdAt);
    if (!byDay.has(key)) byDay.set(key, emptyCounts());
    const bucket = byDay.get(key);
    bucket[category] += 1;
    bucket.total += 1;
  }
  return byDay;
}

/** The category with the most entries on a day (ties resolve toward normal). */
function dominantCategory(counts) {
  if (!counts || counts.total === 0) return null;
  let best = 'normal';
  let bestVal = -1;
  for (const c of CATEGORIES) {
    if (counts[c] > bestVal) {
      bestVal = counts[c];
      best = c;
    }
  }
  return best;
}

/**
 * Wellness score for a single set of counts.
 *
 * Formula requested for Neshama:
 *   Raw Score = Normal% - Anxiety% - Depression%
 *
 * The raw score is normalized to a 0..100 scale for product display:
 *   Wellness Score = (Raw Score + 100) / 2
 *
 * Since each entry belongs to exactly one of the three classes, this is
 * equivalent to the share of Normal entries in the selected set.
 *
 *   70% normal - 20% anxiety - 10% depression = 40
 *   (40 + 100) / 2 = 70
 */
function wellnessForCounts(counts) {
  if (!counts || counts.total === 0) return null;
  const rawScore =
    ((counts.normal - counts.anxiety - counts.depression) / counts.total) * 100;
  return Math.round((rawScore + 100) / 2);
}

/** Least-squares slope of y over its own index. Returns 0 for <2 points. */
function linregSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Classify a slope into a direction. `improving`/`worsening` are oriented so
 * that a RISING wellness score is "improving". For category-frequency series
 * pass invert=true (a rising anxiety frequency is "worsening").
 */
function directionFromSlope(slope, invert = false) {
  const s = invert ? -slope : slope;
  if (s > 0.5) return 'improving';
  if (s < -0.5) return 'worsening';
  return 'stable';
}

/** Ordered list of daily wellness scores (only days that have entries). */
function dailyWellnessSeries(byDay) {
  return Array.from(byDay.keys())
    .sort()
    .map((key) => wellnessForCounts(byDay.get(key)))
    .filter((v) => v != null);
}

function cumulativeWellnessSeries(entries) {
  const running = emptyCounts();
  return entries
    .map((entry) => resolveCategory(entry))
    .filter(Boolean)
    .map((category) => {
      running[category] += 1;
      running.total += 1;
      return wellnessForCounts(running);
    })
    .filter((v) => v != null);
}

/** Overall category distribution as fractions that sum to ~1. */
function distribution(entries) {
  const totals = emptyCounts();
  for (const entry of entries) {
    const category = resolveCategory(entry);
    if (!category) continue;
    totals[category] += 1;
    totals.total += 1;
  }
  if (totals.total === 0) {
    return { normal: 0, anxiety: 0, depression: 0, classifiedEntries: 0 };
  }
  return {
    normal: +(totals.normal / totals.total).toFixed(4),
    anxiety: +(totals.anxiety / totals.total).toFixed(4),
    depression: +(totals.depression / totals.total).toFixed(4),
    classifiedEntries: totals.total,
  };
}

/** Count of days whose dominant category is normal. */
function countPositiveDays(byDay) {
  let count = 0;
  for (const counts of byDay.values()) {
    if (dominantCategory(counts) === 'normal') count += 1;
  }
  return count;
}

/** Current run of consecutive positive days ending on the most recent day. */
function currentPositiveStreak(byDay) {
  const keys = Array.from(byDay.keys()).sort().reverse();
  let streak = 0;
  for (const key of keys) {
    if (dominantCategory(byDay.get(key)) === 'normal') streak += 1;
    else break;
  }
  return streak;
}

/** Longest run of consecutive positive (by dominant category) days. */
function longestPositiveStreak(byDay) {
  const keys = Array.from(byDay.keys()).sort();
  let best = 0;
  let run = 0;
  for (const key of keys) {
    if (dominantCategory(byDay.get(key)) === 'normal') {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

/** 0-1 stability: how rarely the dominant category flips day to day. */
function emotionalStability(byDay) {
  const cats = Array.from(byDay.keys())
    .sort()
    .map((key) => dominantCategory(byDay.get(key)));
  if (cats.length < 2) return cats.length === 1 ? 1 : 0;
  let switches = 0;
  for (let i = 1; i < cats.length; i++) {
    if (cats[i] !== cats[i - 1]) switches += 1;
  }
  return +(1 - switches / (cats.length - 1)).toFixed(4);
}

/** Average wellness score across all classified days. */
function averageWellness(byDay) {
  const series = dailyWellnessSeries(byDay);
  if (series.length === 0) return null;
  return Math.round(series.reduce((s, v) => s + v, 0) / series.length);
}

/**
 * Build the /summary payload from the user's recent entries.
 * @param {Array} entries entries within the last ~28 days, any order
 * @param {Date}  now
 */
function buildSummary(entries, now = new Date()) {
  const fourteenAgo = new Date(now.getTime() - 14 * 86400000);
  const recent = entries.filter((e) => new Date(e.date || e.createdAt) >= fourteenAgo);
  const prior = entries.filter((e) => {
    const d = new Date(e.date || e.createdAt);
    return d < fourteenAgo;
  });

  const byDayRecent = aggregateDaily(recent);
  const scoreSeries = cumulativeWellnessSeries(recent);
  const priorSeries = cumulativeWellnessSeries(prior);
  const wellnessScore = scoreSeries[scoreSeries.length - 1] ?? 0;
  const priorScore = priorSeries[priorSeries.length - 1] ?? null;

  const slope = linregSlope(scoreSeries);
  const hasEnoughData = scoreSeries.length >= MIN_CONFIDENT_DAYS;

  const weekOverWeek =
    priorScore != null ? wellnessScore - priorScore : null;

  return {
    wellnessScore,
    weeklyScore: wellnessScore,
    positiveStreak: currentPositiveStreak(byDayRecent),
    trend: {
      direction: hasEnoughData ? directionFromSlope(slope) : 'stable',
      slope: +slope.toFixed(3),
      weekOverWeek: weekOverWeek != null ? Math.round(weekOverWeek) : null,
    },
    distribution: distribution(recent),
    stability: emotionalStability(byDayRecent),
    classifiedDays: scoreSeries.length,
    hasEnoughData,
  };
}

/**
 * Build the /trends payload.
 *
 * The chart series is event-based, not day-based: every classified journal
 * entry adds one point. Each point is a cumulative score inside the selected
 * range, so four entries in one day still create a visible function/slope.
 *
 * Formula:
 *   Wellness Score = Normal% - Anxiety% - Depression%
 *
 * @param {Array}  entries entries within the requested range
 * @param {number} range   1 | 3 | 5 | 7 | 30 | 90
 */
function buildTrends(entries, range) {
  const running = emptyCounts();
  const classifiedEntries = entries
    .map((entry) => ({ entry, category: resolveCategory(entry) }))
    .filter((item) => item.category);

  const series = classifiedEntries.map(({ entry, category }) => {
    running[category] += 1;
    running.total += 1;
    const percentages = percentagesForCounts(running);

    return {
      date: new Date(entry.createdAt || entry.date).toISOString(),
      ...percentages,
      wellnessScore: wellnessForCounts(running),
      entryCount: running.total,
    };
  });

  const anxietySeries = series.map((p) => p.anxiety * 100);
  const depressionSeries = series.map((p) => p.depression * 100);
  const normalSeries = series.map((p) => p.normal * 100);
  const wellnessSeries = series.map((p) => p.wellnessScore);
  const first = series[0];
  const last = series[series.length - 1];

  return {
    range,
    series,
    distribution: distribution(entries),
    categoryTrends: {
      normal: directionFromSlope(linregSlope(normalSeries)),
      anxiety: directionFromSlope(linregSlope(anxietySeries), true),
      depression: directionFromSlope(linregSlope(depressionSeries), true),
    },
    wellnessScore: last?.wellnessScore ?? 0,
    wellnessChange:
      first && last ? Math.round(last.wellnessScore - first.wellnessScore) : 0,
    anxietyChange:
      first && last ? Math.round((last.anxiety - first.anxiety) * 100) : 0,
    slope: +linregSlope(wellnessSeries).toFixed(3),
    positiveDays: countPositiveDays(aggregateDaily(entries)),
    longestPositiveStreak: longestPositiveStreak(aggregateDaily(entries)),
  };
}

module.exports = {
  CATEGORIES,
  resolveCategory,
  percentagesForCounts,
  aggregateDaily,
  dominantCategory,
  wellnessForCounts,
  linregSlope,
  directionFromSlope,
  distribution,
  emotionalStability,
  buildSummary,
  buildTrends,
};
