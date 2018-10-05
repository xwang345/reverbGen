var express = require("express");
var app = express();
const Chart = require("chart.js");

var HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('./'));
app.use(express.static('node_modules'));

//   app.use(bodyParser.urlencoded({ extended: false }));

  app.listen(HTTP_PORT, function onHttpStart() {
    console.log("==========    System is running   ==========");
    console.log("===                                      ===");
    console.log("== Express http server listening on: " + HTTP_PORT + " ==");
    console.log("===                                      ===");
    console.log("============================================");
  });

app.get("/", (req, res) =>{
    res.sendFile('index.html', { root: '.' });
});

  app.use((req, res) => {
    res.status(404).send("Sorry!!!!!!!>>>Page Not Found! <<<:(");
});