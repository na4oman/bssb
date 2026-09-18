import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native'
import axios from 'axios'
import { footballDataApiKey } from '../../config/config'
import { footballDataGet } from '../../utils/footballDataService'
import { isWeb, maxWidthCard } from '../../utils/platformStyles'
import LoadingState from '../../components/LoadingState'

type TeamStats = {
  position: number
  team: {
    id: number
    name: string
    crest: string
  }
  playedGames: number
  form: string
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function TableScreen() {
  const [standings, setStandings] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        // EFL Championship league code
        const response = await footballDataGet('competitions/PL/standings', {
          headers: {
            'X-Auth-Token': footballDataApiKey,
          },
        })

        // Extract and process standings
        const processedStandings = response.data.standings[0].table.map(
          (team: TeamStats) => ({
            position: team.position,
            team: {
              id: team.team.id,
              name: team.team.name,
              crest: team.team.crest,
            },
            playedGames: team.playedGames,
            form: team.form,
            won: team.won,
            draw: team.draw,
            lost: team.lost,
            points: team.points,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            goalDifference: team.goalDifference,
          }),
        )

        setStandings(processedStandings)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching standings:', err)
        setError('Failed to fetch league standings')
        setLoading(false)
      }
    }

    fetchStandings()
  }, [])

  const renderTableHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.fixedHeaderColumn, isWeb && styles.fixedColumnWeb]}>
        <View style={styles.fixedHeaderRow}>
          <View style={styles.positionCell}>
            <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
              Pos
            </Text>
          </View>
          <View style={styles.teamLogoCell}>
            <Text
              style={[
                styles.headerText,
                { marginLeft: -15 },
                isWeb && styles.headerTextWeb,
              ]}
            >
              Logo
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.scrollableHeaderColumns}>
        <View
          style={[
            styles.teamNameCell,
            { minWidth: 140 },
            isWeb && styles.teamNameCellWeb,
          ]}
        >
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            Team
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            Pts
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            P
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            W
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            D
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            L
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            GF
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            GA
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.headerText, isWeb && styles.headerTextWeb]}>
            GD
          </Text>
        </View>
      </View>
    </View>
  )

  const renderTeamRow = ({
    item,
    index,
  }: {
    item: TeamStats
    index: number
  }) => (
    <View
      style={[
        styles.rowContainer,
        isWeb && index % 2 === 1 && styles.rowAlternateWeb,
      ]}
    >
      <View style={[styles.fixedColumn, isWeb && styles.fixedColumnWeb]}>
        <View style={styles.fixedColumnRow}>
          <View style={styles.positionCell}>
            <Text
              style={[
                styles.positionText,
                { paddingLeft: 10 },
                isWeb && styles.positionTextWeb,
              ]}
            >
              {item.position}
            </Text>
          </View>
          <View style={styles.teamLogoCell}>
            <Image
              source={{ uri: item.team.crest }}
              style={[styles.teamLogo, isWeb && styles.teamLogoWeb]}
              resizeMode='contain'
            />
          </View>
        </View>
      </View>
      <View style={styles.scrollableColumns}>
        <View
          style={[
            styles.teamNameCell,
            { minWidth: 140 },
            isWeb && styles.teamNameCellWeb,
          ]}
        >
          <Text
            style={[styles.teamNameText, isWeb && styles.teamNameTextWeb]}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {item.team.name}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text
            style={[
              styles.statText,
              styles.pointsText,
              isWeb && styles.statTextWeb,
            ]}
          >
            {item.points}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.playedGames}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.won}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.draw}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 30 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.lost}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.goalsFor}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.goalsAgainst}
          </Text>
        </View>
        <View style={[styles.statCell, { minWidth: 40 }]}>
          <Text style={[styles.statText, isWeb && styles.statTextWeb]}>
            {item.goalDifference}
          </Text>
        </View>
      </View>
    </View>
  )

  if (loading) {
    return <LoadingState text='Loading table...' />
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return isWeb ? (
    <View style={[styles.container, styles.containerWeb]}>
      {renderTableHeader()}
      <FlatList
        data={standings}
        keyExtractor={item => item.team.id.toString()}
        renderItem={renderTeamRow}
        contentContainerStyle={styles.tableContent}
      />
    </View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.container}>
        {renderTableHeader()}
        <FlatList
          data={standings}
          keyExtractor={item => item.team.id.toString()}
          renderItem={renderTeamRow}
          contentContainerStyle={styles.tableContent}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 10,
  },
  containerWeb: {
    ...maxWidthCard,
    width: '100%',
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
  fixedColumnWeb: {
    width: 84,
  },
  fixedHeaderRow: {
    flexDirection: 'row',
  },
  scrollableHeaderColumns: {
    flexDirection: 'row',
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 30,
  },
  rowAlternateWeb: {
    backgroundColor: '#f9f9f9',
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
    flex: 1,
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
  teamNameCellWeb: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 16,
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
  headerTextWeb: {
    fontSize: 13,
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
  teamLogoWeb: {
    width: 26,
    height: 26,
  },
  positionText: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  positionTextWeb: {
    fontSize: 13,
  },
  teamNameText: {
    color: '#333',
    fontSize: 11,
  },
  teamNameTextWeb: {
    fontSize: 14,
    fontWeight: '600',
  },
  statText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 11,
  },
  statTextWeb: {
    fontSize: 13,
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
})
