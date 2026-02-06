import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types/post';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser } from '../utils/userUtils';
import { togglePostLike, addPostComment, subscribeToPost } from '../utils/postService';

interface PostDetailsModalProps {
  post: Post;
  visible: boolean;
  onClose: () => void;
}

export default function PostDetailsModal({ post: initialPost, visible, onClose }: PostDetailsModalProps) {
  const { user } = useAuth();
  const currentUser = getCurrentUser(user);
  
  const [post, setPost] = useState<Post>(initialPost);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Subscribe to real-time updates for this post
  useEffect(() => {
    if (!visible || !initialPost.id) return;

    const unsubscribe = subscribeToPost(initialPost.id, (updatedPost) => {
      if (updatedPost) {
        setPost(updatedPost);
      }
    });

    return () => unsubscribe();
  }, [visible, initialPost.id]);

  // Update local post when initialPost changes
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const isLiked = user ? post.likes.includes(user.uid) : false;

  const handleLike = async () => {
    if (!user) return;
    
    try {
      await togglePostLike(post.id, user.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like post');
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;

    try {
      setSubmittingComment(true);

      await addPostComment(
        post.id,
        user.uid,
        currentUser.userName,
        commentText
      );

      setCommentText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {/* Header with Close Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#e21d38" />
          </TouchableOpacity>
        </View>

        {/* Post Image */}
        {/* Image support removed for simplicity */}

        {/* Content Container */}
        <View style={styles.content}>
          {/* Post Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Post Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.authorContainer}>
              <Ionicons name="person-circle-outline" size={20} color="#666" />
              <Text style={styles.authorName}>{post.createdBy.userName}</Text>
            </View>
            <Text style={styles.date}>
              {format(new Date(post.createdAt), 'MMMM dd, yyyy • HH:mm')}
            </Text>
          </View>

          {/* Post Content */}
          <View style={styles.postContentContainer}>
            <Text style={styles.postContent}>{post.content}</Text>
          </View>

          {/* Likes & Stats */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#e21d38' : '#666'}
              />
              <Text style={[styles.likesText, isLiked && styles.likedText]}>
                {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.commentsStats}>
              <Ionicons name="chatbubbles-outline" size={20} color="#666" />
              <Text style={styles.commentsStatsText}>
                {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={20} color="#e21d38" />
              <Text style={styles.sectionTitle}>
                Comments ({post.comments.length})
              </Text>
            </View>
            
            {post.comments.length > 0 ? (
              <View style={styles.commentsContainer}>
                {post.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthor}>
                        <Ionicons name="person-circle" size={16} color="#666" />
                        <Text style={styles.commentUserName}>{comment.userName}</Text>
                      </View>
                      <Text style={styles.commentTimestamp}>
                        {format(comment.createdAt, 'MMM dd, HH:mm')}
                      </Text>
                    </View>
                    
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={32} color="#ccc" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubText}>Be the first to comment!</Text>
              </View>
            )}
          </View>

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                editable={!submittingComment}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendCommentButton,
                  !commentText.trim() && styles.sendCommentButtonDisabled
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submittingComment}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    maxHeight: '90%',
  },
  header: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    padding: 15,
  },
  closeButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
  },
  postImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  metaContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
  },
  postContentContainer: {
    marginBottom: 20,
  },
  postContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    fontWeight: '500',
  },
  likedText: {
    color: '#e21d38',
  },
  commentsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsStatsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  commentsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 5,
  },
  commentTimestamp: {
    fontSize: 13,
    color: '#999',
  },
  commentText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 10,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    fontWeight: '500',
  },
  noCommentsSubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  addCommentContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginRight: 10,
  },
  sendCommentButton: {
    backgroundColor: '#e21d38',
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendCommentButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
