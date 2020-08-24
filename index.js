const express = require('express');
const request = require('request');
const path = require('path');
const stories = require('./stories');

const app = express();

//app.use is the middleware that runs before running any
//app.get method
app.use((req, res, next) => {
  console.log('Request details. Method:', req.method, 'Original url:', req.originalUrl);

  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');

  next();
});

app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('/ping', (req, res) => {
  res.send('pong!');
});

app.get('/stories', (req, res) => {
  res.json(stories);
});

app.get('/stories/:title', (req, res) => {
  const { title } = req.params;

  res.json(stories.filter(story => story.title.includes(title)));
});

const URL = ' https://hacker-news.firebaseio.com/v0/';

//app.get method call back mostly contains only two perameters
//i.e. req and res but when we have to handle the error a new
//perameter next can also added which helps to transfer the
//control to error handler and with return keyword so the
//processing of current app.get method stop as well
app.get('/topstories', (req, res, next) => {
  request(`${URL}topstories.json`,
  (error, response, body) => {

      if(error || response.statusCode !== 200) {
          return next(new Error('Error requesting top stories'));
      }

      const topStories = JSON.parse(body);

      const limit = 10;

      //.then starts when all the inner promises got completes
      Promise.all(
          topStories.slice(0, limit).map(story => {
              return new Promise((resolve, reject) => {
  
                  request(`${URL}item/${story}.json`,
                  (error, response, body) => {
                      if(error || response.statusCode !== 200) {
                          return reject(new Error('Error requesting story item'));
                      }

                      resolve(JSON.parse(body));
                  }
                  )
              })
          })
      )
      .then(fullTopStories => {
          res.json(fullTopStories);
      })
      .catch(error => {
          return next(error)
      });
              
  }
  )
})


//Error handler
//the app.use method with 4 parameters is consider as 
//Error handler comes at the end of app.get methods
app.use((err, req, res, next) => {
  res.status(500).json({type: 'error', message: err.message});
})

const PORT = 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
