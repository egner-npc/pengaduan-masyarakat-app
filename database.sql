-- Buat database
CREATE DATABASE IF NOT EXISTS pengaduan_masyarakat;
USE pengaduan_masyarakat;

-- Tabel users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nik VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telepon VARCHAR(15),
    alamat TEXT,
    role ENUM('masyarakat', 'admin') DEFAULT 'masyarakat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel complaints
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    judul VARCHAR(200) NOT NULL,
    isi_laporan TEXT NOT NULL,
    lokasi VARCHAR(200),
    kategori ENUM('infrastruktur', 'sosial', 'lingkungan', 'keamanan', 'lainnya') NOT NULL,
    foto VARCHAR(255),
    status ENUM('pending', 'diproses', 'selesai', 'ditolak') DEFAULT 'pending',
    tanggapan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert admin default
INSERT INTO users (nik, nama, email, password, role) VALUES 
('1234567890123456', 'Admin', 'admin@pengaduan.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample data masyarakat
INSERT INTO users (nik, nama, email, password, telepon, alamat) VALUES 
('3210987654321098', 'Budi Santoso', 'budi@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567890', 'Jl. Merdeka No. 123'),
('4567890123456789', 'Siti Rahayu', 'siti@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081398765432', 'Jl. Sudirman No. 45');

-- Insert sample complaints
INSERT INTO complaints (user_id, judul, isi_laporan, lokasi, kategori, status) VALUES 
(2, 'Jalan Rusak di Perumahan Griya Asri', 'Terdapat lubang besar di jalan utama perumahan Griya Asri yang membahayakan pengendara terutama pada malam hari.', 'Perumahan Griya Asri, Blok A No. 1-10', 'infrastruktur', 'diproses'),
(3, 'Sampah Menumpuk di TPS', 'Sampah sudah tidak diangkut selama 3 hari di TPS RW 05 sehingga menimbulkan bau tidak sedap.', 'TPS RW 05, Jl. Melati No. 15', 'lingkungan', 'pending');