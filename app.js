const express = require('express');
const couchbase = require('couchbase');
const GraphQL = require('express-graphql');
const BuildSchema = require('graphql').buildSchema;
const UUID = require('uuid');
const port = process.env.PORT || 9000;

let schema = BuildSchema(``);
let resolvers = {};
let server = express();

server.use('/graphql', GraphQL({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
}));

server.listen(port, () => console.log(`Listening on port: ${port}`))