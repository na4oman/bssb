import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { deleteAccount } from '../utils/accountDeletionService'
import {
  getSecureCredentials,
  SecureCredentials,
} from '../utils/secureCredentialStorage'
import { isWeb } from '../utils/platformStyles'

type Props = {
  visible: boolean
  onClose: () => void
  onDeleted: () => void
}

/**
 * Cross-platform confirmation dialog for permanent account deletion.
 * On mobile, "Remember me" keychain credentials re-authenticate silently
 * (no password prompt). On web, or when stored credentials are stale,
 * the user must enter their password.
 */
const DeleteAccountModal = ({ visible, onClose, onDeleted }: Props) => {
  const [password, setPassword] = useState('')
  const [storedCreds, setStoredCreds] = useState<SecureCredentials | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setPassword('')
      setError(null)
      setStoredCreds(null)
      if (Platform.OS !== 'web') {
        getSecureCredentials().then(setStoredCreds)
      }
    }
  }, [visible])

  if (!visible) return null

  const needsPassword = !storedCreds

  const handleDelete = async () => {
    if (needsPassword && !password.trim()) {
      setError('Please enter your password to confirm')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await deleteAccount(password.trim() || undefined)
      onDeleted()
    } catch (e: any) {
      const code = e?.code || ''

      // Stored keychain credentials were stale — reveal the password field
      if (storedCreds && code) {
        setStoredCreds(null)
        setError(
          'Stored credentials are out of date. Enter your password to continue.',
        )
        setLoading(false)
        return
      }

      if (code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (code === 'auth/requires-recent-login') {
        setError(
          'Your session has expired. Please log out and log in again, then retry.',
        )
      } else {
        setError(e?.message || 'Failed to delete account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.overlay, isWeb && styles.overlayWeb]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name='warning' size={28} color='#e21d38' />
          <Text style={styles.title}>Delete Account</Text>
        </View>

        <Text style={styles.body}>
          This will permanently delete your account, profile, events, posts,
          notifications and all associated data. This action cannot be undone.
        </Text>

        {needsPassword ? (
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder='Enter your password to confirm'
            placeholderTextColor='#999'
            secureTextEntry
            autoCapitalize='none'
            autoFocus={isWeb}
          />
        ) : (
          <View style={styles.storedBox}>
            <Ionicons name='key-outline' size={16} color='#666' />
            <Text style={styles.storedText}>
              Your saved credentials will confirm this action.
            </Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelBtn]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.deleteBtn,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Text style={styles.deleteText}>Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default DeleteAccountModal

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  overlayWeb: {
    position: 'fixed' as any,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e21d38',
    marginLeft: 10,
  },
  body: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  storedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  storedText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  error: {
    color: '#e21d38',
    fontSize: 13,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#e21d38',
  },
  deleteText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})