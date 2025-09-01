import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('window')
const NUM_HINTS = 6
const hints = ["What to do?", "How will you do it?", "Think carefully", "Verify sources", "Ask for help", "Check facts"]

const defaultQuestions = [
  {
    prompt: "You see a viral post claiming soda cures COVID. What do you do?",
    options: ["Share it without checking", "Verify with trusted sources", "Ask a teacher/parent"],
    correctIndex: 1
  },
  {
    prompt: "A friend forwards a rumor about a celebrity. What is your response?",
    options: ["Forward it immediately", "Check official news sources", "Ignore it"],
    correctIndex: 1
  },
  {
    prompt: "You find a post about a miracle weight loss product. What do you do?",
    options: ["Buy it immediately", "Verify claims online", "Share it for fun"],
    correctIndex: 1
  },
  {
    prompt: "Someone tags you in a controversial news post. How do you react?",
    options: ["Comment angrily", "Check the news source", "Share without reading"],
    correctIndex: 1
  },
  {
    prompt: "You read a headline that seems unbelievable. What's your next step?",
    options: ["Believe it instantly", "Search for trustworthy sources", "Share on social media"],
    correctIndex: 1
  },
  {
    prompt: "A video shows a shocking event. You are unsure if it’s real. What do you do?",
    options: ["Share it immediately", "Fact-check before sharing", "Ignore it"],
    correctIndex: 1
  }
]

export default function ScenarioScreen() {
  const navigation = useNavigation()
  const anims = useRef([...Array(NUM_HINTS)].map(() => new Animated.Value(0))).current
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    navigation.setOptions({ title: 'SCENARIO 📖' })
  }, [navigation])

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2500 + i * 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2500 + i * 300, useNativeDriver: true })
        ])
      ).start()
    })
  }, [])

  const randomPosition = () => ({
    top: Math.random() * height * 0.8,
    left: Math.random() * width * 0.9
  })

  const handleAnswer = (index: number) => {
    if (answered) return
    setSelectedIndex(index)
    setAnswered(true)
    const currentQuestion = defaultQuestions[currentQuestionIndex]
    if (index === currentQuestion.correctIndex) {
      Alert.alert("Correct!", "You verified with trusted sources ✅")
    } else {
      Alert.alert("Wrong!", "Remember to verify information before sharing ❌")
    }
  }

  const handleNextScenario = () => {
    setSelectedIndex(null)
    setAnswered(false)
    if (currentQuestionIndex + 1 < defaultQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      Alert.alert("Completed!", "You have completed all scenarios 🎉")
      setCurrentQuestionIndex(0)
    }
  }

  const currentQuestion = defaultQuestions[currentQuestionIndex]

  return (
    <LinearGradient colors={['#ff7e5f', '#feb47b']} style={styles.container}>
      {anims.map((anim, i) => {
        const pos = randomPosition()
        return (
          <Animated.Text
            key={i}
            style={[styles.floatingText, { top: pos.top, left: pos.left, opacity: anim }]}
          >
            {hints[i]}
          </Animated.Text>
        )
      })}

      <View style={styles.card}>
        <Text style={styles.prompt}>{currentQuestion.prompt}</Text>

        {currentQuestion.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.option,
              answered && idx === currentQuestion.correctIndex ? { backgroundColor: "#4caf50" } : {},
              answered && idx === selectedIndex && idx !== currentQuestion.correctIndex ? { backgroundColor: "#f44336" } : {}
            ]}
            onPress={() => handleAnswer(idx)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}

        {answered && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextScenario}
          >
            <Text style={styles.nextButtonText}>Next Scenario</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  prompt: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#333' },
  option: { 
    backgroundColor: '#e6f0ff',
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#ff7e5f',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  optionText: { fontSize: 16, fontWeight: '600', color: '#ff7e5f' },
  nextButton: {
    marginTop: 20,
    backgroundColor: "#2575fc",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center'
  },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  floatingText: { 
    position: 'absolute', 
    fontSize: 20, 
    fontWeight: '600', 
    color: 'rgba(255,255,255,1)' 
  }
})
