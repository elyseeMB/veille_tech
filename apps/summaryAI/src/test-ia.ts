import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const client = new BedrockRuntimeClient({
  region: "us-east-1",
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10_000,
  }),
});

async function main() {
  const response = await client.send(
    new InvokeModelCommand({
      modelId: "huggingface-textgeneration2-gpt-neox-20b-fp16",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: "Dis moi bonjour en une phrase.",
          },
        ],
      }),
    }),
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  console.log(result.content[0].text);
}

main();
