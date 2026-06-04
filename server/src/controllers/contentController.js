const Content = require('../models/Content');

// @desc    Get all content
// @route   GET /api/content
// @access  Private
const getContent = async (req, res) => {
  try {
    const { category, type, search } = req.query;
    
    const query = { isActive: true };
    
    if (category && category !== 'הכל') {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const content = await Content.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        content: content.map(item => ({
          id: item._id,
          title: item.title,
          description: item.description,
          duration: item.duration,
          category: item.category,
          type: item.type,
          gradientColors: item.gradientColors,
          imageUrl: item.imageUrl,
          mediaUrl: item.mediaUrl,
          tags: item.tags,
        })),
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get recommended content based on user's mood history
// @route   GET /api/content/recommended
// @access  Private
const getRecommended = async (req, res) => {
  try {
    // Get random 4 content items for recommendations
    const content = await Content.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 4 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        content: content.map(item => ({
          id: item._id,
          title: item.title,
          description: item.description,
          duration: item.duration,
          category: item.category,
          type: item.type,
          gradientColors: item.gradientColors,
          imageUrl: item.imageUrl,
          tags: item.tags,
        })),
      },
    });
  } catch (error) {
    console.error('Get recommended error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single content item
// @route   GET /api/content/:id
// @access  Private
const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        content: {
          id: content._id,
          title: content.title,
          description: content.description,
          duration: content.duration,
          category: content.category,
          type: content.type,
          gradientColors: content.gradientColors,
          imageUrl: content.imageUrl,
          mediaUrl: content.mediaUrl,
          tags: content.tags,
        },
      },
    });
  } catch (error) {
    console.error('Get content by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new content (Admin only - for seeding)
// @route   POST /api/content
// @access  Private/Admin
const createContent = async (req, res) => {
  try {
    const content = await Content.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: { content },
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Seed initial content data
// @route   POST /api/content/seed
// @access  Private
const seedContent = async (req, res) => {
  try {
    // Check if content already exists
    const existingCount = await Content.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Content already seeded',
      });
    }

    const sampleContent = [
      {
        title: 'מדיטציית הכרת תודה',
        description: 'מדיטציה להתמקדות בדברים הטובים בחיים ולשינוי נקודת מבט.',
        duration: '10 דקות',
        category: 'מיינדפולנס',
        type: 'meditation',
        gradientColors: ['#10B981', '#34D399'],
        tags: ['מיינדפולנס'],
        order: 1,
      },
      {
        title: 'תרגול חמלה עצמית',
        description: 'לנהל להיות טובים לעצמכם ולפתח חמלה עצמית.',
        duration: '12 דקות',
        category: 'סיפור עצמי',
        type: 'meditation',
        gradientColors: ['#8B5CF6', '#A78BFA'],
        tags: ['סיפור עצמי'],
        order: 2,
      },
      {
        title: 'מדיטציית סריקת גוף',
        description: 'מדיטציה מודרכת לשחרור מתחים בכל הגוף. סרוק כל אזור והרפה.',
        duration: '15 דקות',
        category: 'לחץ',
        type: 'meditation',
        gradientColors: ['#F59E0B', '#FBBF24'],
        tags: ['לחץ'],
        order: 3,
      },
      {
        title: 'תרגיל נשימה 4-7-8',
        description: 'טכניקה נשימה מהירה להפחתת חרדה. שאיפה 4 שניות, החזקת 7, נשיפה 8.',
        duration: '5 דקות',
        category: 'הקלה מחרדה',
        type: 'breathing',
        gradientColors: ['#EF4444', '#F87171'],
        tags: ['הקלה מחרדה'],
        order: 4,
      },
      {
        title: 'יוגה בוקר מרגיעה',
        description: 'רצף יוגה עדין להתחלה זורמת מלאת אנרגיה חיובית.',
        duration: '20 דקות',
        category: 'שינה',
        type: 'yoga',
        gradientColors: ['#14B8A6', '#2DD4BF'],
        tags: ['שינה'],
        order: 5,
      },
      {
        title: 'נשימת קופסה',
        description: 'טכניקה נשימה פשוטה להרגעה מהירה. שאיפה 4 שניות, נשיפה 4.',
        duration: '3 דקות',
        category: 'הקלה מחרדה',
        type: 'breathing',
        gradientColors: ['#EF4444', '#F87171'],
        tags: ['הקלה מחרדה'],
        order: 6,
      },
      {
        title: 'מדריך הכנה לשינה',
        description: 'טיפים וטכניקות להכנה לשינה איכותית ומרעננת.',
        duration: '10 דקות',
        category: 'שינה',
        type: 'article',
        gradientColors: ['#A78BFA', '#C4B5FD'],
        tags: ['שינה'],
        order: 7,
      },
      {
        title: 'להבין חרדה',
        description: 'מדריך מקיף להבנת חרדה, הסימנים, וטכניקות התמודדות.',
        duration: '15 דקות',
        category: 'מידע',
        type: 'article',
        gradientColors: ['#DC2626', '#EF4444'],
        tags: ['מידע'],
        order: 8,
      },
      {
        title: 'הקלה מהירה מלחץ',
        description: 'תרגילים מהירים של 5 דקות להקלה מידית מלחץ.',
        duration: '5 דקות',
        category: 'לחץ',
        type: 'video',
        gradientColors: ['#B45309', '#D97706'],
        tags: ['לחץ'],
        order: 9,
      },
      {
        title: 'אמירות חיוביות',
        description: 'אמירות חיוביות יומיות לשיפור האופטימיות והעצמה אישית.',
        duration: '8 דקות',
        category: 'מוטיבציה',
        type: 'audio',
        gradientColors: ['#B45309', '#D97706'],
        tags: ['מוטיבציה'],
        order: 10,
      },
    ];

    await Content.insertMany(sampleContent);

    res.status(201).json({
      success: true,
      message: `${sampleContent.length} content items seeded successfully`,
    });
  } catch (error) {
    console.error('Seed content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getContent,
  getRecommended,
  getContentById,
  createContent,
  seedContent,
};

