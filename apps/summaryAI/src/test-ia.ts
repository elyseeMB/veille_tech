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
      modelId: "us.meta.llama3-8b-instruct-v1:0", // ← préfixe us.
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt:
          "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\nDis moi bonjour en une phrase.<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        max_gen_len: 512,
        temperature: 0.7,
      }),
    }),
  );
  const result = JSON.parse(new TextDecoder().decode(response.body));
  console.log(result.generation); // ← Llama retourne "generation", pas "content"
}

main();
