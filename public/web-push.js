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

var sendSubscriptionToServer = function(sub) {
  console.log("sendSubscriptionToServer", sub);
  $("#registerForPush").prop("disabled", true);
  $("#schedulePush").prop("disabled", false);
  $("#schedulePush").click(function() {
    ajax.post('/api/push-me?endpoint=' + sub.endpoint, registration).then(function(e) {
      console.log("successful");
    });
  });

  $("#deregisterFromPush").prop("disabled", false).click(function() {
    sub.unsubscribe().then(function(success) {
      $("#deregisterFromPush").prop("disabled", true);
      $("#registerForPush").prop("disabled", false);
      $("#schedulePush").prop("disabled", true);
      $("#subscriptionId").empty();
    }).catch(function(e) {
      console.error("Failed to unregister", e);
    }).then(function() {
      return ajax.del('/api/registrations', { endpoint: sub.endpoint });
    });
  });

  $("#subscriptionId").text(sub.endpoint);
  var registration = {
    clientName: $("#clientName").val(),
    endpoint: sub.endpoint
  };
  localStorage.setItem("clientName", $("#clientName").val());
  ajax.post('/api/registrations', registration).then(function(e) {
    console.log("successful");
  });
};


$(function() {
  if (!("serviceWorker" in navigator)) {
    $("#messages").append($("<p>").text("serviceWorker API is not supported"));
  }

  if (!('PushManager' in window)) {
    $("#messages").append($("<p>").text("PushManager API is not supported"));
    $("#registerForPush").prop("disabled", true);
  }

  if (!("Notification" in window)) {
    $("#showNotification").prop("disabled", true);
    $("#messages").append($("<p>").text("Notification API is not supported"));
  }

  if ("Notification" in window) {
    if (Notification.permission === "denied") {
      $("#messages").append($("<p>").text("Not permitted to display notifications"));
      $("#showNotification").prop("disabled", true);
    }
    $("#showNotification").click(function() {
      Notification.requestPermission(function(permission) {
        console.log("Notification permission", permission);
        if (permission === "granted") {
          var notification = new Notification('Notification title', {
            icon: 'johannes-icon.jpg',
            body: "Hey there! You've been notified!",
            sound: "notification-sound.ogg"
          });
        } else {
          $("#messages").append($("<p>").text("Not permitted to display notifications"));
          if (permission === "denied") {
            $("#showNotification").prop("disabled", true);
          }
        }
      });
    });
  }


  $("#deregisterFromPush").prop("disabled", true);
  $("#clientName").val(localStorage.getItem("clientName"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('serviceworker.js').then(function(registration) {
      registration.pushManager.permissionState({userVisibleOnly: true}).then(function(permission) {
        $("#registerForPush").click(function() {
          console.log("subscribing");
          registration.pushManager.subscribe({userVisibleOnly: true}).then(function(sub) {
            sendSubscriptionToServer(sub);
          }, function(e) {
            console.warn("subcription unsuccessful", e);
            alert(e.message);
          });
        });  
        console.log(permission);

        if (permission === "granted") {
          registration.pushManager.getSubscription().then(function(sub) {
            if (sub) {
              sendSubscriptionToServer(sub);
            } else {
              $("#registerForPush").prop("disabled", false);
                          
            }
          });          
        } else if (permission === "denied") {
          $("#messages").append($("<p>").text("Not permitted to push messages"));
          $("#registerForPush").prop("disabled", true);
        } else {
          $("#registerForPush").prop("disabled", false);
        }
      });
    });
  }
});
