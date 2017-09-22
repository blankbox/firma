[![Codacy Badge](https://api.codacy.com/project/badge/Grade/afd34ce2e1d14813b9ca827f99a58b1a)](https://www.codacy.com/app/darren.looby/firma?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=blankbox/firma&amp;utm_campaign=Badge_Grade)

[![NSP Status](https://nodesecurity.io/orgs/blankbox/projects/c70296a5-7f00-43c7-b395-39a8654a531e/badge)](https://nodesecurity.io/orgs/blankbox/projects/c70296a5-7f00-43c7-b395-39a8654a531e)

# firma
Node.js based API framework.


# Getting started

## .env

Firma relies on a series of environment variables, loaded using dotenv.

Clone the sample and fill in your preferred values
```
cp .env.example .env
nano .env
```
Do not add .env to source control, and if you add additional variables make sure they are listed in the example.

## Running the server.
```
npm start
```
## Running tests

With the server Running
```
npm test
```

## Development DBs

docker pull bitnami/cassandra
docker pull bitnami/redis

docker start cassandra
docker start redis

Running bash in docker cassadra container - can run cqlsh / rediscli
docker exec -i -t cassandra /bin/bash
