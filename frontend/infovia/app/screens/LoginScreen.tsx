// app/screens/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
// import { signIn, signUp } from "../services/auth";
import { auth } from "../../firebaseConfig";
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert("Login Error", e.message);
    }
  };

  const onSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Success", "Account created. You are logged in.");
    } catch (e: any) {
      Alert.alert("Signup Error", e.message);
    }
  };

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Welcome</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Button title="Log In" onPress={onLogin} />
      <Button title="Sign Up" onPress={onSignup} />
    </View>
  );
}