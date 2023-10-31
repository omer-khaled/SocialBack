import mysql2 from 'mysql2';

const pool = mysql2.createPool({
    host:'localhost',
    user:'root',
    password:'fcaiomer2021',
    database:'social'
});

export default pool.promise();
