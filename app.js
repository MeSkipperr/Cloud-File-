// Impor modul yang diperlukan
const express = require('express');
const fs = require('fs');
const upload = require('express-fileupload');
const crypto = require('crypto');
const path = require('path');

// Inisialisasi aplikasi Express
const app = express();
const port = 3000;

// Middleware: Menyajikan berkas statis dari folder 'public'
app.use(express.static(__dirname + '/public'));

// Menggunakan EJS sebagai mesin tampilan
app.set('view engine', 'ejs');

// Tentukan jalur folder unggahan berkas
const folderPath = 'public/uploads';

// Array untuk menyimpan nama berkas dan detailnya
let fileFolder = []; // Daftar berkas yang ada di folder
let lengthFile; // Panjang nama berkas baru

// Fungsi untuk membaca folder dan memperbarui fileFolder
function updateFileList() {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Kesalahan membaca folder:', err);
            return;
        }
        fileFolder = files.filter(file => fs.statSync(path.join(folderPath, file)).isFile());
        lengthFile = fileFolder.length;
        console.log('Jumlah berkas dalam folder:', lengthFile);
        console.log('Nama berkas dalam folder:', fileFolder);
    });
}
updateFileList(); // Panggil fungsi untuk pertama kali

// Rute untuk menampilkan halaman utama
app.get('/', (req, res) => {
    const queryParams = req.query;

    let searchValue = '';
    if (queryParams.file) {
        searchValue = `https://cloudFile.meskipperr.repl.co/?file=${queryParams.file}`;
    }

    res.render('index', {
        value: '.',
        link: 'none',
        file: fileFolder,
        searchValue: searchValue
    });
});

// Fungsi untuk memeriksa dan menghapus berkas lama
function checkAndDeleteFiles() {
    const currentDate = new Date();
    fileFolder.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        const fileModificationDate = stats.mtime; // Tanggal modifikasi terakhir berkas
        const timeDifference = currentDate - fileModificationDate;
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        if (daysDifference > 7) {
            console.log(`Berkas ${file} sudah lewat 7 hari.`);
            fs.unlink(filePath, err => {
                if (err) {
                    console.error('Kesalahan menghapus berkas:', err);
                } else {
                    console.log(`Berkas ${file} telah dihapus.`);
                    fileFolder = fileFolder.filter(item => item != file);
                }
            });
        }
    });
    updateFileList(); // Perbarui daftar berkas setelah penghapusan
}

// Periksa dan hapus berkas lama setiap jam
setInterval(checkAndDeleteFiles, 3600000); // 3600000 milidetik = 1 jam

// Middleware: Aktifkan unggahan berkas
app.use(upload());

// Fungsi untuk mendapatkan tanggal dan waktu yang diformat
function getFormattedDateTime() {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Makassar'
    };
    const formattedDateTime = new Date().toLocaleString('id-ID', options);
    return formattedDateTime;
}

// Rute untuk menangani unggahan berkas
app.post('/', (req, res) => {
    console.log(req.files);
    
    if (req.files) {
        let file = req.files.files;
        let fileName = file.name;

        // Analisis informasi berkas
        let fileInfo = path.parse(fileName);
        let nameFile = fileInfo.name;
        let fileExt = fileInfo.ext;

        // Buat hash SHA-256 dari nama berkas
        let hash = crypto.createHash('sha256');
        hash.update(nameFile);
        let hashNameFile = hash.digest('hex') + fileExt;

        // Periksa apakah nama berkas sudah ada, dan modifikasi jika perlu
        if (fileFolder.includes(hashNameFile)) {
            hashNameFile = path.parse(hashNameFile).name + lengthFile + path.parse(hashNameFile).ext;
        }

        // Tambahkan nama berkas baru ke daftar
        fileFolder.push(hashNameFile);

        // Pindahkan berkas yang diunggah ke folder 'uploads'
        file.mv('./public/uploads/' + hashNameFile, function (err) { 
            if (err) {
                res.send(err);
            } else {
                // Tampilkan halaman utama dengan pesan keberhasilan
                res.render('index', {
                    value: hashNameFile,
                    link: 'link',
                    file: fileFolder,
                    searchValue: ''
                });
                console.log(`File dengan nama ${hashNameFile} telah di tambahkan pada:`)
                console.log(getFormattedDateTime());
            }
        });
    }
});

// Jalankan server Express
app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});
