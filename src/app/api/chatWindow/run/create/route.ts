import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { FunctionToolCall } from 'openai/resources/beta/threads/runs/steps'

// Define a function to fetch product data from your API
// TODO move somewhere else
async function fetchProducts() {
  try {
    // Replace with your actual products API endpoint
    const response = await fetch(
      'https://automations.lama-labs.com/webhook/shopify-test'
    )
    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    return { error: 'Unable to retrieve product data' }
  }
}

export async function POST(req: NextRequest) {
  const { threadId, assId } = await req.json()
  const assistantId = assId || process.env.ASSISTANT_ID

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

        if (!run) {
          throw new Error('Run is null')
        }

        const tools_called: { [key: string]: FunctionToolCall.Function } = {}
        let using_tools = false

        // Handle the OpenAI stream events
        run
          // Messages from the assistant
          .on('textDelta', (textDelta) => {
            const message = JSON.stringify({
              type: 'textDelta',
              text: textDelta.value,
            })
            controller.enqueue(encoder.encode(message))
          })
          // Start of tool call request
          .on('toolCallCreated', (toolCall) => {
            console.log('Tool call created:', toolCall)
            if (toolCall.type === 'function' && toolCall.function) {
              tools_called[toolCall.id] = toolCall.function
            }
          })
          // // End of tool call request (for debugging)
          .on('toolCallDone', (toolCall) => {
            console.log('Tool call done:', toolCall)
          })
          // Listen for events from the assistant
          .on('event', async (event) => {
            // Check if the assistant requires action (tool call)
            if (event.event === 'thread.run.requires_action') {
              const tool_outputs = []
              using_tools = true

              for (const tool_key in tools_called) {
                // Decide which tool to call
                // const tool_name = tools_called[tool_key].name
                // const tool_args = JSON.parse(tools_called[tool_key].arguments)

                const tool_output = await fetchProducts()

                tool_outputs.push({
                  tool_call_id: tool_key,
                  output: JSON.stringify(tool_output),
                })
              }

              // Submit the tool outputs to the assistant
              openai.beta.threads.runs
                .submitToolOutputsStream(threadId, event.data.id, {
                  tool_outputs,
                }) // Return the tool outputs to the user
                .on('textDelta', (textDelta) => {
                  const message = JSON.stringify({
                    type: 'textDelta',
                    text: textDelta.value,
                  })
                  controller.enqueue(encoder.encode(message))
                }) // End the stream
                .on('end', () => {
                  if (controller.desiredSize !== null) {
                    controller.close()
                  }
                })
            }
          })
          // End the stream if tool was not used
          .on('end', () => {
            if (controller.desiredSize !== null && !using_tools) {
              controller.close()
            }
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
    console.error(e)
    return Response.json({ error: e })
  }
}
