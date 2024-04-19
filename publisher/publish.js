#!/usr/bin/env node
import amqp from 'amqplib'
import { env, config } from './config.js'

;(async () => {
    const connection = await amqp.connect(env.url)
    const channel = await connection.createChannel()
    const { exchange: exchangeName } = await config.assertExchange('events', channel)
    const message = `event@${new Date()}`
    const routingKey = '' // ignored for fanout
    channel.publish(exchangeName, routingKey, Buffer.from(message))
    console.log(" [x] Sent %s", message)

    setTimeout(function() {
        connection.close()
        process.exit(0)
    }, 500)
})()
