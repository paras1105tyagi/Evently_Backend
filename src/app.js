'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error');
const requestContext = require('./middlewares/requestContext');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(requestContext);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use(errorHandler);

module.exports = app;
