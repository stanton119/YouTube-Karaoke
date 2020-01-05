SamplesPerFrame = 1024;

% audio file input
FileIn = dsp.AudioFileReader('*.mp3','SamplesPerFrame',SamplesPerFrame);
Fs = FileIn.SampleRate;

% audio analyser
Spectra = dsp.SpectrumAnalyzer;
Spectra.SampleRate = Fs;

% time scope
Time = dsp.TimeScope;
Time.SampleRate = Fs;

% audio output
AudioOut = dsp.AudioPlayer;
AudioOut.SampleRate = Fs;

%% filter design
Fc	= 0.4;
N	= 2;   % FIR filter order
LP1	= fdesign.lowpass('N,Fc',N,Fc);


%% stream
tic;

while 1
	% get frame
	audioIn = FileIn.step;
	%step(Mic)
	
	% previous frame
	PrevAudio = audioIn;
	
	% display frame
	step(Spectra,audioIn);
	step(Time,audioIn);
	
	% play output
	AudioOut.step(audioIn);
end



%% clean up
release(FileIn);
release(Spectra);
release(Time);