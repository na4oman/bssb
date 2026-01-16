import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import axios from 'axios';
import { footballDataApiKey } from '../../config.json';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MatchHead2Head = {
  numberOfMatches: number;
  totalGoals: number;
  homeTeam: {
    wins: number;
    draws: number;
    losses: number;
  };
  awayTeam: {
    wins: number;
    draws: number;
    losses: number;
  };
};

type MatchReferee = {
  id: number;
  name: string;
  role: string;
  nationality: string;
};

type MatchScore = {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime: {
    home: number | null;
    away: number | null;
  };
  halfTime?: {
    home: number | null;
    away: number | null;
  };
  extraTime?: {
    home: number | null;
    away: number | null;
  };
  penalties?: {
    home: number | null;
    away: number | null;
  };
};

type FixtureMatch = {
  id: number;
  homeTeam: {
    id: number;
    name: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    crest: string;
  };
  status: string;
  utcDate: string;
  stage?: string;
  matchday?: number;
  score?: MatchScore;
  referees?: MatchReferee[];
  head2head?: MatchHead2Head;
};

export default function FixturesScreen(): React.ReactElement {
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [pastFixtures, setPastFixtures] = useState<FixtureMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch | null>(null);
  const [matchDetailsModalVisible, setMatchDetailsModalVisible] = useState(false);
  const [nextMatchCountdown, setNextMatchCountdown] = useState<string>('');
  const [nextMatchForm, setNextMatchForm] = useState<{
    homeTeam: string[];
    awayTeam: string[];
  } | null>(null);
  const [matchReminders, setMatchReminders] = useState<{ [key: number]: string }>({});

  // Countdown timer for next match
  useEffect(() => {
    if (fixtures.length === 0) return;

    const nextMatch = fixtures[0];
    const updateCountdown = () => {
      const now = new Date().getTime();
      const matchTime = new Date(nextMatch.utcDate).getTime();
      const distance = matchTime - now;

      if (distance < 0) {
        setNextMatchCountdown('Match started!');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setNextMatchCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setNextMatchCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setNextMatchCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [fixtures]);

  const fetchFixtures = useCallback(async () => {
    try {
      console.log('Fetching fixtures started');
      setLoading(true);
      setError(null);

      // EFL Championship league code
      const upcomingResponse = await axios.get('https://api.football-data.org/v4/competitions/PL/matches', {
        headers: {
          'X-Auth-Token': footballDataApiKey
        },
        params: {
          status: 'SCHEDULED',
          limit: 10
        }
      });

      const pastResponse = await axios.get('https://api.football-data.org/v4/competitions/PL/matches', {
        headers: {
          'X-Auth-Token': footballDataApiKey
        },
        params: {
          status: 'FINISHED',
          limit: 10
        }
      });

      // console.log('Upcoming Matches Raw Response:', JSON.stringify(upcomingResponse.data, null, 2));
      // console.log('Past Matches Raw Response:', JSON.stringify(pastResponse.data, null, 2));

      // Filter for Sunderland matches
      const sunderlandUpcomingFixtures = upcomingResponse.data.matches.filter((match: FixtureMatch) => 
        match.homeTeam.name.includes('Sunderland') || match.awayTeam.name.includes('Sunderland')
      );

      const sunderlandPastFixtures = pastResponse.data.matches
        .filter((match: FixtureMatch) => 
          match.homeTeam.name.includes('Sunderland') || match.awayTeam.name.includes('Sunderland')
        )
        .sort((a: FixtureMatch, b: FixtureMatch) => 
          new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
        );

      // console.log('Upcoming Fixtures:', sunderlandUpcomingFixtures.length);
      // console.log('Past Fixtures:', sunderlandPastFixtures.length);

      // Ensure we have data
      if (sunderlandUpcomingFixtures.length === 0 && sunderlandPastFixtures.length === 0) {
        setError('No Sunderland fixtures found');
      }

      setFixtures(sunderlandUpcomingFixtures);
      setPastFixtures(sunderlandPastFixtures);

      // Fetch form for next match
      if (sunderlandUpcomingFixtures.length > 0) {
        const nextMatch = sunderlandUpcomingFixtures[0];
        await fetchTeamsForm(nextMatch.homeTeam.id, nextMatch.awayTeam.id);
      }

      setLoading(false);
    } catch (err) {
      console.error('Full Error Object:', err);
      console.error('Error Response:', (err as any).response?.data);
      
      let errorMessage = 'Failed to fetch match fixtures';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // The request was made and the server responded with a status code
          errorMessage = `API Error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`;
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from server';
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const fetchTeamsForm = async (homeTeamId: number, awayTeamId: number) => {
    try {
      // Fetch last matches for both teams
      const [homeTeamMatches, awayTeamMatches] = await Promise.all([
        axios.get(`https://api.football-data.org/v4/teams/${homeTeamId}/matches`, {
          headers: { 'X-Auth-Token': footballDataApiKey },
          params: { status: 'FINISHED', limit: 5 }
        }),
        axios.get(`https://api.football-data.org/v4/teams/${awayTeamId}/matches`, {
          headers: { 'X-Auth-Token': footballDataApiKey },
          params: { status: 'FINISHED', limit: 5 }
        })
      ]);

      const homeForm = homeTeamMatches.data.matches.map((match: FixtureMatch) => {
        const isHome = match.homeTeam.id === homeTeamId;
        const teamScore = isHome ? match.score?.fullTime?.home : match.score?.fullTime?.away;
        const opponentScore = isHome ? match.score?.fullTime?.away : match.score?.fullTime?.home;

        if (teamScore === null || teamScore === undefined || opponentScore === null || opponentScore === undefined) return 'U';
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });

      const awayForm = awayTeamMatches.data.matches.map((match: FixtureMatch) => {
        const isHome = match.homeTeam.id === awayTeamId;
        const teamScore = isHome ? match.score?.fullTime?.home : match.score?.fullTime?.away;
        const opponentScore = isHome ? match.score?.fullTime?.away : match.score?.fullTime?.home;

        if (teamScore === null || teamScore === undefined || opponentScore === null || opponentScore === undefined) return 'U';
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });

      setNextMatchForm({
        homeTeam: homeForm,
        awayTeam: awayForm
      });
    } catch (err) {
      console.error('Error fetching teams form:', err);
    }
  };

  // Load saved reminders
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const saved = await AsyncStorage.getItem('matchReminders');
        if (saved) {
          setMatchReminders(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    };
    loadReminders();
  }, []);

  const scheduleMatchReminder = async (match: FixtureMatch) => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications to set reminders.');
        return;
      }

      const matchDate = new Date(match.utcDate);
      const now = new Date();

      // Check if match is in the past
      if (matchDate <= now) {
        Alert.alert('Invalid Time', 'Cannot set reminder for past matches.');
        return;
      }

      // Schedule notification 1 hour before match
      const reminderTime = new Date(matchDate.getTime() - 60 * 60 * 1000);

      // Calculate seconds until reminder
      const secondsUntilReminder = Math.max(
        10, // Minimum 10 seconds
        Math.floor((reminderTime.getTime() - now.getTime()) / 1000)
      );

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚽ Match Starting Soon!',
          body: `${match.homeTeam.name} vs ${match.awayTeam.name} starts in 1 hour!`,
          data: { matchId: match.id },
        },
        trigger: { seconds: secondsUntilReminder } as any,
      });

      // Save reminder
      const newReminders = { ...matchReminders, [match.id]: notificationId };
      setMatchReminders(newReminders);
      await AsyncStorage.setItem('matchReminders', JSON.stringify(newReminders));

      Alert.alert(
        'Reminder Set!',
        `You'll be notified 1 hour before ${match.homeTeam.name} vs ${match.awayTeam.name}`
      );
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      Alert.alert('Error', 'Failed to set reminder. Please try again.');
    }
  };

  const cancelMatchReminder = async (matchId: number) => {
    try {
      const notificationId = matchReminders[matchId];
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        
        const newReminders = { ...matchReminders };
        delete newReminders[matchId];
        setMatchReminders(newReminders);
        await AsyncStorage.setItem('matchReminders', JSON.stringify(newReminders));

        Alert.alert('Reminder Cancelled', 'Match reminder has been removed.');
      }
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      Alert.alert('Error', 'Failed to cancel reminder.');
    }
  };

  const toggleReminder = (match: FixtureMatch) => {
    if (matchReminders[match.id]) {
      cancelMatchReminder(match.id);
    } else {
      scheduleMatchReminder(match);
    }
  };

  const fetchMatchDetails = async (matchId: number): Promise<FixtureMatch | undefined> => {
    try {
      const response = await axios.get(`https://api.football-data.org/v4/matches/${matchId}`, {
        headers: {
          'X-Auth-Token': footballDataApiKey
        },
        params: {
          head2head: 10 // Fetch last 10 head-to-head matches
        }
      });
      return response.data;
    } catch (err) {
      console.error('Error fetching match details:', err);
      return undefined;
    }
  };

  const openMatchDetails = async (match: FixtureMatch) => {
    try {
      // Fetch additional match details for finished matches
      if (match.status === 'FINISHED') {
        const detailedMatch = await fetchMatchDetails(match.id);
        setSelectedMatch(detailedMatch || match);
      } else {
        setSelectedMatch(match);
      }
      setMatchDetailsModalVisible(true);
    } catch (err) {
      console.error('Error opening match details:', err);
    }
  };

  const renderFixtureItem = ({ item, isPast }: { item: FixtureMatch, isPast?: boolean }) => {
    const hasReminder = matchReminders[item.id];
    
    return (
      <View style={styles.fixtureItem}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.utcDate)}</Text>
          {!isPast && (
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => toggleReminder(item)}
            >
              <Ionicons
                name={hasReminder ? 'notifications' : 'notifications-outline'}
                size={20}
                color={hasReminder ? '#e21d38' : '#666'}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.matchContainer}>
          <View style={styles.teamContainer}>
            <Image 
              source={{ uri: item.homeTeam.crest }} 
              style={styles.teamLogo} 
              resizeMode="contain"
            />
            <Text style={styles.teamName}>
              {item.homeTeam.name}
            </Text>
          </View>
          <View style={styles.vsContainer}>
            {isPast ? (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {item.score?.fullTime?.home ?? '-'} - {item.score?.fullTime?.away ?? '-'}
                </Text>
              </View>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>
          <View style={styles.teamContainer}>
            <Image 
              source={{ uri: item.awayTeam.crest }} 
              style={styles.teamLogo} 
              resizeMode="contain"
            />
            <Text style={styles.teamName}>
              {item.awayTeam.name}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  const handleTabChange = useCallback((tab: 'upcoming' | 'past') => {
    console.log(`Tab change initiated: ${tab}`);
    if (isTabChanging) return;

    setIsTabChanging(true);
    
    // Use setTimeout to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      console.log(`Tab change completed: ${tab}`);
      setActiveTab(tab);
      setIsTabChanging(false);
    }, Platform.OS === 'android' ? 200 : 0);

    // Cleanup function to clear timeout
    return () => clearTimeout(timeoutId);
  }, [isTabChanging]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderFormBadge = (result: string) => {
    let backgroundColor = '#ccc';
    if (result === 'W') backgroundColor = '#4CAF50';
    if (result === 'L') backgroundColor = '#f44336';
    if (result === 'D') backgroundColor = '#FF9800';

    return (
      <View key={Math.random()} style={[styles.formBadge, { backgroundColor }]}>
        <Text style={styles.formBadgeText}>{result}</Text>
      </View>
    );
  };

  const renderNextMatchCountdown = () => {
    if (fixtures.length === 0 || activeTab !== 'upcoming') return null;

    const nextMatch = fixtures[0];
    const hasReminder = matchReminders[nextMatch.id];
    
    return (
      <View style={styles.countdownContainer}>
        <View style={styles.countdownHeader}>
          <Ionicons name="time-outline" size={24} color="#e21d38" />
          <Text style={styles.countdownTitle}>Next Match</Text>
          <TouchableOpacity
            style={styles.countdownReminderButton}
            onPress={() => toggleReminder(nextMatch)}
          >
            <Ionicons
              name={hasReminder ? 'notifications' : 'notifications-outline'}
              size={24}
              color={hasReminder ? '#e21d38' : '#666'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.countdownMatchInfo}>
          <View style={styles.countdownTeams}>
            <View style={styles.countdownTeamColumn}>
              <Image source={{ uri: nextMatch.homeTeam.crest }} style={styles.countdownLogo} />
              {nextMatchForm && nextMatchForm.homeTeam.length > 0 && (
                <View style={styles.teamFormBadges}>
                  {nextMatchForm.homeTeam.map((result, index) => (
                    <View key={index}>
                      {renderFormBadge(result)}
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.countdownVs}>vs</Text>
            <View style={styles.countdownTeamColumn}>
              <Image source={{ uri: nextMatch.awayTeam.crest }} style={styles.countdownLogo} />
              {nextMatchForm && nextMatchForm.awayTeam.length > 0 && (
                <View style={styles.teamFormBadges}>
                  {nextMatchForm.awayTeam.map((result, index) => (
                    <View key={index}>
                      {renderFormBadge(result)}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <Text style={styles.countdownTimer}>{nextMatchCountdown}</Text>
          <Text style={styles.countdownDate}>{formatDate(nextMatch.utcDate)}</Text>
        </View>
      </View>
    );
  };

  const renderMatchDetailsModal = () => {
    if (!selectedMatch) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={matchDetailsModalVisible}
        onRequestClose={() => setMatchDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Image 
                  source={{ uri: selectedMatch.homeTeam.crest }} 
                  style={styles.modalTeamLogo} 
                  resizeMode="contain"
                />
                <Text style={styles.modalMatchScore}>
                  {selectedMatch.score?.fullTime?.home ?? '-'} - {selectedMatch.score?.fullTime?.away ?? '-'}
                </Text>
                <Image 
                  source={{ uri: selectedMatch.awayTeam.crest }} 
                  style={styles.modalTeamLogo} 
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.modalTeamNames}>
                {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
              </Text>
              <View style={styles.matchDetailsContainer}>
                <Text style={styles.matchDetailsTitle}>Match Details</Text>
                <View style={styles.matchDetailRow}>
                  <Text style={styles.matchDetailLabel}>Date:</Text>
                  <Text style={styles.matchDetailValue}>{formatDate(selectedMatch.utcDate)}</Text>
                </View>
                <View style={styles.matchDetailRow}>
                  <Text style={styles.matchDetailLabel}>Status:</Text>
                  <Text style={styles.matchDetailValue}>{selectedMatch.status}</Text>
                </View>
                {selectedMatch.score && (
                  <View style={styles.matchDetailRow}>
                    <Text style={styles.matchDetailLabel}>Score:</Text>
                    <Text style={styles.matchDetailValue}>
                      {selectedMatch.score.fullTime.home} - {selectedMatch.score.fullTime.away}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#e21d38" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchFixtures} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentFixtures = activeTab === 'upcoming' ? fixtures : pastFixtures;
  // Skip first match in upcoming tab since it's shown in the Next Match card
  const listFixtures = activeTab === 'upcoming' && currentFixtures.length > 0 
    ? currentFixtures.slice(1) 
    : currentFixtures;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'upcoming' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('upcoming')}
            disabled={isTabChanging}
          >
            <Text style={[
              styles.tabButtonText, 
              activeTab === 'upcoming' && styles.activeTabButtonText
            ]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'past' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('past')}
            disabled={isTabChanging}
          >
            <Text style={[
              styles.tabButtonText, 
              activeTab === 'past' && styles.activeTabButtonText
            ]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {currentFixtures.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {activeTab === 'upcoming' 
                ? 'No upcoming fixtures found' 
                : 'No past fixtures available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={listFixtures}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderFixtureItem({ 
              item, 
              isPast: activeTab === 'past' 
            })}
            ListHeaderComponent={activeTab === 'upcoming' ? renderNextMatchCountdown : null}
            contentContainerStyle={styles.listContainer}
          />
        )}
        {renderMatchDetailsModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#e21d38',
  },
  tabButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  fixtureItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  reminderButton: {
    padding: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  teamName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 10,
  },
  vsText: {
    color: '#666',
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: '#e21d38',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  statusText: {
    color: '#666',
    fontSize: 11,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#e21d38',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
  countdownContainer: {
    backgroundColor: 'white',
    marginHorizontal: 0,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  countdownReminderButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  countdownMatchInfo: {
    alignItems: 'center',
  },
  countdownTeams: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 15,
    width: '100%',
  },
  countdownTeamColumn: {
    alignItems: 'center',
    flex: 1,
  },
  countdownLogo: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  teamFormBadges: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  countdownVs: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 15,
    marginTop: 15,
  },
  countdownTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 5,
  },
  countdownDate: {
    fontSize: 14,
    color: '#666',
  },
  formBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 30,
  },
  modalTeamLogo: {
    width: 30,
    height: 30,
  },
  modalMatchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  modalTeamNames: {
    fontSize: 16,
    marginBottom: 10,
  },
  matchDetailsContainer: {
    marginTop: 10,
  },
  matchDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  matchDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  matchDetailValue: {
    fontSize: 14,
    color: '#333',
  },
});
