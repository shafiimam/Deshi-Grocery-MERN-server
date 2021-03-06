const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
require("dotenv").config();
const serviceAccount = require("./config/deshi-grocery-firebase-adminsdk-dhtp4-bf39e06a3d.json")

const app = express();
app.use(bodyParser.json());
app.use(cors());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qz5k4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const productsCollection = client.db("deshi-bazar").collection("products");
  const ordersCollection = client.db("deshi-bazar").collection("orders");
  console.log("database connected successfully");

//for adding new product
  app.post("/admin/addProduct", (req, res) => {
    const newProduct = req.body;
    console.log("adding product", req.body);
    productsCollection.insertOne(newProduct).then((result) => {});
  });

//for getting all the products
  app.get("/products", (req, res) => {
    productsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
//for getting product by key
  app.get("/product/:key", (req, res) => {
    productsCollection
      .find({ key: req.params.key })
      .toArray((err, documents) => {
        res.status(200).send(documents[0]);
      });
  });
// for order place
  app.post("/addOrder", (req, res) => {
    const order = req.body;
    ordersCollection.insertOne(order).then((result) => {
      
      res.send(result.insertedCount > 0);
    });
  });
//for getting all the orders
  app.get("/orders", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          if ((tokenEmail === req.query.email)) {
            ordersCollection.find({email:req.query.email}).toArray((err, documents) => {
              res.send(documents);
            });
          }
          else{
            res.status(401).send('unauthorized access')
          }
        });
    }
  });

//for deleting product
  app.get("/admin/deleteProduct/:key", (req, res) => {
    console.log(req.params.key)
    productsCollection.deleteOne({key:req.params.key})
    .then(result =>{
      res.send(result.deletedCount> 0)
    })
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || 4000);
