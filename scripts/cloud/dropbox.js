/*
* Dropbox Integration
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Variables
------------------------*/
// Namespaces
cloud.dropbox = {};

// Dropbox
var welcomeDropboxArea, welcomeDropboxList, openDialogDropboxArea, openDialogDropboxList;
cloud.dropbox.client = undefined;


/* Auth
------------------------*/
cloud.dropbox.auth = new Dropbox.Client({
  key: "CBB0GYTWGYA=|aeSB7VBcIP94mzfQPoykIzGm++Z97KtaDn2snjXCGQ=="
});

cloud.dropbox.auth.authDriver(new Dropbox.Drivers.Popup({
  rememberUser: true,
  receiverUrl: "http://firetext.codexa.org/api/success/dropbox/"
}));

cloud.dropbox.auth.onAuth = new CustomEvent('cloud.dropbox.authed');


/* File IO
------------------------*/
cloud.dropbox.enumerate = function (directory, callback) {
  if (directory && cloud.dropbox.client && cloud.dropbox.client.readdir(directory)) {
    var docs = cloud.dropbox.client.readdir(directory, function(error, entries) {
      if (!error) {
        for (var i = 0; i < entries.length; i++) {
          var dir;
          if (directory[directory.length - 1] != '/') {
            dir = (directory + '/');
          } else {
            dir = directory;
          }
          entries[i] = (dir + entries[i]);
          entries[i] = firetext.io.split(entries[i]);
          entries[i].push('');
          
          // Only get documents
          if (entries[i][2] != '.txt' && entries[i][2] != '.html' && entries[i][2] != '.htm' && entries[i][2] != '.docx') {
            entries.splice(i, 1);
            i = (i - 1);
          }
        }
        // Remove folders
        for (var i = 0; i < entries.length; i++) {
          if (Array.isArray(entries[i]) == false | entries[i][2].length == 1 | entries[i][2][0] != '.') {
            entries.splice(i, 1);
          }
        }
        for (var i = 0; i < entries.length; i++) {
          if (Array.isArray(entries[i]) == false | entries[i][2].length <= 1 | entries[i][2][0] != '.') {
            entries.splice(i, 1);
            i = (i - 1);
          }
        }
        callback(entries);
      } else {
        client.mkdir(directory, function() {
          callback(cloud.dropbox.enumerate(directory, function(l) { return l; }));
        });
      }
    });
  }
};

cloud.dropbox.load = function (path, callback) {
  if (cloud.dropbox.client && path) {
    spinner();
    cloud.dropbox.client.readFile(path, function(e, d) {
      spinner('hide');
      if (!e) {
        callback(d);
      } else {
        callback(e.status, true);
      }
    });
  } else {
    if (!cloud.dropbox.client) {
      callback("You are not signed in to Dropbox", true);
    } else if (!path) {
      callback("Path not defined", true);
    } else {
      callback("Unknown error", true);
    }
  }
}

cloud.dropbox.save = function (path, content, showSpinner) {
  if (cloud.dropbox.client && path && content) {
    if (showSpinner != false) {
      spinner();
    }
    cloud.dropbox.client.writeFile(path, content, function() { 
      if (showSpinner != false) {
        spinner('hide');
        return;
      }
    });    
  } else {
    if (!cloud.dropbox.client) {
      return "You are not signed in to Dropbox";
    } else if (!path) {
      return "Path not defined";
    } else if (!content) {
      return "Content not defined";
    } else {
      return "Unknown error";
    }
  }
}

cloud.dropbox.delete = function (path) {
  if (cloud.dropbox.client && path) {
    cloud.dropbox.client.remove(path, function(e) { });
  } else {
    if (!cloud.dropbox.client) {
      return "You are not signed in to Dropbox";
    } else if (!path) {
      return "Path not defined";
    } else {
      return "Unknown error";
    }
  }
}


/* Misc
------------------------*/
cloud.dropbox.error = function (error) {
  switch (error.status) {
  case Dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    alert('Your Dropbox is full :(');
    break;


  case Dropbox.ApiError.NETWORK_ERROR:
    alert('Your network appears to be unavailable.\n\nPlease check your connection and try again.');
    break;

  case Dropbox.ApiError.RATE_LIMITED:
  case Dropbox.ApiError.INVALID_TOKEN:
  case Dropbox.ApiError.INVALID_PARAM:
  case Dropbox.ApiError.OAUTH_ERROR:
  case Dropbox.ApiError.INVALID_METHOD:    
  case 404:  
  default:
    // TBD Code to Notify Fireanalytic
    break;
  }
};
