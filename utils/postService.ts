import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post, PostComment } from '../types/post';

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';

// Check if user is admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Create a new post
export const createPost = async (
  title: string,
  content: string,
  userId: string,
  userName: string
): Promise<string> => {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      throw new Error('Only admins can create posts');
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      createdBy: {
        userId,
        userName,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      likes: [],
      comments: [],
    };

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Subscribe to posts
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        likes: data.likes || [],
        comments: (data.comments || []).map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt?.toDate() || new Date(),
        })),
      };
    });
    callback(posts);
  });
};

// Subscribe to a single post for real-time updates
export const subscribeToPost = (postId: string, callback: (post: Post | null) => void) => {
  const postRef = doc(db, POSTS_COLLECTION, postId);

  return onSnapshot(postRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.data();
    const post: Post = {
      id: snapshot.id,
      title: data.title,
      content: data.content,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      likes: data.likes || [],
      comments: (data.comments || []).map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt?.toDate() || new Date(),
      })),
    };
    callback(post);
  });
};

// Toggle like on post
export const togglePostLike = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const postData = postDoc.data();
    const likes = postData.likes || [];
    
    if (likes.includes(userId)) {
      await updateDoc(postRef, {
        likes: arrayRemove(userId),
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(userId),
      });
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

// Add comment to post
export const addPostComment = async (
  postId: string,
  userId: string,
  userName: string,
  text: string
) => {
  try {
    const comment: any = {
      id: Date.now().toString(),
      userId,
      userName,
      text: text.trim(),
      createdAt: Timestamp.now(),
    };

    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      comments: arrayUnion(comment),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Delete post (admin only)
export const deletePost = async (postId: string, userId: string) => {
  try {
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      throw new Error('Only admins can delete posts');
    }

    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Update post (admin only)
export const updatePost = async (
  postId: string,
  userId: string,
  title: string,
  content: string
) => {
  try {
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      throw new Error('Only admins can update posts');
    }

    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      title: title.trim(),
      content: content.trim(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};
