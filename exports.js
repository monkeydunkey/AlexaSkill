/**

 Copyright 2016 Brian Donohue.

*/

'use strict';
var config = require('./config.js'),
    getSongInfo = require('./APIcall.js');
// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.

var ordinalMap = {
  'first' : 1,
  'second' : 2,
  'third' : 3,
  'fourth' : 4,
  'fifth' : 5,
  'sixth' : 6,
  'seventh' : 7,
  'eighth' : 8,
  'ninth' : 9,
  'tenth' : 10,
  'eleventh' : 11,
}
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    var cardTitle = "Hello, World!"
    var speechOutput = "You can tell Hello, World! to say Hello, World!"
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", true));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == 'getsong') {
        handleGetSongRequest(intent, session, callback);
    }
    else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

function handleGetSongRequest(intent, session, callback) {
    var showname = intent.slots.tvshow.value,
        season = intent.slots.season.value,
        episode = intent.slots.episode.value,
        episodeAlter = intent.slots.episodeAlter.value,
        episode = (!!episode) ? episode : ordinalMap[episodeAlter];
        console.log('hello');

          console.log({'tvshow':showname, 'season':season, 'episode': episode});
          getSongInfo({'tvshow':showname, 'season':season, 'episode': episode}, function(obj, queryString){
            if (!!queryString === false){
              ret_str = "Sorry, Couldnt understand the command";
              callback(session.attributes,
                  buildSpeechletResponseWithoutCard(ret_str, "", "true"));
            } else {
              replyWithSuggestion(session, callback, obj);
            }
          })
}

function replyWithSuggestion(session, callback, songs) {
  var length = songs.songs.length,
      resp = (length == 1) ? 'The name of the song is ' : 'There were a total of ' + length + 'sound tracks in that episode. Following are their names ';
  for(var i=0; i < length ; i++){
    resp += songs.songs[i].name;
  }
  console.log(resp);
  callback(session.attributes,
      buildSpeechletResponseWithoutCard(resp, "", "true"));
}
// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
