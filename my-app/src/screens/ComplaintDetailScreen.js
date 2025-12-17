import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  ActivityIndicator,
  Chip,
  Paragraph,
  Divider,
  TextInput,
} from 'react-native-paper';
import { useAuth } from '../services/auth';
import api from '../services/api';
import { COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../utils/constants';

const ComplaintDetailScreen = ({ route, navigation }) => {
  const { complaintId } = route.params;
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tanggapan, setTanggapan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadComplaintDetail();
  }, [complaintId]);

  const loadComplaintDetail = async () => {
    try {
      const response = await api.get(`/complaints/${complaintId}`);
      setComplaint(response.data.complaint);
      setSelectedStatus(response.data.complaint.status);
      setTanggapan(response.data.complaint.tanggapan || '');
    } catch (error) {
      console.error('Error loading complaint detail:', error);
      Alert.alert('Error', 'Gagal memuat detail pengaduan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      Alert.alert('Error', 'Pilih status terlebih dahulu');
      return;
    }

    setIsUpdating(true);
    try {
      await api.put(`/complaints/${complaintId}`, {
        status: selectedStatus,
        tanggapan: tanggapan,
      });
      
      Alert.alert('Sukses', 'Status pengaduan berhasil diperbarui');
      loadComplaintDetail(); // Reload data
    } catch (error) {
      console.error('Error updating complaint:', error);
      Alert.alert('Error', 'Gagal memperbarui status pengaduan');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    return COMPLAINT_STATUS[status]?.color || '#666';
  };

  const getStatusLabel = (status) => {
    return COMPLAINT_STATUS[status]?.label || status;
  };

  const getCategoryLabel = (category) => {
    return COMPLAINT_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Memuat detail pengaduan...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pengaduan tidak ditemukan</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Kembali
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Complaint Details */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>{complaint.judul}</Title>
            <Chip
              mode="outlined"
              textStyle={{ color: 'white', fontSize: 12 }}
              style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
            >
              {getStatusLabel(complaint.status)}
            </Chip>
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.metaLabel}>Kategori:</Text>
            <Text style={styles.metaValue}>{getCategoryLabel(complaint.kategori)}</Text>
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.metaLabel}>Lokasi:</Text>
            <Text style={styles.metaValue}>{complaint.lokasi}</Text>
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.metaLabel}>Dilaporkan oleh:</Text>
            <Text style={styles.metaValue}>
              {complaint.user_nama} ({complaint.user_nik})
            </Text>
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.metaLabel}>Tanggal:</Text>
            <Text style={styles.metaValue}>
              {new Date(complaint.created_at).toLocaleString('id-ID')}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Isi Laporan</Text>
          <Paragraph style={styles.content}>
            {complaint.isi_laporan}
          </Paragraph>

          {complaint.foto && (
            <>
              <Text style={styles.sectionTitle}>Foto Pendukung</Text>
              <Button
                mode="outlined"
                icon="image"
                onPress={() => {/* Handle image view */}}
                style={styles.imageButton}
              >
                Lihat Foto
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Response Section */}
      {complaint.tanggapan && (
        <Card style={[styles.card, styles.responseCard]}>
          <Card.Content>
            <Title style={styles.responseTitle}>Tanggapan Resmi</Title>
            <Paragraph style={styles.responseContent}>
              {complaint.tanggapan}
            </Paragraph>
            <Text style={styles.responseDate}>
              Diperbarui: {new Date(complaint.updated_at).toLocaleString('id-ID')}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Admin Controls */}
      {user.role === 'admin' && (
        <Card style={styles.adminCard}>
          <Card.Content>
            <Title style={styles.adminTitle}>Kelola Pengaduan</Title>
            
            <Text style={styles.sectionLabel}>Ubah Status</Text>
            <View style={styles.statusContainer}>
              {Object.entries(COMPLAINT_STATUS).map(([key, status]) => (
                <Button
                  key={key}
                  mode={selectedStatus === key ? 'contained' : 'outlined'}
                  onPress={() => setSelectedStatus(key)}
                  style={[
                    styles.statusButton,
                    selectedStatus === key && { backgroundColor: status.color }
                  ]}
                  compact
                >
                  {status.label}
                </Button>
              ))}
            </View>

            <TextInput
              label="Tanggapan"
              value={tanggapan}
              onChangeText={setTanggapan}
              mode="outlined"
              style={styles.responseInput}
              multiline
              numberOfLines={4}
              placeholder="Berikan tanggapan resmi untuk pengaduan ini..."
            />

            <Button
              mode="contained"
              onPress={handleStatusUpdate}
              style={styles.updateButton}
              loading={isUpdating}
              disabled={isUpdating}
            >
              {isUpdating ? 'Memperbarui...' : 'Perbarui Status'}
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#666',
  },
  metaValue: {
    flex: 1,
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  content: {
    lineHeight: 20,
    color: '#666',
  },
  imageButton: {
    marginTop: 8,
  },
  responseCard: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  responseTitle: {
    fontSize: 16,
    color: '#2E7D32',
  },
  responseContent: {
    lineHeight: 20,
    color: '#666',
    marginBottom: 8,
  },
  responseDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  adminCard: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  adminTitle: {
    fontSize: 16,
    color: '#E65100',
    marginBottom: 16,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusButton: {
    margin: 2,
  },
  responseInput: {
    marginBottom: 16,
  },
  updateButton: {
    marginTop: 8,
  },
});

export default ComplaintDetailScreen;