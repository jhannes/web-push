/* jshint node: true */
"use strict";

var archiver = require('archiver');
var Promise = require('promise');
var child_process = require('child_process');

var fs = require('fs');
var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);


var certificate = "website_aps_production.pem";
var key = "web.net.openright.webpush.key";

function createManifest(directory) {
  var walkDirectoryTree = require('walk-tree-as-promised');
  var crypto = require('crypto');

  function calculateSha1Hash(data) {
    var hash = crypto.createHash('sha1');
    hash.setEncoding('hex');
    hash.update(data);
    hash.end();
    return hash.read();
  }

  function omitDirectories(baseDir, relativePath, stat, entries, callback) {
    callback(null, Array.prototype.concat.apply([], entries));
  }

  return walkDirectoryTree(directory, {
    processDirectory: omitDirectories
  }).then(function(files) {
    return Promise.all(files.map(function(file) {
      return readFile(directory + file).then(function(data) {
        return { filename: file, hash: calculateSha1Hash(data) };
      });
    }));
  }).then(function(values) {
    var result = {};
    values.forEach(function(value) {
      if (value.hash) {
        result[value.filename] = value.hash; 
      }
    });
    delete result['manifest.json'];
    delete result['signature'];
    return result;
  });
}


function createSignature(file) {
  return new Promise(function(resolve, reject) {
    child_process.execFile("openssl", 
      ["smime", "-sign", "-signer", certificate, "-inkey", key, "-in", file, "-binary", "-outform", "DER"],
      {},
      function(err, stdout, stderr) {
        if (err) {
          console.log(stderr);
          return reject(err);
        }
        resolve(stdout);
      });
  });
}

function createZip(directory, zipFile) {
  var archive = archiver("zip");
  archive.directory(directory, false);
  archive.pipe(fs.createWriteStream(zipFile));  
}



var command = process.argv[2];
if (command === "zip") {
  createZip("public/WebPush.pushpackage", 'public/WebPush.pushpackage.zip');
} else if (command === "manifest") {
  createManifest("public/WebPush.pushpackage/").then(function(manifest) {
    return writeFile('public/WebPush.pushpackage/manifest.json', JSON.stringify(manifest));
  }).then(function() {
    console.log("Wrote manifest");
  });
} else if (command === "signature") {
  createSignature("public/WebPush.pushpackage/manifest.json").then(function(signature) {
    return writeFile("public/WebPush.pushpackage/signature", signature);
  }).done(function() {
    console.log("Wrote signature");
  });
} else {
  console.warn("Unknown command", command);
}
