import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";

type NewsItem = {
  title: string;
  description: string;
  url?: string;
  source?: string;
};

const API_KEYS = [
  "bff7d8cd3abf431da64621406b2eb285",
  "pub_ea8e0afe0cfd42e5a6ab6734424dd137",
  "959fa753ad28a4c5ebb02cff629be75c",
];

// Example API fetch function, replace API endpoint with actual if different
async function fetchNewsByApiKey(apiKey: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${apiKey}`
    );
    const data = await res.json();

    if (data.articles && Array.isArray(data.articles)) {
      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || "",
        url: article.url,
        source: article.source?.name || "Unknown",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching news for API key:", apiKey, error);
    return [];
  }
}

export default function Explore() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllNews = async () => {
      setLoading(true);
      let combinedNews: NewsItem[] = [];

      for (const key of API_KEYS) {
        const newsFromKey = await fetchNewsByApiKey(key);
        combinedNews = combinedNews.concat(newsFromKey);
      }

      combinedNews.sort((a, b) => a.title.localeCompare(b.title));

      setNews(combinedNews);
      setLoading(false);
    };

    fetchAllNews();
  }, []);

  const handlePress = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert("Error", "Failed to open the article link.")
      );
    } else {
      Alert.alert("Info", "More content coming soon!");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2a52be" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Explore Latest News</Text>
      {news.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSource}>Source: {item.source}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => handlePress(item.url)}
          >
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f7fc" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2a52be",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 7,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d3557",
    marginBottom: 6,
  },
  cardSource: {
    fontSize: 12,
    fontWeight: "600",
    color: "#457b9d",
    marginBottom: 10,
    fontStyle: "italic",
  },
  cardDesc: {
    fontSize: 14,
    color: "#303030",
    marginBottom: 14,
    lineHeight: 20,
  },
  readMoreButton: {
    backgroundColor: "#2a52be",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  readMoreText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});