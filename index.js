const express = require('express')
const cors = require('cors')
const app = express();
var jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors())

app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.jt15atw.mongodb.net/?retryWrites=true&w=majority`;

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  //   try {
  // Connect the client to the server	(optional starting in v4.7)
  const StoryCollection = client.db("Banglabook").collection("Story");
  const UsersCollection = client.db("Banglabook").collection("users");
  const PostCollection = client.db("Banglabook").collection("Post");
  const MessengerCollection = client.db("Banglabook").collection("Messenger");



  app.post('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' })

    res.send({ token })
  })

  //     await client.connect();
  // Send a ping to confirm a successful connection
  app.get('/story', async (req, res) => {
    const result = await StoryCollection.find().toArray();
    res.send(result)
  })

  app.post('/story', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = await StoryCollection.insertOne(body);
    res.send(result)
  })

  app.post('/users', async (req, res) => {
    const body = req.body;
    console.log(body);
    const result = await UsersCollection.insertOne(body);
    res.send(result)
  })
  app.patch('/users/:id', async (req, res) => {
    const UpdateData = req.body;
    const Id = req.params.id;
    const filter = { _id: new ObjectId(Id) };

    const data = await UsersCollection.findOne(filter)
    const updateDoc = {
      $set: {
        Cover: UpdateData?.CoverPhoto ? UpdateData?.CoverPhoto : data?.Cover,
        image: UpdateData.image ? UpdateData.image : data?.image
      }
    };
    const result = await UsersCollection.updateOne(filter, updateDoc);
    res.send(result)
  })
  // users APi 

  app.get('/users', async (req, res) => {
    const result = await UsersCollection.find().toArray();
    res.send(result)
  })
  app.get('/user/:email', verifyJWT, async (req, res) => {
    const query = req.params.email;
    const fond = { email: query };
    const result = await UsersCollection.findOne(fond);
    res.send(result)
  })

  app.get('/userId/:id', async (req, res) => {
    const query = req.params.id;

    const fond = { _id: new ObjectId(query) };
    const result = await UsersCollection.findOne(fond);

    res.send(result)
  })
  app.get('/alluser', async (req, res) => {
    const query = req.query.name;
    const result = await UsersCollection.find({
      "$or": [
        { name: { $regex: query, $options: 'i' } },
      ],
    }).toArray()

    res.send(result)
  })
  //  post api 
  app.post('/post', async (req, res) => {
    const body = req.body;
    const result = await PostCollection.insertOne(body);
    res.send(result)
  })
  app.get('/post', async (rea, res) => {
    const result = await PostCollection.find().toArray();
    res.send(result)
  })
  app.get('/postVideo', async (rea, res) => {
    const query = { video: "" }
    const result = await PostCollection.find(query).toArray();
    res.send(result)
  })

  app.delete('/post/:id', verifyJWT, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await PostCollection.deleteOne(query);
    res.send(result);

  })
  app.patch('/post/:id', verifyJWT, async (req, res) => {
    const UpdateData = req.body;
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const CountLink = UpdateData.LikeUser;
    const likeEmailer = UpdateData.likeEmail;
    const updateDoc = {
      $set: {
        like: UpdateData.like + 1,
        likeEmail: [...likeEmailer, CountLink]
      }
    };
    const result = await PostCollection.updateOne(filter, updateDoc);
    res.send(result)
  })
  app.patch('/postComment/:id', verifyJWT, async (req, res) => {
    const UpdateData = req.body;
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const CommentUser = UpdateData.CommentData;
    const comment = UpdateData.comment;
    const updateDoc = {
      $set: {
        comment: [...comment, CommentUser]
      }
    };
    const result = await PostCollection.updateOne(filter, updateDoc);
    res.send(result)
  })

  // messenger Api 

  app.post('/messenger', verifyJWT, async (req, res) => {
    const body = req.body;
    const data = body?.MessegerData
    const result = await MessengerCollection.insertOne(data);
    res.send(result);
  })

  app.get('/messenger/:email', async (req, res) => {
    const email = req.params.email;
    const query = { yourEmail: email };
    const result = await MessengerCollection.find(query).toArray();
    res.send(result);

  });

  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  //   } finally {
  //     // Ensures that the client will close when you finish/error
  //     await client.close();
  //   }
}
run().catch(console.dir);




app.get('/', function (req, res,) {
  res.send("hello world")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})