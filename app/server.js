const express = require('express');
const bodyParser = require ('body-parser');
const path = require('path');
const cookieSession = require('cookie-session');
const createError = require('http-errors');
const routes = require('./routes')

// Initialize the server object
const server = express();
const PORT = 5000;

// Communicate with the chaincode by create a hyperledgerApp object
const HyperledgerApp = require('./hyperledgerApp.js');
const hyperledgerApp = new HyperledgerApp();

server.set('trust proxy', 1);

server.use(cookieSession({
    name: 'session',
    keys: ['Jason238497mkasns', 'asdjasni673mes345'],
}))

server.use(express.static(__dirname + '/public'));

server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// bodyParse setup
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());

// Use express router to define endpoints of the server
server.use('/', routes({hyperledgerApp}));

server.use((req, res, next) => {
    return next(createError(404, "File not found"));
})

server.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status);
    res.send(err.message);
})

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})