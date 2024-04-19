#!/usr/bin/env node
import amqp from 'amqplib'
import { env, config } from './config.js'

const consumer = message => {
  console.log(" [x] Received %s", message.content.toString())
}

;(async () => {
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()
  const { queue: queueName } = await config.assertQueue('hello', channel) // assert queue into existence

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName)
  const consumerOptions = { noAck: true }
  channel.consume(queueName, consumer, consumerOptions)
})()
