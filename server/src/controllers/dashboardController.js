const JournalEntry = require('../models/JournalEntry');
const dashboardService = require('../services/dashboardService');

const ALLOWED_RANGES = [1, 7, 30, 90];

/** Build the short, human summary sentence shown under the wellness score. */
function buildSummaryMessage(summary) {
  if (!summary.hasEnoughData) return 'keepJournaling';
  const { direction, weekOverWeek } = summary.trend;
  if (direction === 'improving') return 'improving';
  if (direction === 'worsening') return 'worsening';
  if (weekOverWeek != null && weekOverWeek > 0) return 'slightlyBetter';
  return 'steady';
}

// @desc    Dashboard summary (wellness score, trend, streak)
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    const entries = await JournalEntry.find({
      user: userId,
      date: { $gte: twentyEightDaysAgo },
    }).sort({ date: 1 });

    const summary = dashboardService.buildSummary(entries, new Date());

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        summaryMessageKey: buildSummaryMessage(summary),
      },
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Dashboard trends (stacked distribution series over time)
// @route   GET /api/dashboard/trends?range=30
// @access  Private
const getTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    let range = parseInt(req.query.range, 10) || 30;
    if (!ALLOWED_RANGES.includes(range)) range = 30;

    const startDate = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

    const entries = await JournalEntry.find({
      user: userId,
      date: { $gte: startDate },
    }).sort({ date: 1, createdAt: 1 });

    const trends = dashboardService.buildTrends(entries, range);

    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    console.error('Get dashboard trends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getSummary, getTrends };
