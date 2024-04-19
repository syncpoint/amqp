#!/usr/bin/env node
import amqp from 'amqplib'
import { env, config } from './config.js'

const consumer = message => {
  const { content, fields } = message
  console.log(" [x] Received %s", fields.routingKey, content.toString())
}

;(async () => {
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()
  const { exchange: exchangeName } = await config.assertExchange('emitter', channel)

  // named, durable queue:
  const { queue: queueName } = await config.assertQueue('listener-a', channel)
  await channel.bindQueue(queueName, exchangeName, 'a.*')

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName)
  channel.consume(queueName, consumer, { noAck: true })
})()
