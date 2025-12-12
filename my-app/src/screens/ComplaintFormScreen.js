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
  RadioButton,
  HelperText,
} from 'react-native-paper';
import api from '../services/api';
import { COMPLAINT_CATEGORIES } from '../utils/constants';

const ComplaintFormScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    judul: '',
    isi_laporan: '',
    lokasi: '',
    kategori: 'infrastruktur',
    foto: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.judul.trim()) {
      newErrors.judul = 'Judul pengaduan harus diisi';
    } else if (formData.judul.length < 5) {
      newErrors.judul = 'Judul minimal 5 karakter';
    }

    if (!formData.isi_laporan.trim()) {
      newErrors.isi_laporan = 'Isi laporan harus diisi';
    } else if (formData.isi_laporan.length < 10) {
      newErrors.isi_laporan = 'Isi laporan minimal 10 karakter';
    }

    if (!formData.lokasi.trim()) {
      newErrors.lokasi = 'Lokasi harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/complaints', formData);
      Alert.alert(
        'Sukses',
        'Pengaduan berhasil dikirim!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Error', 'Gagal mengirim pengaduan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
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
            <Title style={styles.title}>Buat Pengaduan Baru</Title>

            <TextInput
              label="Judul Pengaduan"
              value={formData.judul}
              onChangeText={(value) => handleChange('judul', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.judul}
              left={<TextInput.Icon icon="format-title" />}
              placeholder="Masukkan judul pengaduan yang jelas"
            />
            <HelperText type="error" visible={!!errors.judul}>
              {errors.judul}
            </HelperText>

            <TextInput
              label="Lokasi Kejadian"
              value={formData.lokasi}
              onChangeText={(value) => handleChange('lokasi', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.lokasi}
              left={<TextInput.Icon icon="map-marker" />}
              placeholder="Contoh: Jl. Merdeka No. 123, RT 01/RW 02"
            />
            <HelperText type="error" visible={!!errors.lokasi}>
              {errors.lokasi}
            </HelperText>

            <Text style={styles.sectionLabel}>Kategori Pengaduan</Text>
            <RadioButton.Group
              onValueChange={(value) => handleChange('kategori', value)}
              value={formData.kategori}
            >
              {COMPLAINT_CATEGORIES.map((category) => (
                <RadioButton.Item
                  key={category.value}
                  label={category.label}
                  value={category.value}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>

            <TextInput
              label="Isi Laporan"
              value={formData.isi_laporan}
              onChangeText={(value) => handleChange('isi_laporan', value)}
              mode="outlined"
              style={styles.textArea}
              multiline
              numberOfLines={6}
              error={!!errors.isi_laporan}
              left={<TextInput.Icon icon="text" />}
              placeholder="Jelaskan secara detail masalah yang terjadi..."
            />
            <HelperText type="error" visible={!!errors.isi_laporan}>
              {errors.isi_laporan}
            </HelperText>

            <TextInput
              label="Foto (URL - opsional)"
              value={formData.foto}
              onChangeText={(value) => handleChange('foto', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="camera" />}
              placeholder="https://example.com/foto.jpg"
            />
            <HelperText type="info">
              Anda dapat menambahkan URL foto untuk mendukung laporan
            </HelperText>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={isLoading}
                disabled={isLoading}
                icon="send"
              >
                {isLoading ? 'Mengirim...' : 'Kirim Pengaduan'}
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#2196F3',
  },
  input: {
    marginBottom: 4,
  },
  textArea: {
    marginBottom: 4,
    height: 120,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  radioItem: {
    paddingVertical: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    marginLeft: 8,
  },
});

export default ComplaintFormScreen;