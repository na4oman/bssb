import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Button,
  ScrollView,
} from 'react-native'
import { format, differenceInDays } from 'date-fns'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import Constants from 'expo-constants'
import { newsApiKey } from '../../config/config'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS, SHADOW } from '../../constants/theme'
import { Ionicons } from '@expo/vector-icons'
import { isWeb, maxWidthContent } from '../../utils/platformStyles'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import SkeletonList from '../../components/SkeletonList'

type NewsItem = {
  id: string
  title: string
  date: Date
  imageUrl: string
  summary: string
  url: string
}

interface NewsCardProps {
  item: NewsItem
  onPress: () => void
}

const NewsCard: React.FC<NewsCardProps> = ({ item, onPress }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <TouchableOpacity
      onPress={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        styles.newsItem,
        isWeb && styles.newsItemWeb,
        isWeb && hovered && styles.newsItemHovered,
      ]}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={[styles.newsImage, isWeb && styles.newsImageWeb]}
      />
      <View
        style={[
          styles.newsTextContainer,
          isWeb && styles.newsTextContainerWeb,
        ]}
      >
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.newsDate}>{format(item.date, 'dd MMM yyyy')}</Text>
        <Text style={styles.newsSummary} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

interface MatchResult {
  opponent: string
  score: string
  highlights: string
  date?: string
}

type LatestSunderlandNewsItem = {
  type: string
  title: string
  description: string
  icon: string
}

type SunderlandTeamStatus = {
  previous_match?: {
    opponent: string
    date: string
    result: string
  }
  next_match?: {
    opponent: string
    date: string
    time: string
    competition: string
    venue?: string
  }
  injuries?: Array<{
    player: string
    status: string
  }>
  suspensions?: Array<{
    player: string
    status: string
  }>
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestSunderlandNews, setLatestSunderlandNews] = useState<
    LatestSunderlandNewsItem[]
  >([])
  const [teamStatus, setTeamStatus] = useState<SunderlandTeamStatus>({})

  const fetchNews = async () => {
    try {
      const apiKey = newsApiKey

      if (!apiKey) {
        throw new Error('No API key found in configuration')
      }

      setLoading(true)
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=Sunderland+AFC+football+club&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`,
        {
          timeout: 10000, // 10 seconds timeout
        },
      )

      const newsData = response.data.articles.map((article: any) => ({
        id: article.url, // Use URL as unique identifier
        title: article.title || 'Untitled Article',
        date: new Date(article.publishedAt || Date.now()),
        imageUrl:
          article.urlToImage ||
          'https://via.placeholder.com/300x200.png?text=SAFC+News',
        summary: article.description || 'No summary available',
        url: article.url,
      }))

      setNews(newsData)
      setDisplayedNews(newsData.slice(0, 5))
      setError(null)
    } catch (error) {
      console.error('News Fetching Error:', error)

      if (axios.isAxiosError(error)) {
        console.error('Detailed Axios Error:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          message: error.message,
        })
      }

      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      )
      setNews([])
      setDisplayedNews([])
    } finally {
      setLoading(false)
    }
  }

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
      await AsyncStorage.removeItem('sunderlandLatestNews')
      console.log('Sunderland news cache cleared')
      // Optionally, refetch news after clearing
      // await fetchSunderlandNews();
    } catch (err) {
      console.error('Error clearing Sunderland news cache:', err)
    }
  }

  useEffect(() => {
    fetchNews()
    // fetchSunderlandNews();
    // Uncomment the following line if you want to clear cache on component mount (for testing)
    // clearSunderlandNewsCache();
  }, [])

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error fetching news: {error}</Text>
      </View>
    )
  }

  if (loading) {
    return isWeb ? (
      <SkeletonList count={3} />
    ) : (
      <LoadingState text='Loading news...' />
    )
  }

  if (displayedNews.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon='newspaper-outline'
          title='No news articles found'
          subtitle='Check back later for updates'
        />
      </View>
    )
  }

  const openArticle = (url: string) => {
    Linking.openURL(url)
  }

  const showAllNews = () => {
    setDisplayedNews(news)
  }

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
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.newsListContent,
          isWeb && styles.newsListContentWeb,
        ]}
        renderItem={({ item }) => (
          <NewsCard item={item} onPress={() => openArticle(item.url)} />
        )}
        ListFooterComponent={
          news.length > 5 && displayedNews.length < news.length ? (
            <Button title='Show All News' onPress={showAllNews} />
          ) : null
        }
      />
    </View>
  )
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
    shadowColor: '#182230',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  newsItemWeb: {
    flexDirection: 'row',
    maxWidth: 920,
    width: '100%',
    marginHorizontal: 'auto',
    minHeight: 150,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  newsItemHovered: {
    shadowColor: '#182230',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    transform: [{ translateY: -2 }],
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsListContent: {
    paddingBottom: 24,
  },
  newsListContentWeb: {
    ...maxWidthContent,
    width: '100%',
    paddingVertical: 24,
  },
  newsImageWeb: {
    width: 220,
    height: 150,
  },
  newsTextContainer: {
    padding: 15,
  },
  newsTextContainerWeb: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    ...SHADOW.card,
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
    backgroundColor: COLORS.card,
    borderRadius: 10,
    ...SHADOW.card,
    marginBottom: 10,
  },
  cacheClearButtonText: {
    fontSize: 16,
    color: '#e21d38',
    marginLeft: 10,
  },
})
