import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  SafeAreaView
} from 'react-native';
import axios from 'axios';
import { footballDataApiKey } from '../../config.json';
import { Ionicons } from '@expo/vector-icons';

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

  const fetchFixtures = useCallback(async () => {
    try {
      console.log('Fetching fixtures started');
      setLoading(true);
      setError(null);

      // EFL Championship league code
      const upcomingResponse = await axios.get('https://api.football-data.org/v4/competitions/ELC/matches', {
        headers: {
          'X-Auth-Token': footballDataApiKey
        },
        params: {
          status: 'SCHEDULED',
          limit: 10
        }
      });

      const pastResponse = await axios.get('https://api.football-data.org/v4/competitions/ELC/matches', {
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
    return (
      <View 
        style={styles.fixtureItem}
        // onPress={() => openMatchDetails(item)}
      >
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.utcDate)}</Text>
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
            data={currentFixtures}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderFixtureItem({ 
              item, 
              isPast: activeTab === 'past' 
            })}
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
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
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
