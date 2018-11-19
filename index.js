//Add requires
const express = require('express');
const bodyParser = require('body-parser');
const chalk = require('chalk');
var moment = require('moment');
var request = require('request');
const MongoClient = require('mongodb').MongoClient;

const app = express();

//Set global variables
let port = process.env.PORT || 8080;
mongoURL = 'mongodb://system:Password5@ds024548.mlab.com:24548/celebstock';
const mongoDBName = 'celebstock';

//Allow app to use Public directory for CSS
app.use(express.static(__dirname + '/public'));
//Allow app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));

//Set view engine to EJS
app.set('view engine', 'ejs');

//Mongo connection
MongoClient.connect(mongoURL, { useNewUrlParser: true },function(err, database) {
    if (err) return console.log(chalk.red(err));
    db = database.db(mongoDBName);
    console.log(chalk.green('MongoDB connected'));
})

//Homepage render
app.get('/', function(req, res) {
    res.redirect('/all');
});

//Admin render
app.get('/admin', function(req, res) {
    res.render('pages/admin.ejs');
});

//All render
app.get('/all', function(req, res) {
    db.collection("celebs").find({}).sort( { celebrityPrice: -1 } ).toArray(function(err, result) {
        if (err) throw err;

        if (result.length == 0) {
            console.log("No celebs in DB");
            res.redirect('/admin');
        } else {
            res.render('pages/all.ejs', { celebList: result });
        }

    })
});

app.post('/freshstart', function(req, res) {
    console.time('Fresh start completed');
    db.collection('celebs').deleteMany({});
    console.log(chalk.blue('Celebs DB emptied'));

    request(celebrityBucksAPIOPtions, function (error, response, body) {
        if (error) throw error;

        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log(chalk.blue('Celebs found:', body.CelebrityValues.length)); // Print the HTML for the Google homepage.

        amountOfCelebs = body.CelebrityValues.length;

        //add error checking here on api request

        var i;
        for (i = 0; i < amountOfCelebs; i++) {
            var currentCeleb = {celebrityId: body.CelebrityValues[i].celebId, celebrityName: body.CelebrityValues[i].name, celebrityPrice: body.CelebrityValues[i].price/1000, lastUpdated: moment().format('H:mm:ss, Do MMMM YYYY')};
            //console.log(body.CelebrityValues[i].name);

            db.collection('celebs').insertOne(currentCeleb, function(err, result) {
                if (err) return console.log(chalk.red(err));
            });

            console.log(chalk.green(currentCeleb.celebrityName + ' added'));
        }
        console.timeEnd('Fresh start completed');
        res.redirect('/admin');


    });
});


//app.post('/clearall', function(req, res) {
//    db.collection('celebs').deleteMany({});
//    console.log('Celebs DB emptied');  
//    res.redirect('/admin');
//});




app.post('/fetchandupdate', function(req, res) {

    request(celebrityBucksAPIOPtions, function (error, response, body) {
        if (error) throw error;

        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log(chalk.blue('Celebs found:', body.CelebrityValues.length)); // Print the HTML for the Google homepage.

        amountOfCelebs = body.CelebrityValues.length;

        //add error checking here on api request

        var i;
        for (i = 0; i < amountOfCelebs; i++) {
            var currentCeleb = {celebrityId: body.CelebrityValues[i].celebId, celebrityName: body.CelebrityValues[i].name, celebrityPrice: body.CelebrityValues[i].price/1000, lastUpdated: moment().format('H:mm:ss, Do MMMM YYYY')};
            //console.log(body.CelebrityValues[i].name);

            db.collection('celebs').findOneAndUpdate({celebrityId: body.CelebrityValues[i].celebId}, {$set: currentCeleb}, {upsert: true}, function(err, result) {
                if (err) return console.log(chalk.red(err));

                if (result.ok === 1 && result.lastErrorObject.updatedExisting === true) {
                    console.log(result.value.celebrityName + ' updated')
                } else if (result.ok === 1 && result.lastErrorObject.updatedExisting === false) {
                    console.log('New celeb added');
                } else {
                    console.log('Error adding ' + result.value.celebrityName);
                }
            });


        }

        res.redirect('/admin');


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



