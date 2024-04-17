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

const assertExchange = R.curry(
  (config, exchangeName, channel) => {
    const { type, options } = config.exchange[exchangeName]
    return channel.assertExchange(exchangeName, type, options)
  }
)

const consumer = message => {
  console.log(" [x] Received %s", message.content.toString())
}

;(async () => {
  const config = readConfig()
  const connection = await amqp.connect(env.url)
  const channel = await connection.createChannel()

  const exchangeName = 'events'
  await assertExchange(config, exchangeName, channel)

  // temporary queue with auto-generated name; closes with connection.
  const q = await channel.assertQueue('', { exclusive: true })
  await channel.bindQueue(q.queue, exchangeName, '')

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue)
  const consumerOptions = { noAck: true }
  channel.consume(q.queue, consumer, consumerOptions)
})()
