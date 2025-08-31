import { HapticTab } from '@/components/HapticTab'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { useColorScheme } from '@/hooks/useColorScheme'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const [showTabs, setShowTabs] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowTabs(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!showTabs) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarActiveTintColor: 'rgba(0, 195, 255, 1)',
        tabBarInactiveTintColor: 'rgb(161,206,220)',
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 1)',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Learn',
          tabBarIcon: () => <Ionicons size={28} name="book-outline" color="#4BFF1F" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="globe-outline" color="#00008B" />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 500,
    height: 500,
    resizeMode: 'contain',
  },
})
