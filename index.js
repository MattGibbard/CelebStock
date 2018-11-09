//Add requires
const express = require('express');
const bodyParser = require('body-parser');
const chalk = require('chalk');
var promise = require('promise');
var request = require('request-promise');
const MongoClient = require('mongodb').MongoClient;

const app = express();

//Set global variables
let port = process.env.PORT || 8080;

//Allow app to use Public directory for CSS
app.use(express.static(__dirname + '/public'));
//Allow app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));

//Set view engine to EJS
app.set('view engine', 'ejs');

//Homepage render
app.get('/', function(req, res) {

    request(celebrityBucksAPIOPtions)
    .then(function (data) {
        console.log(data.CelebrityValues.length);
        //console.log(data.CelebrityValues[0])
        res.render('pages/home.ejs', {'celebList' : data.CelebrityValues});
    })
    .catch(function (err) {
        // API call failed...
    });

});

//Listen server
app.listen(port, function() {
    console.log(chalk.green('Server started and listening on port ' + port));
});


var celebrityBucksAPIOPtions = {
    uri: 'https://celebritybucks.com/developers/export/JSON',
    qs: {
        //limit: '5' // -> uri + '?access_token=xxxxx%20xxxxx'
    },
    headers: {
    //    'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
};

