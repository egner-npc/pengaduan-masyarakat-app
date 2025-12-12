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
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../services/auth';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    telepon: '',
    alamat: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { nik, nama, email, password, confirmPassword, telepon, alamat } = formData;

    // Validasi
    if (!nik || !nama || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    if (nik.length !== 16) {
      Alert.alert('Error', 'NIK harus 16 digit');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak sama');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    const result = await register({
      nik,
      nama,
      email,
      password,
      telepon,
      alamat,
    });
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        'Sukses',
        'Registrasi berhasil! Silakan login.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Registrasi Gagal', result.error);
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
            <Title style={styles.title}>Daftar Akun Baru</Title>

            <TextInput
              label="NIK (16 digit)"
              value={formData.nik}
              onChangeText={(value) => handleChange('nik', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              maxLength={16}
              left={<TextInput.Icon icon="card-account-details" />}
            />

            <TextInput
              label="Nama Lengkap"
              value={formData.nama}
              onChangeText={(value) => handleChange('nama', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Nomor Telepon"
              value={formData.telepon}
              onChangeText={(value) => handleChange('telepon', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Alamat"
              value={formData.alamat}
              onChangeText={(value) => handleChange('alamat', value)}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="home" />}
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />

            <TextInput
              label="Konfirmasi Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              left={<TextInput.Icon icon="lock-check" />}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Mendaftarkan...' : 'Daftar'}
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Sudah punya akun?{' '}
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                compact
              >
                Masuk di sini
              </Button>
            </View>
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
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#2196F3',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
});

export default RegisterScreen;