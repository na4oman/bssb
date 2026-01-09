import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { footballDataApiKey } from '../../config.json';

type TeamStats = {
  position: number;
  team: {
    id: number;
    name: string;
    crest: string;
  };
  playedGames: number;
  form: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TableScreen() {
  const [standings, setStandings] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        // EFL Championship league code
        const response = await axios.get('https://api.football-data.org/v4/competitions/PL/standings', {
          headers: {
            'X-Auth-Token': footballDataApiKey
          }
        });

        // Extract and process standings
        const processedStandings = response.data.standings[0].table.map((team: TeamStats) => ({
          position: team.position,
          team: {
            id: team.team.id,
            name: team.team.name,
            crest: team.team.crest
          },
          playedGames: team.playedGames,
          form: team.form,
          won: team.won,
          draw: team.draw,
          lost: team.lost,
          points: team.points,
          goalsFor: team.goalsFor,
          goalsAgainst: team.goalsAgainst,
          goalDifference: team.goalDifference
        }));

        setStandings(processedStandings);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setError('Failed to fetch league standings');
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  const renderTableHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.fixedHeaderColumn}>
        <View style={styles.fixedHeaderRow}>
          <View style={styles.positionCell}>
            <Text style={styles.headerText}>Pos</Text>
          </View>
          <View style={styles.teamLogoCell}>
            <Text style={[styles.headerText, { marginLeft: -15 }]}>Logo</Text>
          </View>
        </View>
      </View>
      <View style={styles.scrollableHeaderColumns}>
        <View style={[styles.teamNameCell, { minWidth: 140 }]}>
          <Text style={styles.headerText}>Team</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.headerText}>Pts</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.headerText}>P</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.headerText}>W</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.headerText}>D</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.headerText}>L</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.headerText}>GF</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.headerText}>GA</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.headerText}>GD</Text>
        </View>
      </View>
    </View>
  );

  const renderTeamRow = ({ item }: { item: TeamStats }) => (
    <View style={styles.rowContainer}>
      <View style={styles.fixedColumn}>
        <View style={styles.fixedColumnRow}>
          <View style={styles.positionCell}>
            <Text style={[styles.positionText, { paddingLeft: 10 }]}>{item.position}</Text>
          </View>
          <View style={styles.teamLogoCell}>
            <Image 
              source={{ uri: item.team.crest }} 
              style={styles.teamLogo} 
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
      <View style={styles.scrollableColumns}>
        <View style={[styles.teamNameCell, { minWidth: 140 }]}>
          <Text style={styles.teamNameText} numberOfLines={1} ellipsizeMode="tail">
            {item.team.name}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.statText, styles.pointsText]}>{item.points}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.statText}>{item.playedGames}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.statText}>{item.won}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.statText}>{item.draw}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={styles.statText}>{item.lost}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.statText}>{item.goalsFor}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.statText}>{item.goalsAgainst}</Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={styles.statText}>{item.goalDifference}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e21d38" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.container}>
        {renderTableHeader()}
        <FlatList
          data={standings}
          keyExtractor={(item) => item.team.id.toString()}
          renderItem={renderTeamRow}
          contentContainerStyle={styles.tableContent}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#e21d38',
  },
  fixedHeaderColumn: {
    flexDirection: 'row',
    borderRightWidth: 1,
    borderRightColor: 'white',
    width: 60,
  },
  fixedHeaderRow: {
    flexDirection: 'row',
  },
  scrollableHeaderColumns: {
    flexDirection: 'row',
  },
  rowContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 30,
  },
  fixedColumn: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedColumnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  scrollableColumns: {
    flexDirection: 'row',
  },
  positionCell: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 2,
  },
  teamNameCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 11,
  },
  teamLogoCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  teamLogo: {
    width: 20,
    height: 20,
  },
  positionText: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  teamNameText: {
    color: '#333',
    fontSize: 11,
  },
  statText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 11,
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableContent: {
    paddingBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },
});