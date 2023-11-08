// Impor modul yang diperlukan
const express = require('express'); // Modul Express untuk membuat server
const fs = require('fs'); // Modul fs untuk operasi berkas
const upload = require('express-fileupload'); // Modul express-fileupload untuk pengunggahan berkas
const crypto = require('crypto'); // Modul crypto untuk fungsi hash
const path = require('path'); // Modul path untuk manipulasi jalur

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
let fileFolder = [];
let lengthFile;
fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error('Kesalahan membaca folder:', err);
        return;
    }
    files.forEach(file => {
        const uplaodPath = path.join(folderPath, file);

        // Dapatkan informasi status berkas
        fs.stat(uplaodPath, (err, stats) => {
            if (err) {
                console.error('Kesalahan mendapatkan status berkas:', err);
                return;
            }

            if (stats.isFile()) {
                fileFolder.push(file);
            }

            // Periksa apakah semua berkas telah diproses
            if (fileFolder.length === files.length) {
                console.log('Jumlah berkas dalam folder:', fileFolder.length);
                console.log('Nama berkas dalam folder:', fileFolder);
            }
        });
    });
})
// Rute untuk menampilkan halaman utama
app.get('/', (req, res) => {

    const queryParams = req.query;

    if(queryParams.file){
        // res.sendFile('./index.html', { root: __dirname });
        res.render('index', {value: '.',link : 'none',file : fileFolder,searchValue : `https://cloudFile.meskipperr.repl.co/?file=${queryParams.file}`});
    }else{
        res.render('index', {value: '.',link : 'none',file : fileFolder,searchValue : ''});
    }
});





// Fungsi untuk memeriksa dan menghapus berkas lama
function checkAndDeleteFiles() {
    const currentDate = new Date();
    fileFolder = [];

    // Baca isi folder
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Kesalahan membaca folder:', err);
            return;
        }
        files.forEach(file => {
            const uplaodPath = path.join(folderPath, file);

            // Dapatkan informasi status berkas
            fs.stat(uplaodPath, (err, stats) => {
                if (err) {
                    console.error('Kesalahan mendapatkan status berkas:', err);
                    return;
                }

                if (stats.isFile()) {
                    fileFolder.push(file);
                }

                // Periksa apakah semua berkas telah diproses
                if (fileFolder.length === files.length) {
                    console.log('Jumlah berkas dalam folder:', fileFolder.length);
                    console.log('Nama berkas dalam folder:', fileFolder);
                }
            });
        });

        // Iterasi lagi untuk memeriksa dan menghapus berkas lama
        files.forEach(file => {
            const filePath = path.join(folderPath, file);

            // Dapatkan informasi status berkas
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Kesalahan mengakses berkas:', err);
                    return;
                }

                const fileModificationDate = stats.mtime; // Tanggal modifikasi terakhir berkas

                // Hitung selisih waktu dalam milidetik antara tanggal saat ini dan tanggal modifikasi berkas
                const timeDifference = currentDate - fileModificationDate;

                // Menghitung selisih dalam hari
                const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

                if (daysDifference > 7) {
                    console.log(`Berkas ${file} sudah lewat 7 hari.`);

                    // Hapus berkas
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error('Kesalahan menghapus berkas:', err);
                        } else {
                            console.log(`Berkas ${file} telah dihapus.`);
                            fileFolder = fileFolder.filter(item=>item != file)
                        }
                    });
                }
            });
        });
    });
    console.log(fileFolder);
}

// Periksa dan hapus berkas lama setiap jam
setInterval(checkAndDeleteFiles, 3600000); // 3600000 milidetik = 1 jam

// Middleware: Aktifkan unggahan berkas
app.use(upload());

function getFormattedDateTime() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'Asia/Makassar' };
    const formattedDateTime = new Date().toLocaleString('id-ID', options);
    
    return formattedDateTime;
}


// Rute untuk menangani unggahan berkas
app.post('/', (req, res) => {
    if (req.files) {
        console.log(req.files);
        let file = req.files.files;
        let fileName = file.name;
        console.log(fileName);

        // Analisis informasi berkas
        let fileInfo = path.parse(fileName);
        let nameFile = fileInfo.name;
        let fileExt = fileInfo.ext;

        // Buat hash SHA-256 dari nama berkas
        let hash = crypto.createHash('sha256');
        hash.update(nameFile);
        let hashNameFile = hash.digest('hex') + fileExt;
        console.log(hashNameFile);

        // Periksa apakah nama berkas sudah ada, dan modifikasi jika perlu
        if (fileFolder.includes(hashNameFile)) {
            hashNameFile = path.parse(hashNameFile).name + lengthFile + path.parse(hashNameFile).ext;
            console.log(hashNameFile);
        }

        // Tambahkan nama berkas baru ke daftar
        fileFolder.push(hashNameFile);

        // Pindahkan berkas yang diunggah ke folder 'uploads'
        file.mv('./public/uploads/' + hashNameFile, function (err) {
            if (err) {
                res.send(err);
            } else {
                // Tampilkan halaman utama dengan pesan keberhasilan
                res.render('index', { value: hashNameFile, link: 'link', file: fileFolder,searchValue : ''});
                console.log(getFormattedDateTime());
            }
        });
    }
});

// Jalankan server Express
app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});
