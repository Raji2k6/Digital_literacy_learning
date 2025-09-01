import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Image, StyleSheet, View } from 'react-native'

export default function SplashScreen() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('./auth') // navigate to Login/Signup after 3s
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  logo: { width: 300, height: 300, resizeMode: 'contain' },
})
