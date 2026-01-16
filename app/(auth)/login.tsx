import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { saveCredentials, getStoredCredentials, clearStoredCredentials } from '../../utils/credentialStorage'

const LogoImage = require('../../assets/images/logo.jpg')

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  
  const { login, error } = useAuth()

  // Load stored credentials on component mount
  useEffect(() => {
    loadStoredCredentials()
  }, [])

  const loadStoredCredentials = async () => {
    try {
      const stored = await getStoredCredentials()
      if (stored && stored.rememberMe) {
        setEmail(stored.email)
        setRememberMe(stored.rememberMe)
      }
    } catch (error) {
      console.error('Error loading stored credentials:', error)
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      
      // Perform login
      await login(email.trim(), password)
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        await saveCredentials(email.trim(), true)
      } else {
        await clearStoredCredentials()
      }
      
      // Success - allow password managers to detect successful login
      console.log('Login successful - password managers should detect this')
      
      // Redirect to main app after successful login
      router.replace('/(tabs)')
      
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Bulgarian Sunderland</Text>
            <Text style={styles.subtitle}>Supporters Branch</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            
            {/* Form wrapper for better autofill detection */}
            <View style={styles.formWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  returnKeyType="next"
                  placeholderTextColor="#999"
                  importantForAutofill="yes"
                  nativeID="username"
                  onSubmitEditing={() => {
                    // Focus password field when email is submitted
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  placeholderTextColor="#999"
                  importantForAutofill="yes"
                  nativeID="password"
                  passwordRules="minlength: 6;"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {/* Remember Me Checkbox */}
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Ionicons
                  name={rememberMe ? "checkbox" : "checkbox-outline"}
                  size={20}
                  color="#e21d38"
                />
                <Text style={styles.rememberMeText}>Remember my credentials</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21d38',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  formWrapper: {
    width: '100%',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: '#e21d38',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  rememberMeText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#e21d38',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  signupText: {
    color: '#666',
    fontSize: 16,
  },
  signupLink: {
    color: '#e21d38',
    fontSize: 16,
    fontWeight: 'bold',
  },
})