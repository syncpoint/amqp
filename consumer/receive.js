#!/usr/bin/env node
import fs from 'fs'
import amqp from 'amqplib'
import * as R from 'ramda'

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

const consumer = message => {
  console.log(" [x] Received %s", message.content.toString())
}

;(async () => {
  const config = readConfig()
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()
  const queueName = 'hello'
  await assertQueue(config, queueName, channel) // assert queue into existence

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName)
  const consumerOptions = { noAck: true }
  channel.consume(queueName, consumer, consumerOptions)
})()
