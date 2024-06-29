import express from 'express';
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import axios from "axios";
import fs from 'node:fs';

let votes = { 
                option1: 0, 
                option2: 0 
            };

//console.log(votes.option1=+1);
const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url))
//const __dirname = process.cwd(); // Use process.cwd() to get the current working directory

let dummyResponse = '';

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'app.html'));
});

io.on('connection', (socket) => {
    console.log('New user is connected');
    

    socket.on('disconnect', () => {
        console.log('New user disconnected');
    });

    socket.on('chat message', async (msg) => {
        try {
        // Fetch responses from OpenAI
        const [codeResponse, codeResponse2] = await Promise.all([
            fetchOpenAIResponses(msg),
            fetchOpenAIResponses(msg)
        ]);

        dummyResponse = codeResponse;
        
        // Emit responses to clients
        io.emit('chat message', codeResponse);        
        io.emit('chat message', codeResponse2);

        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    });

    socket.on('vote', (optionSelected) => {
        const pathFile = './code1.js';
        if(optionSelected === 1){
            votes.option1=votes.option1 + 1;
            if(votes.option1 === 2){
                fs.writeFile(pathFile, dummyResponse, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing to file', err);
                    } else {
                        console.log(`Response written to ${pathFile} successfully`);
                        io.emit('final action', `Code wrote`);
                    }
                });
            }
        }
        if(optionSelected === 2){
            votes.option2 = votes.option2 + 1;
            if(votes.option2 === 2){
                fs.writeFile(pathFile, dummyResponse, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing to file', err);
                    } else {
                        console.log(`Response written to ${pathFile} successfully`);
                        io.emit('final action', `Code wrote`);
                    }
                });
            }
        }

        //io.emit('vote count', votes);

    });

    io.emit('vote count', votes);

});

const fetchOpenAIResponses = async (prompt) => {
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model:  "gpt-3.5-turbo",
            //response_format: { "type": "json_object" },
            messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant designed to create quality code. you just show the code to copy and paste, no opinions about it, no mention programming language neither",
                },
                { role: "user", content: prompt },
              ],
            max_tokens: 600,
            temperature: 0.5,
        },
        {
            headers: {
              Authorization: `Bearer sk-00kV6ghhtgDm9L`,
              "Content-Type": "application/json",
            },
          }
        )
        const apiResponse = response.data.choices[0].message.content.trim();
        const cleanedResponse = extractJavaScriptCode(apiResponse);

        return cleanedResponse;
    } catch (error) {
        console.error("Error fetching OpenAI response:", error);
        return [];
    }
}


const extractJavaScriptCode = (response) => {
    response = response.replace(/^```(javascript|js)/, '').trim();
    response = response.replace(/```$/, '').trim();
    return response;
}


server.listen(3000, () => {
    console.log(`Server listening on port: 3000 👾`)
});