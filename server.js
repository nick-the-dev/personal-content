require("dotenv").config();
const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { env } = require("process");
const MongoClient = require("mongodb").MongoClient;

var db;

const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_CLUSTER_URL = process.env.MONGO_CLUSTER_URL;
const REMOTE_PC_USERNAME = process.env.REMOTE_PC_USERNAME;
const REMOTE_PC_PASSWORD = process.env.REMOTE_PC_PASSWORD;

// Remember to change YOUR_USERNAME and YOUR_PASSWORD to your username and password!
MongoClient.connect(
  `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER_URL}/?retryWrites=true&w=majority`,
  (err, database) => {
    if (err) return console.log(err);
    db = database.db("data");
    app.listen(process.env.PORT || 3000, () => {
      console.log("listening on 3000");
    });
  },
);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// SCRAPPER

const statuses = [];

// Functions
const addStatuses = () => {
  db.collection("statuses").insertMany(statuses, (err, result) => {
    if (err) return console.log(err);
    console.log("saved to database");
  });
};

const updateStatuses = () => {
  statuses.forEach((status, index) => {
    db.collection("statuses").findOneAndUpdate(
      { _id: index },
      {
        $set: {
          updated: status.updated,
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      (err, result) => {
        if (err) return err;
        console.log(result);
      },
    );
  });
};

console.log("inside scrapper");

function runScrapper() {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      console.log(page);
      await page.authenticate({
        username: REMOTE_PC_USERNAME,
        password: REMOTE_PC_PASSWORD,
      });
      await page.goto("https://news.ycombinator.com/");
      let urls = await page.evaluate(() => {
        let results = [];
        let items = document.querySelectorAll(".athing");
        items.forEach((item, index) => {
          results.push({
            url: item.getAttribute("href"),
            text: item.innerText,
            _id: index,
            updated: false,
          });
        });
        return results;
      });
      browser.close();
      // console.log(urls);
      urls.forEach((item) => {
        statuses.push(item);
      });
      return resolve(urls);
    } catch (e) {
      return reject(e);
    }
  });
}

setTimeout(() => {
  runScrapper()
    .then(() => {
      db.collection("statuses").findOne({}, (err, result) => {
        //if (err) return console.log(err);

        if (result) {
          updateStatuses();
        } else {
          addStatuses();
        }
      });
    })
    .catch(console.error);
}, 60000);

// GET
app.get("/", (req, res) => {
  db.collection("users")
    .find()
    .toArray((err, result) => {
      if (err) return console.log(err);
      console.log(result);
      res.render("index.ejs", { users: result });
    });
});

//Showing login form
app.get("/login", function (req, res) {
  res.render("login.ejs");
});

// POST
app.post("/users", (req, res) => {
  db.collection("users").insertOne(req.body, (err, result) => {
    if (err) return console.log(err);
    console.log("saved to database");
    res.redirect("/");
  });
});

app.post("/login", (req, res) => {
  db.collection("users").findOne(
    { username: req.body.username },
    (err, result) => {
      //if (err) return console.log(err);

      //
      if (result) {
        if (req.body.password === result.password) {
          console.log("Password match!");
          res.status(200).send({ url: result.url });
        } else if (req.body.password !== result.password) {
          console.log("Authentication failed!");
        }
      }
    },
  );
});

// PUT
app.put("/users", (req, res) => {
  db.collection("users").findOneAndUpdate(
    { name: "user" },
    {
      $set: {
        username: req.body.name,
        password: req.body.password,
        url: req.body.url,
      },
    },
    {
      sort: { _id: -1 },
      upsert: true,
    },
    (err, result) => {
      if (err) return res.send(err);
      res.send(result);
    },
  );
});

//DELETE
app.delete("/users", (req, res) => {
  db.collection("users").findOneAndDelete(
    { name: req.body.name },
    (err, result) => {
      if (err) return res.send(500, err);
      res.send("User deleted");
    },
  );
});
