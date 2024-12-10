import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { threadId } = await req.json()
  const assistantId = process.env.ASSISTANT_ID

  if (!threadId || !assistantId)
    return Response.json(
      { error: 'Missing thread or assistant id' },
      { status: 400 }
    )

  const openai = new OpenAI()

  try {
    const encoder = new TextEncoder()

    // Define a readable stream to pass events to the client
    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // OpenAI stream for the assistant
        const run = openai.beta.threads.runs.stream(threadId, {
          assistant_id: assistantId,
        })

        // Handle the OpenAI stream events
        // TODO implement other outputs than text
        run
          .on('textDelta', (textDelta) => {
            const message = JSON.stringify({
              type: 'textDelta',
              text: textDelta.value,
            })
            console.log('Text delta:', message)
            controller.enqueue(encoder.encode(message))
          })
          // .on('toolCallCreated', (toolCall) => {
          //   const message = JSON.stringify({
          //     type: 'toolCallCreated',
          //     toolCall,
          //   })
          //   controller.enqueue(encoder.encode(`data: ${message}\n\n`))
          // })
          // .on('toolCallDelta', (toolCallDelta) => {
          //   if (toolCallDelta.type === 'code_interpreter') {
          //     if (toolCallDelta.code_interpreter.input) {
          //       const inputMessage = JSON.stringify({
          //         type: 'codeInterpreterInput',
          //         input: toolCallDelta.code_interpreter.input,
          //       })
          //       controller.enqueue(encoder.encode(`data: ${inputMessage}\n\n`))
          //     }
          //     if (toolCallDelta.code_interpreter.outputs) {
          //       const outputsMessage = JSON.stringify({
          //         type: 'codeInterpreterOutputs',
          //         outputs: toolCallDelta.code_interpreter.outputs,
          //       })
          //       controller.enqueue(
          //         encoder.encode(`data: ${outputsMessage}\n\n`)
          //       )
          //     }
          //   }
          // })
          .on('end', () => {
            controller.close()
          })
          .on('error', (error) => {
            console.error('OpenAI Stream Error:', error)
            controller.error(error)
          })
      },
    })

    // Return the readable stream as the response
    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    console.log(e)
    return Response.json({ error: e })
  }
}
