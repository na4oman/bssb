import { User } from 'firebase/auth'

export const getCurrentUser = (user: User | null) => {
  if (!user) {
    return {
      userId: 'anonymous',
      userName: 'Anonymous User',
    }
  }

  return {
    userId: user.uid,
    userName: user.displayName || user.email || 'User',
  }
}