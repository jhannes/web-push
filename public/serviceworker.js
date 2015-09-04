/* globals self */
"use strict";



self.addEventListener('push', function(event) {

  event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(sub) {
      return fetch("/api/last-message?endpoint=" + sub.endpoint);
    }).then(function(response) {
      return response.json();
    }).then(function(lastMessage) {
      console.log(lastMessage);
      var notification = {
        body: lastMessage.text,
        icon: lastMessage.icon,
        sound: "notification-sound.ogg",
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        tag: "web-push-message"
      };
      details = lastMessage.details;
      return self.registration.showNotification(lastMessage.title, notification);
    }));
});


self.addEventListener('notificationclick', function(event) {
  console.log("On notification click", event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll()
    .then(function(clientList) {
      if (clientList.length) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    }));
});
