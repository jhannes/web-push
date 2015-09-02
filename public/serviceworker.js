console.log("Service worker started, version", 3);


self.addEventListener('push', function(event) {
  "use strict";

  event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(sub) {
      return fetch("/api/messages?endpoint=" + sub.endpoint);
    }).then(function(response) {
      return response.json();
    }).then(function(json) {
      console.log("registration", json);
      return json;
    }).then(function(json) {
      var notification = {
        body: json.messages[0],
        icon: "johannes-icon.jpg",
        tag: "web-push-message"
      };
      return self.registration.showNotification("A message", notification);
    }));
});


self.addEventListener('notificationclick', function(event) {
  console.log("On notification click", event);
  event.notification.close();
  clients.openWindow("play-sound.html");
});
