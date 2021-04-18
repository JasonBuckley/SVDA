const mysql = require("mysql");

// gets config settings for the database from environment variables
const sqlConfig = {
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    database: process.env.SQL_DATABASE
};

function query(conn, query, data=[]){
    if(Array.isArray(data) && data.length == 0){
        return new Promise((resolve, reject) => {
            conn.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }else{
        return new Promise((resolve, reject) => {
            conn.query(query, data, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports.query = query;
module.exports.pool = mysql.createPool(sqlConfig);
