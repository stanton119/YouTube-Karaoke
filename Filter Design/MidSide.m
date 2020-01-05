% uiopen('*.mp3',1)
fs

playLen = 1400000:1900000;
L = data(:,1);
R = data(:,2);

M = L+R;
S = L-R;


% soundsc(M(playLen),fs)
% soundsc(S(playLen),fs)

% side should be vocal free
S2 = S;

% filter Mid, to remove vocals as much as possible
F1 = 300;
F2 = 3500;

N  = 2;    % Order
h  = fdesign.lowpass('N,F3dB', N, F1, fs);
HdL = design(h, 'butter');
h  = fdesign.highpass('N,F3dB', N, F2, fs);
HdH = design(h, 'butter');

% M2 = M;
% more filtering
M2a = HdL.filter(M);
M2a = HdL.filter(M2a);
M2a = HdL.filter(M2a);
% M2 = HdL.filter(M2);
% M2 = HdH.filter(M2);
M2b = HdH.filter(M);
M2b = HdH.filter(M2b);
M2b = HdH.filter(M2b);
M2 = M2a+M2b;

% convert back into L+R

L2 = (M2+S2)/2;
R2 = (M2-S2)/2;

Z = [L2 R2];

% soundsc(Z(playLen,:),fs)

% current: band stop and band pass -> splitter (L-R) -> output
