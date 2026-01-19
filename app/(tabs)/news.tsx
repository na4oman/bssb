import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Button,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { format, differenceInDays } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { newsApiKey } from '../../config/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type NewsItem = {
  id: string;
  title: string;
  date: Date;
  imageUrl: string;
  summary: string;
  url: string;
};

interface MatchResult {
  opponent: string;
  score: string;
  highlights: string;
  date?: string;
}

type LatestSunderlandNewsItem = {
  type: string;
  title: string;
  description: string;
  icon: string;
};

type SunderlandTeamStatus = {
  previous_match?: {
    opponent: string;
    date: string;
    result: string;
  };
  next_match?: {
    opponent: string;
    date: string;
    time: string;
    competition: string;
    venue?: string;
  };
  injuries?: Array<{
    player: string;
    status: string;
  }>;
  suspensions?: Array<{
    player: string;
    status: string;
  }>;
};

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestSunderlandNews, setLatestSunderlandNews] = useState<LatestSunderlandNewsItem[]>([]);
  const [teamStatus, setTeamStatus] = useState<SunderlandTeamStatus>({});

  const fetchNews = async () => {
    try {
      const apiKey = newsApiKey;

      if (!apiKey) {
        throw new Error('No API key found in configuration');
      }

      setLoading(true);
      const response = await axios.get(`https://newsapi.org/v2/everything?q=Sunderland+AFC+football+club&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`, {
        timeout: 10000 // 10 seconds timeout
      });

      const newsData = response.data.articles.map((article: any) => ({
        id: article.url, // Use URL as unique identifier
        title: article.title || 'Untitled Article',
        date: new Date(article.publishedAt || Date.now()),
        imageUrl: article.urlToImage || 'https://via.placeholder.com/300x200.png?text=SAFC+News',
        summary: article.description || 'No summary available',
        url: article.url
      }));

      setNews(newsData);
      setDisplayedNews(newsData.slice(0, 5));
      setError(null);
    } catch (error) {
      console.error('News Fetching Error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Detailed Axios Error:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          message: error.message
        });
      }

      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setNews([]);
      setDisplayedNews([]);
    } finally {
      setLoading(false);
    }
  };

  // const fetchSunderlandNews = async () => {
  //   try {
      // Use require to import local JSON file
      // const teamData = require('../../sunderland_latest_news.json');

      // Extract team status
      // const status: SunderlandTeamStatus = {
      //   previous_match: teamData.previous_match,
      //   next_match: teamData.next_match,
      //   injuries: teamData.injuries,
      //   suspensions: teamData.suspensions
      // };
      // setTeamStatus(status);

      // Combine and deduplicate recent matches
      // const allRecentMatches = [
      //   ...(teamData.recent_matches || []),
      //   ...(teamData.recent_results || [])
      // ].filter((match: any, index: number, self: any[]) => 
      //   index === self.findIndex((m) => 
      //     m.opponent === match.opponent && m.score === match.score
      //   )
      // );

      // Create news items based on team status
      // const sunderlandNews: LatestSunderlandNewsItem[] = [
      //   ...allRecentMatches.map((result: any) => ({
      //     type: 'Match Result',
      //     title: `vs ${result.opponent || 'Unknown'}`,
      //     description: `${result.score || 'No score'} - ${result.highlights || 'No highlights'}`,
      //     icon: 'football'
      //   })),
      //   ...(teamData.team_notes || []).map((note: any) => ({
      //     type: 'Team Update',
      //     title: 'Club News',
      //     description: note,
      //     icon: 'information-circle'
      //   })),
      //   ...(teamData.transfer_news || []).map((transfer: any) => ({
      //     type: 'Transfer News',
      //     title: transfer.player,
      //     description: transfer.details,
      //     icon: 'swap-horizontal'
      //   })),
      //   ...(status.injuries || []).map(injury => ({
      //     type: 'Injury Update',
      //     title: injury.player,
      //     description: injury.status,
      //     icon: 'medical'
      //   })),
      //   ...(status.suspensions || []).map(suspension => ({
      //     type: 'Suspension',
      //     title: suspension.player,
      //     description: suspension.status,
      //     icon: 'warning'
      //   }))
      // ];

      // Always update the cached news
  //     await AsyncStorage.setItem('sunderlandLatestNews', JSON.stringify({
  //       news: sunderlandNews,
  //       timestamp: new Date().getTime()
  //     }));

  //     setLatestSunderlandNews(sunderlandNews);
  //   } catch (err) {
  //     console.error('Error fetching Sunderland news:', err);
      
  //     // Try to retrieve cached news if available
  //     try {
  //       const cachedNewsString = await AsyncStorage.getItem('sunderlandLatestNews');
  //       if (cachedNewsString) {
  //         const cachedNews = JSON.parse(cachedNewsString);
  //         setLatestSunderlandNews(cachedNews.news);
  //         return;
  //       }
  //     } catch (cacheErr) {
  //       console.error('Error retrieving cached news:', cacheErr);
  //     }

  //     // Fallback to static news if something goes wrong
  //     setLatestSunderlandNews([
  //       {
  //         type: 'Team Update',
  //         title: 'Sunderland AFC Status',
  //         description: 'Unable to fetch latest team status. Check back later.',
  //         icon: 'information-circle-outline'
  //       }
  //     ]);
  //   }
  // };

  // Method to clear AsyncStorage cache for Sunderland news
  const clearSunderlandNewsCache = async () => {
    try {
      await AsyncStorage.removeItem('sunderlandLatestNews');
      console.log('Sunderland news cache cleared');
      // Optionally, refetch news after clearing
      // await fetchSunderlandNews();
    } catch (err) {
      console.error('Error clearing Sunderland news cache:', err);
    }
  };

  useEffect(() => {
    fetchNews();
    // fetchSunderlandNews();
    // Uncomment the following line if you want to clear cache on component mount (for testing)
    // clearSunderlandNewsCache();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error fetching news: {error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e21d38" />
      </View>
    );
  }

  if (displayedNews.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No news articles found</Text>
      </View>
    );
  }

  const openArticle = (url: string) => {
    Linking.openURL(url);
  };

  const showAllNews = () => {
    setDisplayedNews(news);
  };

  return (
    <View style={styles.container}>
      {/* Cache Clearing Button */}
      {/* <TouchableOpacity 
        style={styles.cacheClearButton} 
        onPress={clearSunderlandNewsCache}
      >
        <Ionicons name="refresh-circle" size={24} color="#e21d38" />
        <Text style={styles.cacheClearButtonText}>Refresh News</Text>
      </TouchableOpacity> */}

    

      <FlatList
        data={displayedNews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openArticle(item.url)} style={styles.newsItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
            <View style={styles.newsTextContainer}>
              <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.newsDate}>
                {format(item.date, 'dd MMM yyyy')}
              </Text>
              <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          news.length > 5 && displayedNews.length < news.length ? (
            <Button title="Show All News" onPress={showAllNews} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  newsItem: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsTextContainer: {
    padding: 15,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 5,
  },
  newsDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  newsSummary: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  latestNewsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    maxHeight: 200,
    marginBottom: 10,
    overflow: 'hidden',
  },
  latestNewsCard: {
    borderRadius: 15,
    marginRight: 15,
    width: 320,
    height: 130,
    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  latestNewsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 10,
    height: '100%',
  },
  latestNewsTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 15,
  },
  latestNewsIcon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  latestNewsType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  latestNewsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  latestNewsDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    flexWrap: 'wrap',
    lineHeight: 16,
  },
  cacheClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    marginBottom: 10,
  },
  cacheClearButtonText: {
    fontSize: 16,
    color: '#e21d38',
    marginLeft: 10,
  },
});