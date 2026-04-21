import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebaseConfig';

export default function Login({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    try {
      if (isRegistering) {
        if (!name) return setError("Please provide your full name");
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        await fetch('http://10.0.2.2:5000/api/user/sync', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firebaseUid: creds.user.uid,
                email: creds.user.email,
                name: name,
                role: 'DRIVER'
            })
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/driver-bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
            
            <View style={styles.heroSection}>
              <Text style={styles.heroText}>Drive.{'\n'}Earn.{'\n'}<Text style={{color: '#4f46e5'}}>Grow.</Text></Text>
              <Text style={styles.heroSubText}>Join thousands of drivers{'\n'}and unlock your potential</Text>
              
              <View style={styles.featuresRow}>
                 <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}><Text style={{fontSize: 16}}>🛡️</Text></View>
                    <Text style={styles.featureTitle}>Safe & Secure</Text>
                 </View>
                 <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}><Text style={{fontSize: 16}}>💸</Text></View>
                    <Text style={styles.featureTitle}>Great Earnings</Text>
                 </View>
                 <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}><Text style={{fontSize: 16}}>⏰</Text></View>
                    <Text style={styles.featureTitle}>24/7 Support</Text>
                 </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.iconWrapper}>
                 <View style={styles.iconContainer}>
                     <Text style={{fontSize: 28}}>🚘</Text>
                 </View>
              </View>
              <Text style={styles.title}>Welcome Back, <Text style={{color: '#4f46e5'}}>Driver!</Text></Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              {isRegistering && (
                 <TextInput
                   style={styles.input}
                   placeholder="Full Name"
                   placeholderTextColor="#64748b"
                   value={name}
                   onChangeText={setName}
                 />
              )}

              <TextInput
                style={styles.input}
                placeholder="Email or Phone Number"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              
              {!isRegistering && (
                 <View style={styles.rowBetween}>
                   <Text style={styles.rememberText}>Remember me</Text>
                   <Text style={styles.forgotText}>Forgot Password?</Text>
                 </View>
              )}

              <TouchableOpacity style={styles.button} onPress={handleAuth} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{isRegistering ? 'Register Now' : 'Sign In'}</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                 <View style={styles.divider}></View>
                 <Text style={styles.dividerText}>or continue with</Text>
                 <View style={styles.divider}></View>
              </View>

              <View style={styles.socialRow}>
                 <TouchableOpacity style={styles.socialBtn}>
                     <Text style={styles.socialBtnText}>Google</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.socialBtn}>
                     <Text style={styles.socialBtnText}>Facebook</Text>
                 </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                <Text style={styles.switchText}>
                  {isRegistering ? 'Already have an account? Sign In' : "New here? Register Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 50,
  },
  heroSection: {
    width: '90%',
    marginBottom: 30,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  heroText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 56,
    marginBottom: 16,
  },
  heroSubText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: 'rgba(17, 21, 32, 0.95)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8b9bb4',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontWeight: '500',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  rememberText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  forgotText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4f46e5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: 13,
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialBtn: {
    flex: 0.48,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  switchText: {
    color: '#3b82f6',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 85, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 85, 0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  error: {
    color: '#ff0055',
    textAlign: 'center',
    fontWeight: '700',
  }
});


