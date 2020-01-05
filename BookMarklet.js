// javascript bookmarklet to convert html5 video tags to audio
javascript:(function(){
	var mediaElement = document.getElementsByClassName('html5-main-video')[0];
	if (typeof mediaElement !== "undefined") {
		var paused = mediaElement.paused;
		mediaElement.parentNode.removeChild(mediaElement);
		if (!paused) {
			mediaElement.play();		
		}
	}
}
)();

//compiled bookmarklet
javascript:(function(){var%20mediaElement%20=%20document.getElementsByClassName(%27html5-main-video%27)[0];if%20(typeof%20mediaElement%20!==%20%22undefined%22)%20{var%20paused%20=%20mediaElement.paused;mediaElement.parentNode.removeChild(mediaElement);if%20(!paused)%20{mediaElement.play();}}})();
