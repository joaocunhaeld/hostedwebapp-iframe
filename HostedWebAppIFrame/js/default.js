// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
	"use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;	
	var appbarTileUri;

	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
            // Based on: https://code.msdn.microsoft.com/windowsapps/Secondary-Tiles-Sample-edf2a178
		    // Use setPromise to indicate to the system that the splash screen must not be torn down
		    // until after processAll and navigate complete asynchronously.
		    args.setPromise(WinJS.UI.processAll().then(function () {
		        var url;
		        var content = document.getElementById("content");
		        
		        if (args.detail.arguments !== " " && args.detail.arguments !== "") {
		            url = args.detail.arguments;
		        }
		        else {
		            url = content.src;
		        }

		        if (url !== content.src) {
		            content.src = url;
		        }

		        var content = document.getElementById("content");
		        content.addEventListener("MSWebViewNavigationStarting", navigationStart);
		        content.addEventListener("MSWebViewNavigationCompleted", navigationCompleted);
		        content.addEventListener("MSWebViewUnivewableContentIdentified", unviewableContentIdentified);

		        var appBar = document.getElementById("pinUnpinFromAppbar");
		        appBar.disabled = false;
		        appBar.winControl.getCommandById("commandButton").addEventListener("click", appbarButtonClicked, false);
		    }));
		}
	};

	app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
		// You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
		// If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
	};

	app.start();

	function navigationStart(e)
	{
	    WinJS.UI.Animation.fadeIn(WinJS.Utilities.query(".loadingContent").get(0));
	    appbarTileUri = e.uri;
	    setAppbarButton();
	}

	function navigationCompleted(e) {
	    WinJS.UI.Animation.fadeOut(WinJS.Utilities.query(".loadingContent").get(0));
	}

	function unviewableContentIdentified(e) {
	    WinJS.UI.Animation.fadeOut(WinJS.Utilities.query(".loadingContent").get(0));

	    var messageDialog = new Windows.UI.Popups.MessageDialog("Content loaded");
	    messageDialog.showAsync();
	}

	function setAppbarButton() {
	    var appBar = document.getElementById("pinUnpinFromAppbar");
	    var commandButton = document.getElementById("commandButton").winControl;

	    if (Windows.UI.StartScreen.SecondaryTile.exists(getAppbarTileId())) {
	        commandButton.label = "Unpin from start";
	        commandButton.icon = "unpin";
	    }
	    else {
	        commandButton.label = "Pin to start";
	        commandButton.icon = "pin";
	    }

	    appBar.winControl.sticky = false;
	}

	function appbarButtonClicked() {
	    var appBar = document.getElementById("pinUnpinFromAppbar");
	    appBar.winControl.sticky = true;

	    var commandButton = document.getElementById("commandButton");

	    if (WinJS.UI.AppBarIcon.unpin == commandButton.winControl.icon) {
	        unpinByElementAsync(commandButton, getAppbarTileId()).done(function (isDeleted) {
	            if (isDeleted) {
	                WinJS.log && WinJS.log("Secondary tile was successfully unpinned.", "sample", "status");
	            }
	            else {
	                WinJS.log && WinJS.log("Secondary tile was not unpinned.", "sample", "error");
	            }

	            setAppbarButton();
	        });
	    }
	    else {
	        pinByElementAsync(commandButton, getAppbarTileId(), appbarTileUri).done(function (isCreated) {
	            if (isCreated) {
	                WinJS.log && WinJS.log("Secondary tile was successfully pinned.", "sample", "status");
	            }
	            else {
	                WinJS.log && WinJS.log("Secondary tile was not pinned.", "sample", "error");
	            }

	            setAppbarButton();
	        });
	    }
	}

	function pinByElementAsync(element, newTileId, newTileDisplayName) {
	    var square150X150Logo = new Windows.Foundation.Uri("ms-appx:///images/logo.scale-100.png");
	    var square30x30Logo = new Windows.Foundation.Uri("ms-appx:///images/smalllogo.scale-100.png");

	    var currentTime = new Date();
	    var newTileDesiredSize = Windows.UI.StartScreen.TileSize.square150x150;

	    var tile = new Windows.UI.StartScreen.SecondaryTile(getAppbarTileId(), newTileDisplayName, appbarTileUri, square150X150Logo, newTileDesiredSize);

	    tile.visualElements.showNameOnSquare150x150Logo = true;
	    tile.visualElements.foregroundText = Windows.UI.StartScreen.ForegroundText.light;
	    tile.visualElements.square30x30Logo = square30x30Logo;

	    var selectionRect = element.getBoundingClientRect();
	    var buttonCoordinates = { x: selectionRect.left, y: selectionRect.top, width: selectionRect.width, height: selectionRect.height };
	    var placement = Windows.UI.Popups.Placement.above;

	    return new WinJS.Promise(function (complete, error, progress) {
	        tile.requestCreateForSelectionAsync(buttonCoordinates, placement).done(function (isCreated) {
	            if (isCreated) {
	                complete(true);
	            }
	            else {
	                complete(false);
	            }
	        });
	    });
	}

	function unpinByElementAsync(element, unwantedTileID) {
	    var selectionRect = element.getBoundingClientRect();
	    var buttonCoordinates = { x: selectionRect.left, y: selectionRect.top, width: selectionRect.width, height: selectionRect.height };
	    var placement = Windows.UI.Popups.Placement.above;

	    var tileToDelete = new Windows.UI.StartScreen.SecondaryTile(unwantedTileID);

	    return new WinJS.Promise(function (complete, error, progress) {
	        tileToDelete.requestDeleteForSelectionAsync(buttonCoordinates, placement).done(function (isDeleted) {
	            if (isDeleted) {
	                complete(true);
	            }
	            else {
	                complete(false);
	            }
	        });
	    });
	}

	function getAppbarTileId() {
	    var appbarTileId = appbarTileUri;
	    var uriLength = appbarTileUri.length;
	    if (uriLength > 64) {
	        appbarTileId = appbarTileId.substr(uriLength - 64, 64);
	    }

	    return appbarTileId.replace(new RegExp(/[\|\\"\/<>\?\;\:\!']/g), "-");
	}
})();
