import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { auth, firestore } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

// Animated gradient background component
function AnimatedGradientBackground() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  });

  return (
    <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity }}>
      <LinearGradient
        colors={["#0033ffff", "#6ee0ffff", "#2802d2ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

// Auth Screen (Login / Signup)
function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Success", "Logged in successfully");
      navigation.replace("AppDrawer");
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Create Firestore user document with initial data
      await setDoc(doc(firestore, "users", user.uid), {
        username: email.split("@")[0], // default username from email prefix
        email: user.email,
        quizzesCompleted: 0,
        scenariosCompleted: 0,
        currentScore: 0,
      });

      Alert.alert("Success", "Account created successfully");
      navigation.replace("AppDrawer");
    } catch (error: any) {
      Alert.alert("Signup Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.authContainer}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="#666"
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#666"
        />

        {!isLogin && (
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#666"
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={isLogin ? handleLogin : handleSignup}
        >
          <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={{ marginTop: 15 }}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Dashboard Screen
function Dashboard({ navigation }: any) {
  return (
    <View style={{ flex: 1 }}>
      <AnimatedGradientBackground />
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={() => navigation.openDrawer()}
      >
        <Text style={styles.hamburgerText}>☰</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.header}>Welcome, Teen! 👋</Text>
        <Text style={styles.motivation}>Today is a great day to learn something new!</Text>

        <View style={styles.dashboardCard}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("quiz")}
          >
            <Text style={styles.menuButtonText}>🎯 Quizzes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("scenario")}
          >
            <Text style={styles.menuButtonText}>📖 Scenarios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


// Profile Screen
function Profile({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [quizzesCompleted, setQuizzesCompleted] = useState(0);
  const [scenariosCompleted, setScenariosCompleted] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(doc(firestore, "users", uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setUsername(data.username || "");
        setEmail(auth.currentUser?.email || "");
        setQuizzesCompleted(data.quizzesCompleted || 0);
        setScenariosCompleted(data.scenariosCompleted || 0);
        setCurrentScore(data.currentScore || 0);
        setLoading(false);
      } else {
        Alert.alert("Error", "User data not found.");
        setLoading(false);
      }
    });

    return () => unsub();
  }, [uid]);

  const handleSave = async () => {
    if (!uid) return;

    if (username.trim().length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters.");
      return;
    }

    try {
      await updateDoc(doc(firestore, "users", uid), {
        username: username.trim(),
        quizzesCompleted,
        scenariosCompleted,
        currentScore,
      });

      Alert.alert("Success", "Profile updated successfully.");
      setEditMode(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#4a3fbc" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <AnimatedGradientBackground />

      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={() => navigation.openDrawer()}
      >
        <Text style={styles.hamburgerText}>☰</Text>
      </TouchableOpacity>

      <View style={[styles.container, { paddingVertical: 40 }]}>
        <Text style={styles.header}>Profile</Text>

        <Image
          source={{ uri: auth.currentUser?.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg" }}
          style={styles.profileImage}
        />

        {editMode ? (
          <>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: "#ddd" }]}
              value={email}
              editable={false}
              placeholder="Email"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={String(quizzesCompleted)}
              onChangeText={(text) => setQuizzesCompleted(Number(text) || 0)}
              placeholder="Quizzes Completed"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={String(scenariosCompleted)}
              onChangeText={(text) => setScenariosCompleted(Number(text) || 0)}
              placeholder="Scenarios Completed"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={String(currentScore)}
              onChangeText={(text) => setCurrentScore(Number(text) || 0)}
              placeholder="Current Score"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditMode(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.profileText}>Username: {username}</Text>
              <Text style={styles.profileText}>Email: {email}</Text>
              <Text style={styles.profileText}>Total Quizzes Completed: {quizzesCompleted}</Text>
              <Text style={styles.profileText}>Total Scenarios Completed: {scenariosCompleted}</Text>
              <Text style={styles.profileText}>Current Score: {currentScore}</Text>
              <Text style={styles.profileText}>Badges: 🕵️‍♂️ 🧠 🏅</Text>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}


// Leaderboard Screen
function Leaderboard({ navigation }: any) {
  const players = [
    { name: "Alice", score: 190, stage: "Master", avatar: "https://randomuser.me/api/portraits/women/65.jpg" },
    { name: "Bob", score: 160, stage: "Expert", avatar: "https://randomuser.me/api/portraits/men/43.jpg" },
    { name: "You", score: 120, stage: "Intermediate", avatar: "https://randomuser.me/api/portraits/lego/1.jpg" },
    { name: "Eve", score: 100, stage: "Beginner", avatar: "https://randomuser.me/api/portraits/women/30.jpg" },
  ];

  const maxScore = Math.max(...players.map((p) => p.score));

  return (
    <ScrollView contentContainerStyle={styles.leaderboardContainer}>
      <AnimatedGradientBackground />
      <TouchableOpacity style={styles.hamburgerButton} onPress={() => navigation.openDrawer()}>
        <Text style={styles.hamburgerText}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.leaderboardTitle}>Leaderboard</Text>

      {players.map((player, index) => {
        const isCurrentUser = player.name === "You";
        const progress = player.score / maxScore;

        return (
          <View key={index} style={[styles.playerCard, isCurrentUser && styles.currentUserCard]}>
            <Image
              source={{ uri: player.avatar }}
              style={[styles.playerAvatar, isCurrentUser && styles.currentUserAvatar]}
            />
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>{player.name}</Text>
              <Text style={styles.playerStage}>{player.stage}</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <Text style={[styles.playerScore, isCurrentUser && styles.currentUserScore]}>{player.score} pts</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flex: 1,
        backgroundColor: "#4a3fbc",
        paddingTop: 40,
      }}
    >
      <DrawerItem
        label="Dashboard"
        labelStyle={{ color: "#fff", fontWeight: "700", fontSize: 18 }}
        style={{ marginVertical: 10, borderRadius: 10 }}
        onPress={() => props.navigation.navigate("Dashboard")}
      />
      <DrawerItem
        label="Profile"
        labelStyle={{ color: "#fff", fontWeight: "700", fontSize: 18 }}
        style={{ marginVertical: 10, borderRadius: 10 }}
        onPress={() => props.navigation.navigate("Profile")}
      />
      <DrawerItem
        label="Leaderboard"
        labelStyle={{ color: "#fff", fontWeight: "700", fontSize: 18 }}
        style={{ marginVertical: 10, borderRadius: 10 }}
        onPress={() => props.navigation.navigate("Leaderboard")}
      />
      <DrawerItem
        label="Log Out"
        labelStyle={{ color: "#ff6b6b", fontWeight: "700", fontSize: 18 }}
        style={{ marginVertical: 10, borderRadius: 10 }}
        onPress={() => {
          Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", style: "destructive", onPress: handleLogout },
          ]);
        }}
      />
    </DrawerContentScrollView>
  );
}

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="Leaderboard" component={Leaderboard} />
    </Drawer.Navigator>
  );
}

export default function Index({ navigation }: any) {
  // We expect the root NavigationContainer to be outside this component (e.g. Expo environment wraps it)
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
      </View>
    );
  }

  // Render stack navigator without NavigationContainer
  // navigation prop must be passed from parent container
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="AppDrawer" component={AppDrawer} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2575fc" },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 25, textAlign: "center", color: "#333" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    width: "90%",
    fontSize: 16,
    color: "#333",
    borderColor: "#4a3fbc",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#2575fc",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchText: { color: "#2575fc", fontWeight: "600", textAlign: "center" },

  container: { flex: 1, padding: 50, alignItems: "center", justifyContent: "center" },
  hamburgerButton: {
    position: "absolute",
    top: 40,
    left: 10,
    zIndex: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor:"rgba(255,255,255,0)"
    

  },
  hamburgerText: { fontSize: 28, fontWeight: "900", color: "#fff" },

  header: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 15,
    marginLeft: 6,
    marginTop: 40,
    textAlign: "center",
    color: "#fff",
    textShadowColor: "#000b48ff",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  motivation: { fontSize: 18, marginBottom: 25, textAlign: "center", color: "#fff" },

  dashboardCard: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14 },
  menuButton: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    width: 270,
    margin: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 8,
  },
  menuButtonText: { fontWeight: "700", color: "#4a3fbc", fontSize: 28 },

  infoBotButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#ffb703",
    padding: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 10,
  },
  infoBotText: { color: "#fff", fontWeight: "900" },

  profileCard: {
    backgroundColor: "#ffffffcc",
    padding: 20,
    borderRadius: 18,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
  },
  profileText: { fontSize: 16, fontWeight: "700", color: "#4a3fbc", marginBottom: 8, textAlign: "center" },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#4a3fbc",
    alignSelf: "center",
  },

  leaderboardContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: "#f5f7fa",
    minHeight: "100%",
  },
  leaderboardTitle: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 25,
    color: "#4a3fbc",
    textAlign: "center",
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#999",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    elevation: 6,
  },
  currentUserCard: {
    backgroundColor: "#d7e9ff",
    shadowColor: "#4a3fbc",
    shadowOpacity: 0.4,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  currentUserAvatar: {
    borderColor: "#2575fc",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: "700",
    fontSize: 20,
    color: "#4a3fbc",
  },
  currentUserName: {
    color: "#2575fc",
  },
  playerStage: {
    fontSize: 14,
    color: "#777",
    marginBottom: 8,
  },
  progressBarBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4a3fbc",
    borderRadius: 10,
  },
  playerScore: {
    fontWeight: "700",
    fontSize: 18,
    color: "#4a3fbc",
    marginLeft: 12,
    width: 70,
    textAlign: "right",
  },
  currentUserScore: {
    color: "#2575fc",
  },

  editButton: {
    backgroundColor: "#4a3fbc",
    padding: 16,
    borderRadius: 20,
    width: 200,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2575fc",
    padding: 16,
    borderRadius: 20,
    width: 200,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    borderColor: "#2575fc",
    borderWidth: 2,
    padding: 16,
    borderRadius: 20,
    width: 200,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#2575fc",
    fontWeight: "700",
    fontSize: 16,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});