const express = require('express')
const app = express()
var cors = require('cors')
const port = 3333
const http = require("http")
const { Server } = require("socket.io");
const server = http.createServer(app);


app.use(express.json());
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})


io.on("connection", (socket) => {
  console.log("Client connected")

  // ทดสอบส่งข้อมูล
  socket.emit("attendanceUpdate", [
    { time: "08:30", date: "2026-03-10", id_card: "A01" },
    { time: "09:10", date: "2026-03-10", id_card: "A02" }
  ])
})

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '6411-171-7-55-92.ngrok-free.app',
  user     : 'root',
  password : '',
  database : 'employeetimestamp'
});
 
connection.connect();


app.get('/selectcheckin', (req, res) => {


  connection.query('SELECT * FROM checkin', function (error, results, fields) {
  if (error) throw error;
    res.json(results);
});


})



app.post("/checkin", (req,res)=>{

 const {time,date,id_card} = req.body

 connection.query(
   "INSERT INTO checkin(time,date,id_card) VALUES(?,?,?)",
   [time,date,id_card],
   (err,result)=>{

     if(err) throw err

     io.emit("attendanceUpdate", [{time,date,id_card}])

     res.json({status:"ok"})
   }
 )
})

app.listen(port,  () => {
  console.log(`Example app listening on port ${port}`)
})
