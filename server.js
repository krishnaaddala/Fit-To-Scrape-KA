var express = require("express");
var exphbs = require("express-handlebars")
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
            .populate("quotes")
            .lean()
            .then(function (dbQuotes) {
        console.log("***********************")
        console.log(dbQuotes)
        res.render("home",
            {
                quotes: dbQuotes
            });
    })
});

app.get("/saved", (req, res) => {
    console.log("in the / route");
    db.Quote.find({isSaved: true})
            //.populate("note")
            .lean()
            .then(function (dbQuotes) {
        console.log("***********************")
        console.log(dbQuotes)
        // console.log(dbNote)
        res.render("saved",
            {
                quotes: dbQuotes
            });
    })
});

//API Routes

app.get("/scrape", function (req, res) {
    var query = {}
    db.Quote.deleteMany(query, function(err, obj) {
        if (err) throw err;
      });
    axios.get("http://quotes.toscrape.com/").then(function (response) {
        var $ = cheerio.load(response.data);
        $("div.quote").each(function (i, element) {
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.quote = $(this)
                .children("span.text")
                .text();
            result.author = $(this)
                .children("span")
                .children("small.author")
                .text();
            db.Quote.create(result)
                .then(function (dbQuote) {
                    // View the added result in the console
                    //console.log(dbQuote);
                })
                .catch(function (err) {
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
            res.json(dbQuote);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.put("/quotes/:id", function(req, res){
    db.Quote.findOneAndUpdate({quote: req.params.id}, {$set: {isSaved: true}}, {new: true})
    .then(function(data){
        console.log(data)
        res.json(data);
    })
    .catch(function(err){
        res.json(err)
    })
});

app.delete("/quotes/:id", function(req, res){
    db.Quote.findOneAndUpdate({quote: req.params.id}, {$set: {isSaved: false}}, {new: true})
    .then(function(data){
        console.log(data)
        res.json(data);
    })
    .catch(function(err){
        res.json(err)
    })
});

app.post("/quotes/add-note", function (req, res) {    
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbQuote) {
            // If we were able to successfully update an Quote, send it back to the client
            res.json(dbQuote);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/quotes/get-notes/:quoteId", function (req, res) {
    let qId = req.params.quoteId
    // Create a new note and pass the req.body to the entry
    db.Note.find({quoteId : qId}).exec()
    .then(notes => {              
        console.log(notes);
        res.json(notes);
      });
});


app.delete("/notes/:id", function(req, res){
    db.Note.deleteOne({_id: req.params.id})
    .then(function(data){
        res.json(data);
    })
    .catch(function(err){
        res.json(err)
    })
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
