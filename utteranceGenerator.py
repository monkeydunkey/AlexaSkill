intentName = 'getsong'
commonTerms = ['which song was played in', 'which songs were played in',
              'which song was played during', 'which songs were played during',
              'name the song played in', 'name the songs played in', 'name the song played during',
              'name the songs played during', 'to name the song played in', 'to name the songs played in',
              'to name the song played during', 'to name the songs played during',
              'what is the name of the song played in', 'what are the names of the songs played in',
              'what was the name of the song played in',
              'what is the name of the song played during', 'what are the names of the songs played during',
              'what was the name of the song played during', 'what were the names of the songs played in',
              'what were the names of the songs played during', 'name the songs in', 'name the song in',
              'get me the names of the songs in', 'get me the name of the song in',
              'get me the list of songs in', 'get me the list of songs played in',
              'get me the list of songs played during', 'get me a list of songs in',
              'get me a list of songs played in', 'get me a list of songs played during',
              'list the songs played in', 'list the songs played during',
              'to list the songs played in', 'to list the songs played during']
combo = ['episode {episode} season {season} of {tvshow}',
         'episode {episode} of season {season} of {tvshow}',
         'episode {episode} of {tvshow}',
         'season {season} episode {episode} of {tvshow}',
         'the {episodeAlter} episode of season {season} of {tvshow}',
         'the {episodeAlter} episode of the {seasonAlter} season of {tvshow}',
         '{tvshow} {episodeAlter} episode season {season}',
         '{tvshow} {episodeAlter} episode',
         '{tvshow} episode {episode}',
         'the {episodeAlter} episode of {tvshow}',
         "the {seasonAlter} season's {episodeAlter} episode of {tvshow}"]

f_out = open('SampleUtterance.txt', 'w')
for term in commonTerms:
    for com in combo:
        x = intentName + ' ' + term + ' ' + com
        f_out.write(x+'\n');
