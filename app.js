/* jshint node: true */
'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var requestJSON = require('request-json');
var request = require('request');

var apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error('Must be started with API_KEY');
  return;
}

app.use(function requireHttps(req, res, next) {
  if(req.headers.host != "localhost:1337" && req.headers['x-forwarded-proto'] != 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  } else {
    return next();
  }
});

app.use('/static', express.static('public'));
app.use('/favicon.ico', express.static('public/favicon.ico'));
app.use(bodyParser.json()); // for parsing application/json

app.get('/', function(req, res) {
  res.redirect('/static');
});


var clients = {};

app.post('/api/registrations', function(req, res) {
  clients[req.body.endpoint] = {
    clientName: req.body.clientName,
    endpoint: req.body.endpoint
  };
  console.log(clients);
  res.status(200).send('Got POST request').end();
});

app.delete('/api/registrations', function(req, res) {
  delete clients[req.body.endpoint];
  console.log(clients);
  res.status(200).send('Got DELETE request').end();
});

app.get('/api/registrations', function(req, res) {
  res.json({
    clients: clients
  }).end();
});

app.get('/api/messages', function(req, res) {
  res.json({
    messages: clients[req.query.endpoint].messages
  }).end();
});

app.post('/api/push-me', function(req, res) {
  var messageTemplates = {
    "johannes": {
      title: "Hello from Johannes",
      text: "I hope you are enjoying this presentation",
      icon: "johannes-icon.jpg"
    },
    "soprasteria": {
      title: "SopraSteria mobile group",
      text: "Remember to go to the frontend group meeting today",
      icon: "sopra-steria.jpeg"
    }
  };
  var message = messageTemplates[req.query.message];

  res.status(200).end();

  var endpoint = req.query.endpoint;
  setTimeout(function() {
    console.log('Pushing to ' + endpoint);
    sendPushMessages([endpoint], message);
  }, 5000);
});

app.get('/api/last-message', function(req, res) {
  res.json(clients[req.query.endpoint].lastMessage).end();
});

app.post('/push/v1/pushPackages/web.net.openright.webpush', function(req, res) {
  res.sendFile(__dirname + '/public/WebPush.pushpackage.zip');  
});

app.post('/push/v1/devices/*/registrations/*', function(req, res) {
  console.log(req.url);
  res.status(200).end();
});

app.post('/push/v1/log', function(req, res) {
  console.log(req.body);
  res.status(200).end();
});

app.post('/api/notify', function(req) {
  var endpoints = req.body.endpoints;
  console.log(req.body);

  sendPushMessages(endpoints, {
    title: req.body.title,
    text: req.body.text,
    icon: req.body.icon,
    description: req.body.description
  });
});

app.get('*', function(req, res) {
  console.warn("Unexpected request" , req.url);
  res.status(404).send('what???');
});

function sendPushMessages(endpoints, message) {
  endpoints.forEach(function(endpoint) {
    if (clients[endpoint]) {
      clients[endpoint].lastMessage = message;
    }
  });
  console.log(clients);

  sendGoogleNotifications(endpoints);
  sendMozillaNotifications(endpoints);
}

function sendMozillaNotifications(endpoints) {
  endpoints.filter(function(e) {
    return e.indexOf('https://updates.push.services.mozilla.com') === 0;
  }).map(function(endpoint) {
    console.log('PUT ', endpoint);
    request.put(endpoint, function(err, apiRes, body) {
      console.log(err, body);
    });
  });
}

function sendGoogleNotifications(endpoints) {
  var headers = { 'Authorization': 'key=' + apiKey };
  var googleNotificationIds = endpoints.filter(function(e) {
    return e.indexOf('https://android.googleapis.com/gcm/send/') === 0;
  }).map(function(e) {
    return e.substring('https://android.googleapis.com/gcm/send/'.length);
  });
  if (!googleNotificationIds.length) return;

  var notification = { registration_ids: googleNotificationIds };
  console.log('POST to https://android.googleapis.com/gcm/send', notification);
  var client = requestJSON.createClient('https://android.googleapis.com/', {headers: headers});
  client.post('gcm/send', notification, function(err, gcmRes, body) {
    if (!err) {
      console.log('Notification successful', body);
    } else if (gcmRes && gcmRes.statusCode === 401) {
      console.log(err);
      console.warn('GCM call unauthorized - check API key');
    } else {
      console.error('Failed to send notification', err);
    }
  });
}


app.listen(process.env.PORT || 1337, function() {
  console.log('started');
});

