#!/usr/bin/env node
import amqp from 'amqplib'
import { env, config } from './config.js'

;(async () => {
    const connection = await amqp.connect(env.url)
    const channel = await connection.createChannel()
    const { queue: queueName } = await config.assertQueue('hello', channel)
    const message = "Hello, World!"
    channel.sendToQueue(queueName, Buffer.from(message))
    console.log(" [x] Sent %s", message)

    setTimeout(function() {
        connection.close()
        process.exit(0)
    }, 500)
})()
