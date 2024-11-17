"use server"

export async function sendToPushBullet(title: string, body: string): Promise<void> {
  const accessToken = process.env.PUSHBULLET_ACCESS_TOKEN; // Store this in .env.local

  console.log('Sending push to Pushbullet:', title, body);

  if (!accessToken) {
    throw { status: 400, message: 'Pushbullet access token is missing in environment variables' };
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, message: `Pushbullet API error: ${errorData.error.message}` };
    }

    const data = await response.json();
    console.log('Push sent successfully:', data);
    return data;
  } catch (error: any) {
    if (!error.status) {
      error.status = 500; // Default to 500 if no status is provided
    }
    throw error;
  }
}