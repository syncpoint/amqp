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

;(async () => {
    const config = readConfig()
    const connection = await amqp.connect(env.url)
    const channel = await connection.createChannel()
    const exchangeName = 'events'
    await assertExchange(config, exchangeName, channel)
    const message = `event@${new Date()}`
    const routingKey = '' // ignored for fanout
    channel.publish(exchangeName, routingKey, Buffer.from(message))
    console.log(" [x] Sent %s", message)

    setTimeout(function() {
        connection.close()
        process.exit(0)
    }, 500)
})()
