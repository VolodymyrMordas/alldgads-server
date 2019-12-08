const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const USER_SECRET = 'USER_SECRET';

const typeDefs = gql`
    type User {
        name: String
        email: String
        password: String
    }

    type Query {
        users: [User]
    }

    type Mutation {
        signUp(name: String, email: String, password: String): User
        login(name: String, password: String): User
    }
`;

const db = [];

const resolvers = {
  Query: {
    users: (_, __, ctx) => {
      console.log(ctx.req.username);
      return db;
    },
  },
  Mutation: {
    signUp: (_, user) => {
      db.push(user);

      return user;
    },
    login: (_, { name, password }, ctx) => {
      const user = db.find((currentUser) => currentUser.name === name);

      if (!user) {
        throw new Error(`No such user found with this name ${name}`);
      }
      const isUserValid = user.password === password;

      if (!isUserValid) {
        throw new Error(`password is not valid!`);
      }

      const token = jwt.sign({ username: 'name' }, USER_SECRET);
      ctx.res.cookie('token', token, { maxAge: 900000, httpOnly: true });

      return user;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return { ...req }
  }
});

const app = express();

const corsOptions = {
  origin: 'http://localhost:4000/',
  credentials: true
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.use((req, res, next) => { // checks for user in cookies and adds userId to the requests
  const { token } = req.cookies;
  if (token) {
    const { username } = jwt.verify(token, USER_SECRET);
    req.username = username;
  }

  next();
});

server.applyMiddleware({
  app,
  path: '/',
  cors: false, // disables the apollo-server-express cors to allow the cors middleware use
});

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
