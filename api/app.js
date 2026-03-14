const express = require('express')
const app = express()
var cors = require('cors')
const port = 3333
const http = require("http")
const { Server } = require("socket.io");
const server = http.createServer(app);


app.use(express.json());
app.use(cors());






var mysql      = require('mysql2');
var connection = mysql.createConnection({
  host     : 'junction.proxy.rlwy.net',
  port     : 19560,
  user     : 'root',
  password : 'aZoqtZrSTuzjCZjSTFlpEfXLrcwwoTAl',
  database : 'railway'
});
 
connection.connect();


const io = new Server(server, {
  cors: {
    origin: "*"
  }
})
io.on("connection",(socket)=>{

  console.log("client connected")

  connection.query(`
 SELECT *
  FROM checkin INNER JOIN employee on checkin.id_card = employee.id_card
  ORDER BY date DESC
  LIMIT 10;
  `, (err,rows)=>{

    if(err){
      console.log(err)
      return
    }

    socket.emit("attendanceUpdate", rows)

  })

})



app.get('/selectcheckin', (req, res) => {


  connection.query('SELECT * FROM checkin', function (error, results, fields) {
  if (error) throw error;
    res.json(results);
});


})


app.get('/selectemployee', (req, res) => {


  connection.query('SELECT id_card, Name FROM employee', function (error, results, fields) {
  if (error) throw error;
    res.json(results);
});


})




app.get('/selectcheckout', (req, res) => {


  connection.query('SELECT * FROM checkout', function (error, results, fields) {
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


app.post("/sendcheckout", (req,res)=>{

 const {time,date,id_card} = req.body

 connection.query(
   "INSERT INTO checkout(time_checkout,date_checkout,id_card) VALUES(?,?,?)",
   [time,date,id_card],
   (err,result)=>{

     if(err) throw err

     io.emit("attendanceUpdate", [{time,date,id_card}])

     res.json({status:"ok"})
   }
 )
})

app.post("/updatestatuscheckin", (req,res)=>{

 const {time,date,id_card} = req.body

 connection.query(
   "update checkin set status=2 where  date=? and id_card=?",
   [date,id_card],
   (err,result)=>{

     if(err) throw err

     io.emit("attendanceUpdate", [{time,date,id_card}])

     res.json({status:"ok"})
   }
 )
})



// app.post("/findcheckin", (req, res) => {

//   const {  date, id_card } = req.body;

//   connection.query(
//     "SELECT * FROM checkin WHERE date = ? AND id_card = ? and status=1",
//     [date, id_card],
//     (err, result) => {

//       if (err) {
//         console.log(err);
//         return res.status(500).json({ status: "error" });
//       }

//       if (result.length > 0) {

//         // เจอ user
//         io.emit("attendanceUpdate", result);

//         res.json({ status: "founduser" });

//       } else {

//         // ไม่เจอ
//         res.json({ status: "notfound" });

//       }

//     }
//   );

// });

app.post("/findcheckin", (req, res) => {

  const { time, date, id_card } = req.body;

  // 🔴 เช็คก่อนว่า checkout ไปแล้วหรือยัง
  connection.query(
    "SELECT * FROM checkin WHERE date=? AND id_card=? AND status=2",
    [date, id_card],
    (err, result2) => {

      if (err) {
        console.log(err);
        return res.status(500).json({ status: "error" });
      }

      // ❗ ถ้า status = 2 แปลว่า checkout แล้ว
      if (result2.length > 0) {
        return res.json({ status: "already_checkout" });
      }

      // 🔍 เช็ค checkin ที่ยังไม่ checkout
      connection.query(
        "SELECT * FROM checkin WHERE date=? AND id_card=? AND status=1",
        [date, id_card],
        (err, result) => {

          if (err) {
            console.log(err);
            return res.status(500).json({ status: "error" });
          }

          // ✅ เจอ → ทำ checkout
          if (result.length > 0) {

            connection.query(
              "INSERT INTO checkout(time_checkout,date_checkout,id_card) VALUES(?,?,?)",
              [time, date, id_card],
              (err) => {

                if (err) {
                  console.log(err);
                  return res.status(500).json({ status: "error" });
                }

                connection.query(
                  "UPDATE checkin SET status=2 WHERE date=? AND id_card=?",
                  [date, id_card],
                  (err) => {

                    if (err) {
                      console.log(err);
                      return res.status(500).json({ status: "error" });
                    }

                    io.emit("attendanceUpdate", result);

                    res.json({ status: "checkout_success" });

                  }
                );

              }
            );

          }

          // ❌ ไม่เคย checkin → ทำ checkin ใหม่
          else {

            connection.query(
              "INSERT INTO checkin(time,date,id_card,status) VALUES(?,?,?,1)",
              [time, date, id_card],
              (err) => {

                if (err) {
                  console.log(err);
                  return res.status(500).json({ status: "error" });
                }

                io.emit("attendanceUpdate", [{ time, date, id_card }]);

                res.json({ status: "checkin_success" });

              }
            );

          }

        }
      );

    }
  );

});


// app.post("/scan", (req, res) => {

//   const { time, date, id_card } = req.body;

//   connection.query(
//     "SELECT * FROM checkin WHERE date = ? AND id_card = ? AND status = 1",
//     [date, id_card],
//     (err, result) => {

//       if (err) {
//         console.log(err);
//         return res.status(500).json({ status: "error" });
//       }

//       // ถ้ามี checkin แล้ว → checkout
//       if (result.length > 0) {

//         connection.query(
//           "INSERT INTO checkout(time_checkout,date_checkout,id_card) VALUES(?,?,?)",
//           [time, date, id_card],
//           (err2) => {

//             if (err2) {
//               console.log(err2);
//               return res.status(500).json({ status: "error" });
//             }

//             res.json({ status: "checkout_success" });
//           }
//         );

//       } 
//       // ถ้ายังไม่มี → checkin
//       else {

//         connection.query(
//           "INSERT INTO checkin(time,date,id_card) VALUES(?,?,?)",
//           [time, date, id_card],
//           (err2) => {

//             if (err2) {
//               console.log(err2);
//               return res.status(500).json({ status: "error" });
//             }

//             res.json({ status: "checkin_success" });
//           }
//         );

//       }

//     }
//   );

// });


server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})