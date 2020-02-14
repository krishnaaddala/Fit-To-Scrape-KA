var express = require("express");
var exphbs = require("express-handlebars")
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));

app.set("view engine", "handlebars");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/quoteScraped";
// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, {useNewUrlParser: true}, (err) => {
    if (err) throw err;
    console.log("database connected")
});

//html routes

app.get("/", (req, res) => {
    console.log("in the / route");
    db.Quote.find()
            .populate("notes")
            .then(function (dbQuotes) {
        console.log("***********************")
        console.log(dbQuotes)
        res.render("home",
            {
                quotes: dbQuotes
            });
    })
});

//API Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://quotes.toscrape.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an Quote tag, and do the following:
        $("div.quote").each(function (i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.quote = $(this)
                .children("span.text")
                .text();
            result.author = $(this)
                .children("span")
                .children("small.author")
                .text();
            // Create a new Quote using the `result` object built from scraping
            db.Quote.create(result)
                .then(function (dbQuote) {
                    // View the added result in the console
                    console.log(dbQuote);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err)
                });
        });

        // Send a message to the client
        res.redirect("/");
    });
});

// Route for getting all Quotes from the db
app.get("/quotes", function (req, res) {
    // Grab every document in the Quotes collection
    db.Quote.find({})
        .then(function (dbQuote) {
            // If we were able to successfully find Quotes, send them back to the client
            res.json(dbQuote);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// // Route for grabbing a specific Quote by id, populate it with it's note
// app.get("/quotes/:id", function(req, res) {
//   // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//   db.Quote.findOne({ _id: req.params.id })
//     // ..and populate all of the notes associated with it
//     .populate("note")
//     .then(function(dbQuote) {
//       // If we were able to successfully find an Quote with the given id, send it back to the client
//       res.json(dbQuote);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });

// Route for saving/updating an Quote's associated Note
app.post("/quotes/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Quote with an `_id` equal to `req.params.id`. Update the Quote to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Quote.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbQuote) {
            // If we were able to successfully update an Quote, send it back to the client
            res.json(dbQuote);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
