import mysql2 from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();
const pool = mysql2.createPool({
    host:process.env.DB_HOST,
    user:process.env.User,
    password:process.env.Password,
    database:process.env.DB
});

export default pool.promise();
