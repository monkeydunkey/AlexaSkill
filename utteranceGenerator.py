intentName = 'getsong'
commonTerms = ['which song was played in', 'which songs were played in',
              'which song was played during', 'which song were played during',
              'name the song played in', 'name the songs played in', 'name the song played during',
              'name the songs played during', 'what is the name of the song played in',
              'what are the names of the song played in', 'what is the name of the song played during',
              'what are the names of the song played during', 'name the songs in', 'name the song in',
              'get me the names of the songs in', 'get me the name of the song in',
              'get me the list of songs in', 'get me the list of songs played in',
              'get me the list of songs played during']
combo = ['episode {episode} season {season} of {tvshow}',
         'episode {episode} of season {season} of {tvshow}',
         'season {season} episode {episode} of {tvshow}',
         'the {episodeAlter} episode of season {season} of {tvshow}',
         'the {episodeAlter} episode of the {seasonAlter} season of {tvshow}',
         '{tvshow} {episodeAlter} episode season {season}',
         '{tvshow} {episodeAlter} episode',
         'the {episodeAlter} episode of {tvshow}',
         "the {seasonAlter} season's {episodeAlter} episode of {tvshow}"]

for term in commonTerms:
  for com in combo:
    x = intentName + ' ' + term + ' ' + com
    print x
