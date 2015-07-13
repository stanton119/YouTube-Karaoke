// off by default
var karaokeEnabled;

// off by default, use localstorage to keep state
chrome.storage.sync.get('karaokeEnabled', function(data) {
	if (data.karaokeEnabled === undefined) {
		chrome.storage.sync.set({karaokeEnabled: 'false'});
		karaokeEnabled = false;
	} else if (data.karaokeEnabled === 'on') {
		karaokeEnabled = true;
	} else {
		karaokeEnabled = false;
	}
});

// show icon only for youtube pages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (!isYoutubeTab(tab))
		return;
	// place address bar icon
	showIcon(tabId);
	// turn content script on/off
	chrome.tabs.executeScript(tabId, {code: 'on = '+karaokeEnabled+';'});
	// turn filter on
	if (karaokeEnabled) {
		chrome.tabs.sendMessage(tab.id, {type: "filterOn"});
	}
});
function isYoutubeTab(tab) {
	// return tab.url.match(/youtube/);
	// true if video player only
	return (tab.url.indexOf('youtube.com/watch') > -1);
	
}
function showIcon(tabId) {
	chrome.pageAction.show(tabId);
	console.log("showing Karaoke icon, state: "+karaokeEnabled);
	icon_path = karaokeEnabled ? "img/on.png" : "img/off.png";
	chrome.pageAction.setIcon({tabId: tabId, path:icon_path});
}

chrome.pageAction.onClicked.addListener(function(tab) {
	karaokeEnabled = !karaokeEnabled;
	
	// use storage for persistence
	chrome.storage.sync.get('karaokeEnabled', function(data) {
		if (data.karaokeEnabled === 'on') {
			chrome.storage.sync.set({karaokeEnabled: 'off'});
		} else {
			chrome.storage.sync.set({karaokeEnabled: 'on'});
		}
	});
	
	// change icon
	icon_path = karaokeEnabled ? "img/on.png" : "img/off.png";
	chrome.pageAction.setIcon({tabId: tab.id, path:icon_path});
	
	// turn on/off karaoke
	if (karaokeEnabled) {
		insertedAlready = false;
		
		// turn filter on
		chrome.tabs.sendMessage(tab.id, {type: "filterOn"});
		
		// get tab: song title, tad_it
		getTabURL(tab.title, tab.id);
	} else {
		// delete tab from page
		
		// turn filter on
		chrome.tabs.sendMessage(tab.id, {type: "filterOff"});
	}
	chrome.tabs.executeScript(tab.id, {code: 'on = '+karaokeEnabled+';'});
	// chrome.tabs.executeScript(tabId, {file: "js/off.js"});
	console.log("Triggering Karaoke: "+karaokeEnabled);
});


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		
		console.log(request);
			
		if (request.type == "newLyrics") {
			// var tabCont = getTab(request.title);
			insertedAlready = false;
			// get tab: song title, tad_it
			getTabURL(request.title, sender.tab.id);
			
			// sendResponse({tabContent: tabCont});
		}
	}
);



var videoTitle;
var tabTitle;
// function to get tab URL
function getTabURL(title, tabId) {
	// condition title
	videoTitle = conditionTitle(title);
	
	// form google search url
	var google_url = 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=site%3Alyrics.wikia.com%22+' + encodeURIComponent(videoTitle) + ' -"Page Ranking Information"';
	console.log(google_url);
	
	// get top google result
	$.getJSON( google_url, function( data ) {
		if (data.responseStatus !== 200) {
			console.log("XHR google error");
			return;
		}
		console.log("URL found, parsing tab");
		try {
			var googleResult = data.responseData.results[0].unescapedUrl;
			tabTitle		 = data.responseData.results[0].titleNoFormatting;
		} catch (e) {
			errorShow(tabId, "No google url");
			return;
		}
		parseLyrics(googleResult, tabId);
	});
}

function conditionTitle(titleIn) {
	// condition title
	titleIn = titleIn.replace(" - YouTube", "");
	titleIn = titleIn.replace(/<[^>]*>/g, "").trim();
	titleIn = titleIn.replace(/\s+/gm, ' ')        // Remove all white spaces with a single space
	.trim()                       // Trim it
	.replace(/( \(.+\))+$/g, '')  // Remove additional info like (video)
	.replace(/( \[.+\])+$/g, '')  // Remove additional info like [video]
	.replace(/-(?=[^\s])/g, '- ') // Change -something to - something, so Google includes it in search
	.trim();
	
	return titleIn;
}

// function to parse tab URL
function parseLyrics (tabURL, tabId) {
	console.log(tabURL);
	
    if(!tabURL){
      errorShow(tabId,"No tab url");
	  return;
    }
	
	jQuery.ajax({
		url: tabURL,
		success: function(result) {
			try {
				var tabContent = $(result).find(".lyricbox");
				
				// remove scripts
				tabContent.find('script').remove();
				
				// find inner text
				tabContent = tabContent[0].innerText;
			
				console.log("sending tab to page");
				// insert into page
				insertIntoPage(tabId, tabContent, tabURL);
			} catch (e) {
				errorShow(tabId, "No tab url 2");
				return;
			}
		},
	});
}


// function to insert complete tab box into page
var insertedAlready = false;
function insertIntoPage(tabId, tabContent, URL) {
	if (insertedAlready) {
		console.log("Already inserted");
		return;
	}
	insertedAlready = true;
	// chrome.tabs.executeScript(tabId, {file: "js/on.js"});
	console.log("sending message to tab " + tabId);
	// console.log("tab content: " + tabContent);
	chrome.tabs.sendMessage(tabId, {type: "lyricsReceived", tabContents: tabContent, tabURL: URL, tabTitle: tabTitle, videoTitle: videoTitle});
}
function errorShow(tabId, tabContent) {
	console.log("Error: " + tabContent);
	insertIntoPage(tabId, "", "");
}




// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	// direct to welcome page

    if(details.reason == "install"){
        console.log("First time install, show website");
		// new tab with install page
		chrome.tabs.create({url: "http://www.richard-stanton.com/chrome-plugins/youtube-karaoke/karaokeinstall/"});
    }else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
		if (details.previousVersion == "2.0") {
			return;	// don't show page for 2.0 users
		}
		// if (details.previousVersion == "1.5.3") {
// 			return;	// don't show page for 2.0 users
// 		}
		chrome.tabs.create({url: "http://www.richard-stanton.com/chrome-plugins/youtube-karaoke/karaokeinstall/"});
    }
});