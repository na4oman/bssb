import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser } from '../utils/userUtils';
import { createPost } from '../utils/postService';
import { COLORS, RADIUS, FONT, SHADOW } from '../constants/theme';

type PostFormProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function PostForm({ onClose, onSuccess }: PostFormProps) {
  const { user } = useAuth();
  const currentUser = getCurrentUser(user);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    try {
      setLoading(true);

      await createPost(
        title,
        content,
        user.uid,
        currentUser.userName
      );

      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !title.trim() || !content.trim()}
          style={[
            styles.submitButton,
            (loading || !title.trim() || !content.trim()) && styles.submitButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          placeholder="Post Title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          editable={!loading}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Write your post content here..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          editable={!loading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    maxHeight: '90%',
    ...SHADOW.heavy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: FONT.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.xl,
    minWidth: 70,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: FONT.size.md,
  },
  form: {
    padding: 15,
  },
  titleInput: {
    fontSize: FONT.size.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingVertical: 10,
    marginBottom: 20,
  },
  contentInput: {
    fontSize: FONT.size.md,
    color: COLORS.text,
    minHeight: 200,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
});
