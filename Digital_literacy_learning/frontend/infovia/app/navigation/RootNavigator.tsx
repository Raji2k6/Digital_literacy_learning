// app/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
// Make sure the file exists at the specified path and extension
import LoginScreen from "../screens/LoginScreen"; // If the file is LoginScreen.tsx

// If the file is named differently or in a different location, update the path accordingly, for example:
// import LoginScreen from "../screens/Login"; // If the file is Login.tsx
// Update the path and filename if needed, e.g. Home.tsx or correct folder
import HomeScreen from "../screens/HomeScreen"; // Change 'Home' to the actual filename if different

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // Show a splash/loader if you want

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* Quiz, Scenario, Leaderboard, Profile screens go here */}
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          {/* Signup screen if you want separate */}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
