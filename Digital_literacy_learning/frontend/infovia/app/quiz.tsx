import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { auth, firestore } from "../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

// ---- Types ----
type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
};

type QuizResult = {
  correctCount: number;
  totalCount: number;
  failedQuestions: QuizQuestion[];
};

// ---- Constants ----
const QUIZ_TOPICS = ["Fake News Detection", "Digital Literacy", "Awareness"];

// ---- Helper: Decode HTML entities ----
const decodeHtml = (html: string) => {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

export default function QuizScreen() {
  const navigation = useNavigation<any>();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const uid = auth.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'QUIZ 📝' });
  }, [navigation]);

  const fetchQuestionsFromApi = async (category: string) => {
    try {
      const categoryMap: Record<string, number> = {
        "Fake News Detection": 9,
        "Digital Literacy": 18,
        Awareness: 23,
      };
      const catId = categoryMap[category] || 9;

      const response = await fetch(
        `https://opentdb.com/api.php?amount=10&category=${catId}&type=multiple`
      );
      const data = await response.json();

      return data.results.map((item: any, index: number) => {
        const options = [...item.incorrect_answers, item.correct_answer].sort(
          () => Math.random() - 0.5
        );
        return {
          id: String(index),
          question: decodeHtml(item.question),
          options: options.map(decodeHtml),
          correctAnswerIndex: options.indexOf(decodeHtml(item.correct_answer)),
          explanation: "Learn more about this topic from trusted sources online.",
          topic: category,
        };
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load quiz questions from API.");
      return [];
    }
  };

  const startQuiz = async (topic: string) => {
    setLoading(true);
    setSelectedTopic(topic);
    setQuizDone(false);
    setResult(null);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);

    const fetchedQuestions = await fetchQuestionsFromApi(topic);
    setQuestions(fetchedQuestions);
    setAnswers(Array(fetchedQuestions.length).fill(null));
    setLoading(false);
  };

  const selectOption = (index: number) => {
    setSelectedOptionIndex(index);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (selectedOptionIndex === null) {
      Alert.alert("Please select an answer before proceeding.");
      return;
    }
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionIndex(answers[currentIndex + 1]);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    const failedQuestions: QuizQuestion[] = [];

    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) {
        correctCount++;
      } else {
        failedQuestions.push(q);
      }
    });

    const res: QuizResult = {
      correctCount,
      totalCount: questions.length,
      failedQuestions,
    };
    setResult(res);
    setQuizDone(true);
    updateLeaderboard(res.correctCount);
  };

  const updateLeaderboard = async (correctCount: number) => {
    if (!uid) return;

    try {
      const userRef = doc(firestore, "leaderboard", uid);
      const userDoc = await getDoc(userRef);
      let currentScore = 0;
      if (userDoc.exists()) {
        currentScore = userDoc.data()?.score || 0;
      }
      const newScore = currentScore + correctCount * 10;

      await setDoc(
        userRef,
        {
          score: newScore,
          quizzesTaken: increment(1),
          lastUpdated: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Failed to update leaderboard", error);
    }
  };

  if (!selectedTopic) {
    return (
      <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
        <Text style={styles.title}>Select Quiz Topic</Text>
        {QUIZ_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic}
            style={styles.topicButton}
            onPress={() => startQuiz(topic)}
          >
            <Text style={styles.topicButtonText}>{topic}</Text>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Quiz...</Text>
      </View>
    );
  }

  if (quizDone && result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.t}>
          QUIZ COMPLETE! You scored {result.correctCount} out of {result.totalCount}
        </Text>

        {result.failedQuestions.length > 0 && (
          <>
            <Text style={styles.subtitle}>Explanation for incorrect answers:</Text>
            {result.failedQuestions.map((q, idx) => (
              <View key={idx} style={styles.explanationCard}>
                <Text style={styles.questionText}>{q.question}</Text>
                <Text style={styles.explanationText}>{q.explanation}</Text>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => {
            setSelectedTopic(null);
            setQuestions([]);
            setAnswers([]);
            setQuizDone(false);
            setResult(null);
          }}
        >
          <Text style={styles.restartButtonText}>Back to Topics</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.loadingText}>No questions available.</Text>
        <TouchableOpacity style={styles.restartButton} onPress={() => setSelectedTopic(null)}>
          <Text style={styles.restartButtonText}>Back to Topics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
      <View style={styles.quizCard}>
        <Text style={styles.questionCounter}>
          Question {currentIndex + 1} / {questions.length}
        </Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.options.map((opt, idx) => {
          const isSelected = idx === selectedOptionIndex;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => selectOption(idx)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex + 1 === questions.length ? "Finish Quiz" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffffff",
    textAlign: "center",
    marginBottom: 40,
  },
  t:{
     fontSize: 28,
    fontWeight: "900",
    color: "#0b00abff",
    textAlign: "center",
    marginBottom: 40
  }
  ,
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0d0082ff",
    marginBottom: 20,
  },
  topicButton: {
    backgroundColor: "#fff",
    marginHorizontal: 40,
    marginVertical: 12,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  topicButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6a11cb",
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030043ff",
    marginTop: 10,
  },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    elevation: 8,
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#6a11cb",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  optionButton: {
    backgroundColor: "#e6e6e6",
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  optionButtonSelected: {
    backgroundColor: "#6a11cb",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },
  optionTextSelected: {
    color: "#fff",
  },
  nextButton: {
    backgroundColor: "#6a11cb",
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 30,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  explanationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  explanationText: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
    lineHeight: 22,
  },
  restartButton: {
    backgroundColor: "#2575fc",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 60,
  },
  restartButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});
