import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('window')
const NUM_HINTS = 6
const hints = ["What to do?", "How will you do it?", "Think carefully", "Verify sources", "Ask for help", "Check facts"]

export default function ScenarioScreen() {
  const navigation = useNavigation()
  const anims = useRef([...Array(NUM_HINTS)].map(() => new Animated.Value(0))).current

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
        <Text style={styles.prompt}>“You see a viral post claiming soda cures COVID. What do you do?”</Text>

        <TouchableOpacity style={styles.option}><Text style={styles.optionText}>Share it without checking</Text></TouchableOpacity>
        <TouchableOpacity style={styles.option}><Text style={styles.optionText}>Verify with trusted sources</Text></TouchableOpacity>
        <TouchableOpacity style={styles.option}><Text style={styles.optionText}>Ask a teacher/parent</Text></TouchableOpacity>
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
  floatingText: { 
    position: 'absolute', 
    fontSize: 20, 
    fontWeight: '600', 
    color: 'rgba(255,255,255,1)' 
  }
})
