const express = require('express');
const Couchbase = require('couchbase');
const GraphQL = require('express-graphql');
const BuildSchema = require('graphql').buildSchema;
const UUID = require('uuid');
const port = process.env.PORT || 9000;

const server = express();

let cluster = new Couchbase.Cluster('couchbase://localhost')
cluster.authenticate('Administrator', 'BvpcRpJZT68i8y4');
let bucket = cluster.openBucket('example')

let schema = BuildSchema(`
    type Query {
        account(id: String!): Account,
        accounts: [Account],
        blog(id: String!): Blog,
        blogs(account: String!): [Blog]
    }

    type Account {
        id: String,
        firstname: String,
        lastname: String
    }

    type Blog {
        id: String,
        account: String!,
        title: String,
        content: String
    }

    type Mutation {
        createAccount(firstname: String!, lastname: String!): Account
        createBlog(account: String!, title: String!, content: String!): Blog
    }
`);
let resolvers = {
    createAccount: (data) => {
        let id = UUID.v4();
        data.type = "account";
        return new Promise((resolve, reject) => {
            bucket.insert(id, data, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve({ "id": id });
            });
        });
    },
    createBlog: (data) => {
        var id = UUID.v4();
        data.type = "blog";
        return new Promise((resolve, reject) => {
            bucket.insert(id, data, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve({ "id": id });
            });
        });
    },
    account: data => {
        let id = data.id;
        return new Promise((resolve, reject) => {
            bucket.get(id, (error, result) => {
                if (error) {
                    return reject(error)
                }
                resolve(result.value);
            })
        })
    },
    accounts: () => {
        var statement = `SELECT META(account).id, account.* FROM ${bucket._name} AS account WHERE account.type = 'account'`;
        var query = Couchbase.N1qlQuery.fromString(statement);
        return new Promise((resolve, reject) => {
            bucket.query(query, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    },
    blog: (data) => {
        var id = data.id;
        return new Promise((resolve, reject) => {
            bucket.get(id, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve(result.value);
            });
        });
    },
    blogs: (data) => {
        var statement = `SELECT META(blog).id, blog.* FROM ${bucket._name} AS blog WHERE blog.type = 'blog' AND blog.account = $account`;
        var query = Couchbase.N1qlQuery.fromString(statement);
        return new Promise((resolve, reject) => {
            bucket.query(query, { "account": data.account }, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    }
};

server.use('/graphql', GraphQL({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
}));

server.listen(port, () => console.log(`Listening on port: ${port}`))
// yarn start and navigate to localhost:9000/graphql