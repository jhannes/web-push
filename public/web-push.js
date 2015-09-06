/* globals Notification */
'use strict';

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

function sendSubscriptionToServer(sub) {
  console.log("sendSubscriptionToServer", sub);
  $("#registerForPush").prop("disabled", true);

  $(".schedulePush").prop("disabled", false);
  $(".schedulePush").click(function() {
    ajax.post('/api/push-me?endpoint=' + sub.endpoint + "&message=" + $(this).data("message")).then(function() {
      console.log("successful");
    });
  });

  $("#deregisterFromPush").prop("disabled", false).click(function() {
    sub.unsubscribe().then(function() {
      $("#deregisterFromPush").prop("disabled", true);
      $("#registerForPush").prop("disabled", false);
      $(".schedulePush").prop("disabled", true);
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
  ajax.post('/api/registrations', registration).then(function() {
    console.log("successful");
  });
};

function setApiSupport(apiName, support) {
  $("." + apiName + "-support").hide();
  $("." + apiName + "-support." + support).show();
}


$(function() {
  if (!("Notification" in window)) {
    setApiSupport("notifications", "missing");
  }

  if ("Notification" in window) {
    setApiSupport("notifications", Notification.permission);
    $("#showNotification").click(function() {
      Notification.requestPermission(function(permission) {
        if (permission === "granted") {
          new Notification('Notification message', {
            icon: 'javazone.png',
            body: "This is an example of a push notification",
            sound: "notification-sound.ogg"
          });
        } else {
          setApiSupport("notifications", Notification.permission);
        }
      });
    });
  }


  $("#deregisterFromPush").prop("disabled", true);
  $("#clientName").val(localStorage.getItem("clientName"));

  if (!("serviceWorker" in navigator)) {
    setApiSupport("serviceworker", "missing");
  } else {
    setApiSupport("serviceworker", "default");    
  }

  if (!('PushManager' in window)) {
    setApiSupport("PushManager", "missing");
  } else {
    setApiSupport("PushManager", "default");
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener('message', function(e) {
      console.log('on message');
      console.log(e);
    });

    navigator.serviceWorker.register('serviceworker.js').then(function(registration) {
      // Throws exception in Opera
      registration.pushManager.permissionState({userVisibleOnly: true}).then(function(permission) {
        setApiSupport("PushManager", permission);

        $("#registerForPush").click(function() {
          registration.pushManager.subscribe({userVisibleOnly: true}).then(function(sub) {
            sendSubscriptionToServer(sub);
          }, function(e) {
            console.warn("subcription unsuccessful", e);
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
        }
      });
    });
  }
});

