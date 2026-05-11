require('dotenv').config();
const express = require('express');
const cors = require('cors');
const configViewEngine = require('./config/viewEngine');
const connection = require('./config/database');
const { getHomepage } = require('./controllers/homeController');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

configViewEngine(app);

const webAPI = express.Router();
webAPI.get("/", getHomepage);
app.use('/', webAPI);

app.use('/v1/api/', apiRoutes);

app.listen(port, () => {
    console.log(`Backend Nodejs App listening on port ${port}`);
});