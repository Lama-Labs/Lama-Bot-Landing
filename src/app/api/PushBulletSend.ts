'use server'
interface PushbulletError {
  status: number
  message: string
}

export async function sendToPushBullet(
  title: string,
  body: string
): Promise<void> {
  const accessToken = process.env.PUSHBULLET_ACCESS_TOKEN
  const channelId = process.env.PUSHBULLET_CHANNEL_ID

  console.log('Sending push to Pushbullet:', title, body)

  if (!accessToken) {
    throw {
      status: 400,
      message: 'Pushbullet access token is missing in environment variables',
    } as PushbulletError
  }

  if (!channelId) {
    throw {
      status: 400,
      message: 'Pushbullet channel id is missing in environment variables',
    } as PushbulletError
  }

  try {
    const response = await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'note',
        title,
        body,
        channel_tag: channelId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw {
        status: response.status,
        message: `Pushbullet API error: ${errorData.error.message}`,
      } as PushbulletError
    }

    const data = await response.json()
    console.log('Push sent successfully:', data)
    return data
  } catch (error) {
    const customError = error as PushbulletError
    if (!customError.status) {
      customError.status = 500 // Default to 500 if no status is provided
    }
    throw customError
  }
}
