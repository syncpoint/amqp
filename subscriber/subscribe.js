#!/usr/bin/env node
import amqp from 'amqplib'
import { env, config } from './config.js'

const consumer = message => {
  console.log(" [x] Received %s", message.content.toString())
}

;(async () => {
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()
  const { exchange: exchangeName } = await config.assertExchange('events', channel)

  // temporary queue with auto-generated name; closes with connection.
  const q = await channel.assertQueue('', { exclusive: true })
  await channel.bindQueue(q.queue, exchangeName, '')

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue)
  const consumerOptions = { noAck: true }
  channel.consume(q.queue, consumer, consumerOptions)
})()
