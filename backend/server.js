const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();

// PORT untuk Railway harus 10000
const PORT = process.env.PORT || 10000;

// IMPORTANT: Enhanced CORS for mobile apps
app.use(cors({
    origin: '*', // Untuk testing, bisa ganti nanti dengan domain spesifik
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration for Railway
const dbConfig = {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'HIaVpulxiNvSjqnCgdULvXKdEKjpnzGA',
    database: process.env.DB_NAME || 'pengaduan_masyarakat_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Database Configuration:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    env: process.env.NODE_ENV
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection immediately
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully to:', dbConfig.host);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection FAILED!');
        console.error('Error details:', {
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState
        });
        console.error('Full error:', err.message);
        
        // Log environment for debugging
        console.log('Current environment variables:', {
            DB_HOST: process.env.DB_HOST,
            DB_PORT: process.env.DB_PORT,
            DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
            DB_NAME: process.env.DB_NAME,
            NODE_ENV: process.env.NODE_ENV
        });
    });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key_change_in_production';

// Auth middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ 
                success: false,
                error: 'Token tidak ditemukan. Silakan login kembali.' 
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Format token tidak valid.' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [users] = await pool.execute(
            'SELECT id, nik, nama, email, telepon, alamat, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(403).json({ 
                success: false,
                error: 'User tidak ditemukan.' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token telah kadaluarsa. Silakan login kembali.' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token tidak valid.' 
            });
        }
        
        return res.status(500).json({ 
            success: false,
            error: 'Terjadi kesalahan dalam autentikasi.' 
        });
    }
};

// ==================== ROUTES ====================

// Health check endpoint - IMPORTANT for Railway
app.get('/api/health', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 as status');
        res.json({ 
            success: true,
            status: 'healthy', 
            database: 'connected',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            port: PORT
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(500).json({ 
            success: false,
            status: 'unhealthy', 
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Pengaduan Masyarakt',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        endpoints: {
            auth: '/api/login, /api/register',
            complaints: '/api/complaints, /api/my-complaints',
            health: '/api/health'
        }
    });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { nik, nama, email, password, telepon, alamat } = req.body;

        // Validation
        if (!nik || !nama || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Semua field wajib diisi: NIK, Nama, Email, Password' 
            });
        }

        if (nik.length !== 16) {
            return res.status(400).json({ 
                success: false,
                error: 'NIK harus 16 digit' 
            });
        }

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR nik = ?',
            [email, nik]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Email atau NIK sudah terdaftar' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (nik, nama, email, password, telepon, alamat, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nik, nama, email, hashedPassword, telepon, alamat, 'masyarakat']
        );

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Terjadi kesalahan server. Silakan coba lagi.' 
        });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email dan password wajib diisi' 
            });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Email atau password salah' 
            });
        }

        const user = users[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Email atau password salah' 
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' } // 7 hari
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                nik: user.nik,
                nama: user.nama,
                email: user.email,
                telepon: user.telepon,
                alamat: user.alamat,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Terjadi kesalahan server. Silakan coba lagi.' 
        });
    }
});

// Profile endpoint
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        res.json({ 
            success: true,
            user: req.user 
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Terjadi kesalahan server.' 
        });
    }
});

// Create complaint endpoint
app.post('/api/complaints', authenticateToken, async (req, res) => {
    try {
        const { judul, isi_laporan, lokasi, kategori, foto } = req.body;
        const userId = req.user.id;

        if (!judul || !isi_laporan || !kategori) {
            return res.status(400).json({ 
                success: false,
                error: 'Judul, isi laporan, dan kategori wajib diisi' 
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO complaints (user_id, judul, isi_laporan, lokasi, kategori, foto) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, judul, isi_laporan, lokasi, kategori, foto || null]
        );

        res.status(201).json({
            success: true,
            message: 'Pengaduan berhasil dikirim',
            complaintId: result.insertId
        });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal mengirim pengaduan. Silakan coba lagi.' 
        });
    }
});

// Get user complaints endpoint
app.get('/api/my-complaints', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [complaints] = await pool.execute(
            `SELECT c.*, u.nama as user_nama 
             FROM complaints c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.user_id = ? 
             ORDER BY c.created_at DESC`,
            [userId]
        );

        res.json({ 
            success: true,
            complaints: complaints || []
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal mengambil data pengaduan.' 
        });
    }
});

// Get all complaints (admin only)
app.get('/api/complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: 'Akses ditolak. Hanya admin yang bisa mengakses.' 
            });
        }

        const [complaints] = await pool.execute(
            `SELECT c.*, u.nama as user_nama, u.nik as user_nik 
             FROM complaints c 
             JOIN users u ON c.user_id = u.id 
             ORDER BY c.created_at DESC`
        );

        res.json({ 
            success: true,
            complaints: complaints || []
        });
    } catch (error) {
        console.error('Get all complaints error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal mengambil data pengaduan.' 
        });
    }
});

// Get complaint by ID
app.get('/api/complaints/:id', authenticateToken, async (req, res) => {
    try {
        const complaintId = req.params.id;
        const [complaints] = await pool.execute(
            `SELECT c.*, u.nama as user_nama, u.nik as user_nik, u.telepon as user_telepon 
             FROM complaints c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.id = ?`,
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Pengaduan tidak ditemukan' 
            });
        }

        // Check if user owns the complaint or is admin
        if (req.user.role !== 'admin' && complaints[0].user_id !== req.user.id) {
            return res.status(403).json({ 
                success: false,
                error: 'Akses ditolak. Anda tidak memiliki izin.' 
            });
        }

        res.json({ 
            success: true,
            complaint: complaints[0] 
        });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal mengambil detail pengaduan.' 
        });
    }
});

// Update complaint status (admin only)
app.put('/api/complaints/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: 'Akses ditolak. Hanya admin yang bisa mengupdate status.' 
            });
        }

        const { status, tanggapan } = req.body;
        const complaintId = req.params.id;

        if (!status || !['pending', 'diproses', 'selesai', 'ditolak'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Status tidak valid. Pilih: pending, diproses, selesai, atau ditolak' 
            });
        }

        const [result] = await pool.execute(
            'UPDATE complaints SET status = ?, tanggapan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, tanggapan || null, complaintId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Pengaduan tidak ditemukan' 
            });
        }

        res.json({ 
            success: true,
            message: 'Status pengaduan berhasil diperbarui' 
        });
    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal memperbarui status pengaduan.' 
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint tidak ditemukan',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan internal server'
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`✅ Server berjalan di port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
    console.log(`🔗 Health check: /api/health`);
    console.log('========================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end();
    });
});