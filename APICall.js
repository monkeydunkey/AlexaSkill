var config = require('./config.js'),
    request = require('request');



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
      username = config.API_ENDPOINT,
      password = config.API_ENDPOINT,
      url = endpoint + query,
      auth = 'Basic ' + config.HASH_AUTH_VALUE;
  request(
    {
        url : url,
        headers : {
            "Authorization" : auth
        }
    },
    function (error, response, body) {
        if (response.statusCode != 200) {
          callback(new Error("Non 200 Response"));
        }
        callback(JSON.parse(body), query);
    }
  );
  /*
  http.get(endpoint+queryString, function (res) {
        var ResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            callback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            ResponseString += data;
        });

        res.on('end', function () {
            var ResponseObject = JSON.parse(ResponseString);

            if (ResponseObject.error) {
                console.log("Request error: " + ResponseObj.error.message);
                callback(new Error(ResponseObj.error.message));
            } else {
                console.log(query);
                callback(ResponseObject, query);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        callback(new Error(e.message));
    });
    */
}

module.exports = getSongInfo;
