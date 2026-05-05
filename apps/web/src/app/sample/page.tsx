'use client'

import {useEffect, useState} from 'react'
import {sendPushNotification, subscribeUser, unsubscribeUser} from './actions'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(
        null
    )
    const [message, setMessage] = useState('')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })
        const sub = await registration.pushManager.getSubscription()
        if (sub) {
            const serializedSub = JSON.parse(JSON.stringify(sub))
            await subscribeUser(serializedSub)
        }
        setSubscription(sub)
    }

    async function subscribeToPush() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
        })
        setSubscription(sub)
        const serializedSub = JSON.parse(JSON.stringify(sub))
        await subscribeUser(serializedSub)
    }

    async function unsubscribeFromPush() {
        await subscription?.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
    }

    async function sendTestNotification() {
        if (subscription) {
            await sendPushNotification(message)
            setMessage('')
        }
    }

    if (!isSupported) {
        return <p>Push notifications are not supported in this browser.</p>
    }

    return (
        <div>
            <h3>Push Notifications</h3>
            {subscription ? (
                <>
                    <p>You are subscribed to push notifications.</p>
                    <button onClick={unsubscribeFromPush}>Unsubscribe</button>
                    <input
                        type="text"
                        placeholder="Enter notification message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button onClick={sendTestNotification}>Send Test</button>
                </>
            ) : (
                <>
                    <p>You are not subscribed to push notifications.</p>
                    <button onClick={subscribeToPush}>Subscribe</button>
                </>
            )}
        </div>
    )
}

function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [promptEvent, setPromptEvent] = useState<any>(null);

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        )

        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

        const handler = (e: Event) => {
            // beforeinstallpromptは, 既にインストールされている場合は発火しないことに注意.
            e.preventDefault();
            setPromptEvent(e as any);
        };
        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, [])

    if (isStandalone) {
        return null // Don't show install UI if already installed
    }

    if (!isIOS && !promptEvent) {
        return null // Non-iOS: only show if install prompt is available
    }

    return (
        <div>
            <h3>Install App</h3>
            {promptEvent && (
                <button
                    onClick={() => {
                        try {
                            promptEvent.prompt();
                        } catch (err) {
                            console.error('Failed to show install prompt:', err);
                        }
                    }}
                >
                    Add to Home Screen
                </button>
            )}
            {isIOS && (
                <p>
                    To install this app on your iOS device, tap the share button
                    <span role="img" aria-label="share icon">
            {' '}
                        ⎋{' '}
          </span>
                    and then "Add to Home Screen"
                    <span role="img" aria-label="plus icon">
            {' '}
                        ➕{' '}
          </span>.
                </p>
            )}
        </div>
    )
}

export default function Page() {
    return (
        <div>
            <PushNotificationManager/>
            <InstallPrompt/>
        </div>
    )
}