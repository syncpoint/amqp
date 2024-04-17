#!/usr/bin/env node
import fs from 'fs'
import amqp from 'amqplib'
import * as R from 'ramda'
import { setTimeout } from 'timers'

const env = {}
env.RMQHOST = process.env.RMQHOST || 'localhost'
env.url = `amqp://${env.RMQHOST}`

const readJSON = R.tryCatch(
  filename => JSON.parse(fs.readFileSync(filename, 'utf8')),
  R.always(null)
)

const readConfig = () =>
  ['/opt/config.json', '../config.json']
    .reduce((acc, filename) =>
      acc ? acc : readJSON(filename),
      null
    )

const assertQueue = R.curry(
  (config, queueName, channel) =>
    channel.assertQueue(queueName, config.queue[queueName])
)

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
  const config = readConfig()
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()
  const queueName = 'tasks'
  await assertQueue(config, queueName, channel) // assert queue into existence

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName)
  const consumerOptions = { noAck: false } // require explicit acknowledgment
  channel.consume(queueName, consumer(channel), consumerOptions)
})()
