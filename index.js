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

    const result = await StoryCollection.insertOne(body);
    res.send(result)
  })

  app.get('/story/:id', async (req, res) => {
    const param = req.params?.id;
    const result = await StoryCollection.findOne({ _id: new ObjectId(param) })
    res.send(result)
  })

  app.post('/users', async (req, res) => {
    const body = req.body;

    const result = await UsersCollection.insertOne(body);
    res.send(result)
  })
  app.patch('/users/:email', async (req, res) => {
    const UpdateData = req.body;
    const email = req.params.email;
    const filter = { email: email };



    const data = await UsersCollection.findOne(filter)
    const updateDoc = {
      $set: {
        Cover: UpdateData?.CoverPhoto ? UpdateData?.CoverPhoto : data?.Cover,
        image: UpdateData.image ? UpdateData.image : data?.image,
        boi: UpdateData.boi ? UpdateData.boi : data?.boi,
        media: UpdateData.media ? UpdateData.media : data?.media,
        Gender: UpdateData.Gender ? UpdateData.Gender : data?.Gender,
        address: UpdateData.address ? UpdateData.address : data?.address,
        collage: UpdateData.collage ? UpdateData.collage : data?.collage
      }
    };
    const result = await UsersCollection.updateOne(filter, updateDoc);
    res.send(result)
  })
  // users APi 

  app.get('/follower', async (req, res) => {
    const Follower = await UsersCollection.aggregate([
      {
        $match: { email: req?.query?.email }
      }, {
        $lookup: {
          from: 'users',
          localField: 'following',
          foreignField: 'email',
          as: 'followingMe'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'followers',
          foreignField: 'email',
          as: 'followersMe'
        }
      },
    ]).toArray();

    res.send(Follower)

  })



  app.post('/follower', async (req, res) => {
    const data = req.body;
    const meEmail = data?.me
    const friendEmail = data?.friend;

    const me = await UsersCollection.findOne({ email: meEmail });
    const followerMe = me?.following;
    const friend = await UsersCollection.findOne({ email: friendEmail });
    const followersFriend = friend?.followers;

    const resultMe = await UsersCollection.updateOne({ email: meEmail }, {
      $set: {
        following: followerMe ? [...followerMe, friendEmail] : [friendEmail]
      }
    });
    const resultFriend = await UsersCollection.updateOne({ email: friendEmail }, {
      $set: {
        followers: followersFriend ? [...followersFriend, friendEmail] : [meEmail]
      }
    });
    console.log(resultMe, resultFriend);
    if (resultMe?.modifiedCount && resultFriend?.modifiedCount) {
      res.send({ massage: " congratulations  successfully add new friend  " })
    }
  })
  app.patch('/follower', verifyJWT, async (req, res) => {
    const email = req?.query?.email;
    const data = req.body;
    const me = await UsersCollection.findOne({ email: email });

    const filteredArray = me?.following.filter(item => item !== data?.email);


    const resultMe = await UsersCollection.updateOne({ email: email }, {
      $set: {
        following: filteredArray ? filteredArray : me?.following
      }
    });
    console.log(resultMe);
    res.send(resultMe)

  })

  app.get('/users', async (req, res) => {
    const result = await UsersCollection.find().toArray();
    res.send(result)
  })
  app.get('/user/:email', async (req, res) => {
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
  app.get('/post', async (req, res) => {

    const result = await PostCollection.aggregate([{
      $lookup: {
        from: 'users',
        localField: 'email',
        foreignField: 'email',
        as: 'user'
      }
    },]).toArray();
    console.log(result);

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
    const data = body?.massageData;
    console.log(data);

    const result = await MessengerCollection.insertOne(data);
    res.send(result);
  })

  app.delete('/messenger/:id', async (req, res) => {
    const data = req?.params?.id;
    const result = await MessengerCollection.deleteOne({ _id: new ObjectId(data) });
    res.send(result)

  });


  app.get('/messenger/', async (req, res) => {
    const yourEmail = req?.query?.yourEmail
    const friendEmail = req?.query?.friendEmail

    console.log(friendEmail, yourEmail);
    const pipeline = [{
      $lookup: {
        from: 'users',
        localField: 'friendEmail',
        foreignField: 'email',
        as: 'friendData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'yourEmail',
        foreignField: 'email',
        as: 'yourData'
      }
    },
    {
      $match: {
        "friendData": { $ne: [] }, // Checking if friendData array is not empty
        "yourData": { $ne: [] }    // Checking if yourData array is not empty
      }
    }
    ];


    const result = await MessengerCollection.aggregate(pipeline).toArray();
    console.log(result);
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