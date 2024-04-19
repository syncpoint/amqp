#!/usr/bin/env node
import amqp from 'amqplib'
import * as R from 'ramda'
import { env, config } from './config.js'

const consumer = R.curry((channel, message) => {
  const timeout = Math.ceil(Math.random() * 20)
  setTimeout(() => {
    const reject = Math.random() > 0.65
    if (reject) channel.nack(message)
    else channel.ack(message)

    console.log(" [x] Handled %s", message.content.toString(), reject ? 'NACK' : 'ACK')
  }, timeout)
})

;(async () => {
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()
  const { queue: queueName } = await config.assertQueue('tasks', channel)

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName)
  const consumerOptions = { noAck: false } // require explicit acknowledgment
  channel.consume(queueName, consumer(channel), consumerOptions)
})()
