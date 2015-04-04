Demonstration of the web-push showcase
======================================

Prerequisities:
---------------

* [NodeJS](https://nodejs.org/)
* Google developer project (see below)
* Chrome 42 (requires [Chrome beta](https://www.google.com/chrome/browser/beta.html))

Setting up a Google Developer project:
--------------------------------------

In order to send push messages, you have to have a project with Google Cloud Messaging support

1. Go to https://console.developers.google.com/
2. Click "Create new project" and enter a name. The developer console will take about a minute to create your project and launch the settings for it
3. Copy the Project number that was generated. You will need to put this in the `manifest.json` file
4. Under "APIs & auth", select API
5. Search for messaging to find and enable Google Cloud Messaging for Chrome
6. In the menu, under "APIs & auth", select Credentials
7. Click "Create new key" and select "Server key" (in the dialog that shows up, it's okay to just press Create)
8. Copy the API key that was generated. You will need to make this into an environment variable later

Running and demonstrating the server:
-------------------------------------

1. Check out the code
2. In the `web-push` directory, run `npm install` to install all dependencies
3. Set the environment variable API_KEY to your API key for the Google project
4. In the `web-push` directory, run `node app.js`
5. TODO - simplify this: Edit the `manifest.json` file and put your project number as `gcm_sender_id`
6. Go to http://localhost:1337/static *with Chrome 42* and enter you name and click Register client. This will register the client with Google Cloud Message and send the registration_id to the server.
7. Go to http://localhost:1337/static/admin.html with any browser. This page should list the registered clients.
8. Check one or more clients and click "Send notification"
9. The registered client will now show a notification message. This will happen even if the web page is no longer visible in the client. It will even happen if all the browser windows are closed, as long as the Chrome process is running

Troubleshooting:
----------------

* Check the Chrome developer console for any error messages
* Be sure to use Chrome 42, which is currently only in [Chrome beta](https://www.google.com/chrome/browser/beta.html)
* You have to access the page either at localhost or over https, or the client will be blocked
