import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const NUM_QUESTIONS = 10;

const fallbackQuestions: QuizQuestion[] = [
  {
    question: "What is the primary goal of Media Information Literacy?",
    options: [
      "To consume more media",
      "To critically evaluate information sources",
      "To create viral content",
      "To avoid all media",
    ],
    correctAnswer: 1,
    explanation:
      "MIL helps people evaluate and interpret information critically.",
  },
  {
    question: "Which of the following is an example of misinformation?",
    options: [
      "Accidentally sharing outdated statistics",
      "Deliberately spreading fake news",
      "Editing a video for clarity",
      "Posting your opinion online",
    ],
    correctAnswer: 0,
    explanation:
      "Misinformation is false information shared without harmful intent.",
  },
];

export default function QuizScreen() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      console.log("Generating quiz with multiple Firebase calls...");

      const generateMILQuiz = httpsCallable(functions, "generateMILQuiz");
      const allQuestions: QuizQuestion[] = [];

      for (let i = 0; i < NUM_QUESTIONS; i++) {
        try {
          console.log(`Generating question ${i + 1}/${NUM_QUESTIONS}...`);

          const functionData = {
            topic: "Media Information Literacy",
            difficulty: "medium",
            questionCount: 1,
          };

          const result = await generateMILQuiz(functionData);

          if (!result.data) {
            console.warn(`No data returned for question ${i + 1}`);
            continue;
          }

          const responseData = result.data as any;

          // ✅ Normalize Gemini response into QuizQuestion format
          if (responseData.questions && Array.isArray(responseData.questions)) {
            const raw = responseData.questions[0];

            const mapped: QuizQuestion = {
              question: raw.headline || raw.question,
              options: raw.options || ["Fake", "Real"],
              correctAnswer: raw.correctAnswer === "Real" ? 1 : 0,
              explanation: raw.explanation || "",
            };

            allQuestions.push(mapped);
            console.log(`✅ Successfully generated question ${i + 1}`);
          } else {
            console.warn(
              `⚠ Invalid question structure for question ${i + 1},
              responseData`
            );
          }

          if (i < NUM_QUESTIONS - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (e) {
          console.error(`Error generating question ${i + 1}:`, e);
        }
      }

      if (allQuestions.length > 0) {
        setQuestions(allQuestions);
      } else {
        console.warn("No valid questions, using fallback set");
        setQuestions(fallbackQuestions.sort(() => Math.random() - 0.5));
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuestions(fallbackQuestions.sort(() => Math.random() - 0.5));
    } finally {
      setLoading(false); // ✅ Always stop loading
    }
  };

  useEffect(() => {
    generateQuiz();
  }, []);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    if (index === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
    generateQuiz();
  };

  if (loading) {
    return (
      <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
        <Text style={styles.loadingText}>
          Generating your personalised quiz...
        </Text>
        <Text style={styles.loadingSubtext}>
          Please wait while we create your questions.
        </Text>
      </LinearGradient>
    );
  }

  if (quizCompleted) {
    return (
      <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
        <Text style={styles.completedTitle}>Quiz Completed!</Text>
        <Text style={styles.scoreText}>
          Your Score: {score}/{questions.length}
        </Text>
        <Text style={styles.percentageText}>
          {Math.round((score / questions.length) * 100)}%
        </Text>
        <TouchableOpacity style={styles.next} onPress={resetQuiz}>
          <Text style={styles.nextText}>Take Another Quiz</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
        <Text style={styles.errorText}>
          No questions available. Please try again.
        </Text>
        <TouchableOpacity style={styles.next} onPress={resetQuiz}>
          <Text style={styles.nextText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedAnswer === index && styles.selectedOption,
              selectedAnswer !== null &&
                index === currentQuestion.correctAnswer &&
                styles.correctOption,
              selectedAnswer !== null &&
                selectedAnswer === index &&
                index !== currentQuestion.correctAnswer &&
                styles.incorrectOption,
            ]}
            onPress={() => handleAnswer(index)}
            disabled={selectedAnswer !== null}
          >
            <Text
              style={[
                styles.optionText,
                selectedAnswer === index && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}

        {selectedAnswer !== null && currentQuestion.explanation && (
          <Text
            style={[
              styles.explanation,
              selectedAnswer === currentQuestion.correctAnswer
                ? styles.correctExplanation
                : styles.incorrectExplanation,
            ]}
          >
            {currentQuestion.explanation}
          </Text>
        )}

        <Text style={styles.progress}>
          Question {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <TouchableOpacity
          style={[styles.next, selectedAnswer === null && styles.disabledNext]}
          onPress={handleNextQuestion}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.nextText}>
            {currentQuestionIndex + 1 === questions.length
              ? "Complete Quiz"
              : "Next Question"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  question: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  option: {
    backgroundColor: "#e6f0ff",
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#6a11cb",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  selectedOption: { backgroundColor: "#2575fc" },
  correctOption: { backgroundColor: "#28a745" },
  incorrectOption: { backgroundColor: "#ff4444" },
  optionText: { fontSize: 18, fontWeight: "600", color: "#2575fc" },
  selectedOptionText: { color: "#fff" },
  next: {
    backgroundColor: "#6a11cb",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#6a11cb",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  disabledNext: { backgroundColor: "#ccc", shadowOpacity: 0.1 },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  progress: {
    textAlign: "center",
    marginTop: 15,
    fontWeight: "600",
    color: "#666",
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
  },
  loadingSubtext: { fontSize: 16, textAlign: "center", color: "#666" },
  completedTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#6a11cb",
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
  },
  percentageText: {
    fontSize: 18,
    textAlign: "center",
    color: "#2575fc",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    color: "#ff4444",
    marginBottom: 20,
  },
  explanation: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  correctExplanation: { color: "#28a745" },
  incorrectExplanation: { color: "#ff4444" },
});