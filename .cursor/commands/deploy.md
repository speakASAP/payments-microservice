# Production Deployment

## Task: Deploy our application on production

## Details needed

Our application payment.statex.cz consists of several microservices in /home/statex/ (logging, nginx, database, notifications). Access via ssh statex.

ssh statex "cd payments-microservice && git pull"

pull github repos using ssh statex "cd payments-microservice && git pull && cd ../nginx-microservice && git pull && docker exec nginx-microservice nginx -t && docker exec nginx-microservice nginx -s reload"
In case there will be local file changes they needs to be checked against github version and git repo should be corrected with working codebase.

nginx-microservice handles blue/green deployments.
Use the same nginx and database setup to manage payments-microservice:
Run: ssh statex "cd nginx-microservice && ./scripts/blue-green/deploy.sh payments-microservice"

database-server is the PostgreSQL database for the app.

Applications are located at /Users/sergiystashok/Documents/GitHub/ (prod: /home/statex).

Configs and logs are in project root folders and ./logs/.
Environment variables are protected and stored within root folder for each project. Use command cat .env to see it

This modular architecture improves development and separation of services.

Success is when payments-microservice is accessible without console or log errors.
