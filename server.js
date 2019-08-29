var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");

var PORT = process.env.PORT || 3000;

var db = require("./models");

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.engine("handlebars",exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


mongoose.connect("mongodb://localhost:27017/populatedb", { useNewUrlParser: true});

//Routes
app.get("/scrape", function(req,res) {
    axios.get("http://wwww.ign.com").then(function(response){
      var $ = cheerio.load(response.data);

      $(".item-details").each(function(i, element) {
        if(!$(this).children("a").attr("href")) return
        var result = {};
        console.log($(this).text());
        result.title = $(this)
          .find("span")
          .text();
        result.link = $(this).children("a").attr("href")

        db.Article.create(result)
          .then(function(dbArticle) {
            res.end()
          })
          .catch(function(err) {
            console.log(err);
          });
        console.log($(this).children("a").attr("href"))
      });

      res.send("Scrape Complete")
    });
});

app.get("/articles", function(req, res) {
    db.Article.find({})
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
});

//issue with getting id from mongoose 
app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
      .populate("comments")
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
          res.json(err);
      })
});

app.post("/articles/:id", function(req, res) {
    db.Comment.create(req.body)
      .then(function(dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      })
})

app.listen(PORT, function(){
    console.log("Server listening on port " + PORT);
});