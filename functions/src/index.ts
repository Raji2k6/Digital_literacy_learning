import * as functions from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ---------- Types ----------
interface GenerateQuizData {
  topic: string;
  difficulty: string;
  questionCount: number;
}

interface QuizQuestion {
  id: number;
  headline: string;
  context: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  learningObjective: string;
  milConcept: string;
}

interface SaveQuizAttemptData {
  quizId: string;
  answers: { [key: string]: string };
  score: number;
  timeSpent: number;
}

interface GetCachedQuizData {
  quizId: string;
}

// Test function to verify setup
export const testFunction = functions.onCall(async (request) => {
  logger.info("Test function called!");
  return { success: true, message: "Functions are working!" };
});
// logger.info("Gemini API Key present?", !!apiKey);
// logger.info("Prompt being sent:", prompt);

// Generate Quiz (with lazy Gemini loading)
export const generateMILQuiz = functions.onCall<GenerateQuizData>(
  async (request) => {
    const data = request.data;
    const userId = request.auth?.uid || "anonymous";

    try {
      // Lazy load Gemini AI inside the function to avoid initialization timeout
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        logger.error("❌ GEMINI_API_KEY not found in environment variables");
        throw new Error("API key not configured");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `
Generate ${data.questionCount} Media Information Literacy quiz questions about "${data.topic}" at ${data.difficulty} level.

Create engaging scenarios that users must evaluate as FAKE or REAL.

Focus on these MIL concepts:
- Fake news identification
- Source credibility assessment
- Bias recognition
- Misinformation vs. disinformation
- Digital footprints and privacy
- Social media literacy
- Fact-checking techniques
- Information verification
- Media manipulation detection
- Algorithm awareness

Return the output as a valid JSON array ONLY, with no extra text.
Each object in the array must have the following fields:
- id (incrementing number starting at 1)
- headline (string)
- context (string)
- options (exactly ["Fake", "Real"])
- correctAnswer ("Fake" or "Real")
- explanation (string)
- learningObjective (string)
- milConcept (string)

Example Format as valid JSON array:
[
  {
    "id": 1,
    "headline": "Aliens spotted in downtown!",
    "context": "Viral TikTok video with 2M views shows blurry footage.",
    "options": ["Fake", "Real"],
    "correctAnswer": "Fake",
    "explanation": "Red flags include blurry evidence and lack of sources.",
    "learningObjective": "Recognize lack of credible sources",
    "milConcept": "Source credibility assessment"
  }
]
`;

      logger.info("Sending prompt to Gemini...");

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let questions: QuizQuestion[] = [];
      try {
        questions = JSON.parse(text);
      } catch (err) {
        logger.error("❌ Failed to parse Gemini response", err, text);
        throw new Error("Invalid Gemini response format.");
      }

      // Cache quiz in Firestore
      const quizDoc = await db.collection("quizzes").add({
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        topic: data.topic,
        difficulty: data.difficulty,
        questions,
      });

      return {
        success: true,
        quizId: quizDoc.id,
        questions,
      };
    } catch (err) {
      logger.error("❌ Error generating quiz:", err);
      return { success: false, quizId: "", questions: [] };
    }
  }
);

// Save Quiz Attempt
export const saveQuizAttempt = functions.onCall<SaveQuizAttemptData>(
  async (request) => {
    const data = request.data;
    const userId = request.auth?.uid || "anonymous";

    try {
      await db.collection("quizAttempts").add({
        userId,
        quizId: data.quizId,
        answers: data.answers,
        score: data.score,
        timeSpent: data.timeSpent,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (err) {
      logger.error("❌ Error saving attempt:", err);
      return { success: false };
    }
  }
);

// Get User Progress
export const getUserProgress = functions.onCall<Record<string, unknown>>(
  async (request) => {
    const userId = request.auth?.uid || "anonymous";

    try {
      const attemptsSnapshot = await db
        .collection("quizAttempts")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      const recentAttempts = attemptsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const statsSnapshot = await db
        .collection("quizAttempts")
        .where("userId", "==", userId)
        .get();

      const totalQuizzes = statsSnapshot.size;
      const totalScore = statsSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().score || 0),
        0
      );

      return {
        recentAttempts,
        totalQuizzes,
        totalScore,
        lastActivity:
          recentAttempts.length > 0 && "createdAt" in recentAttempts[0]
            ? (recentAttempts[0].createdAt as admin.firestore.Timestamp)
            : null,
      };
    } catch (err) {
      logger.error("❌ Error fetching progress:", err);
      return { recentAttempts: [] };
    }
  }
);

// Get Cached Quiz
export const getCachedQuiz = functions.onCall<GetCachedQuizData>(
  async (request) => {
    const data = request.data;

    try {
      const quizDoc = await db.collection("quizzes").doc(data.quizId).get();

      if (!quizDoc.exists) {
        throw new Error("Quiz not found");
      }

      return { success: true, quiz: quizDoc.data()! };
    } catch (err) {
      logger.error("❌ Error fetching cached quiz:", err);
      return { success: false, quiz: null };
    }
  }
);


// Add this to your functions/src/index.ts to test Gemini

export const testGemini = functions.onCall(async (request) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: "No API key found",
        envVars: Object.keys(process.env).filter(key => key.includes('GEMINI'))
      };
    }

    // Test Gemini connection
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent("Generate 1 simple quiz question in JSON format: {\"question\": \"What is 2+2?\", \"answer\": \"4\"}");
    const response = result.response.text();

    return {
      success: true,
      geminiResponse: response,
      message: "Gemini is working!"
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});