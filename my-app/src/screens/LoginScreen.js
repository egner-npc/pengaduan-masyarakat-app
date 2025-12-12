import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../services/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Login Gagal', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Aplikasi Pengaduan</Title>
            <Paragraph style={styles.subtitle}>
              Masuk ke akun Anda
            </Paragraph>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Belum punya akun?{' '}
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                compact
              >
                Daftar di sini
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>Fitur Aplikasi</Title>
            <Paragraph style={styles.infoText}>
              • Kirim pengaduan masyarakat{'\n'}
              • Pantau status pengaduan{'\n'}
              • Dapatkan tanggapan dari pemerintah{'\n'}
              • Laporkan masalah infrastruktur & lingkungan
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 18,
    color: '#2196F3',
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 20,
  },
});

export default LoginScreen;