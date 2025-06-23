require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  const parsedUrl = url.parse(originalUrl);

  if (!parsedUrl.protocol || !parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }
  
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    Url.findOne({ original_url: originalUrl }).then(foundUrl => {
      if (foundUrl) {
        res.json({
          original_url: foundUrl.original_url,
          short_url: foundUrl.short_url
        });
      } else {
        Url.countDocuments({}).then(count => {
          const newUrl = new Url({
            original_url: originalUrl,
            short_url: count + 1
          });
          newUrl.save().then(savedUrl => {
            res.json({
              original_url: savedUrl.original_url,
              short_url: savedUrl.short_url
            });
          });
        });
      }
    });
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  Url.findOne({ short_url: shortUrl }).then(foundUrl => {
    if (foundUrl) {
      res.redirect(foundUrl.original_url);
    } else {
      res.json({ error: 'No short URL found for the given input' });
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
}); 