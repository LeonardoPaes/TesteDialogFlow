const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const projectId = "teste-dialogflow-avdj"
const languageCode = 'pt-br';

var app = express();

const server = require('http').createServer(app);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('views'));
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.text({ limit: '50mb' }));

app.get('/',(req, res)=>{
    res.render('index')
})

app.post('/webhook', async function (req, res, next) {
    try {
        let { responseId = null, session = null } = req.body;
        let { action = null, queryText = null, parameters = null, outputContexts = null, intent = null } = req.body.queryResult
        let contexts = outputContexts.map(context => context.name.split("/")[6])
        let sessionid = outputContexts.map(context => context.name.split("/")[4])[0]
        console.log("Query text: " + queryText)
        console.log("Action: " + action)
        console.log("Parameters: " + parameters)
        console.log("Contexts: " + contexts)
        // Retrieving parameters from the request made by the agent

        // await updateIntent(intent.displayName, sessionid)
        let response = await handleResponses(action, queryText, contexts)
        let fulfillmentMessages = {
            "fulfillmentMessages": [
                {
                    "text": {
                        "text": [
                            response.text
                        ]
                    }
                }
            ],
            "outputContexts": response.context.map(context => {
                return {
                    "name": `${session}/contexts/${context.name}`,
                    "lifespanCount": context.lifespan || 3,
                    "parameters": {
                        parameters
                    }
                }
            })
        }
        console.log(response)
        // Sending back the results to the agent
        res.json(fulfillmentMessages)
    } catch (err) {
        return next(err)
    }
});

app.post("/dialogflow/query/", async (req, res, next) => {
    try {
        let { queryText, sessionId, contexts } = req.body
        sessionId = (!sessionId) ? uuid.v4() : sessionId
        contexts = (!contexts) ? [] : JSON.parse(contexts)

        console.log("***********************")
        console.log(sessionId, queryText, contexts)
        console.log("***********************")

        let response = await detectIntent(projectId, sessionId, queryText, contexts, languageCode)
        res.status(200).json({ response, sessionId })

    } catch (err) {
        return next(err)
    }
})

async function handleResponses(action, queryText, outputContexts) {
    return new Promise(async (resolve, reject) => {
        let responses = {
            "champion":{
                "garen":{
                    "text": "Meu coração e espada sempre por Damacia",
                    "context": [{ name: "championSelected", "lifespan": 3 }],
                },
                "zed":{
                    "text": "A lamina que não se vê é a mais mortifera",
                    "context": [{ name: "championSelected", "lifespan": 3 }],
                }
            }
        }
        let championName = queryText.toLowerCase();
        resolve(responses[action][championName]);
    })
}

async function detectIntent(projectId, sessionId, query, contexts, languageCode) {
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: languageCode,
            },
        },
    };

    if (contexts && contexts.length > 0) {
        request.queryParams = {
            contexts: contexts,
        };
    }

    console.log(request)
    const responses = await sessionClient.detectIntent(request);
    return responses[0];
}

let port = process.env.PORT;
if (port == null || port == "") {
    port = 443;
    console.log('Listening to port ' + port);
}
server.listen(port);
