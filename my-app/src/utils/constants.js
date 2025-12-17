// Ganti dengan IP lokal komputer Anda atau server yang berjalan
// Untuk development di emulator/device fisik:

// Untuk Android Emulator:
// export const API_BASE_URL = 'http://10.0.2.2:5000/api';

// Untuk iOS Simulator:
// export const API_BASE_URL = 'http://localhost:5000/api';

// Untuk device fisik (ganti dengan IP komputer Anda):
// export const API_BASE_URL = 'http://192.168.1.100:5000/api';

// Contoh dengan IP default:
export const API_BASE_URL = 'http://10.0.2.2:5000/api'; // IP khusus untuk Emulator Android mengakses localhost komputer

export const COMPLAINT_CATEGORIES = [
  { label: 'Infrastruktur', value: 'infrastruktur' },
  { label: 'Sosial', value: 'sosial' },
  { label: 'Lingkungan', value: 'lingkungan' },
  { label: 'Keamanan', value: 'keamanan' },
  { label: 'Lainnya', value: 'lainnya' }
];

export const COMPLAINT_STATUS = {
  pending: { label: 'Menunggu', color: '#FFA500' },
  diproses: { label: 'Diproses', color: '#007AFF' },
  selesai: { label: 'Selesai', color: '#34C759' },
  ditolak: { label: 'Ditolak', color: '#FF3B30' }
};