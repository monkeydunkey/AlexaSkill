'use strict';

const https = require('https');
const app_name = "Shank's TV Guide";

// JSON object for configuration
 var config = {
     API_ENDPOINT:'https://www.tunefind.com/api/v1/show/',
     API_DOMAIN:'www.tunefind.com',
     API_PATH:'/api/v1/show/',
     API_USERNAME: process.env.API_USERNAME,
     API_KEY: process.env.API_KEY,
     HASH_AUTH_VALUE: process.env.HASH_AUTH_VALUE,
     YES_INTENT: 'AMAZON.YesIntent',
     NO_INTENT: 'AMAZON.NoIntent',
     CANCEL_INTENT: 'AMAZON.CancelIntent',
     STOP_INTENT: 'AMAZON.StopIntent',
     HELP_INTENT: 'AMAZON.HelpIntent',
     OBJECT_TVSHOW: 'tvshow',
     ERROR_INVALID_SHOW:'The TV show name is not correct',
     ERROR_INVALID_SEASON:'The Season number is not corect',
     ERROR_INVALID_EPISODE:'The episode number is not correct',
     ERROR_SEVER_ERROR: 'SERVER Error try Later'
 };

 var ordinalMap = {
   'first' : '1',
   'second' : '2',
   'third' : '3',
   'fourth' : '4',
   'fifth' : '5',
   'sixth' : '6',
   'seventh' : '7',
   'eighth' : '8',
   'ninth' : '9',
   'tenth' : '10',
   'eleventh' : '11',
   'twelfth' : '12',
   'thirteenth' : '13',
   'fourteenth' : '14',
   'fifteenth' : '15',
   'sixteenth' : '16',
   'seventeenth' : '17',
   'eighteenth' : '18',
   'nineteenth' : '19',
   'twentieth' : '20'
 };

// This is to handle abbrevations in names. We will expand on it in the next version
var abbrMap = {
  'mister' : 'mr',
  'mistress' : 'mrs'
};
///////// Functions to handle the API call/////////////////////////
// Gets the song name for a given TV season and episode
/*
  parameters
    a. params: object containing:
      1. tvshow: TV-Show name
      2. season: Season number
      3. episode: episode number
    b. callback: The callback function
*/
 var getSongInfo = function(params, callback){
   console.log(params);
   var episode = params.episode;
   getEpisodeID(params, function(episodeList, query, statusCode){
     // Checking if query parameter is empty i.e. the API returned an error
     if (statusCode != 200){
       // Passing the error returned form the API to the callback function
       switch (statusCode){
         case 404:
            makeCall(params.tvshow, function(obj, query, statusCode){
              //TODO: Update the code as during the second call their might me be a server error
              if(statusCode != 200){
                callback(config.ERROR_INVALID_SHOW, '', 301);
              } else {
                callback(config.ERROR_INVALID_SEASON, '', 301);
              }
            });
            break;
         case 401:
            console.log('Error: Unauthorized, Parameters: ' + JSON.stringify(params));
         case 500:
         case 301: //Request cannot be made
         case 429:
         default:
            callback(config.ERROR_SEVER_ERROR, '', 301);
            break;
       }
     } else {
       // Iterating to find the id (Tunefind internal id) of the episode specified
       var arr = episodeList.episodes,
           episode_id = null;
       for (var i =0; i < arr.length; i++){
         if (arr[i].number === episode){
             episode_id = arr[i].id
         }
       }
       if (episode_id === null){
         callback(config.ERROR_INVALID_EPISODE, '', 301);
       } else {
         // Call API with the episode number
         makeCall(query+'/'+episode_id, callback);
       }
     }
   });
 }

// Gets all episodes for a given TV an season
/*
  parameters
    a. params: object containing:
      1. tvshow: TV-Show name
      2. season: Season number
      3. episode: episode number
    b. callback: The callback function
*/
 var getEpisodeID = function(params, callback){
   var tvShow = params.tvshow,
       season = params.season,
       query = tvShow + '/season-' + season;
   makeCall(query, callback)
 }

// Queries the API and returns the JSON object
/*
  parameters
    a. query: The URL path that needs to be HelpIntent
    b. callback: The callback function
*/
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
         headers: {'Authorization' : auth}
       };
   var request = https.get(options, function(res){
     var body = "";
     res.on('data', function(data) {
       body += data;
     });
     res.on('end', function() {
       //here we have the full response, the json object
       if(res.statusCode === 200)
          callback(JSON.parse(body), query, res.statusCode);
       else
          callback(body, query, res.statusCode);
     });

     res.on('error', function(e) {
       console.log("Got error: " + e.message);
       callback(e, query, 301);
     });
	  });
}
///////// End of functions to handle the API call/////////////////////////


////////Function to route Alexa's requests/////////////////////
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


//Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

//Called when the user invokes the skill without specifying what they want.
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    var cardTitle = app_name;
    var speechOutput = "Welcome to " + app_name + ", you can ask me to name the songs played during an episode of your favourite TV Show."
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", false));
}

//Called when the user specifies an intent for this skill.
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    switch (intentName) {
      case 'getsong':
          handleGetSongRequest(intent, session, callback);
        break;
      case 'AMAZON.HelpIntent':
          var resp = 'You can ask ' + app_name + ', the names of the songs played during any particular episode of a TV-series.'+
          ' For example say, name the songs played in episode 1, season 1 of friends';
          callback(session.attributes,
              buildSpeechletResponseWithoutCard(resp, "", "false"));
        break;
      case 'AMAZON.StopIntent':
      case 'AMAZON.CancelIntent':
          var resp = 'Goodbye.';
          callback(session.attributes,
              buildSpeechletResponseWithoutCard(resp, "", "true"));
        break;
      default:
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

function replaceAbbr(showname){
  var words = showname.split(' '),
      i = 0;
  for (i = 0; i < words.length; i++){
    if(!!abbrMap[words[i]])
      words[i] = abbrMap[words[i]];
  }
  return words.join(' ');
}

// Called to handle the GetSongRequest Intent
function handleGetSongRequest(intent, session, callback) {
    console.log(intent);
    var showname = replaceAbbr(intent.slots.tvshow.value).split(' ').join('-').toLowerCase(),
        season = intent.slots.season.value,
        episode = intent.slots.episode.value,
        episodeAlter = intent.slots.episodeAlter.value,
        seasonAlter = intent.slots.seasonAlter.value,
        episodeAlter_isDigit = (!!episodeAlter) ? !isNaN(episodeAlter.replace('nd', '').replace('st', '').replace('th', '').replace('rd', '')) : false,
        seasonAlter_isDigit = (!!seasonAlter) ? !isNaN(seasonAlter.replace('nd', '').replace('st', '').replace('th', '').replace('rd', '')) : false;

        episode = (!!episode) ? episode : (episodeAlter_isDigit === true) ? episodeAlter.replace('nd', '').replace('st', '').replace('th', '').replace('rd', '') : ordinalMap[episodeAlter.toLowerCase()];
        season = (!!season) ? season : (!!seasonAlter) ? (seasonAlter_isDigit === true) ? episodeAlter.replace('nd', '').replace('st', '').replace('th', '').replace('rd', '') : ordinalMap[seasonAlter.toLowerCase()] : 1;
        console.log(showname + ' : ' + episode + ' & ' + !!showname &&  !!episode);
        if(!!showname &&  !!episode){
          getSongInfo({'tvshow':showname, 'season':season, 'episode': episode}, function(obj, query, errorCode){
              var ret_str = '';
              showname = showname.split('-').join(' ');
              if (errorCode != 200){
                var sessionEnd = true;
                switch(errorCode){
                  case 301: // Custom error code
                    switch(obj){
                      case config.ERROR_INVALID_SHOW:
                        console.log('ERROR_INVALID_SHOW SHOW ' + showname);
                        ret_str = "Sorry, I couldn't understand the question, please rephrase or repeat the question."
                        sessionEnd = false;
                        break;
                      case config.ERROR_INVALID_SEASON:
                        console.log('ERROR_INVALID_SEASON SHOW ' + showname + ' SEASON ' + season);
                        ret_str = "Sorry, I couldn't understand the question, please rephrase or repeat the question."
                        sessionEnd = false;
                        break;
                      case config.ERROR_INVALID_EPISODE:
                          console.log('ERROR_INVALID_EPISODE SHOW ' + showname + ' SEASON ' + season + ' EPISODE ' + episode );
                          ret_str = "Sorry, I couldn't understand the question, please rephrase or repeat the question."
                          sessionEnd = false;
                          break;
                      case config.ERROR_SEVER_ERROR:
                      default:
                          ret_str = 'Sorry, I could not fetch the information at the moment can you please try agian in some time.';
                          break;
                    }
                    break;
                  default:
                    ret_str = "Sorry, I could not fetch the information at the moment can you please try agian in some time.";
                    break;
                }
                callback(session.attributes,
                    buildSpeechletResponseWithoutCard(ret_str, "", sessionEnd));
              } else {
                replyWithSuggestion(session, callback, obj, showname, season, episode);
              }
          });
        } else {
          var ret_str = "Sorry, I couldn't understand the question, please rephrase or repeat the question."
          callback(session.attributes,
              buildSpeechletResponseWithoutCard(ret_str, "", "true"));
      }
}

function replyWithSuggestion(session, callback, songs, showname, season, episode) {
  console.log('replyWithSuggestion called');
  var length = songs.songs.length,
      common_end = ' played during episode ' + episode + ' of season ' + season + ' of ' + showname,
      resp = (length == 0) ? 'There were no songs' + common_end : (length == 1) ? 'The name of the song' + common_end + ' is ':
      'There were a total of ' + length + ' sound tracks ' + common_end + '. Following are their names: ',
      temp = '';
  for(var i=0; i < length ; i++){
    temp = (length > 1) ? (i+1).toString() + '. ' : '';
    resp += temp + songs.songs[i].name.split('\"').join('"') + '. ';
  }
  console.log(resp);
  callback(session.attributes,
      buildSpeechletResponse(app_name,resp, "", "true"));
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
