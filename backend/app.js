const express = require('express')
const bodyparser = require('body-parser')
const fs = require('fs');
const path = require('path')
const mysql = require('mysql')
const multer = require('multer')
const csv = require('fast-csv');
 
const app = express()
app.use(express.static("./public"))
 
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))
 
// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "test"
})

db.connect(function (err) {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to database.');
    const sql = `CREATE TABLE users (
        id bigint(11) NOT NULL,
        name varchar(150) DEFAULT NULL,
        email varchar(50) DEFAULT NULL,
        PRIMARY KEY (id)
      )`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
})
 
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({
    storage: storage
});
 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
 
app.post('/import-csv', upload.single("import-csv"), (req, res) =>{
    uploadCsv(__dirname + '/uploads/' + req.file.filename);
    console.log('File has imported :' + err);
});
 
function uploadCsv(uriFile){
    let stream = fs.createReadStream(uriFile);
    let csvDataColl = [];
    let fileStream = csv
        .parse()
        .on("data", function (data) {
            csvDataColl.push(data);
        })
        .on("end", function () {
            csvDataColl.shift();
  
            db.connect((error) => {
                if (error) {
                    console.error(error);
                } else {
                    let query = 'INSERT INTO users (id, name, email) VALUES ?';
                    db.query(query, [csvDataColl], (error, res) => {
                        console.log(error || res);
                    });
                }
            });
             
            fs.unlinkSync(uriFile)
        });
  
    stream.pipe(fileStream);
}
 
const PORT = process.env.PORT || 5555
app.listen(PORT, () => console.log(`Node app serving on port: ${PORT}`))