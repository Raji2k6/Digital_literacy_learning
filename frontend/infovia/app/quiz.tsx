import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useLayoutEffect } from 'react'

const { width, height } = Dimensions.get('window')
const NUM_QUESTIONS = 10

export default function QuizScreen() {
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'QUIZ 📝' })
  }, [navigation])

  const anims = useRef([...Array(NUM_QUESTIONS)].map(() => new Animated.Value(0))).current

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2000 + i * 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2000 + i * 200, useNativeDriver: true })
        ])
      ).start()
    })
  }, [])

  const randomPosition = () => ({
    top: Math.random() * height * 0.8,
    left: Math.random() * width * 0.9
  })

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      {anims.map((anim, i) => {
        const pos = randomPosition()
        return (
          <Animated.Text
            key={i}
            style={[
              styles.floatingQuestion,
              { top: pos.top, left: pos.left, opacity: anim }
            ]}
          >
            ?
          </Animated.Text>
        )
      })}

      <View style={styles.card}>
        <Text style={styles.question}>Fake or Real? &quot;Aliens spotted in downtown!&quot;</Text>
        <TouchableOpacity style={styles.option}><Text style={styles.optionText}>Fake</Text></TouchableOpacity>
        <TouchableOpacity style={styles.option}><Text style={styles.optionText}>Real</Text></TouchableOpacity>
        <Text style={styles.progress}>Question 3/10</Text>
        <TouchableOpacity style={styles.next}><Text style={styles.nextText}>Next Question</Text></TouchableOpacity>
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
  question: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#333' },
  option: { 
    backgroundColor: '#e6f0ff', 
    padding: 16, 
    borderRadius: 15, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  optionText: { fontSize: 18, fontWeight: '600', color: '#2575fc' },
  next: { 
    backgroundColor: '#6a11cb', 
    padding: 16, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5
  },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  progress: { textAlign: 'center', marginTop: 15, fontWeight: '600', color: '#666' },
  floatingQuestion: { position: 'absolute', fontSize: 28, fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }
})
