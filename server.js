const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cors = require("cors");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "webproject123",
});
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(
  session({
    secret: "mysecret",
    cookie: { maxAge: 1000 * 60 * 5 },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.session());
app.get("/login", (req, res) => {
    res.send({message : "login"});
  });
  app.post("/login",
      passport.authenticate("local", {
        failureRedirect: "/login",
        successRedirect: "/home",
      })
    );
  //check if the user is logged in
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  }
  
  function manager (req, res, next) {
    const user = req.session.passport.user;
    db.query(
      `SELECT root FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
  
        if (result[0].root === "manager") {
          return next();
        } else {
          res.redirect("/login");
        }
      }
    );
    
    
  }
  
  function customer (req, res, next) {
    const user = req.session.passport.user;
    db.query(
      `SELECT root FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
  
        if (result[0].root === "customer") {
          return next();
        } else {
          res.redirect("/login");
        }
      }
    );
    
    
  }
  app.get('/logout', function (req, res) {
    delete req.session.passport.user
    res.redirect('/login');
  });  
  function status (req, res) {
    setTimeout(function(){
      const user = req.session.passport.user
      console.log(user)
      ; 
   }, 1000);
  }
  
  // customer or manager
  function authRoot(req, res, next) {
    const user = req.session.passport.user;
    db.query(
      `SELECT root FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
  
        if (result.length === 0) {
          done(null, false);
        } else {
          if (result[0].root === "customer") {
           
            res.redirect("/customer")
          } else {
           
            res.redirect("/manager")
          }
        }
      }
    );
  
    next();
  }
  
  app.get("/home" ,authRoot ,checkAuthenticated, (req, res) => { 
    
  });
  app.get("/customer",checkAuthenticated,customer,(req, res) => {
    const user = req.session.passport.user;
    db.query(
      `SELECT * FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
        res.send(result);
        console.log("customer")
      }
    );
  });
  // browse restaurant (customer)
  app.get("/restaurants",(req, res) => {    
    db.query(
      `SELECT * FROM restaurant `,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
        console.log(result)
         res.send(result);
      }
      
      
    );
  });
  // Search for restaurant 
  app.get("/restaurant/search",(req, res) => {
    res.send({message :"restaurant search"});
  });
  app.post("/restaurant/search",(req, res) => {
    console.log(req.body.restaurant)
     db.query(
      `SELECT * FROM restaurant WHERE restaurant_name LIKE'%${req.body.restaurant}%'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
        console.log(result)
         
         if(result.length !== 0){
           
          res.send(result);
         } else {
           res.send({message :"No match restaurant"})
         }
        
      }
      
      
    );
  });
  //Browse restaurant menus (customer)
  app.get("/restaurant/menu/:id", (req, res) => {
    db.query(
      `SELECT * FROM product WHERE restaurant_id ='${req.params.id}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
        res.send(result);
        console.log(result)
       
      }
    );
    
  });
  //customer order status
  app.get("/customer/order/status",checkAuthenticated,customer,(req, res) => {
    
    const user = req.session.passport.user;
    db.query(
      `SELECT user_id FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
         var id = result.map(a => a.user_id)   
         db.query(
          "SELECT product_id, order_status FROM `order`  WHERE user_id =" + `${id}` + " AND order_status != 'Delivered'",
          function (err, rows) {
            if (err) throw err;
            var result2 = Object.values(JSON.parse(JSON.stringify(rows)));
            if (result2.length === 0) { res.send({message :"No order yet"})}
            else {res.send(result2)  }
             
          } 
        );
      } 
    );
   
         
  });
  // customer order history
  app.get("/customer/order/history",checkAuthenticated,customer,(req, res) => {
    
    const user = req.session.passport.user;
    db.query(
      `SELECT user_id FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
         var id = result.map(a => a.user_id)   
         db.query(
          "SELECT * FROM `order`  WHERE user_id =" + `${id}` +" AND order_status = 'Delivered'",
          function (err, rows) {
            if (err) throw err;
            var result2 = Object.values(JSON.parse(JSON.stringify(rows)));
             
            if (result2.length === 0) {res.send({message :"no order yet"})} else {res.send(result2)}
             
          } 
        );
      } 
    );
   
         
  });
  //customer comfirm order 
  app.get("/customer/order/confirm",checkAuthenticated,customer,(req, res) => {
    const user = req.session.passport.user;
    db.query(
      `SELECT user_id FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
         var id = result.map(a => a.user_id)   
         db.query(
          "SELECT product_id, order_status FROM `order`  WHERE user_id =" + `${id}` + " AND order_status != 'Delivered'",
          function (err, rows) {
            if (err) throw err;
            var result2 = Object.values(JSON.parse(JSON.stringify(rows)));
            if (result2.length === 0) { res.send({message :"No order yet"})}
            else {res.send(result2)  }
             
          } 
        );
      } 
    );
  })
  app.post("/customer/order/confirm",checkAuthenticated,customer,(req, res) => {
     const user = req.session.passport.user;
    db.query(
      `SELECT user_id FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
        
        var id = result.map(a => a.user_id)
        console.log(id)
         var sql = "UPDATE `order` SET order_status = 'Delivered' WHERE user_id = " + `${id}` + " AND product_id  =  " + `${req.body.product_id}`
    
                  db.query(sql, function (err) {
                    if (err) throw err;
                    res.send({message :"confirm order success"})
                  });
                 
        } 
    );
   
         
  });
  //customer add order
  app.get("/customer/order",checkAuthenticated,customer,(req, res) => {
    res.send({message :"Customer add order"})
  });
  app.post("/customer/order",checkAuthenticated,customer,(req, res) => {
    
    const user = req.session.passport.user;
    db.query(
      `SELECT user_id FROM user WHERE username ='${user}'`,
      function (err, rows) {
        if (err) throw err;
        var result = Object.values(JSON.parse(JSON.stringify(rows)));
        
        var id = result.map(a => a.user_id)
        console.log(id)
         var sql = "INSERT INTO `order` ( `user_id`, `product_id`, `order_status`) VALUES ?";
        var values = [
          [
            (user_id = id),
            (product_id = req.body.product_id),
            (order_status = "Ordering"),
            
          ],
        ];
        console.log(values);
                db.query(sql, [values], function (err) {
                  if (err) throw err;
                 
                });
      } 
    );
   
    res.send({message :"okay"})       
  });