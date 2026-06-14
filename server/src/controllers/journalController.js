const JournalEntry = require('../models/JournalEntry');
const { validationResult } = require('express-validator');
const classificationService = require('../services/classificationService');

const ANXIETY_LABEL_VALUES = {
  low: 0.2,
  moderate: 0.5,
  medium: 0.5,
  high: 0.85,
};

const roundToTwo = (value) => Math.round(value * 100) / 100;

const getAnxietyScore = (entry) => {
  const anxietyProbability = entry.classification?.probabilities?.anxiety;
  if (
    typeof anxietyProbability === 'number' &&
    !Number.isNaN(anxietyProbability)
  ) {
    return Math.max(0, Math.min(1, anxietyProbability));
  }

  if (typeof entry.anxietyLevel === 'number' && !Number.isNaN(entry.anxietyLevel)) {
    return Math.max(0, Math.min(1, entry.anxietyLevel));
  }

  const label = String(entry.anxietyLabel || '').toLowerCase();
  return ANXIETY_LABEL_VALUES[label] ?? null;
};

const average = (values) =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

const toIsoDay = (date) => date.toISOString().split('T')[0];

const buildDailyAnxietyPoints = (entries) => {
  const grouped = new Map();

  entries.forEach((entry) => {
    const anxiety = getAnxietyScore(entry);
    if (anxiety === null) return;

    const day = toIsoDay(entry.date);
    const group = grouped.get(day) || {
      date: day,
      anxieties: [],
      moods: [],
      entryCount: 0,
    };

    group.anxieties.push(anxiety);
    group.moods.push(entry.mood);
    group.entryCount += 1;
    grouped.set(day, group);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((group) => ({
      date: group.date,
      anxiety: roundToTwo(average(group.anxieties)),
      mood: roundToTwo(average(group.moods) * 2),
      entryCount: group.entryCount,
    }));
};

const summarizeAnxietyTrend = (points) => {
  const totalEntries = points.reduce((sum, point) => sum + point.entryCount, 0);
  const averageAnxiety = points.length > 0
    ? roundToTwo(average(points.map((point) => point.anxiety)))
    : 0;

  let trendDirection = 'stable';
  let trendPercent = 0;

  if (points.length >= 2) {
    const midpoint = Math.floor(points.length / 2);
    const earlierSlice = points.slice(0, midpoint);
    const recentSlice = points.slice(midpoint);
    const earlierAvg = average(earlierSlice.map((point) => point.anxiety));
    const recentAvg = average(recentSlice.map((point) => point.anxiety));

    if (earlierAvg > 0 && recentSlice.length > 0) {
      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
      trendPercent = Math.abs(Math.round(change));
      if (change < -5) trendDirection = 'improving';
      else if (change > 5) trendDirection = 'increasing';
    }
  }

  const peakDay = points.length > 0
    ? points.reduce((max, point) => (point.anxiety > max.anxiety ? point : max))
    : null;

  return {
    totalDays: points.length,
    totalEntries,
    averageAnxiety,
    trendDirection,
    trendPercent,
    peakDay: peakDay ? { date: peakDay.date, anxiety: peakDay.anxiety } : null,
  };
};

// @desc    Get all journal entries for current user
// @route   GET /api/journal
// @access  Private
const getEntries = async (req, res) => {
  try {
    const { page = 1, limit = 20, mood } = req.query;
    
    const query = { user: req.user.id };
    if (mood) {
      query.mood = parseInt(mood);
    }

    const entries = await JournalEntry.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JournalEntry.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        entries: entries.map(entry => ({
          id: entry._id,
          date: entry.formattedDate,
          time: entry.formattedTime,
          mood: entry.mood,
          title: entry.title,
          content: entry.content,
          tags: entry.tags,
          classification: entry.classification,
          anxietyLevel: entry.anxietyLevel,
          anxietyLabel: entry.anxietyLabel,
          createdAt: entry.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new journal entry
// @route   POST /api/journal
// @access  Private
const createEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { mood, title, content, tags } = req.body;

    let entry = await JournalEntry.create({
      user: req.user.id,
      mood,
      title,
      content,
      tags: tags || [],
    });

    // Run ML classification and update the entry with the real model category:
    // normal / anxiety / depression.
    const classification = await classificationService.classify(content);
    if (classification) {
      entry.classification = classification.classification;
      entry.anxietyLevel = classification.anxietyLevel;
      entry.anxietyLabel = classification.anxietyLabel;
      await entry.save();
    }

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: {
        entry: {
          id: entry._id,
          date: entry.formattedDate,
          time: entry.formattedTime,
          mood: entry.mood,
          title: entry.title,
          content: entry.content,
          tags: entry.tags,
          classification: entry.classification,
          anxietyLevel: entry.anxietyLevel,
          anxietyLabel: entry.anxietyLabel,
          createdAt: entry.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single journal entry
// @route   GET /api/journal/:id
// @access  Private
const getEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        entry: {
          id: entry._id,
          date: entry.formattedDate,
          time: entry.formattedTime,
          mood: entry.mood,
          title: entry.title,
          content: entry.content,
          tags: entry.tags,
          classification: entry.classification,
          anxietyLevel: entry.anxietyLevel,
          anxietyLabel: entry.anxietyLabel,
          createdAt: entry.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update journal entry
// @route   PUT /api/journal/:id
// @access  Private
const updateEntry = async (req, res) => {
  try {
    const { mood, title, content, tags } = req.body;

    let entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    if (mood !== undefined) entry.mood = mood;
    if (title !== undefined) entry.title = title;
    if (content !== undefined) entry.content = content;
    if (tags !== undefined) entry.tags = tags;

    await entry.save();

    res.status(200).json({
      success: true,
      message: 'Entry updated successfully',
      data: {
        entry: {
          id: entry._id,
          date: entry.formattedDate,
          time: entry.formattedTime,
          mood: entry.mood,
          title: entry.title,
          content: entry.content,
          tags: entry.tags,
          classification: entry.classification,
          anxietyLevel: entry.anxietyLevel,
          anxietyLabel: entry.anxietyLabel,
          createdAt: entry.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete journal entry
// @route   DELETE /api/journal/:id
// @access  Private
const deleteEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get journal statistics for dashboard
// @route   GET /api/journal/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get date range for this week and last 14 days
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get entries for different periods
    const weekEntries = await JournalEntry.find({
      user: userId,
      date: { $gte: startOfWeek },
    });

    const monthEntries = await JournalEntry.find({
      user: userId,
      date: { $gte: thirtyDaysAgo },
    });

    const twoWeeksEntries = await JournalEntry.find({
      user: userId,
      date: { $gte: fourteenDaysAgo },
    }).sort({ date: 1 });

    // Calculate statistics
    const weeklyStreak = weekEntries.length;
    const monthlyAvgMood = monthEntries.length > 0
      ? (monthEntries.reduce((sum, e) => sum + e.mood, 0) / monthEntries.length).toFixed(1)
      : 0;
    
    const goodDays = monthEntries.filter(e => e.mood >= 4).length;

    // Calculate anxiety stats from the model's anxiety probability.
    const classifiedEntries = monthEntries.filter(e => getAnxietyScore(e) !== null);
    const avgAnxiety = classifiedEntries.length > 0
      ? classifiedEntries.reduce((sum, e) => sum + getAnxietyScore(e), 0) / classifiedEntries.length
      : 0;
    const anxietyReduction = Math.round((1 - avgAnxiety) * 100);

    // Mood chart data for last 14 days
    const moodChartData = twoWeeksEntries.map(entry => ({
      date: entry.formattedDate,
      mood: entry.mood,
    }));

    // Calculate high, average, low moods
    const moods = monthEntries.map(e => e.mood);
    const highMood = moods.length > 0 ? Math.max(...moods) : 0;
    const lowMood = moods.length > 0 ? Math.min(...moods) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          weeklyStreak: `${weeklyStreak}/7`,
          avgMood: `${monthlyAvgMood}/5`,
          anxietyReduction: `${anxietyReduction}%`,
          goodDays,
          totalEntries: monthEntries.length,
        },
        progress: {
          avgMood: parseFloat(monthlyAvgMood) || 0,
          anxietyLevel: avgAnxiety,
        },
        chartData: {
          entries: moodChartData,
          highMood,
          avgMood: parseFloat(monthlyAvgMood),
          lowMood,
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get anxiety trend data for chart
// @route   GET /api/journal/anxiety-trend
// @access  Private
const getAnxietyTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = Math.min(parseInt(req.query.days) || 30, 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await JournalEntry.find({
      user: userId,
      date: { $gte: startDate },
      $or: [
        { 'classification.probabilities.anxiety': { $ne: null } },
        { anxietyLevel: { $ne: null } },
        { anxietyLabel: { $in: ['low', 'moderate', 'medium', 'high'] } },
      ],
    }).sort({ date: 1 });

    const points = buildDailyAnxietyPoints(entries);
    const summary = summarizeAnxietyTrend(points);

    res.status(200).json({
      success: true,
      data: {
        points,
        summary,
      },
    });
  } catch (error) {
    console.error('Get anxiety trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  getStats,
  getAnxietyTrend,
};

