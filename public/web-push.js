var ajax = {
  post: function(url, obj) {
    return $.ajax({
      type: 'POST',
      url: url,
      data: JSON.stringify(obj),
      contentType: "application/json; charset=utf-8",
      dataType: "json"
    });
  },
  del: function(url, obj) {
    return $.ajax({
      type: 'DELETE',
      url: url,
      data: JSON.stringify(obj),
      contentType: "application/json; charset=utf-8",
      dataType: "json"
    });
  },

};

//   <p>The only browser that currently supports WebPush seems to be <a href="https://www.google.com/chrome/browser/beta.html">Chrome <em>BETA</em></a></p>


if (!("serviceWorker" in navigator)) {
  $("#messages").append($("<p>").text("serviceWorker is not supported"));
}

if (!('PushManager' in window)) {
  $("#messages").append($("<p>").text("PushManager is not supported"));
}

if (!("serviceWorker" in navigator) || !('PushManager' in window)) {
  $("#messages").append($("<p>")
      .html('<p>The only browser that currently supports WebPush seems to be <a href="https://www.google.com/chrome/browser/beta.html">Chrome <em>BETA</em></a>'));
}

var sendSubscriptionToServer = function(sub) {
  $("#registerForPush").prop("disabled", true);
  $("#deregisterFromPush").prop("disabled", false).click(function() {
    sub.unsubscribe().then(function(success) {
      $("#deregisterFromPush").prop("disabled", true);
      $("#registerForPush").prop("disabled", false);
      $("#subscriptionId").empty();
    }).catch(function(e) {
      console.error("Failed to unregister", e);
    }).then(function() {
      return ajax.del('/api/registrations', { subscriptionId: sub.subscriptionId });
    });
  });

  $("#subscriptionId").text(sub.subscriptionId);
  var registration = {
    clientName: $("#clientName").val(),
    subscriptionId: sub.subscriptionId
  };
  ajax.post('/api/registrations', registration).then(function(e) {
    console.log("successful");
  });
};


$(function() {

  $("#showNotification").click(function() {
    var notification = new Notification('Notification title', {
      icon: 'johannes-icon.jpg',
      body: "Hey there! You've been notified!",
      sound: "notification-sound.ogg"
    });
  });

  $("#deregisterFromPush").prop("disabled", true);
  $("#clientName").val(localStorage.getItem("clientName"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('serviceworker.js').then(function(registration) {
      registration.pushManager.getSubscription().then(function(sub) {
        if (sub) {
          sendSubscriptionToServer(sub);
        }
      });

      $("#registerForPush").click(function() {
        localStorage.setItem("clientName", $("#clientName").val());
        registration.pushManager.subscribe().then(function(sub) {
          sendSubscriptionToServer(sub);
        }, function(e) {
          console.warn("subcription unsuccessful", e);
          alert(e.message);
        });
      });
    });
  }
});
