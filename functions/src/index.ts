import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {GoogleGenerativeAI} from "@google/generative-ai";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define TypeScript interfaces
interface GenerateQuizData {
  topic: string;
  difficulty: string;
  questionCount: number;
}

interface SaveQuizAttemptData {
  quizId: string;
  answers: Record<string, unknown>[];
  score: number;
  timeSpent: number;
}

interface GetCachedQuizData {
  quizId: string;
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

interface UserAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, unknown>[];
  score: number;
  timeSpent: number;
  completedAt: admin.firestore.Timestamp;
}

interface UserStats {
  totalQuizzes: number;
  totalScore: number;
  lastActivity: admin.firestore.Timestamp | null;
  recentAttempts?: UserAttempt[];
}

interface MILTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Generate MIL Quiz Function
export const generateMILQuiz = functions.https.onCall(
  async (
    data: GenerateQuizData,
    context: functions.https.CallableContext
  ) => {
    try {
      const {topic, difficulty, questionCount} = data;

      // Validate input
      if (!topic || !difficulty || !questionCount) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required parameters: topic, difficulty, questionCount"
        );
      }

      const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

      const prompt = `Generate ${questionCount} Media Information Literacy`+
      `quiz questions about "${topic}" at ${difficulty} level.

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

Format as valid JSON array:
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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      let quizData: QuizQuestion[];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          quizData = JSON.parse(jsonMatch[0]) as QuizQuestion[];
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to parse generated quiz data"
        );
      }

      // Store in Firestore for caching
      const quizRef = await db.collection("milQuizzes").add({
        topic,
        difficulty,
        questions: quizData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth?.uid || "anonymous",
      });

      return {
        success: true,
        quizId: quizRef.id,
        questions: quizData,
      };
    } catch (error) {
      console.error("Error generating MIL quiz:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate quiz: " + (error as Error).message
      );
    }
  }
);

// Get specific MIL quiz topics
export const getMILTopics = functions.https.onCall(
  async () => {
    const milTopics: MILTopic[] = [
      {
        id: "fake-news",
        title: "Fake News Detection",
        description: "Learn to identify false information in news articles",
        icon: "📰",
      },
      {
        id: "social-media",
        title: "Social Media Literacy",
        description: "Understand how information spreads on social platforms",
        icon: "📱",
      },
      {
        id: "source-verification",
        title: "Source Verification",
        description: "Evaluate the credibility of information sources",
        icon: "🔍",
      },
      {
        id: "bias-recognition",
        title: "Bias Recognition",
        description: "Identify different types of bias in media content",
        icon: "⚖",
      },
      {
        id: "digital-privacy",
        title: "Digital Privacy & Footprints",
        description: "Understand online privacy and digital traces",
        icon: "🔒",
      },
      {
        id: "image-manipulation",
        title: "Image & Video Manipulation",
        description: "Detect edited or manipulated visual content",
        icon: "🖼",
      },
      {
        id: "algorithm-awareness",
        title: "Algorithm Awareness",
        description: "Understand how algorithms shape information exposure",
        icon: "🤖",
      },
      {
        id: "fact-checking",
        title: "Fact-Checking Techniques",
        description: "Learn systematic approaches to verify information",
        icon: "✓",
      },
    ];

    return {topics: milTopics};
  }
);

// Save user quiz attempt
export const saveQuizAttempt = functions.https.onCall(
  async (
    data: SaveQuizAttemptData,
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {quizId, answers, score, timeSpent} = data;

    try {
      await db.collection("userAttempts").add({
        userId: context.auth.uid,
        quizId,
        answers,
        score,
        timeSpent,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user stats
      const userStatsRef = db.collection("userStats").doc(context.auth.uid);
      await userStatsRef.set({
        totalQuizzes: admin.firestore.FieldValue.increment(1),
        totalScore: admin.firestore.FieldValue.increment(score),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      return {success: true};
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to save quiz attempt"
      );
    }
  }
);

// Get user statistics
export const getUserStats = functions.https.onCall(
  async (
    data: Record<string, unknown>,
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    try {
      const userStatsDoc = await db.collection("userStats")
        .doc(context.auth.uid).get();
      const userAttempts = await db.collection("userAttempts")
        .where("userId", "==", context.auth.uid)
        .orderBy("completedAt", "desc")
        .limit(10)
        .get();

      const stats: Partial<UserStats> = userStatsDoc.exists ?
        userStatsDoc.data() : {
          totalQuizzes: 0,
          totalScore: 0,
          lastActivity: null,
        };

      const recentAttempts: Array<{id: string, [key: string]: unknown}> = [];
      userAttempts.forEach((doc) => {
        recentAttempts.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        ...stats,
        recentAttempts,
      };
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to fetch user statistics"
      );
    }
  }
);

// Get cached quiz by ID
export const getCachedQuiz = functions.https.onCall(
  async (data: GetCachedQuizData) => {
    const {quizId} = data;

    if (!quizId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Quiz ID is required"
      );
    }

    try {
      const quizDoc = await db.collection("milQuizzes").doc(quizId).get();

      if (!quizDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Quiz not found"
        );
      }

      return {
        success: true,
        quiz: quizDoc.data(),
      };
    } catch (error) {
      console.error("Error fetching quiz:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to fetch quiz"
      );
    }
  }
);
