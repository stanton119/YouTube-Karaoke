function onYouTubePlayerReady(playerId) {
	var currentVideo = document.getElementById("movie_player");
	currentVideo.addEventListener("onStateChange", "onytplayerStateChange");
	console.log("onYouTubePlayerReady");
}

var stageOne = 0;
function onytplayerStateChange(event) {
	console.log("state changed");
	console.log(event);
	
	// -1 for new video, followed by 3 for buffering = ACTION
	// -1 occurs for new videos, and going off page
	// new page after searching is followed by 3 for buffering
	if (stageOne) {
		if (event == 3) {
			stageOne = 0;
			console.log("sending title");
			window.postMessage({ type: "newTab", title: document.title }, "*");
		}
	} else {
		if (event == -1) {
			stageOne = 1;
		}
	}
};