const express = require('express')
const app = express()
var cors = require('cors')
const port = 3333

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'employeetimestamp'
});
 
connection.connect();


app.get('/employee', (req, res) => {


  connection.query('SELECT * FROM employee', function (error, results, fields) {
  if (error) throw error;
    res.json(results);
});

})

app.listen(port,  () => {
  console.log(`Example app listening on port ${port}`)
})
