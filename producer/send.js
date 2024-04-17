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

;(async () => {
    const config = readConfig()
    const connection = await amqp.connect(env.url)
    const channel = await connection.createChannel()
    const queueName = 'hello'
    await assertQueue(config, queueName, channel) // assert queue into existence
    const message = "Hello, World!"
    channel.sendToQueue(queueName, Buffer.from(message))
    console.log(" [x] Sent %s", message)

    setTimeout(function() {
        connection.close()
        process.exit(0)
    }, 500)
})()
