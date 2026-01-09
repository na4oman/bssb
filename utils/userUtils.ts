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

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Anonymous User'
  return user.displayName || user.email?.split('@')[0] || 'User'
}

export const getUserInitials = (user: User | null): string => {
  const displayName = getUserDisplayName(user)
  return displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}