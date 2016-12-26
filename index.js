'use strict';

const https = require('https');

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */

 var config = {
     API_ENDPOINT:'https://www.tunefind.com/api/v1/show/',
     API_DOMAIN:'www.tunefind.com',
     API_PATH:'/api/v1/show/',
     YES_INTENT: 'AMAZON.YesIntent',
     NO_INTENT: 'AMAZON.NoIntent',
     CANCEL_INTENT: 'AMAZON.CancelIntent',
     STOP_INTENT: 'AMAZON.StopIntent',
     HELP_INTENT: 'AMAZON.HelpIntent',
     OBJECT_TVSHOW: 'tvshow',
 }

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

 var getSongInfo = function(params, callback){

   var episode = params.episode;
   getEpisodeID(params, function(episodeList, query){
     if (!!query === false){
       callback(episodeList);
     } else {
       var arr = episodeList.episodes,
           episode_id = null;
       for (var i =0; i < arr.length; i++){
         if (arr[i].number === episode){
             episode_id = arr[i].id
         }
       }
       if (episode_id == null){
         callback(new Error('Episode not found'));
       } else {
         console.log('Making final call');
         makeCall(query+'/'+episode_id, callback);
       }
     }
   });
 }

 var getEpisodeID = function(params, callback){
   var tvShow = params.tvshow,
       season = (!!params.season) ? params.season : 1,
       query = tvShow + '/season-' + season;
   makeCall(query, callback)
 }

 var makeCall = function(query, callback){
   var endpoint = config.API_ENDPOINT,
       username = config.API_USERNAME,
       password = config.API_KEY,
       domain = config.API_DOMAIN,
       path = config.API_PATH + query,
       url = endpoint + query,
       auth = 'Basic ' + config.HASH_AUTH_VALUE,
       options = {
         hostname: domain,
         path: path,
         headers: {'Authorization' : 'Basic MTBlZGRjZGFjZjgyNmYzYTZlY2NmZTJiNzQyZWIzZDM6Y2RlMzZkNDhjYmM5MGE3NjcwMWY5Y2M3YzAwMjJmNDA='}
       };
   console.log(options);
   var request = https.get(options, function(res){
     var body = "";
     res.on('data', function(data) {
       body += data;
     });
     res.on('end', function() {
       //here we have the full response, html or json object
       callback(JSON.parse(body), query);
     });
     res.on('error', function(e) {
       console.log("Got error: " + e.message);
     });
	  });
}

  exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

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
        });
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
