'use server'

import {PushSubscription, sendNotification, setVapidDetails} from 'web-push'

setVapidDetails(
    `mailto:${process.env.VAPID_MAILTO || 'admin@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
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
                icon: 'https://dev.sho800.net/web-app-manifest-192x192.png',
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