var express = require('express');
var app = express();

app.get("/", function(req, res) {
  res.send("you gots it");
});

app.listen(8080, function() {
  console.log("Express server is running on port 8080");
});
