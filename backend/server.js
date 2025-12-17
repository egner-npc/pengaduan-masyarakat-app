const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pengaduan_masyarakat'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [users] = await pool.execute(
            'SELECT id, nik, nama, email, telepon, alamat, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(403).json({ error: 'User not found' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { nik, nama, email, password, telepon, alamat } = req.body;

        // Validation
        if (!nik || !nama || !email || !password) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        if (nik.length !== 16) {
            return res.status(400).json({ error: 'NIK harus 16 digit' });
        }

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR nik = ?',
            [email, nik]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email atau NIK sudah terdaftar' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (nik, nama, email, password, telepon, alamat) VALUES (?, ?, ?, ?, ?, ?)',
            [nik, nama, email, hashedPassword, telepon, alamat]
        );

        res.status(201).json({
            message: 'Registrasi berhasil',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi' });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const user = users[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    res.json({ user: req.user });
});

// Create complaint
app.post('/api/complaints', authenticateToken, async (req, res) => {
    try {
        const { judul, isi_laporan, lokasi, kategori, foto } = req.body;
        const userId = req.user.id;

        if (!judul || !isi_laporan || !kategori) {
            return res.status(400).json({ error: 'Judul, isi laporan, dan kategori wajib diisi' });
        }

        const [result] = await pool.execute(
            'INSERT INTO complaints (user_id, judul, isi_laporan, lokasi, kategori, foto) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, judul, isi_laporan, lokasi, kategori, foto]
        );

        res.status(201).json({
            message: 'Pengaduan berhasil dikirim',
            complaintId: result.insertId
        });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user complaints
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

        res.json({ complaints });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all complaints (for admin)
app.get('/api/complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const [complaints] = await pool.execute(
            `SELECT c.*, u.nama as user_nama, u.nik as user_nik 
             FROM complaints c 
             JOIN users u ON c.user_id = u.id 
             ORDER BY c.created_at DESC`
        );

        res.json({ complaints });
    } catch (error) {
        console.error('Get all complaints error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update complaint status (admin only)
app.put('/api/complaints/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const { status, tanggapan } = req.body;
        const complaintId = req.params.id;

        const [result] = await pool.execute(
            'UPDATE complaints SET status = ?, tanggapan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, tanggapan, complaintId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
        }

        res.json({ message: 'Status pengaduan berhasil diperbarui' });
    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
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
            return res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
        }

        // Check if user owns the complaint or is admin
        if (req.user.role !== 'admin' && complaints[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        res.json({ complaint: complaints[0] });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});