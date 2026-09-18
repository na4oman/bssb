import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentUser } from '../../utils/userUtils'
import { Post } from '../../types/post'
import {
  subscribeToPosts,
  togglePostLike,
  deletePost,
  checkIsAdmin,
} from '../../utils/postService'
import { format } from 'date-fns'
import Modal from 'react-native-modal'
import PostForm from '../../components/PostForm'
import PostDetailsModal from '../../components/PostDetailsModal'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import SkeletonList from '../../components/SkeletonList'
import { isWeb, maxWidthContent, maxWidthCard } from '../../utils/platformStyles'
import { COLORS, RADIUS, SHADOW, FONT } from '../../constants/theme'

interface PostCardProps {
  item: Post
  isLiked: boolean
  isOwnPost: boolean
  isAdmin: boolean
  onPress: () => void
  onLike: () => void
  onDelete: () => void
}

const PostCard: React.FC<PostCardProps> = ({
  item,
  isLiked,
  isOwnPost,
  isAdmin,
  onPress,
  onLike,
  onDelete,
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <TouchableOpacity
      style={[
        styles.postCard,
        isWeb && styles.postCardWeb,
        isWeb && hovered && styles.postCardHovered,
      ]}
      onPress={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      activeOpacity={0.8}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.postImage, isWeb && styles.postImageWeb]}
          resizeMode='cover'
        />
      )}

      <View style={[styles.postContent, isWeb && styles.postContentWeb]}>
        <Text style={styles.postTitle}>{item.title}</Text>

        <View style={styles.postMeta}>
          <Ionicons name='person-circle-outline' size={16} color={COLORS.textSecondary} />
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
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {item.likes.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Ionicons
              name='chatbubble-outline'
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.actionText}>{item.comments.length}</Text>
          </TouchableOpacity>

          {isAdmin && isOwnPost && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Ionicons name='trash-outline' size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function PostsScreen() {
  const { user } = useAuth()
  const currentUser = getCurrentUser(user)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showPostDetails, setShowPostDetails] = useState(false)
  const [fabHovered, setFabHovered] = useState(false)
  const [newPostBtnHovered, setNewPostBtnHovered] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkIsAdmin(user.uid).then(setIsAdmin)
    }
  }, [user])

  // Subscribe to posts
  useEffect(() => {
    const unsubscribe = subscribeToPosts(fetchedPosts => {
      setPosts(fetchedPosts)
      setLoading(false)
      setRefreshing(false)
    })

    return () => unsubscribe()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
  }

  const handleLike = async (postId: string) => {
    if (!user) return

    try {
      await togglePostLike(postId, user.uid)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like post')
    }
  }

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
                await deletePost(post.id, user.uid)
                Alert.alert('Success', 'Post deleted successfully')
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post')
            }
          },
        },
      ],
    )
  }

  const handlePostPress = (post: Post) => {
    setSelectedPost(post)
    setShowPostDetails(true)
  }

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = user ? item.likes.includes(user.uid) : false
    const isOwnPost = user ? item.createdBy.userId === user.uid : false

    return (
      <PostCard
        item={item}
        isLiked={isLiked}
        isOwnPost={isOwnPost}
        isAdmin={isAdmin}
        onPress={() => handlePostPress(item)}
        onLike={() => handleLike(item.id)}
        onDelete={() => handleDeletePost(item)}
      />
    )
  }

  if (loading) {
    return isWeb ? (
      <SkeletonList count={3} />
    ) : (
      <LoadingState text='Loading posts...' />
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.listContentWeb,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e21d38']}
            tintColor='#e21d38'
          />
        }
        ListHeaderComponent={
          isWeb && isAdmin ? (
            <TouchableOpacity
              style={[
                styles.newPostInlineBtn,
                newPostBtnHovered && styles.newPostInlineBtnHovered,
              ]}
              onPress={() => setShowPostForm(true)}
              onMouseEnter={() => setNewPostBtnHovered(true)}
              onMouseLeave={() => setNewPostBtnHovered(false)}
            >
              <Ionicons name='add-circle-outline' size={22} color={COLORS.primary} />
              <Text style={styles.newPostInlineBtnText}>New Post</Text>
            </TouchableOpacity>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon='newspaper-outline'
            title='No posts yet'
            subtitle={
              isAdmin
                ? 'Be the first to create a post!'
                : 'Check back later for updates'
            }
          />
        }
      />

      {isAdmin && !isWeb && (
        <TouchableOpacity
          style={[styles.fab, fabHovered && styles.fabHovered]}
          onPress={() => setShowPostForm(true)}
          onMouseEnter={() => setFabHovered(true)}
          onMouseLeave={() => setFabHovered(false)}
        >
          <Ionicons name='add' size={28} color='white' />
        </TouchableOpacity>
      )}

      {/* Post Form Modal */}
      <Modal
        isVisible={showPostForm}
        onBackdropPress={() => setShowPostForm(false)}
        onSwipeComplete={() => setShowPostForm(false)}
        swipeDirection={isWeb ? undefined : 'down'}
        style={[styles.modal, isWeb && styles.modalWeb]}
        animationIn='slideInUp'
        animationOut='slideOutDown'
      >
        <PostForm
          onClose={() => setShowPostForm(false)}
          onSuccess={() => {
            setShowPostForm(false)
            Alert.alert('Success', 'Post created successfully!')
          }}
        />
      </Modal>

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          visible={showPostDetails}
          onClose={() => {
            setShowPostDetails(false)
            setSelectedPost(null)
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 15,
  },
  listContentWeb: {
    ...maxWidthContent,
    width: '100%',
    paddingVertical: 24,
  },
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginBottom: 15,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  postCardWeb: {
    ...maxWidthCard,
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    borderRadius: 14,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  postCardHovered: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    transform: [{ translateY: -2 }],
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postImageWeb: {
    width: 220,
    height: '100%',
    minHeight: 180,
    alignSelf: 'stretch',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  postContent: {
    padding: 15,
  },
  postContentWeb: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  postTitle: {
    fontSize: FONT.size.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthor: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  postDot: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  postDate: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
  },
  postExcerpt: {
    fontSize: FONT.size.base,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  likedText: {
    color: COLORS.primary,
  },
  deleteButton: {
    marginLeft: 'auto',
    marginRight: 0,
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
    transition: 'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
  },
  fabHovered: {
    backgroundColor: '#c0142e',
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  newPostInlineBtn: {
    ...maxWidthCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    transition:
      'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  },
  newPostInlineBtnHovered: {
    backgroundColor: '#fff',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  newPostInlineBtnText: {
    fontSize: FONT.size.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalWeb: {
    justifyContent: 'center',
  },
})
