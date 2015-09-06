var child_process = require('child_process');

var Promise = require('promise');

// Convert certificate to pem
//  openssl x509 -in website_aps_production.cer -inform DER -out website_aps_production.pem -outform PEM

// Create p12 key
//   ["pkcs12", "-export", "-inkey", "web.net.openright.webpush.key", "-in", "website_aps_productio.pem", "-out", "website_aps_production.p12"],

// Create signature file
//	["smime", "-sign", "-signer", "website_aps_production.pem", "-inkey", "web.net.openright.webpush.key", "-nodetach", "-outform", "DER"]


var execFile = Promise.denodeify(child_process.execFile);

//var certificate = "website_aps_production.pem";
var certificate = "website_aps_production.pem";
var key = "web.net.openright.webpush.key";
var file = "manifest.json";
var output = "signature";

execFile("openssl", 
	["smime", "-sign", "-signer", certificate, "-inkey", key, "-in", file, "-binary", "-outform", "DER","-out", output],
	{},
	function(err, stdout, stderr) {
		console.log("done", stdout, stderr);
	});

