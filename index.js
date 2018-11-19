//Add requires
const express = require('express');
const bodyParser = require('body-parser');
const chalk = require('chalk');
var request = require('request');
const MongoClient = require('mongodb').MongoClient;

const app = express();

var configVars = require('./config');

//Set global variables
let port = process.env.PORT || 8080;
const mongoDBName = 'celebstock';

//Allow app to use Public directory for CSS
app.use(express.static(__dirname + '/public'));
//Allow app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));

//Set view engine to EJS
app.set('view engine', 'ejs');

//Mongo connection
MongoClient.connect(configVars.mongoURL, { useNewUrlParser: true },function(err, database) {
    if (err) return console.log(chalk.red(err));
    db = database.db(mongoDBName);
    console.log(chalk.green('MongoDB connected'));
})

//Homepage render
app.get('/', function(req, res) {
    res.render('pages/home.ejs');
});

//Admin render
app.get('/admin', function(req, res) {
    res.render('pages/admin.ejs');
});

//All render
app.get('/all', function(req, res) {
    db.collection("celebs").find({}).toArray(function(err, result) {
        if (err) throw err;

        if (result.length == 0) {
            console.log("No celebs in DB");
            res.redirect('/admin');
        } else {
            res.render('pages/all.ejs', { celebList: result });
        }

    })
});

app.post('/overwriteall', function(req, res) {
    db.collection('celebs').deleteMany({});
    console.log('Celebs DB emptied');

    request(celebrityBucksAPIOPtions, function (error, response, body) {
        if (error) throw error;

        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('Celebs found:', body.CelebrityValues.length); // Print the HTML for the Google homepage.

        amountOfCelebs = body.CelebrityValues.length;

        //add error checking here on api request

        var i;
        for (i = 0; i < amountOfCelebs; i++) {
            var currentCeleb = {celebrityId: body.CelebrityValues[i].celebId, celebrityName: body.CelebrityValues[i].name, celebrityPrice: body.CelebrityValues[i].price};
            //console.log(body.CelebrityValues[i].name);

            db.collection('celebs').insertOne(currentCeleb, function(err, result) {
                if (err) return console.log(chalk.red(err));
            });

            console.log(chalk.green(currentCeleb.celebrityName + ' added to users'));
        }

        res.redirect('/admin');


    });
});


app.post('/fetchandupdate', function(req, res) {

    request(celebrityBucksAPIOPtions, function (error, response, body) {
        if (error) throw error;

        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('Celebs found:', body.CelebrityValues.length); // Print the HTML for the Google homepage.

        amountOfCelebs = body.CelebrityValues.length;

        //add error checking here on api request

        var i;
        for (i = 0; i < amountOfCelebs; i++) {
            var currentCeleb = {celebrityId: body.CelebrityValues[i].celebId, celebrityName: body.CelebrityValues[i].name, celebrityPrice: body.CelebrityValues[i].price};
            //console.log(body.CelebrityValues[i].name);
            
            db.collection('celebs').find(currentCeleb).toArray(function(err, result) {
                console.log(result.length);

                if (result && result.length == 0)
                    console.log("Insert needs to be here! Need to insert " + body.CelebrityValues[i].name);
            })
        
        }
        res.redirect('/admin');
    })
});

app.post('/clearall', function(req, res) {
    db.collection('celebs').deleteMany({});
    console.log('Celebs DB emptied');
    
    res.redirect('/admin');
});

//Listen server
app.listen(port, function() {
    console.log(chalk.green('Server started and listening on port ' + port));
});


var celebrityBucksAPIOPtions = {
    uri: 'https://celebritybucks.com/developers/export/JSON',
    qs: {
        limit: '5' // -> uri + '?access_token=xxxxx%20xxxxx'
    },
    headers: {
    //    'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
};




var getCelebrityBucksAPIData = function() {
    return new Promise(function(resolve, reject) {
        request(celebrityBucksAPIOPtions)
            .then(function (data) {
                console.log(data.CelebrityValues.length + ' celebs gathered from API');
                resolve(data.CelebrityValues);
            })
            .catch(function (err) {
                console.log('API call failed ' + err);
            });
        });
};

let updateMongoDB = function(p) {
    return new Promise(function(resolve, reject) {

        let promises = []

        var i;
        for (i = 0; i < p.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                var currentCeleb = {celebrityId: p[i].celebId, celebrityName: p[i].name, celebrityPrice: p[i].price};
                console.log(p[i].name);
                db.collection('celebs').find({celebrityId: p[i].celebId}).toArray()
                .then(function(response) {
                    //resolve(response)
                    console.log(response)
                })
                .catch(function (err) {
                    console.log('Error: ' + err);
                });
            })
            )
        }

        return Promise.all(promises)
    })
}



