// Untuk Production (Railway)
export const API_BASE_URL = 'https://pengaduan-masyarakat-app-production.up.railway.app/api';

// Untuk Development Lokal
// export const API_BASE_URL = 'http://192.168.1.100:5000/api'; // Ganti dengan IP komputer Anda

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