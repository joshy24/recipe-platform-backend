'use strict'

require ("dotenv").config()

const express = require("express")

const cors = require("cors")

const app = express()

app.use(express.json({ type: 'application/json' }));
app.use(express.urlencoded({extended: false}));

app.disable('x-powered-by');

app.use(function(req, res, next) {
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self';");
    next();
});

app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
    optionsSuccessStatus: 200
}));

//Routes Setup
const routes = require("./routes/routes")
app.use('/api/v1', routes)

module.exports = app;




