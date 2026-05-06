'use server'

import {PushSubscription, sendNotification, setVapidDetails} from 'web-push'

function getRequiredEnv(name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY' | 'VAPID_PRIVATE_KEY' | 'VAPID_MAILTO') {
    const value = process.env[name]?.trim()

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
    }

    return value
}

function assertBase64UrlLike(value: string, name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY' | 'VAPID_PRIVATE_KEY', minLength: number) {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length < minLength) {
        throw new Error(
            `Invalid ${name}: expected a base64url-encoded VAPID key`
        )
    }
}

function getValidatedVapidConfig() {
    const mailto = getRequiredEnv('VAPID_MAILTO')
    const publicKey = getRequiredEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    const privateKey = getRequiredEnv('VAPID_PRIVATE_KEY')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailto)) {
        throw new Error('Invalid VAPID_MAILTO: expected an email address without the mailto: prefix')
    }

    assertBase64UrlLike(publicKey, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', 32)
    assertBase64UrlLike(privateKey, 'VAPID_PRIVATE_KEY', 32)

    return {
        mailto: `mailto:${mailto}`,
        publicKey,
        privateKey,
    }
}

const vapidConfig = getValidatedVapidConfig()

setVapidDetails(
    vapidConfig.mailto,
    vapidConfig.publicKey,
    vapidConfig.privateKey
)

let subscription: PushSubscription | null = null

export async function subscribeUser(sub: PushSubscription) {
    subscription = sub
    // In a production environment, you would want to store the subscription in a database
    // For example: await db.subscriptions.create({ data: sub })
    return {success: true}
}

export async function unsubscribeUser() {
    subscription = null
    // In a production environment, you would want to remove the subscription from the database
    // For example: await db.subscriptions.delete({ where: { ... } })
    return {success: true}
}

export async function sendPushNotification(message: string) {
    if (!subscription) {
        throw new Error('No subscription available')
    }

    try {
        await sendNotification(
            subscription,
            JSON.stringify({

                title: '5分後に次の試合が始まります！',
                body: message,
                icon: '/web-app-manifest-192x192.png',
            }),
            {
                headers: {
                    'Urgency': 'high',
                }
            }
        )
        return {success: true}
    } catch (error) {
        console.error('Error sending push notification:', error)
        return {success: false, error: 'Failed to send notification'}
    }
}