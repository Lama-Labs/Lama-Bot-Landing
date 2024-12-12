import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('Request body:')
  try {
    const { question, pageContent }: { question: string; pageContent: string } =
      await request.json()

    // Construct prompt
    const prompt = `this is the question: ${question}, this is the website data the question was published on: ${pageContent}`
    console.log('Prompt:', prompt)

    // Make the API call to the external streaming endpoint
    const streamResponse = await fetch('http://localhost:3000/api/lorem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add API key here if needed, e.g., `Authorization: 'Bearer YOUR_API_KEY'`
      },
      body: JSON.stringify({ prompt }),
    })

    // Check if the response is a readable stream
    if (!streamResponse.body) {
      throw new Error('The response does not contain a readable stream')
    }

    const encoder = new TextEncoder()

    // Define the readable stream that will send data back to the client
    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = streamResponse.body!.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Decode the streamed content here if necessary, this is simplified as an example
            const content = new TextDecoder().decode(value)
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the response' },
      { status: 500 }
    )
  }
}
