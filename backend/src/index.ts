import express, { response } from "express"
import Together from 'together-ai';
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
require('dotenv').config()

const app = express();
app.use(express.json())

const client = new Together({
  apiKey: process.env['TOGETHER_API_KEY'], 
});


app.post("/template" ,async (req , res) =>{


  let fullResponse = '';
  const prompt = req.body.prompt;

  const response = await client.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [
          { 
            role: 'system' , 
            content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
          },
          { role: 'user', content: prompt }

        ],
        temperature: 1,
        max_tokens: 200,
        stream: true,
        });

        for await (const chunk of response) {
          if (chunk.choices[0]?.delta?.content) {
              fullResponse += chunk.choices[0].delta.content;
          }
      }
      
      const answer = fullResponse.toString().toLowerCase();

    if(answer === "react"){
      res.json({
        prompt: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [reactBasePrompt]
      })
      return;
    }

    if(answer === "node"){
      res.json({
        prompt: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [nodeBasePrompt]
      })
      return;
    }

    res.status(403).json({message: "You cant access this"})
    return;
})


app.post("/chat", async(req, res)=> {

  let fullResponse = "";
  const messages = req.body.messages;
  //@ts-ignore
  const response = await client.chat.completions.create({
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    messages: messages,
    system: getSystemPrompt(),
    stream: true,
    temperature: 1,
    max_tokens: 5000,
    
   
  });
  
  for await (const chunk of response) {
    if (chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
    }
}
  const finalOutput = fullResponse.toString()
  console.log(finalOutput)

  res.json({
    response: finalOutput
  })
})


app.listen(3000);


