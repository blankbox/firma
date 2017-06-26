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
Do not add .env to source control, and if you add additonal variables make sure they are listed in the example.

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

docker restart cassandra
docker restart redis
