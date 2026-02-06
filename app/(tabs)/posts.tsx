import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUser } from '../../utils/userUtils';
import { Post } from '../../types/post';
import {
  subscribeToPosts,
  togglePostLike,
  deletePost,
  checkIsAdmin,
} from '../../utils/postService';
import { format } from 'date-fns';
import Modal from 'react-native-modal';
import PostForm from '../../components/PostForm';
import PostDetailsModal from '../../components/PostDetailsModal';

export default function PostsScreen() {
  const { user } = useAuth();
  const currentUser = getCurrentUser(user);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostDetails, setShowPostDetails] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkIsAdmin(user.uid).then(setIsAdmin);
    }
  }, [user]);

  // Subscribe to posts
  useEffect(() => {
    const unsubscribe = subscribeToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      await togglePostLike(postId, user.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like post');
    }
  };

  const handleDeletePost = (post: Post) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${post.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await deletePost(post.id, user.uid);
                Alert.alert('Success', 'Post deleted successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handlePostPress = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetails(true);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = user ? item.likes.includes(user.uid) : false;
    const isOwnPost = user ? item.createdBy.userId === user.uid : false;

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          
          <View style={styles.postMeta}>
            <Ionicons name="person-circle-outline" size={16} color="#666" />
            <Text style={styles.postAuthor}>{item.createdBy.userName}</Text>
            <Text style={styles.postDot}>•</Text>
            <Text style={styles.postDate}>
              {format(item.createdAt, 'MMM dd, yyyy')}
            </Text>
          </View>

          <Text style={styles.postExcerpt} numberOfLines={3}>
            {item.content}
          </Text>

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#e21d38' : '#666'}
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {item.likes.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePostPress(item)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.actionText}>{item.comments.length}</Text>
            </TouchableOpacity>

            {isAdmin && isOwnPost && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeletePost(item)}
              >
                <Ionicons name="trash-outline" size={20} color="#e21d38" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e21d38" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e21d38']}
            tintColor="#e21d38"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              {isAdmin
                ? 'Be the first to create a post!'
                : 'Check back later for updates'}
            </Text>
          </View>
        }
      />

      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowPostForm(true)}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Post Form Modal */}
      <Modal
        isVisible={showPostForm}
        onBackdropPress={() => setShowPostForm(false)}
        onSwipeComplete={() => setShowPostForm(false)}
        swipeDirection="down"
        style={styles.modal}
      >
        <PostForm
          onClose={() => setShowPostForm(false)}
          onSuccess={() => {
            setShowPostForm(false);
            Alert.alert('Success', 'Post created successfully!');
          }}
        />
      </Modal>

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          visible={showPostDetails}
          onClose={() => {
            setShowPostDetails(false);
            setSelectedPost(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  postContent: {
    padding: 15,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthor: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  postDot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  postDate: {
    fontSize: 14,
    color: '#666',
  },
  postExcerpt: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  likedText: {
    color: '#e21d38',
  },
  deleteButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e21d38',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
});
