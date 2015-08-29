var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var request = require('request-json');

var apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("Must be started with API_KEY");
  return;
}

app.use('/static', express.static('public'));
app.use(bodyParser.json()); // for parsing application/json

var clients = {};

app.post('/api/registrations', function(req, res) {
  clients[req.body.endpoint] = {
    clientName: req.body.clientName,
    endpoint: req.body.endpoint
  };
  console.log(clients);
  res.send('Got POST request').end();
});

app.delete('/api/registrations', function(req, res) {
  delete clients[req.body.endpoint];
  console.log(clients);
  res.send('Got DELETE request').end();
});


app.get('/api/registrations', function(req, res) {
  res.json({
    clients: clients
  }).end();
});

app.post('/api/notify', function(req, res) {
  var endpoints = req.body.endpoints;
  console.log(endpoints);
  sendGoogleNotifications(endpoints, res);
});

var server = app.listen(process.env.PORT || 1337, function() {
  console.log("started");
});

function sendGoogleNotifications(endpoints, res) {
  var headers = { 'Authorization': 'key=' + apiKey };
  var client = request.createClient('https://android.googleapis.com/', {headers: headers});
  var googleNotificationIds = endpoints.filter(function(e) {
    return e.indexOf("https://android.googleapis.com/gcm/send/") == 0;
  }).map(function(e) {
    return e.substring("https://android.googleapis.com/gcm/send/".length);
  });
  var notification = { registration_ids: googleNotificationIds };
  console.log("Sending", notification);
  client.post('gcm/send', notification, function(err, gcmRes, body) {
    if (!err) {
      console.log("Notification successful", body);
      res.send('Notification successful').end();
    } else if (gcmRes.statusCode === 401) {
      console.log(err);
      console.warn("GCM call unauthorized - check API key");
      res.status(500).send('GCM authentication failed - check config').end();
    } else {
      console.error("Failed to send notification", err);
      res.status(500).send('Failed to send notification').end();
    }
  });
}
