import express, { response } from "express"
import mysql from "mysql2"
import bodyparser from "body-parser"
import fs from 'fs'
import csv from 'fast-csv'
import fetch from "node-fetch"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { EOL } from 'os';
import { parse } from '@fast-csv/parse';
dotenv.config()
//added dotenv for password safekeeping


const app = express()

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))


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
   
})
  


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
  
//fetch("https://dev.hsl.fi/citybikes/od-trips-2021/2021-05.csv").then(res => res.body.pipe(fileStream))

 
const PORT = process.env.PORT || 5555
app.listen(PORT, () => console.log(`Node app serving on port: ${PORT}`))
app.get("/bike_trips", (req, res) => {
    db.query("SELECT departure_station_name, return_station_name, distance, duration FROM bike_trips LIMIT 10", (error, data) => {
      if (error) {
        return res.json({ status: "ERROR", error });
      }
      console.log(data);
      return res.json(data);
    });
  });


