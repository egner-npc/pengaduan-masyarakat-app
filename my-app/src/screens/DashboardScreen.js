import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  FAB,
  ActivityIndicator,
  Chip,
  Paragraph,
} from 'react-native-paper';
import { useAuth } from '../services/auth';
import api from '../services/api';
import { COMPLAINT_STATUS } from '../utils/constants';

const DashboardScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  const loadComplaints = async () => {
    try {
      const endpoint = user.role === 'admin' ? '/complaints' : '/my-complaints';
      const response = await api.get(endpoint);
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
      Alert.alert('Error', 'Gagal memuat data pengaduan');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints();
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', onPress: logout },
      ]
    );
  };

  const getStatusColor = (status) => {
    return COMPLAINT_STATUS[status]?.color || '#666';
  };

  const getStatusLabel = (status) => {
    return COMPLAINT_STATUS[status]?.label || status;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>
              Selamat Datang, {user.nama}!
            </Title>
            <Paragraph style={styles.welcomeSubtitle}>
              {user.role === 'admin' 
                ? 'Anda login sebagai Administrator' 
                : 'Ayo laporkan masalah di lingkungan Anda'
              }
            </Paragraph>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{complaints.length}</Text>
                <Text style={styles.statLabel}>Total Pengaduan</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {complaints.filter(c => c.status === 'selesai').length}
                </Text>
                <Text style={styles.statLabel}>Selesai</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Complaint List */}
        <View style={styles.complaintsSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>
              {user.role === 'admin' ? 'Semua Pengaduan' : 'Pengaduan Saya'}
            </Title>
            <Button
              mode="outlined"
              onPress={handleLogout}
              compact
              icon="logout"
            >
              Keluar
            </Button>
          </View>

          {complaints.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyText}>
                  {user.role === 'admin' 
                    ? 'Belum ada pengaduan' 
                    : 'Belum ada pengaduan yang dikirim'
                  }
                </Text>
                {user.role !== 'admin' && (
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('ComplaintForm')}
                    style={styles.emptyButton}
                  >
                    Buat Pengaduan Pertama
                  </Button>
                )}
              </Card.Content>
            </Card>
          ) : (
            complaints.map((complaint) => (
              <Card
                key={complaint.id}
                style={styles.complaintCard}
                onPress={() => navigation.navigate('ComplaintDetail', { complaintId: complaint.id })}
              >
                <Card.Content>
                  <View style={styles.complaintHeader}>
                    <Title style={styles.complaintTitle} numberOfLines={2}>
                      {complaint.judul}
                    </Title>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: 'white', fontSize: 12 }}
                      style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
                    >
                      {getStatusLabel(complaint.status)}
                    </Chip>
                  </View>
                  
                  <Paragraph style={styles.complaintContent} numberOfLines={3}>
                    {complaint.isi_laporan}
                  </Paragraph>
                  
                  <View style={styles.complaintFooter}>
                    <Text style={styles.complaintMeta}>
                      {complaint.lokasi}
                    </Text>
                    <Text style={styles.complaintDate}>
                      {new Date(complaint.created_at).toLocaleDateString('id-ID')}
                    </Text>
                  </View>

                  {user.role === 'admin' && (
                    <Text style={styles.complaintUser}>
                      Oleh: {complaint.user_nama} ({complaint.user_nik})
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {user.role !== 'admin' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('ComplaintForm')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerCard: {
    margin: 16,
    backgroundColor: '#2196F3',
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: 'white',
    opacity: 0.9,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'white',
    opacity: 0.9,
    fontSize: 12,
  },
  complaintsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    marginTop: 10,
  },
  complaintCard: {
    marginBottom: 12,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  complaintTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  complaintContent: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintMeta: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  complaintDate: {
    fontSize: 12,
    color: '#999',
  },
  complaintUser: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default DashboardScreen;