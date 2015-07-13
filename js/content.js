console.log("insert");
// inject listen.js into current webpage
var s = document.createElement('script');
s.src = chrome.extension.getURL("js/youtubeAPI.js");
s.onload = function() {
	this.parentNode.removeChild(this);
	console.log("s.onload");
};
(document.head||document.documentElement).appendChild(s);

// after inserting get current tab
// var on = 0;	// inserted by background script
var on;
// if (on === undefined) {
// 	on = 1;
// }
if (on) {
	requestLyrics();
}

// listen for new tab request
window.addEventListener("message", function(event) {
	// if new tab event
	if (on && event.data.type == "newTab") {
		console.log("Content script received: " + event.data.title);
		console.log(event);
		requestLyrics();
	}
}, false);

function requestLyrics() {
	// send message to background, wait for response
	chrome.runtime.sendMessage({
		type: "newLyrics",
		title: document.title
	}, function(response) {
		// process response = tab
		console.log("response");
	    callbackfn(response);
	    return;
	});
}


// when sent tab content, display on page
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log("received message, request:" + request.type);
		
		if (request.type == "lyricsReceived") {
			// output tab or error
			processTab(request);
		} else if (request.type == "filterOn") {
			// console.log("filter on");
			filterOn();
		} else if (request.type == "filterOff") {
			// console.log("filter off");
			filterOff();
		}
	}
);


function callbackfn(response) {
	console.log("callback");
	console.log(response);
	console.log(response.tabContent);
	
	// add tab to page
}



// function to insert complete tab box into page
function insertIntoPage(lyricDiv) {
	var sidebar = document.getElementById('watch7-sidebar-contents');
	//watch-discussion, watch7-sidebar-contents, switch between above comments vs above related videos
	// var sidebar = document.getElementById('watch-discussion');
	if (sidebar) {
		sidebar.insertBefore(lyricDiv, sidebar.firstChild);
	}
}


var videoTitle;
var tabTitle;
var tabURL;
function processTab(request) {
	// if already inserted to page
	var tabBoxes = document.getElementsByClassName('lyricsBox');
	if (tabBoxes.length>0) {
		console.log("already inserted to page");
		return;
	}
	
	tabTitle   = request.tabTitle;
	videoTitle = request.videoTitle;
	tabURL = request.tabURL;
	
	// if no tab found, show error
    if(!request.tabURL || !request.tabContents){
      errorShow();
	  return;
    }
	
	// create div
	var lyricDiv = document.createElement('div');
		lyricDiv.className = 'lyricsBox';
		// use innerText to prevent XSS
		lyricDiv.innerText = request.tabContents;
		
	// add header at top
	lyricDiv.insertBefore(createTabHeader(request.tabURL), lyricDiv.firstChild);
					
	// insert into page
	insertIntoPage(lyricDiv);
}

// function for tab header
function createTabHeader(tabURL) {
	// create div
	var tabHeader = document.createElement('div');
		tabHeader.className = 'tabHeader';
	
	// create links
	tabHeader.appendChild(sourceLink(tabURL));
	tabHeader.appendChild(document.createTextNode(" ---- "));
	tabHeader.appendChild(getSearchLinks());
	tabHeader.appendChild(document.createElement('br'));
	tabHeader.appendChild(getTabTitle());
	return tabHeader;
}

// function for sourceLink
function sourceLink(tabURL, sourceText) {
	// parameter defaults
	sourceText = typeof sourceText !== 'undefined' ? sourceText : "From lyrics.wikia.com";
	tabURL = typeof tabURL !== 'undefined' ? tabURL : "http://lyrics.wikia.com/";
	
	// create links
	var sourceLinkA = document.createElement('a');
	sourceLinkA.appendChild(document.createTextNode(sourceText));
	sourceLinkA.title = sourceText;
	sourceLinkA.className = "tab_sourceLink";
	sourceLinkA.href = tabURL;
	sourceLinkA.target = "_blank";
	return sourceLinkA;
}

// function for searchLinks
function getSearchLinks(wrongTab) {
	// linktext:
	wrongTab = typeof wrongTab !== 'undefined' ? wrongTab : "Wrong song?";
	
	// create links
	var searchLink = "https://www.google.co.uk/#q=lyrics%20" + encodeURIComponent(videoTitle);
	// var searchLink = "http://www.911tabs.com/search.php?search=" + encodeURIComponent(videoTitle);
	var searchLinkA = document.createElement('a');
	searchLinkA.appendChild(document.createTextNode(wrongTab));
	searchLinkA.title = wrongTab;
	searchLinkA.className = "tab_searchLink";
	searchLinkA.href = searchLink;
	searchLinkA.target = "_blank";
	return searchLinkA;
}

// function for searchLinks
function getTabTitle() {
	// process title
	// tabTitle
	console.log("Title: "+tabTitle);
	// two ways to filter end of title
	if (tabTitle.indexOf(" - LyricWikia - song lyrics, music lyrics")>-1) {
		var tabTitleProcessed = tabTitle.replace(" - LyricWikia - song lyrics, music lyrics", "");
	} else {
		var tabTitleProcessed = tabTitle.replace(" - LyricWiki - Wikia", "");
	}
	console.log("Title: "+tabTitleProcessed);
	
	// create links
	var searchLinkA = document.createElement('a');
	searchLinkA.appendChild(document.createTextNode(tabTitleProcessed));
	searchLinkA.innerHTML = tabTitleProcessed;	// html decode
	searchLinkA.className = "tab_title";
	searchLinkA.href = tabURL;
	searchLinkA.target = "_blank";
	return searchLinkA;
}

// function on error calls
function errorShow(e) {
	console.log("Error - could not find lyrics");
	if (e) {
		console.log(e);
	}
	
	// tab not found dialog
	// create div
	var lyricDiv = document.createElement('div');
		lyricDiv.className = 'lyricsBox tabBoxNo';
		// use innerText to prevent XSS
		lyricDiv.innerText = " -- Lyrics not found --";
		
	// create links
	lyricDiv.insertBefore(getSearchLinks("Search again..."), lyricDiv.firstChild);
		
	// insert into page
	insertIntoPage(lyricDiv);
}



// vocal filter
function SetupFilter(){
	// setup audio routing
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		audioContext = new AudioContext();
		
		audioSource = audioContext.createMediaElementSource(mediaElement);
		audioSource.connect(audioContext.destination);
		
		// phase inversion filter
		// input -> splitter
		// output -> destination
		splitter = audioContext.createChannelSplitter(2);
		gainL = audioContext.createGain();
		gainR = audioContext.createGain();
		// Gain stages
		gainL.gain.value = 1;
		gainR.gain.value = -1;
		// reconnect outputs
		splitter.connect(gainL, 0);
		splitter.connect(gainR, 1);
		gainL.connect(audioContext.destination);
		gainR.connect(audioContext.destination);
		
		
		// create band pass/stop using two cascaded biquads
		// inputs -> FilterLP1 & FilterLP2
		// outputs -> splitter & destinations
		console.log("Creating filter");
		
		// filter cutoff frequencies (Hz)
		var f1 = 200;
		var f2 = 6000;
		
		// Bandpass filter = LP + HP
		FilterLP1 = audioContext.createBiquadFilter();
		FilterLP1.type = "lowpass";
		FilterLP1.frequency.value = f2;
		FilterLP1.Q.value = 1;
		
		FilterLP3 = audioContext.createBiquadFilter();
		FilterLP3.type = "lowpass";
		FilterLP3.frequency.value = f2;
		FilterLP3.Q.value = 1;
		
		FilterHP1 = audioContext.createBiquadFilter();
		FilterHP1.type = "highpass";
		FilterHP1.frequency.value = f1;
		FilterHP1.Q.value = 1;
		
		FilterHP3 = audioContext.createBiquadFilter();
		FilterHP3.type = "highpass";
		FilterHP3.frequency.value = f1;
		FilterHP3.Q.value = 1;
		
		// Bandstop filter = LP + HP
		// blocking out everything!
		FilterLP2 = audioContext.createBiquadFilter();
		FilterLP2.type = "lowpass";
		FilterLP2.frequency.value = f1;
		FilterLP2.Q.value = 1;

		FilterLP4 = audioContext.createBiquadFilter();
		FilterLP4.type = "lowpass";
		FilterLP4.frequency.value = f1;
		FilterLP4.Q.value = 1;
		
		FilterHP2 = audioContext.createBiquadFilter();
		FilterHP2.type = "highpass";
		FilterHP2.frequency.value = f2;
		FilterHP2.Q.value = 1;
		
		FilterHP4 = audioContext.createBiquadFilter();
		FilterHP4.type = "highpass";
		FilterHP4.frequency.value = f2;
		FilterHP4.Q.value = 1;
		
		// connect filters
		FilterLP1.connect(FilterLP3);
		FilterLP3.connect(FilterHP1);
		FilterHP1.connect(FilterHP3);
		FilterHP3.connect(splitter);
		
		FilterLP2.connect(FilterLP4);
		FilterLP4.connect(audioContext.destination);
		FilterHP2.connect(FilterHP4);
		FilterHP4.connect(audioContext.destination);

		// audioSource.disconnect(0);
	}
	catch(e) {
		console.error('Web Audio API is not supported in this browser');
	}
}

function filterOn(){
	console.log("Removing vocals");
	audioSource.disconnect(0);

	// input to bandpass
	audioSource.connect(FilterLP1);
	
	// input to bandstop
	audioSource.connect(FilterLP2);
	audioSource.connect(FilterHP2);
}
function filterOff(){
	console.log("Adding in vocals");
	audioSource.disconnect(0);
	audioSource.connect(audioContext.destination);
}




// main
// check if audioSource already setup
if(typeof audioContext === 'undefined') {
	// get first video element
	mediaElement = document.getElementsByClassName('html5-main-video')[0];

	// webaudio elements
	var audioContext, audioSource, splitter, gainL, gainR;
	var FilterLP1, FilterHP1, FilterLP2, FilterHP2;
	var FilterLP3, FilterHP3, FilterLP4, FilterHP4;

	console.log("setting up filter")
	SetupFilter();
}