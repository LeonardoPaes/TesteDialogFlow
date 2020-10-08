var agent = {};

$("#send").click(()=>{
    let msg = $("#msg").val();
    dialogflowQuery(msg, agent).then(({ response, sessionId }) => {
        console.log(response)

        agent = {
            sessionId: sessionId,
            contexts: JSON.stringify(response.queryResult.outputContexts) //response.queryResult.outputContexts.map(context => context.name.split("/")[6])
        }
    }).catch(err => {
        console.log(err)
    })

})

function dialogflowQuery(queryText, agent) {
    return new Promise((resolve, reject) => {
        let { sessionId = null, contexts = [] } = agent

        console.log(queryText, sessionId, contexts)

        // Executa AJAX
        $.ajax({
            type: 'POST',
            url: '/dialogflow/query/',
            data: {
                queryText: queryText,
                sessionId: sessionId,
                contexts: contexts
            },
            success: function (data) {
                resolve(data)
            },
            error: function (err) {
                reject(err)
            }
        });
    });
}