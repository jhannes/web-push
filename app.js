var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var requestJSON = require('request-json');
var request = require('request');

var apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("Must be started with API_KEY");
  return;
}

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

app.post('/api/notify', function(req, res) {
  var endpoints = req.body.endpoints;
  console.log(endpoints);

  endpoints.forEach(function(endpoint) {
    clients[endpoint].messages = (clients[endpoint].messages || []);
    clients[endpoint].messages.push(req.body.text);
  });
  console.log(clients);

  sendGoogleNotifications(endpoints, res);
  sendMozillaNotifications(endpoints, res);
});

var server = app.listen(process.env.PORT || 1337, function() {
  console.log("started");
});

function sendMozillaNotifications(endpoints, res) {
  endpoints.filter(function(e) {
    return e.indexOf("https://updates.push.services.mozilla.com") == 0;
  }).map(function(endpoint) {
    console.log("PUT ", endpoint);
    request.put(endpoint, function(err, apiRes, body) {
      console.log(err, body);
    });
  });
}

function sendGoogleNotifications(endpoints, res) {
  var headers = { 'Authorization': 'key=' + apiKey };
  var googleNotificationIds = endpoints.filter(function(e) {
    return e.indexOf("https://android.googleapis.com/gcm/send/") == 0;
  }).map(function(e) {
    return e.substring("https://android.googleapis.com/gcm/send/".length);
  });
  if (!googleNotificationIds.length) return;

  var notification = { registration_ids: googleNotificationIds };
  console.log("POST to https://android.googleapis.com/gcm/send", notification);
  var client = requestJSON.createClient('https://android.googleapis.com/', {headers: headers});
  client.post('gcm/send', notification, function(err, gcmRes, body) {
    if (!err) {
      console.log("Notification successful", body);
      res.send('Notification successful').end();
    } else if (gcmRes && gcmRes.statusCode === 401) {
      console.log(err);
      console.warn("GCM call unauthorized - check API key");
      res.status(500).send('GCM authentication failed - check config').end();
    } else {
      console.error("Failed to send notification", err);
      res.status(500).send('Failed to send notification').end();
    }
  });
}
