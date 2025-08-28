// app/screens/HomeScreen.tsx
import React, { useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../services/auth";
import { addXP, saveModuleScore, getLeaderboardTop } from "../services/db";

export default function HomeScreen() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);

  const giveDailyXP = async () => {
    if (!user) return;
    await addXP(user.uid, 10);
    Alert.alert("XP Added", "You earned +10 XP!");
  };

  const saveScore = async () => {
    if (!user) return;
    await saveModuleScore(user.uid, "spotting-fake-news", 85);
    Alert.alert("Saved", "Your quiz score was saved.");
  };

  const loadLeaders = async () => {
    const top = await getLeaderboardTop(10);
    setLeaders(top);
  };

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Hello {user?.email}</Text>
      <Button title="Give me +10 XP" onPress={giveDailyXP} />
      <Button title="Save a sample quiz score" onPress={saveScore} />
      <Button title="Load Leaderboard" onPress={loadLeaders} />
      {leaders.map((u, i) => (
        <Text key={u.id}>{i + 1}. {u.id.slice(0,6)} — {u.xp ?? 0} XP</Text>
      ))}
      <Button title="Log out" onPress={signOutUser} />
    </View>
  );
}
