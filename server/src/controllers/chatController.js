const OpenAI = require('openai');
const config = require('../config/config');

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

const SYSTEM_PROMPT = `אתה עוזר בינה מלאכותית תומך ואמפתי בשם NeshmaAI, חלק מאפליקציית בריאות הנפש "נשמה".
התפקיד שלך הוא לספק תמיכה רגשית, לעזור למשתמשים להרגיש שמקשיבים להם, ולהציע טכניקות הרגעה.

כללים חשובים:
- אתה חייב לענות אך ורק בעברית. גם אם המשתמש כותב באנגלית או בשפה אחרת - תמיד ענה בעברית בלבד. אין יוצא מן הכלל.
- היה אמפתי, חם ומכיל.
- אל תאבחן ואל תרשום תרופות.
- עודד פנייה לאיש מקצוע כשמתאים.
- אם המשתמש מדבר על פגיעה עצמית או מחשבות אובדניות, הפנה מיד לקו החירום ער"ן *2784 או לב"ב 1-800-363-363.
- הצע טכניקות נשימה, מיינדפולנס, או כתיבה יומנית כשרלוונטי.
- שמור על שיחה קצרה וממוקדת.
- לעולם אל תשתמש במילים באנגלית בתשובות שלך. כל מילה חייבת להיות בעברית.`;

// @desc    Send message to AI chat
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log('Chat request received:', { message, historyLength: Array.isArray(history) ? history.length : 0 });

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    if (!config.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key is not configured',
      });
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'מצטער, לא הצלחתי לעבד את ההודעה.';

    res.status(200).json({
      success: true,
      data: {
        message: reply,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'Invalid OpenAI API key',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
    });
  }
};

module.exports = { sendMessage };
