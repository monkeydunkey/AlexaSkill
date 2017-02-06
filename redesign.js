'use strict';

const https = require('https');
const app_name = "Shank's TV Guide";


/*
Road map:
It will be a simple dialog based interaction system
The introductory phrase will be 'Welcome to Shank's TV guide......'. The difference would be
to ask for single inputs like TV show name, season number and episode number
This will help us in handling the error better

We also have to do a fuzzy look up to determine the TV-show name
TODO:
7. Add the fuzzy search for TV show name
9. Update the Interface to enable a smoother interaction
*/
// JSON object for configuration
 var config = {
     API_ENDPOINT:'https://www.tunefind.com/api/v1/show/',
     TVMAZE_API_ENDPOINT:'http://api.tvmaze.com/singlesearch/shows?q=',
     API_DOMAIN:'www.tunefind.com',
     API_PATH:'/api/v1/show/',
     /*
     API_USERNAME: process.env.API_USERNAME,
     API_KEY: process.env.API_KEY,
     HASH_AUTH_VALUE: process.env.HASH_AUTH_VALUE,
     */
     API_USERNAME: '10eddcdacf826f3a6eccfe2b742eb3d3',
     API_KEY:'cde36d48cbc90a76701f9cc7c0022f40',
     HASH_AUTH_VALUE: 'MTBlZGRjZGFjZjgyNmYzYTZlY2NmZTJiNzQyZWIzZDM6Y2RlMzZkNDhjYmM5MGE3NjcwMWY5Y2M3YzAwMjJmNDA=',
     YES_INTENT: 'AMAZON.YesIntent',
     NO_INTENT: 'AMAZON.NoIntent',
     CANCEL_INTENT: 'AMAZON.CancelIntent',
     STOP_INTENT: 'AMAZON.StopIntent',
     HELP_INTENT: 'AMAZON.HelpIntent',
     OBJECT_TVSHOW: 'tvshow',
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

//TODO: Implement the common server error handler
function checkError(statusCode, customErrMsg){
  switch (statusCode){
    case 301:
    case 404:
      return {'statusCode': statusCode, 'err_msg': customErrMsg};
    case 401:
       console.log('Error: Unauthorized, Parameters');
    case 500:
    case 301: //Request cannot be made
    case 429:
    default:
       return {'statusCode': statusCode, 'err_msg': config.ERROR_SEVER_ERROR};
       break;
  }
}
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
       // Iterating to find the id (Tunefind internal id) of the episode specified
       var arr = episodeList.episodes,
           episode_id = null;
       for (var i =0; i < arr.length; i++){
         if (arr[i].number === episode){
             episode_id = arr[i].id
         }
       }
       if (episode_id === null){
         callback('', '', 301);
       } else {
         // Call API with the episode number
         makeCall(query+'/'+episode_id, callback);
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
  console.log('calling endpoint')
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
   console.log(options)
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
    var speechOutput = "Welcome to " + app_name + ", you can ask me to name the songs played during an episode of your favourite TV Show. Give me the name of the show you want information for."
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
      //TODO: Handle help intent based on the step the user is in
      case 'AMAZON.HelpIntent':
          var session = new sessionData(session.attributes)
          session.attributes = session.getJSON()
          callback(session.attributes,
              buildSpeechletResponseWithoutCard(session.help(), "", "false"));
        break;
      case 'AMAZON.StopIntent':
      case 'AMAZON.CancelIntent':
          console.log('cancel called')
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

/*Helper functions for cleaning and lookup*/

function replaceAbbr(showname){
  var words = showname.split(' '),
      i = 0;
  for (i = 0; i < words.length; i++){
    if(!!abbrMap[words[i]])
      words[i] = abbrMap[words[i]];
  }
  return words.join(' ');
}

/* This function should call TV maze api to perform a fuzzy lookup to get the actual name
API Hit point - http://api.tvmaze.com/singlesearch/shows
*/
function cleanShowName(showname){
  if (showname === null) {
    return showname
  }
  return replaceAbbr(showname).split(' ').join('-').toLowerCase()
}

//Formats the user input to make it consistent with the value type the API expects
function cleanSeasonEpisodeNumber(value){
  if (value === null)
  {
  return value
  } else {
    var numberPattern = /\d+/g,
        value = value.match(numberPattern);
    return (value !== null) ? value[0] : null;
  }
}
/*
Check if the showname provided is valid or not
*/
function checkShowName(showname, sessionObj, callback){
  showname = showname.split(' ').join('-')
  makeCall(showname, function(data, query, statusCode){
    var err_resp = checkError(statusCode, 'Could not find information for ' + showname + ' please check the name'),
        isValid = (err_resp.statusCode == 200) ? true: false,
        errMsg = err_resp.err_msg;
    if (isValid)
      sessionObj['showname'] = showname

    callback(isValid, errMsg, sessionObj)
  });
}
/*
Checks if the season number is valid or not
*/
function checkSeasonNumber(showname, season, sessionObj, callback){
  var errMsg = 'Could not find information for season ' + season + ' please check the season number'
  season = cleanSeasonEpisodeNumber(season)
  if (season === null){
    callback(false, errMsg, sessionObj);
    return
  }
  makeCall(showname + '/season-' + season, function(data, query, statusCode){
    var err_resp = checkError(statusCode, 'Could not find information for season ' + season + ' please check the season number'),
        isValid = (statusCode == 200) ? true: false,
        errMsg = err_resp.err_msg;
    console.log(statusCode + ' ' + errMsg)
    if (isValid)
        sessionObj['season'] = season
    callback(isValid, errMsg, sessionObj);
  });
}

/*
Checks if the episode number is valid or not. If yes fetches the data required
*/
function checkEpisodeNumber(showname, season, episode, sessionObj, callback){
  var episode = cleanSeasonEpisodeNumber(episode),
      params = {'tvshow': showname, 'season': season, 'episode': episode},
      msg = 'Could not find information for episode ' + episode + ' please check the episode number';
  if (episode === null){
    callback(false, errMsg, sessionObj);
    return
  }
  getSongInfo(params, function(data, query, statusCode){
    console.log(statusCode)
    var err_resp = checkError(statusCode, 'Could not find information for episode ' + episode + ' please check the episode number'),
        isValid = (statusCode == 200) ? true: false,
        errMsg = (isValid) ? data : err_resp.err_msg;
    if (isValid)
        sessionObj['episode'] = episode
    callback(isValid, errMsg, sessionObj)
  });
}

// Called to handle the GetSongRequest Intent

//This function loads the session data into the object for use
function sessionData (data) {
    console.log('loading Session Data');
    for(var key in data){
      this[key] = data[key]
    }
  }
  //The value attribute has to be a number
  sessionData.prototype.updateAttributes = function(attribute, value, callback){
    var isValid = true
    console.log('update called ' + attribute)
    switch(attribute) {
      case 'showname':
          console.log(attribute)
          checkShowName(value, this, callback);
          break;
      case 'season':
          checkSeasonNumber(this.showname, value, this, callback);
          break;
      case 'episode':
          checkEpisodeNumber(this.showname, this.season, value, this, callback);
          break;
    }
  }
  // gets the next attribute to which the information from the user should be mapped
  sessionData.prototype.getNextAttribute = function(){
    if(!this.hasOwnProperty('showname'))
      return 'showname'
    if(!this.hasOwnProperty('season'))
        return 'season'
    return 'episode'
  }

  // check if all the parameters requried for answering the query has been received
  sessionData.prototype.isCompleted = function(){
    if (this.hasOwnProperty('episode'))
      return true
    else
      return false
  }

  // gets the next question that needs to asked from the user
  sessionData.prototype.nextQuestion = function(){
    if(!this.hasOwnProperty('showname'))
      return 'Give me the name of show'
    if(!this.hasOwnProperty('season'))
        return 'Give me the season number'
    return 'Give me the episode number'
  }
  // Gets the help text for the user
  sessionData.prototype.help = function(){
    if(!this.hasOwnProperty('showname'))
      return 'Provide me with the name of TV show for which you need information for. For e.g. friends, Mr. robot'
    if(!this.hasOwnProperty('season'))
        return 'Provide me with the season number of ' + this.showname.split('-').join(' ') + ' for which you need information for.'
    return 'Provide me with the episode number of season ' + this.season + ' of ' + this.showname.split('-').join(' ') + ' for which you need information for.'
  }
  // returns the JSON object to be passed to session.attributes for session persistance
  sessionData.prototype.getJSON = function(){
    var ret_obj = {},
        int_prop = ['showname', 'season', 'episode'],
        key = ''
    for (var val in int_prop) {
      key = int_prop[val]
      if (this.hasOwnProperty(key)){
          ret_obj[key] = this[key]
      }
    }
    return ret_obj
  }


function handleGetSongRequest(intent, session, callback) {
    console.log(intent);
    var step = intent.slots.STEPVALUE.value,
        session = new sessionData(session.attributes),
        nextAttribute = session.getNextAttribute()
    session.updateAttributes(nextAttribute, step, function(isValid, errMsg, sessionObj){
      console.log('handle song request' + isValid)
      var msg = (isValid) ? sessionObj.nextQuestion() : errMsg,
          data = (isValid) ? errMsg : '',
          shouldEndSession  = (config.ERROR_SEVER_ERROR === errMsg && !isValid) ? "true" : "false"
      if (sessionObj.isCompleted()){
          replyWithSuggestion(session, callback, data, sessionObj.showname, sessionObj.season, sessionObj.episode);
      } else {
      //Update the session attributes
      session.attributes = sessionObj.getJSON()
      callback(session.attributes,
               buildSpeechletResponseWithoutCard(msg, "I am waiting for a response. " + sessionObj.nextQuestion(), shouldEndSession));
      }
    });
}

function replyWithSuggestion(session, callback, songs, showname, season, episode) {
  showname = showname.split('-').join(' ')
  console.log(songs)
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
