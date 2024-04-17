RabbitMQ/Docker Test Environment

### Examples

* producer/consumer (Node.js): Simple Queue
* publisher/subscriber (Node.js): Publish/Subscribe Exchange
* dispatcher/worker (Node.js): Durable Queue with persistent message and consumer acknowledgement

### Docker Compose

* Exchange/Queue configuration: ./config.json
* Bridged Network
* RabbitMQ Healthcheck (condition: service_healthy)

#### Images
* producer (one-shot)
* consumer (1 service instance)
* publisher (one-shot)
* subscriber (3 service instances)
* dispatcher (1 service instance, message burst ever 10s with 50 messages each)
* worker (2 service instances, unreliable i.e. 65% acknowledgement)
