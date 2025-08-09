const express = require("express");
const cors = require("cors");
require("dotenv").config();
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

//verifyfirebase token
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const userInfo = await admin.auth().verifyIdToken(token);
  req.tokenEmail = userInfo.email;
  next();
};

const uri = `mongodb+srv://${process.env.DB_USERS}:${process.env.DB_PASSW}@cluster0.t5n91s9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const bookCollection = client.db("bookstore").collection("books");
    const reviewCollection = client.db("bookstore").collection("thereviews");

    //add reviews
    app.post("/reviews", verifyFirebaseToken, async (req, res) => {
      const review = req.body;

      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    //update review
    app.put("/review/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = req.body;
      const updatetext = {
        $set: update,
      };
      const result = await reviewCollection.updateOne(filter, updatetext);
      res.send(result);
    });

    //update status
    app.put('/books/:id/status',async(req,res)=>{
       const id = req.params.id;
       const query = {_id: new ObjectId(id)};
       const updatestatus = req.body;
       const update = {
        $set : updatestatus,
       }
       const result = await bookCollection.updateOne(query,update);
       res.send(result);
    })

    //delete review
    app.delete("/review/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    //get all reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    //get all books
    app.get("/books", async (req, res) => {
      const result = await bookCollection.find().toArray();
      res.send(result);
    });
    //update book
    app.put("/update/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      const updatedata = {
        $set: update,
      };
      const result = await bookCollection.updateOne(query, updatedata);
      res.send(result);
    });

    //delete book
    app.delete("/books/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/books/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });
 
    //post request
    app.post("/add-book", verifyFirebaseToken, async (req, res) => {
      const newbook = req.body;
      const result = await bookCollection.insertOne(newbook);
      res.send(result);
    });

    // Update upvotes
    app.put("/books/:id/upvote", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { upvote: 1 } }
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
   // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
