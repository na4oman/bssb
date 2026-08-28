import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTeamStats, updateTeamStats, PlayerScorer, PlayerAssist } from '../utils/statsService';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const createEmptyScorers = (): PlayerScorer[] => [
  { id: 1, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
  { id: 2, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
  { id: 3, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
  { id: 4, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
  { id: 5, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
];

const createEmptyAssists = (): PlayerAssist[] => [
  { id: 1, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
  { id: 2, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
  { id: 3, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
  { id: 4, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
  { id: 5, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
];

export default function StatsUpdateModal({ visible, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  // Top Scorers
  const [scorers, setScorers] = useState<PlayerScorer[]>([
    { id: 1, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
    { id: 2, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
    { id: 3, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
    { id: 4, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
    { id: 5, name: '', goals: 0, matches: 0, goalsPerMatch: 0 },
  ]);
  
  // Top Assists
  const [assists, setAssists] = useState<PlayerAssist[]>([
    { id: 1, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
    { id: 2, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
    { id: 3, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
    { id: 4, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
    { id: 5, name: '', assists: 0, matches: 0, assistsPerMatch: 0 },
  ]);

  // Load the current stats from Firestore whenever the modal opens so
  // admins always edit the latest data (not stale/empty defaults)
  useEffect(() => {
    if (!visible) return;

    let isActive = true;

    const loadCurrentStats = async () => {
      setFetching(true);
      try {
        const stats = await getTeamStats();
        if (!isActive) return;

        if (stats && (stats.scorers.length > 0 || stats.assists.length > 0)) {
          const loadedScorers = createEmptyScorers().map((scorer, index) =>
            stats.scorers[index]
              ? {
                  ...scorer,
                  ...stats.scorers[index],
                  goalsPerMatch:
                    stats.scorers[index].matches > 0
                      ? stats.scorers[index].goals / stats.scorers[index].matches
                      : 0,
                }
              : scorer,
          );
          const loadedAssists = createEmptyAssists().map((assist, index) =>
            stats.assists[index]
              ? {
                  ...assist,
                  ...stats.assists[index],
                  assistsPerMatch:
                    stats.assists[index].matches > 0
                      ? stats.assists[index].assists /
                        stats.assists[index].matches
                      : 0,
                }
              : assist,
          );
          setScorers(loadedScorers);
          setAssists(loadedAssists);
        } else {
          setScorers(createEmptyScorers());
          setAssists(createEmptyAssists());
        }
      } catch (error) {
        console.error('Error loading current stats into modal:', error);
        if (!isActive) return;
        setScorers(createEmptyScorers());
        setAssists(createEmptyAssists());
      } finally {
        if (isActive) setFetching(false);
      }
    };

    loadCurrentStats();

    return () => {
      isActive = false;
    };
  }, [visible]);

  const updateScorer = (index: number, field: keyof PlayerScorer, value: string | number) => {
    const newScorers = [...scorers];
    if (field === 'name') {
      newScorers[index].name = value as string;
    } else if (field === 'goals' || field === 'matches') {
      const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      newScorers[index][field] = numValue;
      // Recalculate goalsPerMatch
      newScorers[index].goalsPerMatch = 
        newScorers[index].matches > 0 
          ? newScorers[index].goals / newScorers[index].matches 
          : 0;
    }
    setScorers(newScorers);
  };

  const updateAssist = (index: number, field: keyof PlayerAssist, value: string | number) => {
    const newAssists = [...assists];
    if (field === 'name') {
      newAssists[index].name = value as string;
    } else if (field === 'assists' || field === 'matches') {
      const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      newAssists[index][field] = numValue;
      // Recalculate assistsPerMatch
      newAssists[index].assistsPerMatch = 
        newAssists[index].matches > 0 
          ? newAssists[index].assists / newAssists[index].matches 
          : 0;
    }
    setAssists(newAssists);
  };

  const handleSave = async () => {
    if (fetching) return;

    // Filter out empty entries
    const validScorers = scorers.filter(s => s.name.trim() !== '');
    const validAssists = assists.filter(a => a.name.trim() !== '');

    if (validScorers.length === 0 && validAssists.length === 0) {
      Alert.alert('Error', 'Please add at least one player');
      return;
    }

    setLoading(true);
    try {
      await updateTeamStats(validScorers, validAssists);
      Alert.alert('Success', 'Team stats updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Update Team Stats</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Top Scorers Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚽ Top Scorers</Text>
            {scorers.map((scorer, index) => (
              <View key={scorer.id} style={styles.playerRow}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Player Name"
                  value={scorer.name}
                  onChangeText={(text) => updateScorer(index, 'name', text)}
                />
                <TextInput
                  style={styles.statInput}
                  placeholder="G"
                  keyboardType="numeric"
                  value={scorer.goals > 0 ? scorer.goals.toString() : ''}
                  onChangeText={(text) => updateScorer(index, 'goals', text)}
                />
                <TextInput
                  style={styles.statInput}
                  placeholder="M"
                  keyboardType="numeric"
                  value={scorer.matches > 0 ? scorer.matches.toString() : ''}
                  onChangeText={(text) => updateScorer(index, 'matches', text)}
                />
              </View>
            ))}
          </View>

          {/* Top Assists Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Top Assists</Text>
            {assists.map((assist, index) => (
              <View key={assist.id} style={styles.playerRow}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Player Name"
                  value={assist.name}
                  onChangeText={(text) => updateAssist(index, 'name', text)}
                />
                <TextInput
                  style={styles.statInput}
                  placeholder="A"
                  keyboardType="numeric"
                  value={assist.assists > 0 ? assist.assists.toString() : ''}
                  onChangeText={(text) => updateAssist(index, 'assists', text)}
                />
                <TextInput
                  style={styles.statInput}
                  placeholder="M"
                  keyboardType="numeric"
                  value={assist.matches > 0 ? assist.matches.toString() : ''}
                  onChangeText={(text) => updateAssist(index, 'matches', text)}
                />
              </View>
            ))}
          </View>

          <View style={styles.legend}>
            <Text style={styles.legendText}>G = Goals, A = Assists, M = Matches</Text>
          </View>
        </ScrollView>

        {fetching && (
          <View style={styles.contentLoadingOverlay}>
            <ActivityIndicator size="large" color="#e21d38" />
            <Text style={styles.contentLoadingText}>
              Loading current stats...
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, (loading || fetching) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading || fetching}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Stats</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: 30,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 8,
  },
  statInput: {
    width: 50,
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 4,
    textAlign: 'center',
  },
  legend: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#e21d38',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.92)',
  },
  contentLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
