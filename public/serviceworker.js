
self.addEventListener('push', function(event) {
  "use strict";
  console.log("received a message" + event.data);

  var notification = {
    body: "A message was received",
    icon: "johannes-icon.jpg",
    tag: "web-push-message"
  };

  return event.waitUntil(
    self.registration.showNotification("Title", notification));
});

self.addEventListener('notificationclick', function(event) {
  console.log("On notification click", event);
  event.notification.close();
  clients.openWindow("play-sound.html");
});
