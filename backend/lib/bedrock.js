const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime')

// Nova Micro — cheapest Bedrock model, great for dev/testing
// $0.000035 per 1K input tokens — your $200 credits will last months
const MODEL_ID = 'amazon.nova-micro-v1:0'

// Client auto-uses Lambda's IAM role in production,
// or your local AWS credentials (~/.aws/credentials) during dev
const client = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1', // Nova Micro available in us-east-1
})

/**
 * Ask Bedrock a question and get a text response back.
 * @param {string} prompt - The user prompt to send
 * @param {string} [systemPrompt] - Optional system instruction
 * @returns {Promise<string>} - The model's text response
 */
async function askBedrock(prompt, systemPrompt = '') {
  const payload = {
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 4096,
      temperature: 0.1,
    },
  }

  // Add system prompt if provided
  if (systemPrompt) {
    payload.system = [{ text: systemPrompt }]
  }

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  })

  const response = await client.send(command)
  const result = JSON.parse(Buffer.from(response.body).toString('utf8'))

  // Nova Micro response shape
  return result.output?.message?.content?.[0]?.text || ''
}

module.exports = { askBedrock }