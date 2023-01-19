import express, { response } from "express"
import mysql from "mysql2"
import bodyparser from "body-parser"
import fs from 'fs'
import csv from 'fast-csv'
import fetch from "node-fetch"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
//added dotenv for password safekeeping


const app = express()
const { parse } = require('fast-csv');


 
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))



const CSV_STRING = [
    'a1,b1',
    ',',      //empty row empty colums
    'a2,b2',
    '   ,\t', //empty row columns with just white space
    '',       //empty last line
].join(EOL);


 
const stream = parse({ headers: true })
    .on('error', error => console.error(error))
    .on('data', row => console.log(`Valid [row=${JSON.stringify(row)}]`))
    .on('data-invalid', (row, rowNumber) => console.log(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`))
    .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));
    

stream.write('header1,header2\n');
stream.write('col1,col2');
stream.write(CSV_STRING);
stream.end();


   



// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "bike_app"
    /*const DB_HOST = process.env.DB_HOST;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;*/
})

db.connect(function (err) {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to database.');
    /*const sql = `CREATE TABLE users (
        id bigint(11) NOT NULL,
        name varchar(150) DEFAULT NULL,
        email varchar(50) DEFAULT NULL,
        PRIMARY KEY (id)
      )`;
    db.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });*/
})
  
/*app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});*/
 

 

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
                    let query = 'INSERT INTO bike_trips (departure_time, return_time, departure_station_id, departure_station_name, return_station_id, return_station_name, distance, duration) VALUES ?';
                    db.query(query, [csvDataColl], (error, res) => {
                        console.log(error || res);
                    });
                }
            });
             
            
        });
  
fetch("https://dev.hsl.fi/citybikes/od-trips-2021/2021-05.csv").then(res => res.body.pipe(fileStream))

 
const PORT = process.env.PORT || 5555
app.listen(PORT, () => console.log(`Node app serving on port: ${PORT}`))
app.get("/bike_trips", (req, res) => {
    db.query("SELECT departure_station_name, return_station_name, distance, duration FROM bike_trips", (error, data) => {
      if (error) {
        return res.json({ status: "ERROR", error });
      }
  
      return res.json(data);
    });
  });


