const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const moongoose = require('mongoose');
require('dotenv').config();

// app.use(cors());    
// app.options('*', cors());

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true })); 
app.get('/api/products', (req, res) => {
    res.send("refresh");
});
app.listen(4000);