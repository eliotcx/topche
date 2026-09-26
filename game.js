(() => {
  'use strict';

  const canvas = document.getElementById('rink');
  const ctx = canvas.getContext('2d');
  const bootLoader = document.getElementById('bootLoader');
  const bootStatus = document.getElementById('bootStatus');
  const bootProgress = document.getElementById('bootProgress');
  const bootStartedAt = performance.now();
  let bootCoreReady=0,bootFinished=false,bootFallbackTimer;
  function queueIntermissionAssets(){}
  function finishBootSequence(){
    if(bootFinished)return;bootFinished=true;clearTimeout(bootFallbackTimer);
    const reveal=()=>{if(bootStatus)bootStatus.textContent='Ready to hit the ice';if(bootProgress)bootProgress.style.width='100%';setTimeout(()=>{bootLoader?.classList.add('boot-ready');document.body?.classList.remove('app-loading');setTimeout(()=>{if(bootLoader)bootLoader.hidden=true;queueIntermissionAssets();},420);},220);};
    setTimeout(reveal,Math.max(0,620-(performance.now()-bootStartedAt)));
  }
  function markBootAssetReady(){bootCoreReady++;if(bootStatus&&bootCoreReady===1)bootStatus.textContent='Lacing up the players';if(bootProgress)bootProgress.style.width=`${Math.min(88,28+bootCoreReady*20)}%`;if(bootCoreReady>=3)finishBootSequence();}
  const bonusTestMode = /(?:^|[?&])bonus-test=1(?:&|$)/.test(window.location?.search||'');
  const ui = {
    startOverlay: document.getElementById('startOverlay'),
    score: document.getElementById('score'), streak: document.getElementById('streak'), timer: document.getElementById('timer'),
    roundText: document.getElementById('roundText'), roundProgress: document.getElementById('roundProgress'),
    reads: document.getElementById('reads'), accuracy: document.getElementById('accuracy'), avgTime: document.getElementById('avgTime'),
    bestScore: document.getElementById('bestScore'), feedback: document.getElementById('feedback'),
    coachText: document.getElementById('coachText'), skillLabel: document.getElementById('skillLabel'),
    levelEyebrow: document.getElementById('levelEyebrow'), missionTitle: document.getElementById('missionTitle'),
    missionCopy: document.getElementById('missionCopy'), levelStatus: document.getElementById('levelStatus'),
    soundButton: document.getElementById('soundButton'), howButton: document.getElementById('howButton'),
    howDialog: document.getElementById('howDialog'), closeHow: document.getElementById('closeHow'),
    lockerButton: document.getElementById('lockerButton'), lockerDialog: document.getElementById('lockerDialog'),
    closeLocker: document.getElementById('closeLocker'), cheesePoints: document.getElementById('cheesePoints'),
    lockerPoints: document.getElementById('lockerPoints'), lockerTabs: document.getElementById('lockerTabs'),
    lockerItems: document.getElementById('lockerItems'), lockerStatus: document.getElementById('lockerStatus'),
    lockerCatalogView: document.getElementById('lockerCatalogView'), viewPlayerButton: document.getElementById('viewPlayerButton'),
    playerShowcase: document.getElementById('playerShowcase'), backToLockerButton: document.getElementById('backToLockerButton'),
    playerRender: document.getElementById('playerRender'), equippedSummary: document.getElementById('equippedSummary'),
    sharePlayerButton: document.getElementById('sharePlayerButton'), downloadPlayerButton: document.getElementById('downloadPlayerButton'),
    shareStatus: document.getElementById('shareStatus'), powerUpIndicator: document.getElementById('powerUpIndicator'),
    powerUpIcon: document.getElementById('powerUpIcon'), standardControls: document.getElementById('standardControls'),
    bonusControls: document.getElementById('bonusControls'), bonusBanner: document.getElementById('bonusBanner'),
    bonusBannerTitle: document.getElementById('bonusBannerTitle'), bonusBannerCopy: document.getElementById('bonusBannerCopy')
  };
  const choiceButtons = [...document.querySelectorAll('[data-choice]')];

  const scenarios = [
    { answer:'left', goalie:0, cover:'right', shot:false, shotReason:'goalie', rush:null, defenders:[[.45,.56],[.55,.56],[.68,.38]], cue:'One teammate is isolated on the left. The goalie is square and the skating gap is too tight.' },
    { answer:'left', goalie:.35, cover:'right', shot:true, rush:null, defenders:[[.5,.34],[.46,.56],[.58,.56]], cue:'One teammate is completely open on the left. The shot and rush lanes are sealed.' },
    { answer:'right', goalie:0, cover:'left', shot:false, shotReason:'goalie', rush:null, defenders:[[.45,.56],[.55,.56],[.32,.38]], cue:'One teammate is isolated on the right. The goalie is square and the skating gap is too tight.' },
    { answer:'right', goalie:-.36, cover:'left', shot:true, rush:null, defenders:[[.5,.34],[.42,.56],[.54,.56]], cue:'One teammate is completely open on the right. The shot and rush lanes are sealed.' },
    { answer:'shoot', goalie:1, cover:'both', shot:false, rush:null, defenders:[], cue:'No defender is in the shooting lane and the goalie is stranded at the right post. Shoot far side.' },
    { answer:'shoot', goalie:-1, cover:'both', shot:false, rush:null, defenders:[], cue:'No defender is in the shooting lane and the goalie is stranded at the left post. Shoot far side.' },
    { answer:'rush', goalie:0, cover:'both', shot:true, rush:'left', teammates:[[.68,.5],[.82,.38]], defenders:[[.65,.48],[.79,.36]], cue:'Both teammates are tightly covered on the right. The entire left-side skating path is empty.' },
    { answer:'rush', goalie:0, cover:'both', shot:true, rush:'right', teammates:[[.18,.38],[.32,.5]], defenders:[[.21,.36],[.35,.48]], cue:'Both teammates are tightly covered on the left. The entire right-side skating path is empty.' },
    { answer:'rush', goalie:0, cover:'both', shot:true, rush:'centre', teammates:[[.2,.45],[.8,.45]], defenders:[[.22,.43],[.78,.43]], cue:'Both teammates are tightly covered at the boards. The entire middle skating path is empty.' },
    { answer:'regroup', goalie:0, cover:'both', shot:true, rush:null, defenders:[[.2,.36],[.35,.5],[.5,.34],[.65,.5],[.8,.36]], cue:'Every forward option is sealed. Turn back and keep possession.' },
    { answer:'regroup', goalie:0, cover:'both', shot:true, rush:null, defenders:[[.16,.32],[.34,.48],[.51,.37],[.67,.48],[.84,.32]], cue:'There is no clean pass or skating lane. Reset the attack.' },
    { answer:'regroup', goalie:0, cover:'both', shot:true, rush:null, defenders:[[.18,.4],[.37,.5],[.5,.32],[.63,.5],[.82,.4]], cue:'Pressure is layered across the ice. Regroup instead of forcing it.' },
    { situation:'2-on-1 · Pass', answer:'left', carrier:[.63,.72], goalie:0, shot:true, rush:null, teammates:[[.2,.34],[.78,.44]], defenders:[[.58,.45],[.68,.56]], cue:'The defender has taken away the puck carrier. Slide the puck to the isolated teammate.' },
    { situation:'2-on-1 · Shoot', answer:'shoot', carrier:[.36,.7], goalie:1, shot:false, rush:null, teammates:[[.2,.43],[.78,.4]], showRight:true, defenders:[[.76,.39]], cue:'The defender committed to the teammate and the goalie is stuck at the right post. Shoot far side.' },
    { situation:'Backdoor opening', answer:'right', carrier:[.24,.67], goalie:0, shot:true, rush:null, teammates:[[.18,.42],[.82,.29]], defenders:[[.36,.46],[.49,.55],[.27,.37]], cue:'The shot is blocked, but the backdoor teammate is alone at the far post.' },
    { situation:'Solo lane left', answer:'rush', carrier:[.52,.68], goalie:0, shot:false, rush:'left', solo:true, showLeft:false, showRight:false, defenders:[], cue:'You have no support, the goalie is square, and the entire left lane is open. Rush the puck wide and cut to the net.' },
    { situation:'Defender pinches', answer:'rush', carrier:[.54,.75], goalie:0, shot:true, rush:'left', teammates:[[.7,.5],[.83,.37]], defenders:[[.67,.48],[.8,.35]], cue:'The defender pinched toward the boards. Explode through the empty left-side lane.' },
    { situation:'Neutral-zone trap', answer:'regroup', carrier:[.5,.73], goalie:0, shot:true, rush:null, teammates:[[.2,.43],[.8,.43]], defenders:[[.2,.4],[.35,.52],[.5,.39],[.65,.52],[.8,.4]], cue:'The trap has sealed every forward route. Curl back and rebuild with possession.' },
    { situation:'Power-play seam', answer:'left', carrier:[.66,.71], goalie:0, shot:true, rush:null, teammates:[[.17,.3],[.82,.43]], defenders:[[.5,.42],[.64,.52],[.78,.38]], cue:'The penalty killers collapsed toward the puck. Fire the seam pass to the open left side.' },
    { situation:'Power-play lane', answer:'shoot', carrier:[.5,.65], goalie:-1, shot:false, rush:null, teammates:[[.2,.43],[.8,.43]], showLeft:true, showRight:true, defenders:[[.23,.41],[.77,.41]], cue:'Both teammates are covered, the middle lane is empty, and the goalie is pinned to the left post.' },
    { situation:'Low-cycle option', answer:'right', carrier:[.2,.59], goalie:0, shot:true, rush:null, teammates:[[.16,.4],[.82,.28]], defenders:[[.33,.45],[.48,.54],[.24,.35]], cue:'Pressure has closed around the puck. Hit the uncovered teammate across the low slot.' },
    { situation:'Blue-line gap', answer:'rush', carrier:[.42,.76], goalie:0, shot:true, rush:'right', teammates:[[.17,.38],[.3,.51]], defenders:[[.2,.36],[.33,.49]], cue:'Both passing options are covered on the left. Accelerate through the empty right-side gap.' },
    { situation:'Broken play', answer:'regroup', carrier:[.7,.72], goalie:0, shot:true, rush:null, teammates:[[.23,.4],[.78,.38]], defenders:[[.2,.37],[.38,.5],[.53,.36],[.67,.5],[.8,.35]], cue:'The formation has broken down and every direct option is covered. Regroup and reorganize.' },
    { situation:'Solo lane right', answer:'rush', carrier:[.47,.69], goalie:0, shot:false, rush:'right', solo:true, showLeft:false, showRight:false, defenders:[], cue:'There is no teammate to pass to, the goalie is set, and the right-side lane is completely open. Rush and attack the net.' },
    { situation:'Weak-side saucer', answer:'left', carrier:[.7,.7], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.15,.31],[.79,.42]], defenders:[[.5,.39],[.68,.49],[.78,.39]], cue:'The right side is crowded. The weak-side teammate has slipped alone behind the box.' },
    { situation:'Slot seam', answer:'right', carrier:[.29,.68], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.2,.41],[.84,.3]], defenders:[[.24,.39],[.43,.48],[.51,.35]], cue:'Pressure has collapsed left. The far-post teammate is uncovered on the right.' },
    { situation:'Goalie over-slide', answer:'shoot', carrier:[.61,.61], goalie:-1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.18,.4],[.81,.4]], defenders:[[.2,.38],[.79,.38]], cue:'Both passing options are covered and the goalie has over-slid to the left post.' },
    { situation:'Late middle lane', answer:'rush', carrier:[.48,.76], goalie:0, shot:true, rush:'centre', showLeft:true, showRight:true, teammates:[[.16,.42],[.84,.42]], defenders:[[.18,.4],[.82,.4]], cue:'The defenders widened with the wingers and left the middle completely open.' },
    { situation:'Wall escape left', answer:'rush', carrier:[.68,.77], goalie:0, shot:true, rush:'left', showLeft:true, showRight:true, teammates:[[.72,.46],[.84,.35]], defenders:[[.69,.43],[.82,.33]], cue:'Every option is tied up on the right. Escape through the empty left wall and cut in.' },
    { situation:'Wall escape right', answer:'rush', carrier:[.32,.77], goalie:0, shot:true, rush:'right', showLeft:true, showRight:true, teammates:[[.16,.35],[.28,.46]], defenders:[[.18,.33],[.31,.43]], cue:'Every option is tied up on the left. The right wall is an uncontested attack lane.' },
    { situation:'Reverse under pressure', answer:'regroup', carrier:[.63,.73], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.39],[.82,.39]], defenders:[[.18,.37],[.34,.5],[.49,.36],[.65,.51],[.82,.37]], cue:'The forecheck has sealed both walls and the middle. Reverse and rebuild.' },
    { situation:'Layered overload', answer:'regroup', carrier:[.38,.72], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.2,.4],[.8,.4]], defenders:[[.2,.38],[.33,.49],[.49,.34],[.66,.49],[.8,.38]], cue:'Two layers of pressure remove every forward play. Protect possession.' },
    { situation:'Cross-ice rotation', answer:'left', carrier:[.67,.66], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.14,.35],[.8,.38]], defenders:[[.49,.42],[.64,.49],[.78,.36]], cue:'The formation rotated toward the puck. The left point is the only clean outlet.' },
    { situation:'Give-and-go return', answer:'right', carrier:[.27,.63], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.17,.4],[.82,.32]], defenders:[[.22,.38],[.43,.47],[.52,.34]], cue:'The near option is smothered. Complete the give-and-go through the far side.' },
    { situation:'High-slot window', answer:'shoot', carrier:[.49,.57], goalie:1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.18,.4],[.82,.4]], defenders:[[.2,.38],[.8,.38]], cue:'The defenders chased both flanks and the goalie is stuck on the right post.' },
    { situation:'Solo middle lane', answer:'rush', carrier:[.43,.68], goalie:0, shot:false, rush:'centre', solo:true, showLeft:false, showRight:false, defenders:[], cue:'Only the goalie is ahead and the middle lane is wide open. Rush straight in and deke.' },
    { situation:'Penalty-kill split', answer:'rush', carrier:[.51,.73], goalie:0, shot:true, rush:'centre', showLeft:true, showRight:true, teammates:[[.18,.38],[.82,.38]], defenders:[[.19,.36],[.81,.36]], cue:'The penalty killers stretched wide. Split the empty middle before they recover.' },
    { situation:'Counterattack left', answer:'rush', carrier:[.59,.76], goalie:0, shot:true, rush:'left', showLeft:true, showRight:true, teammates:[[.68,.44],[.81,.34]], defenders:[[.66,.42],[.8,.32]], cue:'The turnover caught every defender on the right. Accelerate into the vacant left lane.' },
    { situation:'Counterattack right', answer:'rush', carrier:[.41,.76], goalie:0, shot:true, rush:'right', showLeft:true, showRight:true, teammates:[[.19,.34],[.32,.44]], defenders:[[.2,.32],[.34,.42]], cue:'The turnover caught every defender on the left. Attack the empty right lane.' },
    { situation:'3-on-2 switch left', answer:'left', carrier:[.58,.69], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.14,.31],[.82,.39]], defenders:[[.5,.4],[.69,.47],[.8,.37]], cue:'The defenders crossed assignments. Switch the puck to the isolated left attacker.' },
    { situation:'3-on-2 switch right', answer:'right', carrier:[.42,.69], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.39],[.86,.31]], defenders:[[.2,.37],[.31,.47],[.5,.4]], cue:'The defenders crossed assignments. The right attacker has slipped behind coverage.' },
    { situation:'Line-change possession', answer:'regroup', carrier:[.52,.75], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.19,.41],[.81,.41]], defenders:[[.19,.39],[.35,.5],[.5,.35],[.65,.5],[.81,.39]], cue:'Your support is changing and every lane is contested. Regroup until help arrives.' },
    { situation:'Overtime patience', answer:'regroup', carrier:[.47,.7], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.37],[.82,.37]], defenders:[[.18,.35],[.34,.46],[.49,.32],[.66,.46],[.82,.35]], cue:'A forced play risks an overtime breakaway. Curl back and keep the puck.' },
    { situation:'Solo attack left', answer:'rush', carrier:[.54,.7], goalie:0, shot:false, rush:'left', solo:true, showLeft:false, showRight:false, defenders:[], cue:'With no passing support and a square goalie, the clear left-side route is the best play. Rush and cut inside.' },
    { situation:'Delayed release', answer:'shoot', carrier:[.45,.6], goalie:-1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.18,.4],[.82,.4]], defenders:[[.2,.38],[.8,.38]], cue:'Both defenders committed outside. The goalie is pinned left and the slot has opened.' },
    { situation:'Disguised backdoor left', answer:'left', carrier:[.73,.64], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.15,.27],[.82,.4]], defenders:[[.51,.39],[.69,.47],[.8,.38]], cue:'Look through the traffic: the left backdoor player is completely unattended.' },
    { situation:'Disguised backdoor right', answer:'right', carrier:[.27,.64], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.4],[.85,.27]], defenders:[[.2,.38],[.31,.47],[.49,.39]], cue:'Look through the traffic: the right backdoor player is completely unattended.' },
    { situation:'Five-man box', answer:'regroup', carrier:[.5,.71], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.16,.38],[.84,.38]], defenders:[[.16,.36],[.32,.48],[.5,.33],[.68,.48],[.84,.36]], cue:'The five-player box is intact. Do not feed the counterattack—reset the formation.' },
    // New moving situations. Route arrows show developing plays, never the answer.
    { situation:'Trailing winger', answer:'left', carrier:[.64,.7], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.46],[.79,.4]], defenders:[[.43,.46],[.61,.43],[.78,.39]], routes:[['blue','left',.25,.41],['white',2,.78,.43]], cue:'The right winger is marked and the middle is crowded. The late left winger has a clear passing lane.' },
    { situation:'Far-side rotation', answer:'right', carrier:[.34,.7], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.38],[.82,.47]], defenders:[[.18,.41],[.41,.48],[.54,.46]], routes:[['blue','right',.78,.39],['white',0,.2,.4]], cue:'The left option is covered as the defence rotates. Find the right-side teammate arriving behind it.' },
    { situation:'Point-to-post seam', answer:'left', carrier:[.76,.61], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.17,.29],[.82,.4]], defenders:[[.57,.6],[.69,.45],[.81,.41]], routes:[['blue','left',.21,.32],['white',1,.68,.48]], cue:'The defenders press the puck side. Pass across to the teammate behind the far post.' },
    { situation:'Escape across the slot', answer:'right', carrier:[.22,.76], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.15,.42],[.83,.32]], defenders:[[.17,.4],[.35,.53],[.48,.47]], routes:[['blue','right',.78,.35],['white',1,.37,.53]], cue:'The near wall is trapped. Pass across the open upper slot to your right-side teammate.' },
    { situation:'Wide goalie, free lane', answer:'shoot', carrier:[.37,.63], goalie:1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.17,.39],[.8,.4]], defenders:[[.18,.39],[.78,.41]], routes:[['white',1,.82,.4],['blue','right',.8,.39]], cue:'Both passes are covered, but the middle is empty and the goalie is over at the right post. Shoot.' },
    { situation:'Outside defender peels', answer:'shoot', carrier:[.58,.61], goalie:-1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.18,.4],[.82,.41]], defenders:[[.18,.41],[.81,.42]], routes:[['white',1,.84,.4],['white',0,.16,.4]], cue:'The defenders peel to the wings while the goalie stays left. Take the clear shot to the far side.' },
    { situation:'Slot opens behind the press', answer:'shoot', carrier:[.48,.59], goalie:1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.16,.36],[.84,.38]], defenders:[[.18,.37],[.82,.39]], routes:[['white',0,.16,.39],['white',1,.84,.37]], cue:'The defenders follow both wings, leaving a shooting lane. The goalie is stranded right.' },
    { situation:'Late cut to the middle', answer:'shoot', carrier:[.6,.65], goalie:-1, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.18,.42],[.83,.38]], defenders:[[.19,.42],[.83,.4]], routes:[['blue','left',.17,.4],['white',1,.84,.38]], cue:'The pass options are tied up. With no body between you and the net, shoot away from the left-side goalie.' },
    { situation:'Left-side pressure release', answer:'rush', carrier:[.56,.77], goalie:0, shot:true, rush:'left', showLeft:false, showRight:true, teammates:[[.19,.43],[.8,.42]], defenders:[[.52,.4],[.74,.44],[.81,.4]], routes:[['white',1,.7,.46],['white',2,.81,.42]], cue:'The forecheck crowds the middle and your only teammate is covered on the right. Rush into the empty left lane.' },
    { situation:'Right-side counter lane', answer:'rush', carrier:[.44,.76], goalie:0, shot:true, rush:'right', showLeft:true, showRight:false, teammates:[[.17,.42],[.83,.4]], defenders:[[.17,.43],[.29,.46],[.51,.39]], routes:[['white',1,.31,.48],['blue','left',.18,.4]], cue:'The left side is swarming and the shot is covered. Skate up the unguarded right wall.' },
    { situation:'Two defenders split wide', answer:'rush', carrier:[.5,.78], goalie:0, shot:true, rush:'centre', showLeft:true, showRight:true, teammates:[[.17,.4],[.83,.4]], defenders:[[.18,.4],[.83,.4],[.5,.26]], routes:[['white',0,.16,.42],['white',1,.85,.42]], cue:'The wide defenders stay with your wingers; the middle skating gap is open below the high shot blocker.' },
    { situation:'Forechecker overcommits', answer:'rush', carrier:[.3,.72], goalie:0, shot:false, rush:'right', showLeft:true, showRight:false, teammates:[[.14,.4],[.82,.43]], defenders:[[.16,.41],[.32,.43],[.5,.34]], routes:[['white',1,.29,.44],['white',2,.53,.34]], cue:'The checker lunges toward the left wall while the goalie is set. Cut back and rush the open right-side space.' },
    { situation:'Three-way squeeze', answer:'regroup', carrier:[.47,.78], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.16,.38],[.83,.42]], defenders:[[.18,.39],[.34,.55],[.49,.42],[.66,.54],[.81,.41]], routes:[['white',1,.36,.57],['white',3,.64,.55]], cue:'The two outlets, shooting lane, and both routes forward are covered. Loop back to retain the puck.' },
    { situation:'High forecheck closes', answer:'regroup', carrier:[.61,.73], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.4],[.82,.39]], defenders:[[.18,.39],[.38,.52],[.56,.42],[.7,.54],[.81,.38]], routes:[['white',1,.4,.53],['white',3,.69,.55]], cue:'The forecheck arrives from both sides and the high defender blocks the shot. Regroup.' },
    { situation:'Wall exits denied', answer:'regroup', carrier:[.36,.75], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.17,.4],[.81,.4]], defenders:[[.17,.39],[.28,.53],[.48,.4],[.65,.53],[.82,.39]], routes:[['white',1,.29,.54],['white',3,.63,.54]], cue:'Both walls are sealed and the centre is screened by a defender. Turn out of pressure.' },
    { situation:'Corner trap resets', answer:'regroup', carrier:[.77,.71], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.38],[.82,.39]], defenders:[[.18,.38],[.49,.55],[.58,.41],[.73,.51],[.84,.39]], routes:[['white',1,.51,.56],['white',3,.71,.52]], cue:'The corner trap removes the nearby wall, cross-ice pass, and shot. Protect possession and regroup.' },
    { situation:'Delayed weak-side seam', answer:'left', carrier:[.71,.69], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.37],[.82,.41]], defenders:[[.52,.43],[.64,.43],[.83,.41]], routes:[['blue','left',.22,.33],['white',1,.66,.44]], cue:'The defence steps to the puck on the right. Send the puck to the late weak-side skater on the left.' },
    { situation:'Bumper moves to space', answer:'right', carrier:[.28,.68], goalie:0, shot:false, rush:null, showLeft:true, showRight:true, teammates:[[.17,.41],[.82,.29]], defenders:[[.17,.42],[.43,.5],[.54,.57]], routes:[['blue','right',.78,.31],['white',1,.41,.45]], cue:'The left wing is checked and the goalie is square. Find the right-side bumper arriving alone above the crease.' },
    { situation:'Support on the left wall', answer:'left', carrier:[.64,.63], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.18,.51],[.8,.38]], defenders:[[.49,.45],[.58,.41],[.81,.38]], routes:[['blue','left',.2,.48],['white',1,.58,.43]], cue:'The shooting lane and right winger are blocked. Use the open support skater along the left boards.' },
    { situation:'High point changes side', answer:'right', carrier:[.23,.72], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.16,.4],[.82,.35]], defenders:[[.17,.4],[.35,.51],[.53,.42]], routes:[['blue','right',.79,.32],['white',1,.36,.52]], cue:'The left wall is defended and your shot would hit traffic. Switch play to the right-side point.' }
  ];

  // Each developing read builds on a checked lane layout. The distinct player
  // movement and coaching cue describe the particular decision being tested.
  const additionalReads = [
    {base:48,situation:'Late centre outlet',routes:[['blue','left',.23,.4],['white',2,.8,.42]],cue:'The centre drops into open space to your left while the right wing remains covered. Feed the late outlet.'},
    {base:49,situation:'Weak-side winger cuts in',routes:[['blue','right',.76,.37],['white',0,.2,.39]],cue:'The defender stays with the near winger. Find the weak-side skater cutting into space on the right.'},
    {base:50,situation:'Far-post slip behind coverage',routes:[['blue','left',.19,.32],['white',1,.7,.47]],cue:'The defenders follow the puck down the right wall. Slip the pass to the unmarked far-post teammate.'},
    {base:51,situation:'Blue-line switch under pressure',routes:[['blue','right',.79,.33],['white',1,.38,.52]],cue:'The defender steps into the near passing lane. Switch the puck to the open right-side point.'},
    {base:64,situation:'Low support behind the press',routes:[['blue','left',.23,.47],['white',1,.6,.43]],cue:'Pressure closes around the puck and the right winger. The low left-side support remains free.'},
    {base:65,situation:'High-cycle release',routes:[['blue','right',.8,.3],['white',1,.38,.51]],cue:'The left lane is trapped. A high right-side skater arrives above the collapsing coverage.'},
    {base:66,situation:'Delayed trailer at the circle',routes:[['blue','left',.21,.34],['white',1,.67,.43]],cue:'The defence loads up on the right. The trailing attacker arrives alone at the left circle.'},
    {base:67,situation:'Reverse to the open point',routes:[['blue','right',.8,.32],['white',1,.37,.51]],cue:'The near-side wall is sealed; reverse play to the right point before the pressure arrives.'},
    {base:48,situation:'Cross-ice option after a pinch',carrier:[.66,.7],routes:[['blue','left',.23,.42],['white',2,.79,.43]],cue:'A defender pinches toward the right wing. The pass across to the left-side support is still clear.'},
    {base:49,situation:'Far winger escapes the check',carrier:[.32,.7],routes:[['blue','right',.78,.38],['white',0,.2,.4]],cue:'The near winger is checked. Send the puck to the right winger escaping behind the defender.'},
    {base:52,situation:'Screen clears the shooting lane',routes:[['white',0,.16,.39],['white',1,.82,.4]],cue:'Both defenders peel off to the flanks and the goalie is stranded on the right. Release a clear shot.'},
    {base:53,situation:'Goalie tracks the wrong wing',routes:[['white',0,.16,.4],['white',1,.84,.39]],cue:'The goalie stays left as the defence follows the wings. The open middle gives you a shot far side.'},
    {base:54,situation:'Wingers drag the coverage out',routes:[['white',0,.17,.38],['white',1,.83,.38]],cue:'Both checkers stretch wide with their marks. Shoot through the now-empty slot past the right-side goalie.'},
    {base:55,situation:'Late release against a slide',routes:[['white',0,.19,.41],['white',1,.84,.38]],cue:'The goalie has slid left and both passing targets are covered. Fire through the unblocked lane.'},
    {base:52,situation:'Clear lane after a switch',carrier:[.39,.63],routes:[['white',0,.16,.39],['white',1,.83,.4]],cue:'The defensive switch pulls both checkers to the wings. Shoot while the right-side goalie is out of position.'},
    {base:56,situation:'Vacated lane on a pinch',routes:[['white',1,.7,.45],['white',2,.82,.41]],cue:'The right-side defenders close on your winger and abandon the left lane. Carry the puck through it.'},
    {base:57,situation:'Counter through the empty wall',routes:[['white',1,.31,.47],['blue','left',.17,.4]],cue:'The defence collapses left after the turnover. Rush the open right wall instead of forcing a pass.'},
    {base:58,situation:'Split the stretching defence',routes:[['white',0,.16,.42],['white',1,.85,.41]],cue:'Each defender shadows a winger, leaving an open centre route below the shot blocker. Rush the gap.'},
    {base:59,situation:'Forecheck misses the turn',routes:[['white',1,.29,.45],['white',2,.53,.35]],cue:'A forechecker commits to the left wall. Turn into the space on the right and carry it forward.'},
    {base:56,situation:'Outside lane after overload',carrier:[.55,.77],routes:[['white',1,.71,.46],['white',2,.82,.42]],cue:'The overload seals the shot and the right pass. Skate into the left-side space it leaves behind.'},
    {base:60,situation:'No outlet against layered pressure',routes:[['white',1,.36,.56],['white',3,.64,.56]],cue:'The first checker blocks the shot while the second layer seals both outlets. Regroup with possession.'},
    {base:61,situation:'Forecheck closes both boards',routes:[['white',1,.4,.54],['white',3,.7,.55]],cue:'Two forecheckers take the boards and a third stays in the shooting lane. Turn back to reset.'},
    {base:62,situation:'Neutral-zone squeeze',routes:[['white',1,.29,.55],['white',3,.64,.55]],cue:'The defenders squeeze both passing lanes and protect the middle. Regroup before skating into traffic.'},
    {base:63,situation:'Corner pressure with no seam',routes:[['white',1,.5,.56],['white',3,.71,.53]],cue:'The corner press leaves no clean shot, outlet, or forward skating gap. Curl back with the puck.'},
    {base:60,situation:'Full-ice trap holds its shape',carrier:[.48,.78],routes:[['white',1,.35,.57],['white',3,.65,.55]],cue:'Both wings remain checked and the middle is blocked as the trap shifts. Keep possession and regroup.'}
  ];
  for(const read of additionalReads){
    const {base,...details}=read;
    scenarios.push({...scenarios[base],...details});
  }

  // These routes progress once with the round clock. Every play shows a
  // teammate finding space or drawing coverage while opponents react.
  const timedReads = [
    {base:48,situation:'Centre curls into the seam',routes:[['blue','left',.24,.42],['white',2,.79,.43]],cue:'The centre curls into the left seam as a checker follows the far winger. Pass left before the window shrinks.'},
    {base:49,situation:'Weak-side wing attacks the gap',routes:[['blue','right',.76,.37],['white',0,.2,.39]],cue:'The left winger remains covered while the right winger cuts through a gap. Move the puck right.'},
    {base:50,situation:'Net-front slip to the left',routes:[['blue','left',.23,.32],['white',1,.68,.48]],cue:'A checker reaches toward the puck, leaving the left net-front player free. Make the cross-ice pass.'},
    {base:51,situation:'Pressure follows the strong side',routes:[['blue','right',.79,.34],['white',1,.37,.52]],cue:'The forechecker follows your strong side. The right-side teammate moves into an open lane.'},
    {base:64,situation:'Wall support arrives below pressure',routes:[['blue','left',.23,.48],['white',1,.58,.43]],cue:'The right side is guarded; a supporting left winger drops below pressure to offer a pass.'},
    {base:65,situation:'High weak-side option',routes:[['blue','right',.77,.29],['white',1,.38,.51]],cue:'The defenders follow the puck to the left wall. Switch to the high right-side option.'},
    {base:66,situation:'Trailer arcs into the left circle',routes:[['blue','left',.22,.32],['white',1,.61,.42]],cue:'The trailer arcs into the left circle while the defence shifts right. Feed the open skater.'},
    {base:67,situation:'Point exchange across the ice',routes:[['blue','right',.78,.3],['white',1,.36,.53]],cue:'A checker seals the left wall as your right point backs into open space. Switch sides.'},
    {base:68,situation:'Low centre stays available',routes:[['blue','left',.27,.41],['white',2,.8,.42]],cue:'The centre drops lower for a clean left-side outlet while a defender tracks the right winger.'},
    {base:69,situation:'Right winger separates late',routes:[['blue','right',.76,.36],['white',0,.2,.39]],cue:'The right winger accelerates away from coverage. Look past the checked left side and pass right.'},
    {base:52,situation:'Wingers pull the defenders wide',routes:[['blue','left',.15,.36],['white',0,.16,.39],['white',1,.82,.4]],cue:'As both wingers draw their marks wider, a clean shooting lane opens against an off-centre goalie.'},
    {base:53,situation:'Right post vacated',routes:[['blue','right',.84,.39],['white',0,.16,.4],['white',1,.85,.4]],cue:'The goalie stays left while defenders follow the wide attackers. Take the unblocked shot.'},
    {base:54,situation:'Bumper drags the coverage',routes:[['blue','left',.13,.34],['white',0,.16,.39],['white',1,.85,.37]],cue:'The wide skaters pull defenders away from the slot. Shoot through the middle past the right-side goalie.'},
    {base:55,situation:'Late shot after a rotation',routes:[['blue','right',.86,.37],['white',0,.17,.41],['white',1,.85,.39]],cue:'The rotation carries both defenders away from your lane. Shoot far side while the goalie is left.'},
    {base:78,situation:'Middle opens behind the winger',routes:[['blue','right',.84,.38],['white',0,.16,.4],['white',1,.85,.4]],cue:'The winger carries a checker toward the boards; the uncovered middle remains a direct shot.'},
    {base:79,situation:'Far-side release under pressure',routes:[['blue','left',.15,.38],['white',0,.16,.4],['white',1,.85,.41]],cue:'The defenders chase your passing outlets. Shoot past the goalie stranded to the left.'},
    {base:56,situation:'Winger pulls the pinch inward',routes:[['blue','right',.82,.39],['white',1,.73,.44],['white',2,.83,.4]],cue:'The right winger drags defenders toward the puck side. Rush up the abandoned left lane.'},
    {base:57,situation:'Defender chases the left outlet',routes:[['blue','left',.16,.38],['white',1,.31,.46],['white',2,.52,.39]],cue:'The defence chases your left outlet. Carry through the open right-side skating lane.'},
    {base:58,situation:'Wide coverage leaves a split',routes:[['blue','left',.14,.37],['white',0,.15,.4],['white',1,.86,.41]],cue:'As both wingers drift wide with their checkers, drive through the middle gap.'},
    {base:59,situation:'Lunging forechecker leaves a lane',routes:[['blue','left',.12,.37],['white',1,.29,.44],['white',2,.53,.34]],cue:'The forechecker lunges left. Turn and skate up the free right-side route.'},
    {base:84,situation:'Left wing pins the defence',routes:[['blue','left',.16,.39],['white',1,.29,.49],['white',2,.51,.4]],cue:'The left wing remains checked as the defence crowds that side. Rush the open right skating lane.'},
    {base:85,situation:'Turn away from the wall pressure',routes:[['blue','right',.85,.38],['white',0,.17,.38],['white',1,.85,.38]],cue:'Both wingers draw the checkers outward. Rush through the unguarded centre.'},
    {base:86,situation:'Attacking gap beside the check',routes:[['blue','left',.15,.38],['white',0,.16,.42],['white',1,.3,.43]],cue:'The left outlet draws the checker. Turn away from pressure and rush the open right lane.'},
    {base:60,situation:'Centre support gets swallowed',routes:[['blue','left',.18,.36],['white',0,.19,.36],['white',1,.35,.56],['white',3,.64,.55]],cue:'Both teammates are checked and the forecheck keeps closing the middle. Regroup and protect the puck.'},
    {base:61,situation:'Forecheck takes away the outlets',routes:[['blue','right',.84,.37],['white',1,.4,.53],['white',3,.7,.55]],cue:'Your right winger tries to separate, but the forecheck owns both outlets and the shot lane. Reset.'},
    {base:62,situation:'Two layers deny the breakout',routes:[['blue','left',.15,.37],['white',0,.16,.37],['white',1,.29,.54],['white',3,.64,.54]],cue:'The first layer checks your winger and the second closes the middle. Regroup instead of forcing it.'},
    {base:63,situation:'Corner trap tracks the support',routes:[['blue','right',.84,.36],['white',1,.5,.56],['white',3,.72,.54]],cue:'A defender follows your supporting winger while the others protect the shot and left pass. Curl back.'},
    {base:88,situation:'High pressure denies the reset pass',routes:[['blue','left',.14,.35],['white',0,.16,.36],['white',1,.34,.55],['white',3,.65,.56]],cue:'Even as the left winger drifts wider, the defender tracks them. No direct attack lane remains.'},
    {base:89,situation:'Both boards close at once',routes:[['blue','right',.85,.38],['white',1,.4,.55],['white',3,.69,.55]],cue:'The forecheck tightens on both boards while the high defender screens the net. Turn back.'},
    {base:90,situation:'Traffic builds across the slot',routes:[['blue','left',.15,.36],['white',0,.16,.37],['white',1,.29,.54],['white',3,.63,.55]],cue:'The checking layer moves with your left winger and keeps every forward choice shut. Regroup.'}
  ];
  for(const read of timedReads){
    const {base,...details}=read;
    scenarios.push({...scenarios[base],...details,timedRoutes:true});
  }

  // New formations place support at different depths and angles. The defenders
  // track covered teammates; the shot screen follows the puck-to-net lane.
  // Matching route timing keeps the single safe action legible as everyone moves.
  const shiftingFormations = [
    {situation:'Low-to-high release',answer:'left',carrier:[.73,.59],teammates:[[.27,.51],[.78,.3]],ends:[[.17,.33],[.85,.36]],shot:false,cue:'The low left support backs into room while a defender mirrors the right winger. Find the free left outlet.'},
    {situation:'Inside-out curl',answer:'left',carrier:[.6,.82],teammates:[[.34,.48],[.75,.55]],ends:[[.14,.38],[.85,.44]],shot:true,cue:'A teammate curls from the inside lane to open ice on your left as the right side stays marked.'},
    {situation:'Far-side escape',answer:'left',carrier:[.77,.77],teammates:[[.28,.34],[.72,.42]],ends:[[.13,.4],[.84,.3]],shot:false,cue:'A forechecker shadows your near winger; the far-side skater escapes into the left lane.'},
    {situation:'Blue-line drop',answer:'left',carrier:[.67,.58],teammates:[[.31,.62],[.82,.43]],ends:[[.16,.49],[.76,.31]],shot:true,cue:'The left point drops to support the puck as the opposite outlet is taken away. Pass left.'},
    {situation:'Net-front peel',answer:'left',carrier:[.81,.68],teammates:[[.28,.27],[.7,.32]],ends:[[.14,.39],[.85,.4]],shot:false,cue:'The far-post teammate peels toward space on the left. The near-post route is checked.'},
    {situation:'Weak-side regroup pass',answer:'left',carrier:[.56,.84],teammates:[[.24,.58],[.76,.37]],ends:[[.14,.45],[.83,.49]],shot:true,cue:'The weak-side teammate loops low for a clear pass while the high right winger stays covered.'},
    {situation:'Right point slides down',answer:'right',carrier:[.26,.57],teammates:[[.19,.3],[.66,.58]],ends:[[.13,.41],[.84,.42]],shot:false,cue:'The right point slides toward open ice. The left post option is tracked by a checker.'},
    {situation:'Cycle through the seam',answer:'right',carrier:[.39,.83],teammates:[[.24,.46],[.7,.5]],ends:[[.13,.34],[.86,.33]],shot:true,cue:'The far winger cuts through the right seam as the defence closes around the left-side option.'},
    {situation:'Trailing right support',answer:'right',carrier:[.2,.73],teammates:[[.28,.36],[.62,.64]],ends:[[.13,.42],[.84,.46]],shot:false,cue:'The right-side trailer accelerates into open ice behind the press. Pass across.'},
    {situation:'Cross-ice wheel',answer:'right',carrier:[.31,.65],teammates:[[.2,.58],[.7,.27]],ends:[[.13,.42],[.85,.39]],shot:true,cue:'A teammate wheels out to the right while the close left-side lane remains covered.'},
    {situation:'Backdoor drift',answer:'right',carrier:[.22,.79],teammates:[[.18,.32],[.67,.38]],ends:[[.13,.45],[.84,.24]],shot:false,cue:'The far-post teammate drifts behind the defence on the right. Send the puck across.'},
    {situation:'Right wall outlet',answer:'right',carrier:[.44,.58],teammates:[[.23,.26],[.7,.61]],ends:[[.13,.42],[.85,.44]],shot:true,cue:'The right wall winger moves up into space as the left-side check stays with its target.'},
    {situation:'Slot clears to shoot',answer:'shoot',carrier:[.46,.74],teammates:[[.23,.49],[.72,.45]],ends:[[.11,.31],[.86,.3]],goalie:1,cue:'Both defenders move out with your wingers, opening a straight shot past the right-side goalie.'},
    {situation:'Low cycle shot window',answer:'shoot',carrier:[.69,.6],teammates:[[.29,.38],[.79,.55]],ends:[[.13,.28],[.87,.39]],goalie:-1,cue:'As the near-side defender tracks the cycling winger, the shot lane stays clear to the far side.'},
    {situation:'High-slot step-in',answer:'shoot',carrier:[.42,.57],teammates:[[.27,.61],[.79,.37]],ends:[[.12,.44],[.87,.48]],goalie:1,cue:'The markers follow both support skaters outward. Step into the clear slot and shoot.'},
    {situation:'Post-to-post misread',answer:'shoot',carrier:[.61,.77],teammates:[[.22,.34],[.7,.55]],ends:[[.12,.42],[.87,.35]],goalie:-1,cue:'The goalie reads a left-side pass and stays at that post. The middle shot is uncovered.'},
    {situation:'Late trailer releases',answer:'shoot',carrier:[.48,.66],teammates:[[.29,.55],[.77,.28]],ends:[[.1,.35],[.87,.42]],goalie:1,cue:'Both passing targets carry their checkers away; shoot through the middle before the goalie resets.'},
    {situation:'Wide decoys, clear shot',answer:'shoot',carrier:[.55,.56],teammates:[[.18,.47],[.75,.53]],ends:[[.1,.3],[.88,.42]],goalie:-1,cue:'The wide teammates draw both defenders, leaving a clear shot while the goalie is pinned left.'},
    {situation:'Break up the left boards',answer:'rush',carrier:[.73,.83],teammates:[[.63,.48],[.82,.31]],ends:[[.65,.34],[.86,.46]],rush:'left',shot:true,cue:'Both right-side teammates are checked. The left boards remain empty as the defenders follow them.'},
    {situation:'Escape the right corner',answer:'rush',carrier:[.25,.78],teammates:[[.18,.35],[.39,.56]],ends:[[.14,.48],[.31,.37]],rush:'right',shot:true,cue:'The left corner is crowded and your outlets are followed. Skate into the open right-side lane.'},
    {situation:'Split the retreating pair',answer:'rush',carrier:[.51,.86],teammates:[[.21,.59],[.8,.51]],ends:[[.12,.39],[.87,.37]],rush:'centre',shot:true,cue:'The retreating defenders stay with the wide wingers, leaving a centre skating gap.'},
    {situation:'Turn off the overload',answer:'rush',carrier:[.66,.65],teammates:[[.69,.38],[.85,.51]],ends:[[.62,.29],[.86,.36]],rush:'left',shot:true,cue:'The overload rushes to the right-side support. Cut into the unguarded left lane.'},
    {situation:'Inside lane opens right',answer:'rush',carrier:[.35,.82],teammates:[[.16,.52],[.3,.37]],ends:[[.12,.34],[.37,.3]],rush:'right',shot:true,cue:'Both left-side teammates are tied up; the moving checkers leave the right side open.'},
    {situation:'Race through centre ice',answer:'rush',carrier:[.48,.75],teammates:[[.19,.32],[.76,.59]],ends:[[.13,.44],[.86,.38]],rush:'centre',shot:true,cue:'The wingers stretch the two defenders apart. Rush through the empty centre route.'},
    {situation:'High forecheck reset',answer:'regroup',carrier:[.64,.84],teammates:[[.21,.46],[.75,.53]],ends:[[.14,.32],[.85,.4]],cue:'The forecheck tracks both outlets and closes the middle lane. Curl back with possession.'},
    {situation:'Corner cycle sealed',answer:'regroup',carrier:[.79,.62],teammates:[[.24,.31],[.83,.46]],ends:[[.13,.42],[.87,.3]],cue:'Every cycle outlet is followed and the shot lane is screened. Regroup before forcing a play.'},
    {situation:'Pinch across the wall',answer:'regroup',carrier:[.34,.8],teammates:[[.21,.57],[.78,.37]],ends:[[.12,.4],[.86,.49]],cue:'Two defenders pinch across the passing lanes while a third guards the net. Turn away.'},
    {situation:'Middle support marked',answer:'regroup',carrier:[.5,.7],teammates:[[.3,.37],[.7,.56]],ends:[[.12,.3],[.85,.42]],cue:'The moving middle support is still checked. Both passes, the shot, and the rush are defended.'},
    {situation:'Both outlets collapse',answer:'regroup',carrier:[.62,.78],teammates:[[.2,.59],[.82,.32]],ends:[[.12,.43],[.86,.47]],cue:'Each outlet draws a defender and the middle is blocked. Reverse course to retain the puck.'},
    {situation:'Trap tracks the late winger',answer:'regroup',carrier:[.41,.86],teammates:[[.16,.38],[.71,.52]],ends:[[.12,.51],[.86,.34]],cue:'The late winger cannot shake the checker and every forward lane closes. Regroup.'}
  ];
  function buildShiftingRead(formation){
    const {ends,...read}=formation;
    const carrier=read.carrier;
    const covered=read.answer==='left'?[1]:read.answer==='right'?[0]:[0,1];
    const defenders=[],routes=[];
    // Each covered teammate and their checker use the same staggered clock.
    for(let side=0;side<2;side++){
      const start=read.teammates[side],end=ends[side];
      const begin=side===0?.04:.14,finish=side===0?.88:.96;
      routes.push(['blue',side===0?'left':'right',...end,begin,finish]);
      if(covered.includes(side)){
        const marker=(point)=>[+(carrier[0]+(point[0]-carrier[0])*.68).toFixed(4),+(carrier[1]+(point[1]-carrier[1])*.68).toFixed(4)];
        defenders.push(marker(start));
        routes.push(['white',defenders.length-1,...marker(end),begin,finish]);
      }
    }
    if(read.shot!==false&&read.answer!=='shoot'){
      const shotPoint=(fraction)=>[+(carrier[0]+(.5-carrier[0])*fraction).toFixed(4),+(carrier[1]+(.095-carrier[1])*fraction).toFixed(4)];
      defenders.push(shotPoint(.77));routes.push(['white',defenders.length-1,...shotPoint(.71),.18,.9]);
    }
    if(read.answer==='regroup'){
      // Two lower checkers guard the skating exits while upper defenders
      // follow the passing lanes and screen the shot.
      for(const side of [-1,1]){
        const x=Math.max(.12,Math.min(.88,carrier[0]+side*.23));
        defenders.push([x,carrier[1]-.19]);
        routes.push(['white',defenders.length-1,Math.max(.12,Math.min(.88,x+side*.02)),carrier[1]-.22,.06,.75]);
      }
    }
    return {...read,goalie:read.goalie??0,shot:read.shot??(read.answer!=='shoot'),rush:read.rush??null,
      showLeft:true,showRight:true,defenders,routes,timedRoutes:true};
  }
  scenarios.push(...shiftingFormations.map(buildShiftingRead));

  const levels = [
    { id:'rookie', title:'Rookie Reads', short:'Pass or shoot', mission:'Learn to spot the open pass and the perfect shot.', focus:'See the simple play', rounds:6, time:10, minTime:10, unlock:4, scenarios:[0,2,4,5,1,3] },
    { id:'open-ice', title:'Open Ice', short:'Add the Rush', mission:'Read covered teammates and attack a wide-open skating lane.', focus:'Find open ice', rounds:8, time:4.8, minTime:4.1, unlock:6, scenarios:[0,2,4,5,6,7,8,1] },
    { id:'pressure', title:'Pressure Test', short:'Add Regroup', mission:'Protect the puck when every forward option has disappeared.', focus:'Manage pressure', rounds:10, time:4.4, minTime:3.7, unlock:7, scenarios:[0,1,2,3,4,5,6,7,9,10] },
    { id:'super', title:'Super Lab', short:'All core skills', mission:'Use every core hockey read at game speed and master the full challenge.', focus:'Game-speed decisions', rounds:12, time:4, minTime:3.35, unlock:9, scenarios:[0,1,2,3,4,5,6,7,8,9,10,11] },
    { id:'odd-man', title:'Odd-Man Rush', short:'2-on-1s · backdoor plays', mission:'Read whether the defender gives you the pass, shot, or open ice.', focus:'Odd-man decisions', rounds:8, time:3.9, minTime:3.35, unlock:6, scenarios:[12,13,14,15,16,17,6,8] },
    { id:'net-front', title:'Net-Front Chaos', short:'Rebounds · low-cycle reads', mission:'React to rebounds, backdoor openings, and pressure below the circles.', focus:'Net-front instincts', rounds:10, time:3.7, minTime:3.15, unlock:7, scenarios:[14,15,18,19,20,23,9,10,12,13] },
    { id:'power-play', title:'Power-Play Brain', short:'Seams · lanes · traps', mission:'Move defenders, recognize clean lanes, and reset against layered pressure.', focus:'Power-play vision', rounds:12, time:3.5, minTime:3, unlock:9, scenarios:[18,19,20,21,22,23,12,13,14,15,16,17] },
    { id:'championship', title:'Championship Qualifier', short:'Every core situation', mission:'Handle every core situation quickly enough to enter the elite levels.', focus:'Championship reads', rounds:16, time:3.3, minTime:2.8, unlock:12, scenarios:[12,13,14,15,16,17,18,19,20,21,22,23,6,8,9,11] },
    { id:'transition', title:'Transition Reads', short:'Counters · weak-side plays', mission:'Recognize counterattacks and weak-side openings without lane guides.', focus:'Transition scanning', rounds:14, time:3.2, minTime:2.7, unlock:11, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,39] },
    { id:'cycle', title:'Cycle Control', short:'Rotations · wall escapes', mission:'Read rotations, escapes, and possession choices as coverage shifts.', focus:'Cycle awareness', rounds:14, time:2.1, minTime:1.58, unlock:11, scenarios:[28,29,30,31,32,33,37,38,39,40,41,42,44,45] },
    { id:'special-teams', title:'Special Teams', short:'Power play · penalty kill', mission:'Find the single best play inside compact special-teams formations.', focus:'Special-teams vision', rounds:14, time:2, minTime:1.48, unlock:12, scenarios:[18,19,24,25,34,36,39,40,41,44,45,46,47,31] },
    { id:'east-west', title:'East-West Elite', short:'Seams · backdoor disguises', mission:'See through layered traffic to find late east-west openings.', focus:'Deception and seams', rounds:15, time:1.9, minTime:1.38, unlock:13, scenarios:[14,18,20,24,25,32,33,39,40,43,44,45,46,47,30] },
    { id:'counter', title:'Counterattack', short:'Instant transition choices', mission:'Choose the pass, shot, rush, or reset immediately after a turnover.', focus:'Counterattack speed', rounds:16, time:1.8, minTime:1.28, unlock:14, scenarios:[13,16,21,23,26,27,28,29,34,35,36,37,38,39,40,43] },
    { id:'pressure-cooker', title:'Pressure Cooker', short:'Crowded ice · little time', mission:'Keep your eyes up while multiple defenders close at once.', focus:'Poise under pressure', rounds:16, time:1.7, minTime:1.18, unlock:14, scenarios:[17,18,20,22,24,25,30,31,32,33,39,40,41,42,45,46] },
    { id:'vision', title:'Vision Lab', short:'Decoys · hidden openings', mission:'Ignore convincing decoys and identify the one genuinely open option.', focus:'Elite scanning', rounds:17, time:1.6, minTime:1.08, unlock:15, scenarios:[24,25,26,27,30,31,32,33,34,35,36,39,40,41,42,45,46] },
    { id:'pro-speed', title:'Pro Speed', short:'Every read · no guides', mission:'Process advanced formations at professional decision speed.', focus:'Pro-speed recognition', rounds:18, time:1.5, minTime:1, unlock:16, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,43] },
    { id:'elite-chaos', title:'Elite Chaos', short:'Broken plays · deception', mission:'Solve unpredictable-looking plays before the defence can recover.', focus:'Chaos recognition', rounds:18, time:1.4, minTime:.92, unlock:17, scenarios:[14,15,17,20,22,23,24,25,26,27,30,31,34,35,39,40,45,46] },
    { id:'sudden-death', title:'Sudden Death', short:'One mistake changes everything', mission:'Make near-perfect decisions under an unforgiving clock.', focus:'Clutch decisions', rounds:18, time:1.3, minTime:.84, unlock:16, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,41,42,47] },
    { id:'impossible-ice', title:'Impossible Ice', short:'Almost no reaction time', mission:'Read twenty elite situations with virtually no hesitation.', focus:'Instant recognition', rounds:20, time:1.18, minTime:.76, unlock:18, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,47] },
    { id:'gauntlet', title:'Top Che’s Gauntlet', short:'Perfect reads required', mission:'Complete twenty master-level decisions before the advanced moving-player challenges.', focus:'Master-level hockey sense', rounds:20, time:1.58, minTime:1.2, scoreTimeOffset:.5, unlock:20, scenarios:[45,26,31,37,24,43,29,40,34,42,25,36,30,46,27,41,35,38,44,47] },
    { id:'moving-lanes', title:'Moving Lanes', short:'Developing passing options', mission:'Track skaters as lanes open and defenders close throughout the countdown.', focus:'Watch the routes', rounds:18, time:1.85, minTime:1.4, unlock:16, scenarios:[12,13,14,18,19,20,24,25,26,27,28,29,30,31,32,33,34,35] },
    { id:'coverage-rotation', title:'Coverage Rotation', short:'Support · switches · screens', mission:'Read the rotation rather than the first opening you see.', focus:'Follow the coverage', rounds:20, time:1.7, minTime:1.28, unlock:18, scenarios:[14,18,20,22,24,25,26,27,30,31,32,33,34,35,36,37,38,39,40,41] },
    { id:'closing-window', title:'Closing Window', short:'Quick passes · timed shots', mission:'Identify the reliable play while your teammates and the checkers are moving.', focus:'Choose in motion', rounds:20, time:1.55, minTime:1.18, unlock:18, scenarios:[12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31] },
    { id:'full-ice-read', title:'Full-Ice Read', short:'Every option under pressure', mission:'See the whole play develop and protect the puck when routes disappear.', focus:'Read ahead', rounds:22, time:1.4, minTime:1.05, unlock:20, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45] },
    { id:'breakthrough', title:'Top Che’s Breakthrough', short:'Another leap in hockey IQ', mission:'Follow fast-moving routes as fresh challenges open up ahead.', focus:'Complete hockey vision', rounds:24, time:1.3, minTime:.95, unlock:22, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47] },
    { id:'support-switch', title:'Support Switch', short:'New passing angles', mission:'Find low support, trailing options, and switches across the ice.', focus:'Off-puck support', rounds:20, time:1.85, minTime:1.37, unlock:18, scenarios:[12,13,14,18,19,20,21,22,24,25,26,27,28,29,30,31,32,33,34,35] },
    { id:'rotating-coverage', title:'Rotating Coverage', short:'Checkers on the move', mission:'Track a changing defensive shape while you find an open play.', focus:'Defensive rotations', rounds:21, time:1.7, minTime:1.25, unlock:19, scenarios:[14,15,17,18,19,20,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36] },
    { id:'odd-man-motion', title:'Odd-Man Motion', short:'Rushing into space', mission:'Read moving support and skating gaps on the counterattack.', focus:'Transition vision', rounds:22, time:1.55, minTime:1.13, unlock:20, scenarios:[12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33] },
    { id:'changing-lanes', title:'Changing Lanes', short:'Pass · shoot · protect', mission:'See the reliable decision through shifting pass and shot lanes.', focus:'Quick adjustments', rounds:23, time:1.4, minTime:1.02, unlock:21, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46] },
    { id:'next-horizon', title:'Next Horizon', short:'Keep building your reads', mission:'Keep scanning as skaters move into new patterns and new challenges await.', focus:'Hockey IQ in motion', rounds:24, time:1.3, minTime:.95, unlock:24, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47] }
  ];
  window.TopCheLeaderboard?.setLevels(levels.map((level,index)=>({number:index+1,id:level.id,title:level.title})));

  // Every new timed read is guaranteed a place somewhere after Open Ice.
  // Replacement preserves the round count and favours an original of the same action.
  const freshScenariosByLevel=[[],[],[48,60,68,93],[49,52,69,94],[50,70,95,116],[51,53,71,96],
    [54,61,72,73,97],[55,56,74,98],[57,75,76,99,117],[58,62,77,100],[59,63,78,101],
    [64,79,80,102,118],[65,81,103],[66,82,83,104],[67,84,105],[48,54,60,85,86,106,119],
    [49,55,61,87,107],[56,59,62,88,89,108],[50,53,57,63,90,91,109,120],
    [51,52,58,64,65,66,67,92,110],
    [111,93,94,103,116],[112,121,95,96,104,109],
    [113,97,98,105,117],[114,99,100,106,118,110],
    [115,122,101,102,107,108,119,111],
    [146,123,129,135,147],[141,124,130,136,148],
    [142,125,131,137,149],[143,126,132,138,150],
    [144,127,133,139,151,145,128,134,140,152]];
  // Introduce every new formation throughout levels 3–30 as well as
  // revisiting the new patterns in the advanced levels.
  for(let slot=0;slot<shiftingFormations.length;slot++){
    const levelIndex=2+slot%28,scenarioIndex=123+slot;
    if(!freshScenariosByLevel[levelIndex].includes(scenarioIndex))freshScenariosByLevel[levelIndex].push(scenarioIndex);
  }

  const intermissions = [
    { id:'open-net-rookie', type:'open-net', afterLevel:3, title:'Open Net Rush!', short:'Flick into the gap', difficulty:'Beginner', rounds:6, time:2.75, cue:'Start on the puck and flick it into the glowing opening before time runs out.' },
    { id:'deflection-rookie', type:'deflection', afterLevel:6, title:'Deflection Perfection!', short:'Tip it past the goalie', difficulty:'Beginner', rounds:6, time:1.65, cue:'Drag your blade in front of the puck and redirect it into the net.' },
    { id:'rebound-rookie', type:'rebound', afterLevel:9, title:'Rebound Rush!', short:'Tap the rebound', difficulty:'Beginner', rounds:6, time:1.25, cue:'Track the wobbling rebound and tap it before it slides off the ice.' },
    { id:'open-net-advanced', type:'open-net', afterLevel:12, title:'Open Net Rush!', short:'Smaller openings', difficulty:'Advanced', rounds:8, time:2.15, cue:'Flick the puck from the ice into the smaller glowing opening.' },
    { id:'deflection-advanced', type:'deflection', afterLevel:15, title:'Deflection Perfection!', short:'Faster tips', difficulty:'Advanced', rounds:8, time:1.05, cue:'Track the faster puck and meet it cleanly with your blade.' },
    { id:'rebound-advanced', type:'rebound', afterLevel:18, title:'Rebound Rush!', short:'Faster rebounds', difficulty:'Advanced', rounds:8, time:.8, cue:'Track the wobbling rebound and tap it before it slides off the ice.' },
    { id:'open-net-expert', type:'open-net', afterLevel:21, title:'Open Net Rush!', short:'Expert openings', difficulty:'Expert', rounds:9, time:1.85, cue:'Flick quickly from the puck into the narrow opening before the goalie recovers.' },
    { id:'deflection-expert', type:'deflection', afterLevel:24, title:'Deflection Perfection!', short:'Expert deflections', difficulty:'Expert', rounds:9, time:.95, cue:'Move your blade into the glowing outline before the puck arrives.' },
    { id:'rebound-expert', type:'rebound', afterLevel:27, title:'Rebound Rush!', short:'Expert rebounds', difficulty:'Expert', rounds:9, time:.8, cue:'Track the bouncing puck and tap the rebound before it gets away.' }
  ];

  let state = {
    active:false, locked:true, round:0, total:6, levelIndex:0, score:0, streak:0, correct:0,
    elapsedTotal:0, duration:3.4, timeLeft:3.4, scenario:null, startedAt:0, sound:true,
    animStart:performance.now(), reveal:null, action:null, deck:[], paused:false, pausedAt:0, lastTickAt:0,
    mode:'level', bonusIndex:null, bonusAnswer:null, bonusChoice:null, bonusResult:null, bonusPhase:null,
    bonusDropAt:0, bonusReactionAt:0, bonusLastAnswer:null, bonusFromProgression:false,
    bonusPuck:null, bonusStick:null, bonusStickTarget:null, bonusFlick:null, bonusAimMiss:false, bonusWide:false, bonusGoalTarget:null, bonusSaveType:'pad', bonusGoalieFrom:0, bonusGoalieTo:0, bonusGoalieMoveAt:0
  };
  let raf;
  let bonusTimers=[],bonusRunToken=0;
  let audioCtx;
  let arenaMusicTimer=null,arenaMusicStep=0,arenaMusicTrackIndex=-1,arenaMusicTrackOrder=[],arenaMusicGeneration=0;
  const gearCatalog={
    jersey:[
      {id:'home-navy',name:'Home Navy',cost:0,color:'#1769ff',accent:'#ffffff',detail:'#071b2b'},
      {id:'maple-red',name:'Maple Red',cost:80,color:'#d81f35',accent:'#ffffff',detail:'#9b1222'},
      {id:'northern-white',name:'Northern White',cost:90,color:'#f3f7f8',accent:'#d62c3c',detail:'#193b75'},
      {id:'nordic-blue',name:'Nordic Blue',cost:110,color:'#1f63b7',accent:'#ffda45',detail:'#123f76'},
      {id:'alpine-red',name:'Alpine Red',cost:120,color:'#c72536',accent:'#ffffff',detail:'#111c2a'},
      {id:'coastal-teal',name:'Coastal Teal',cost:140,color:'#0098a6',accent:'#eefcff',detail:'#062f3a'},
      {id:'metro-blue-red',name:'Metro Blue & Red',cost:160,color:'#17498f',accent:'#e73a42',detail:'#ffffff'},
      {id:'gold-black',name:'Gold & Black',cost:180,color:'#e7b52c',accent:'#16191e',detail:'#ffffff'},
      {id:'aurora-green',name:'Aurora Green',cost:220,unlockLevel:3,color:'#087f66',accent:'#8ef5d0',detail:'#052f32'},
      {id:'solar-orange',name:'Solar Orange',cost:340,unlockLevel:9,color:'#ef6d1f',accent:'#ffe26b',detail:'#681f18'},
      {id:'cosmic-violet',name:'Cosmic Violet',cost:520,unlockLevel:16,color:'#592f99',accent:'#5ce6ef',detail:'#1a123d'},
      {id:'crimson-crest',name:'Crimson Crest',cost:690,unlockLevel:21,color:'#861d35',accent:'#f4d28a',detail:'#241324'},
      {id:'glacier-mint',name:'Glacier Mint',cost:860,unlockLevel:25,color:'#8debd5',accent:'#132e3a',detail:'#f7ffff'},
      {id:'midnight-copper',name:'Midnight Copper',cost:1125,unlockLevel:29,color:'#10151d',accent:'#c8753d',detail:'#f0d1a4'}
    ],
    logo:[
      {id:'cheese',name:'Cheese Wedge',cost:0,symbol:'🧀',color:'#132b3e',accent:'#ffcf54'},
      {id:'sticks',name:'Crossed Sticks',cost:70,symbol:'×',color:'#173c55',accent:'#ffffff'},
      {id:'north-leaf',name:'North Leaf',cost:100,symbol:'✦',color:'#a91d2f',accent:'#ffffff'},
      {id:'bolt',name:'Lightning',cost:120,symbol:'ϟ',color:'#165591',accent:'#ffdb48'},
      {id:'crown',name:'Ice Crown',cost:145,symbol:'♛',color:'#35216b',accent:'#ffd84e'},
      {id:'star',name:'Rink Star',cost:160,symbol:'★',color:'#123150',accent:'#ffffff'},
      {id:'comet',name:'Ice Comet',cost:210,unlockLevel:4,symbol:'☄',color:'#123150',accent:'#8deeff'},
      {id:'mountain',name:'North Peak',cost:350,unlockLevel:11,symbol:'▲',color:'#173c55',accent:'#f4fbff'},
      {id:'diamond',name:'Championship Diamond',cost:540,unlockLevel:18,symbol:'◆',color:'#25205c',accent:'#ffd85d'},
      {id:'meteor',name:'Meteor Mark',cost:675,unlockLevel:22,symbol:'✹',color:'#4b1738',accent:'#ffad54'},
      {id:'snow-owl',name:'Snow Owl',cost:850,unlockLevel:26,symbol:'◉',color:'#e8f0f1',accent:'#263746'},
      {id:'legacy-eight',name:'Legacy Eight',cost:1100,unlockLevel:30,symbol:'8',color:'#141820',accent:'#e3b84d'}
    ],
    helmet:[
      {id:'classic-navy',name:'Classic Pro',cost:0,color:'#071b2b',accent:'#2b6384',detail:'#b8d1dc',design:'classic'},
      {id:'polar-white',name:'Ice Storm',cost:65,color:'#e7f7fb',accent:'#38a7df',detail:'#ffffff',design:'ice'},
      {id:'captain-red',name:'Flame Runner',cost:85,color:'#a91424',accent:'#ffcf45',detail:'#f06422',design:'flame'},
      {id:'royal-blue',name:'Pirate Skull',cost:95,color:'#12171c',accent:'#f3f0df',detail:'#8b1d2c',design:'pirate'},
      {id:'gold-stripe',name:'Forest Camo',cost:125,color:'#284f35',accent:'#8aa35a',detail:'#14291e',design:'forest'},
      {id:'galaxy-dome',name:'Galaxy Dome',cost:190,unlockLevel:2,color:'#21154f',accent:'#81e8ff',detail:'#ffdc6b',design:'galaxy'},
      {id:'shark-attack',name:'Shark Attack',cost:315,unlockLevel:8,color:'#166b8a',accent:'#dff9ff',detail:'#082d45',design:'shark'},
      {id:'checker-pro',name:'Checker Pro',cost:470,unlockLevel:15,color:'#f0f5f7',accent:'#142331',detail:'#ffca45',design:'checker'},
      {id:'ember-cage',name:'Ember Cage',cost:640,unlockLevel:21,color:'#3b1018',accent:'#ff7a32',detail:'#f8c755',design:'flame'},
      {id:'northern-lights',name:'Northern Lights',cost:820,unlockLevel:25,color:'#122338',accent:'#4ee4b2',detail:'#c377ff',design:'galaxy'},
      {id:'gold-standard',name:'Gold Standard',cost:1080,unlockLevel:29,color:'#17191d',accent:'#d9b54c',detail:'#f5eee0',design:'checker'}
    ],
    tape:[
      {id:'white-tape',name:'Traditional Full Wrap',cost:0,color:'#f5f7f7',accent:'#bac8cc',design:'full'},
      {id:'black-tape',name:'Toe-Only Black',cost:35,color:'#111418',accent:'#596168',design:'toe'},
      {id:'red-tape',name:'Candy Cane Wrap',cost:45,color:'#d91f35',accent:'#ffffff',design:'candy'},
      {id:'blue-tape',name:'Blue Half Sock',cost:45,color:'#1e69c8',accent:'#a8d1ff',design:'half'},
      {id:'neon-tape',name:'Three-Strip Neon',cost:60,color:'#82ec3e',accent:'#d8ffa9',design:'three'},
      {id:'pink-tape',name:'Split Pink & White',cost:60,color:'#ff4f9b',accent:'#ffffff',design:'split'},
      {id:'zebra-wrap',name:'Zebra Wave',cost:120,unlockLevel:3,color:'#f7f7f2',accent:'#111418',design:'zebra'},
      {id:'heel-lock',name:'Heel Lock',cost:225,unlockLevel:10,color:'#ffcc3d',accent:'#131820',design:'heel'},
      {id:'target-rings',name:'Target Rings',cost:390,unlockLevel:17,color:'#ea324d',accent:'#ffffff',design:'rings'},
      {id:'copper-zebra',name:'Copper Zebra',cost:565,unlockLevel:22,color:'#b86836',accent:'#151515',design:'zebra'},
      {id:'mint-split',name:'Mint Split',cost:735,unlockLevel:26,color:'#55e2b2',accent:'#241b38',design:'split'},
      {id:'championship-wrap',name:'Championship Wrap',cost:965,unlockLevel:30,color:'#d7aa3d',accent:'#fff4cf',design:'rings'}
    ],
    shaft:[
      {id:'midnight',name:'Carbon Weave',cost:0,color:'#111820',accent:'#d3a62c',detail:'#2e3942',design:'carbon'},
      {id:'red-speed',name:'Lightning Fade',cost:100,color:'#f12d48',accent:'#ffffff',detail:'#ff8a39',design:'lightning'},
      {id:'woodland',name:'Woodgrain Classic',cost:115,color:'#a46a2d',accent:'#e8c794',detail:'#573414',design:'woodgrain'},
      {id:'ice-blue',name:'Frost Fracture',cost:130,color:'#24b8ee',accent:'#ffffff',detail:'#75e8ff',design:'frost'},
      {id:'digital-grid',name:'Digital Grid',cost:240,unlockLevel:5,color:'#15567d',accent:'#9dffdc',detail:'#2b98bb',design:'matrix'},
      {id:'sunset-burst',name:'Sunset Burst',cost:370,unlockLevel:12,color:'#ef4e29',accent:'#ffd84b',detail:'#64196f',design:'sunset'},
      {id:'power-circuit',name:'Power Circuit',cost:560,unlockLevel:19,color:'#3154c8',accent:'#8df4ff',detail:'#c14dff',design:'circuit'},
      {id:'graphite-gold',name:'Graphite Gold',cost:720,unlockLevel:23,color:'#171a1f',accent:'#d7ad42',detail:'#454b52',design:'carbon'},
      {id:'aurora-circuit',name:'Aurora Circuit',cost:905,unlockLevel:27,color:'#143d37',accent:'#64f1c6',detail:'#a652dc',design:'circuit'},
      {id:'heritage-wood',name:'Heritage Wood',cost:1160,unlockLevel:30,color:'#6d351d',accent:'#e7c292',detail:'#2a1710',design:'woodgrain'}
    ],
    socks:[
      {id:'home-ice',name:'Home Ice Bands',cost:0,color:'#1769ff',accent:'#ffffff',detail:'#071b2b',design:'classic'},
      {id:'maple-pulse',name:'Maple Pulse',cost:70,color:'#d81f35',accent:'#ffffff',detail:'#9b1222',design:'pulse'},
      {id:'nordic-crown',name:'Nordic Crown',cost:90,color:'#48236d',accent:'#ffda45',detail:'#fff1cf',design:'chevron'},
      {id:'candy-clash',name:'Candy Cane Clash',cost:105,color:'#e1273e',accent:'#ffffff',detail:'#ff8dab',design:'barber'},
      {id:'coastal-current',name:'Coastal Current',cost:125,color:'#0098a6',accent:'#eefcff',detail:'#062f3a',design:'wave'},
      {id:'neon-static',name:'Neon Static',cost:195,unlockLevel:4,color:'#9cff38',accent:'#ff4fa3',detail:'#332080',design:'static'},
      {id:'solar-flame',name:'Solar Flame',cost:275,unlockLevel:7,color:'#ef6d1f',accent:'#ffe26b',detail:'#a61e31',design:'flame'},
      {id:'gold-checker',name:'Gold Checker',cost:365,unlockLevel:11,color:'#e7b52c',accent:'#16191e',detail:'#ffffff',design:'checker'},
      {id:'cosmic-orbit',name:'Cosmic Orbit',cost:475,unlockLevel:16,color:'#592f99',accent:'#5ce6ef',detail:'#ffcf54',design:'orbit'},
      {id:'arctic-shatter',name:'Arctic Shatter',cost:590,unlockLevel:20,color:'#f4f7f4',accent:'#a8b0b7',detail:'#1f252b',design:'shatter'},
      {id:'copper-crosscut',name:'Copper Crosscut',cost:680,unlockLevel:22,color:'#9a4e2d',accent:'#f0c486',detail:'#2c1813',design:'crosscut'},
      {id:'orchid-strike',name:'Orchid Strike',cost:790,unlockLevel:24,color:'#8b3eb8',accent:'#ffd456',detail:'#f7dff2',design:'diagonal'},
      {id:'forest-frost',name:'Forest Frost',cost:900,unlockLevel:26,color:'#174b35',accent:'#b5e36e',detail:'#f1eed4',design:'bands'},
      {id:'midnight-confetti',name:'Midnight Confetti',cost:1025,unlockLevel:28,color:'#171525',accent:'#ff6f91',detail:'#f4c84f',design:'confetti'},
      {id:'champion-cream',name:'Champion Cream',cost:1200,unlockLevel:30,color:'#f2e3bd',accent:'#7e2131',detail:'#16191d',design:'crown'}
    ],
    gloves:[
      {id:'navy-gloves',name:'Navy Gloves',cost:0,color:'#071b2b',accent:'#2d6590'},
      {id:'red-white',name:'Red & White',cost:85,color:'#c82032',accent:'#ffffff'},
      {id:'blue-gold',name:'Blue & Gold',cost:100,color:'#154b9b',accent:'#e9bd39'},
      {id:'black-gold',name:'Black & Gold',cost:115,color:'#15191e',accent:'#d7ad36'},
      {id:'teal-white',name:'Teal & White',cost:120,color:'#078995',accent:'#ffffff'},
      {id:'arctic-gloves',name:'Arctic Flash',cost:205,unlockLevel:4,color:'#eaf8fb',accent:'#209bd1'},
      {id:'voltage-gloves',name:'Voltage',cost:320,unlockLevel:9,color:'#20242b',accent:'#b8f241'},
      {id:'royal-gloves',name:'Royal Elite',cost:455,unlockLevel:14,color:'#4b237d',accent:'#f0c95c'},
      {id:'ember-gloves',name:'Ember Grip',cost:625,unlockLevel:21,color:'#6b1e29',accent:'#ff9a3c'},
      {id:'mint-gloves',name:'Mint Freeze',cost:795,unlockLevel:25,color:'#dffaf1',accent:'#14705f'},
      {id:'copper-gloves',name:'Copper Pro',cost:1030,unlockLevel:29,color:'#171a1e',accent:'#c56d3d'}
    ],
    skates:[
      {id:'classic-black',name:'Classic Black',cost:0,color:'#111419',accent:'#d9e4e8'},
      {id:'copper-edge',name:'Copper Edge',cost:105,color:'#12161c',accent:'#d2854e'},
      {id:'red-runner',name:'Red Runner',cost:115,color:'#15191e',accent:'#dc3442'},
      {id:'blue-runner',name:'Blue Runner',cost:125,color:'#111821',accent:'#2499db'},
      {id:'frost-blade',name:'Frost Blade',cost:250,unlockLevel:6,color:'#e5f8ff',accent:'#36b8e8'},
      {id:'gold-pulse',name:'Gold Pulse',cost:390,unlockLevel:13,color:'#15191e',accent:'#f0bd35'},
      {id:'whiteout-skates',name:'Whiteout Pro',cost:590,unlockLevel:20,color:'#eef5f7',accent:'#333d48'},
      {id:'copper-runner',name:'Copper Runner',cost:675,unlockLevel:22,color:'#1b1c20',accent:'#bd6b3d'},
      {id:'aurora-blade',name:'Aurora Blade',cost:850,unlockLevel:26,color:'#14262d',accent:'#5be6bd'},
      {id:'champion-edge',name:'Champion Edge',cost:1120,unlockLevel:30,color:'#f1eadb',accent:'#b58b2d'}
    ],
    number:[
      ...[10,8,9,19,29,71,87,97,99].map((number,index)=>({id:String(number),name:`Number ${number}`,symbol:String(number),cost:index?45+index*10:0,color:'#12344a',accent:'#ffffff'})),
      {id:'11',name:'Number 11',symbol:'11',cost:140,unlockLevel:2,color:'#12344a',accent:'#ffffff'},
      {id:'16',name:'Number 16',symbol:'16',cost:245,unlockLevel:7,color:'#12344a',accent:'#ffffff'},
      {id:'21',name:'Number 21',symbol:'21',cost:430,unlockLevel:15,color:'#12344a',accent:'#ffffff'},
      {id:'24',name:'Number 24',symbol:'24',cost:585,unlockLevel:22,color:'#12344a',accent:'#ffffff'},
      {id:'44',name:'Number 44',symbol:'44',cost:760,unlockLevel:26,color:'#12344a',accent:'#ffffff'},
      {id:'88',name:'Number 88',symbol:'88',cost:990,unlockLevel:30,color:'#12344a',accent:'#ffffff'}
    ],
    cardstyle:[
      {id:'arena-poster',name:'Arena Poster',cost:0,design:'anton',color:'#ef3b31',accent:'#101d34',detail:'#f8d64d'},
      {id:'ice-rookie',name:'Ice Rookie',cost:90,unlockLevel:1,design:'collection',motif:'frost',layout:'topbar',badge:'puck',font:'Anton',logoCorner:'br',color:'#e9fbff',accent:'#1b9ec3',detail:'#073c63',ink:'#062b44'},
      {id:'heritage-portrait',name:'Heritage Portrait',cost:125,unlockLevel:2,design:'collection',motif:'paper',layout:'bottom',badge:'stamp',font:'Graduate',logoCorner:'tr',color:'#ead8ab',accent:'#a62b31',detail:'#183f57',ink:'#183f57'},
      {id:'pop-art-check',name:'Pop Art Check',cost:165,unlockLevel:3,design:'collection',motif:'pop',layout:'diagonalUp',badge:'burst',font:'Bungee',logoCorner:'bl',color:'#ffdf3f',accent:'#f13b67',detail:'#19b9d0',ink:'#10152b'},
      {id:'bungee-breakout',name:'Bungee Breakout',cost:275,unlockLevel:4,design:'bungee',color:'#f5cf3f',accent:'#5126a8',detail:'#31d8e8'},
      {id:'rink-blueprint',name:'Rink Blueprint',cost:315,unlockLevel:5,design:'collection',motif:'blueprint',layout:'rightside',badge:'hex',font:'Russo One',logoCorner:'bl',color:'#0b3b68',accent:'#70dff2',detail:'#ffffff',ink:'#ffffff'},
      {id:'admit-one',name:'Admit One',cost:355,unlockLevel:6,design:'collection',motif:'ticket',layout:'leftside',badge:'ticket',font:'Black Ops One',logoCorner:'tr',color:'#f0c65c',accent:'#762338',detail:'#142d47',ink:'#142d47'},
      {id:'black-ops-ice',name:'Black Ops Ice',cost:390,unlockLevel:7,design:'blackops',color:'#07120f',accent:'#94ef3b',detail:'#dce8dd'},
      {id:'stick-shop',name:'Stick Shop',cost:430,unlockLevel:8,design:'collection',motif:'wood',layout:'bottom',badge:'plaque',font:'Alfa Slab One',logoCorner:'tl',color:'#9b5e2e',accent:'#f0d097',detail:'#293b47',ink:'#fff4da'},
      {id:'daily-cheddar',name:'Daily Cheddar',cost:470,unlockLevel:9,design:'collection',motif:'newsprint',layout:'topbar',badge:'seal',font:'Graduate',logoCorner:'br',color:'#e9e5d8',accent:'#252525',detail:'#c74336',ink:'#1c1c1c'},
      {id:'eight-bit-ice',name:'8-Bit Ice',cost:515,unlockLevel:10,design:'collection',motif:'arcade',layout:'bottom',badge:'pixel',font:'Russo One',logoCorner:'tl',color:'#12072f',accent:'#5ef5df',detail:'#ff4ccf',ink:'#ffffff'},
      {id:'varsity-heritage',name:'Varsity Heritage',cost:490,unlockLevel:11,design:'graduate',color:'#efe0b3',accent:'#7e1828',detail:'#153f68'},
      {id:'street-rink',name:'Street Rink',cost:590,unlockLevel:12,design:'collection',motif:'graffiti',layout:'diagonalDown',badge:'spray',font:'Anton',logoCorner:'br',color:'#32243f',accent:'#ff7a29',detail:'#6bf0d2',ink:'#ffffff'},
      {id:'nordic-shift',name:'Nordic Shift',cost:635,unlockLevel:13,design:'collection',motif:'knit',layout:'rightside',badge:'patch',font:'Graduate',logoCorner:'tr',color:'#17344c',accent:'#e54e4e',detail:'#f5efe0',ink:'#ffffff'},
      {id:'captains-banner',name:"Captain's Banner",cost:685,unlockLevel:14,design:'collection',motif:'banner',layout:'split',badge:'shield',font:'Alfa Slab One',logoCorner:'tl',color:'#102945',accent:'#c42836',detail:'#f1cb57',ink:'#ffffff'},
      {id:'silver-etch',name:'Silver Etch',cost:740,unlockLevel:15,design:'collection',motif:'etched',layout:'topbar',badge:'coin',font:'Black Ops One',logoCorner:'br',color:'#dfe5e8',accent:'#53636c',detail:'#111a22',ink:'#111a22'},
      {id:'hall-of-fame',name:'Hall of Fame',cost:650,unlockLevel:16,design:'alfa',color:'#28140b',accent:'#d5ad58',detail:'#f6ead0'},
      {id:'lava-lamp',name:'Lava Lamp',cost:850,unlockLevel:17,design:'collection',motif:'lava',layout:'diagonalUp',badge:'flame',font:'Bungee',logoCorner:'tr',color:'#19080c',accent:'#ff4b21',detail:'#ffbd35',ink:'#ffffff'},
      {id:'frozen-glass',name:'Frozen Glass',cost:915,unlockLevel:18,design:'collection',motif:'shards',layout:'leftside',badge:'crystal',font:'Anton',logoCorner:'bl',color:'#dff9ff',accent:'#5acde3',detail:'#375ea9',ink:'#092a52'},
      {id:'metro-rush',name:'Metro Rush',cost:980,unlockLevel:19,design:'collection',motif:'metro',layout:'bottom',badge:'roundel',font:'Russo One',logoCorner:'br',color:'#f4f0dd',accent:'#e53b36',detail:'#1686a7',ink:'#142335'},
      {id:'comic-issue',name:'Comic Issue',cost:1050,unlockLevel:20,design:'collection',motif:'comic',layout:'topbar',badge:'burst',font:'Bungee',logoCorner:'tl',color:'#2b69db',accent:'#ffde34',detail:'#ef3751',ink:'#11172a'},
      {id:'future-star',name:'Future Star',cost:825,unlockLevel:21,design:'russo',color:'#071739',accent:'#ff455d',detail:'#59e5f3'},
      {id:'sunset-chrome',name:'Sunset Chrome',cost:1210,unlockLevel:22,design:'collection',motif:'sunset',layout:'diagonalDown',badge:'sun',font:'Monoton',logoCorner:'tr',color:'#2a1748',accent:'#ff5b67',detail:'#ffcc55',ink:'#ffffff'},
      {id:'carbon-pro',name:'Carbon Pro',cost:1300,unlockLevel:23,design:'collection',motif:'carbon',layout:'rightside',badge:'hex',font:'Russo One',logoCorner:'bl',color:'#111820',accent:'#5fd4dc',detail:'#e6f0f2',ink:'#ffffff'},
      {id:'royal-crest',name:'Royal Crest',cost:1400,unlockLevel:24,design:'collection',motif:'royal',layout:'topbar',badge:'crown',font:'Alfa Slab One',logoCorner:'br',color:'#311657',accent:'#d5ad58',detail:'#f4e7c6',ink:'#ffffff'},
      {id:'polar-prism',name:'Polar Prism',cost:1500,unlockLevel:25,design:'collection',motif:'prism',layout:'diagonalUp',badge:'crystal',font:'Graduate',logoCorner:'tl',color:'#eefcff',accent:'#86d9ee',detail:'#bd79e8',ink:'#173851'},
      {id:'laser-grid',name:'Laser Grid',cost:1625,unlockLevel:26,design:'collection',motif:'laser',layout:'leftside',badge:'target',font:'Monoton',logoCorner:'tr',color:'#050819',accent:'#36f2db',detail:'#ff3cac',ink:'#ffffff'},
      {id:'neon-nights',name:'Neon Nights',cost:1050,unlockLevel:27,design:'monoton',color:'#08031b',accent:'#ff4fd8',detail:'#4ff5ef'},
      {id:'record-breaker',name:'Record Breaker',cost:1900,unlockLevel:28,design:'collection',motif:'record',layout:'topbar',badge:'stopwatch',font:'Anton',logoCorner:'br',color:'#f04a2e',accent:'#ffd456',detail:'#172b46',ink:'#172b46'},
      {id:'platinum-wave',name:'Platinum Wave',cost:2150,unlockLevel:29,design:'collection',motif:'wave',layout:'bottom',badge:'coin',font:'Alfa Slab One',logoCorner:'tl',color:'#d9dce8',accent:'#7554be',detail:'#242b43',ink:'#20263b'},
      {id:'masterpiece',name:'Masterpiece',cost:2500,unlockLevel:30,design:'collection',motif:'masterpiece',layout:'split',badge:'frame',font:'Alfa Slab One',logoCorner:'tr',color:'#071b2b',accent:'#d8b456',detail:'#f5ead0',ink:'#ffffff'}
    ]
  };
  const powerUpCatalog=[
    {id:'banana',name:'Banana',cost:100,slowdown:.02,durationMs:5*60*1000,icon:'assets/powerup-banana.png'},
    {id:'energy-drink',name:'Energy Drink',cost:250,slowdown:.04,durationMs:5*60*1000,icon:'assets/powerup-energy-drink.png'},
    {id:'dryland',name:'Dryland',cost:2500,slowdown:.10,durationMs:15*60*1000,icon:'assets/powerup-dryland.png'},
    {id:'power-skating',name:'Power Skating',cost:5000,slowdown:.25,durationMs:15*60*1000,icon:'assets/powerup-power-skating.png'}
  ];
  const lockerCategories=[...Object.keys(gearCatalog),'powerup'];
  const gearLabels={jersey:'Jerseys',logo:'Logos',helmet:'Helmets',tape:'Tape',shaft:'Sticks',socks:'Socks',gloves:'Gloves',skates:'Skates',number:'Numbers',cardstyle:'Card Style',powerup:'Power Ups'};
  const gearSingular={jersey:'Jersey',logo:'Logo',helmet:'Helmet',tape:'Tape',shaft:'Stick',socks:'Sock design',gloves:'Gloves',skates:'Skates',number:'Number',cardstyle:'Card style'};
  const defaultLoadout={jersey:'home-navy',logo:'cheese',helmet:'classic-navy',tape:'white-tape',shaft:'midnight',socks:'home-ice',gloves:'navy-gloves',skates:'classic-black',number:'10',cardstyle:'arena-poster'};
  let lockerCategory='jersey';
  let lockerPreviewFrame=0;
  let cheesePoints=Number(localStorage.getItem('superHockeyCheesePoints')||0);
  let ownedGear=safeStoredObject('superHockeyOwned',{});
  const storedLifetimeCheeseValue=localStorage.getItem('superHockeyLifetimeCheesePoints'),storedLifetimeCheese=storedLifetimeCheeseValue===null?NaN:Number(storedLifetimeCheeseValue);
  const estimatedEarnedCheese=cheesePoints+Object.keys(ownedGear).reduce((total,key)=>{const [category,id]=key.split(':');const item=gearCatalog[category]?.find(entry=>entry.id===id);return total+(item?.cost||0);},0);
  let lifetimeCheesePoints=Number.isFinite(storedLifetimeCheese)&&storedLifetimeCheese>=0?storedLifetimeCheese:Math.max(0,estimatedEarnedCheese);
  let loadout={...defaultLoadout,...safeStoredObject('superHockeyLoadout',{})};
  const cloudQueueKey='topCheCloudProgressQueue';
  let cloudProgressReady=false,cloudProgressStarting=false,cloudProgressFlushing=false;
  let activePowerUp=safeStoredObject('superHockeyActivePowerUp',null);
  const hockeySprites = new Image();
  let spritesReady = false;
  const motionFrames=new Map();
  let customPlayerSprite=null,customPlayerKey='',customFallenSprite=null,customFallenKey='';
  hockeySprites.onload = () => { spritesReady = true;refreshCustomPlayer();markBootAssetReady();if(ui.lockerDialog?.open){if(ui.playerShowcase.hidden)scheduleGearPreviews();else renderPlayerShowcase();} };
  hockeySprites.onerror = markBootAssetReady;
  hockeySprites.src = 'assets/hockey-sprites.png';
  const regularGoaliePoseFiles={
    butterfly:'regular-goalie-butterfly.png',
    glove:'regular-goalie-glove-save.png',
    blocker:'regular-goalie-blocker-save.png'
  };
  const regularGoaliePoseImages={},regularGoaliePoseReady={};
  Object.entries(regularGoaliePoseFiles).forEach(([pose,file])=>{
    const image=new Image();regularGoaliePoseImages[pose]=image;regularGoaliePoseReady[pose]=false;
    image.onload=()=>{regularGoaliePoseReady[pose]=true;};image.src=`assets/${file}`;
  });
  const cheeseLogo = new Image();
  cheeseLogo.onload = () => { markBootAssetReady();if(ui.playerShowcase&&!ui.playerShowcase.hidden)renderPlayerShowcase(); };
  cheeseLogo.onerror = markBootAssetReady;
  cheeseLogo.src = 'assets/top-ches-logo-v44.png';
  if(document.fonts?.load)Promise.all([
    document.fonts.load('900 24px "Card Block"'),document.fonts.load('900 24px "Card Mono"'),
    document.fonts.load('italic 900 24px "Card Slant"'),document.fonts.load('900 24px "Card Serif"'),
    document.fonts.load('400 24px "Anton"'),document.fonts.load('400 24px "Bungee"'),document.fonts.load('400 24px "Black Ops One"'),
    document.fonts.load('400 24px "Graduate"'),document.fonts.load('400 24px "Alfa Slab One"'),document.fonts.load('400 24px "Russo One"'),document.fonts.load('400 24px "Monoton"')
  ]).then(()=>{if(ui.lockerDialog?.open){if(ui.playerShowcase.hidden)scheduleGearPreviews();else renderPlayerShowcase();}}).catch(()=>{});
  const fallenPlayerSprite = new Image();
  let fallenPlayerReady = false;
  fallenPlayerSprite.onload = () => { fallenPlayerReady = true;refreshCustomPlayer();markBootAssetReady(); };
  fallenPlayerSprite.onerror = markBootAssetReady;
  fallenPlayerSprite.src = 'assets/fallen-player.png';
  const intermissionGoalie = new Image();
  let intermissionGoalieReady = false;
  intermissionGoalie.onload = () => { intermissionGoalieReady = true; };
  const goaliePoseFiles=[['ready','goalie-ready.png'],['pad','goalie-pad-save.png'],['blocker','goalie-blocker-save.png'],['trapper','goalie-trapper-save.png']];
  const goaliePoseImages={};let goaliePoseImagesReady=0,intermissionAssetsRequested=false;
  goaliePoseFiles.forEach(([pose])=>{goaliePoseImages[pose]=new Image();});
  const deflectionStick = new Image();
  let deflectionStickReady = false;
  deflectionStick.onload = () => { deflectionStickReady = true; };
  function loadIntermissionAssets(){
    if(intermissionAssetsRequested)return;intermissionAssetsRequested=true;
    intermissionGoalie.src='assets/intermission-goalie.png';
    goaliePoseFiles.forEach(([pose,file])=>{const image=goaliePoseImages[pose];image.onload=()=>{goaliePoseImagesReady++;};image.src=`assets/${file}`;});
    deflectionStick.src='assets/deflection-stick.png';
  }
  queueIntermissionAssets=()=>{const load=()=>loadIntermissionAssets();if('requestIdleCallback' in window)window.requestIdleCallback(load,{timeout:2600});else setTimeout(load,1200);};
  bootFallbackTimer=setTimeout(finishBootSequence,4200);

  Object.entries(gearCatalog).forEach(([category,items])=>{const starter=items.find(item=>item.cost===0);if(starter)ownedGear[`${category}:${starter.id}`]=true;});
  saveLocker();

  function bestScore() { return Number(localStorage.getItem('superHockeyBest') || 0); }
  function unlockedCount() { return Math.max(1,Math.min(levels.length,Number(localStorage.getItem('superHockeyUnlocked')||1))); }
  function completedLevelCount(){return Math.max(0,Math.min(levels.length,Math.max(Number(localStorage.getItem('superHockeyCompletedThrough')||0),unlockedCount()-1)));}
  function safeStoredObject(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
  function gearItem(category,id){return gearCatalog[category].find(item=>item.id===id)||gearCatalog[category][0];}
  function powerUpItem(id){return powerUpCatalog.find(item=>item.id===id)||null;}
  function currentPowerUp(now=Date.now()){
    const item=activePowerUp&&powerUpItem(activePowerUp.id);
    if(!item||Number(activePowerUp.expiresAt)<=now){
      if(activePowerUp){activePowerUp=null;localStorage.removeItem('superHockeyActivePowerUp');}
      return null;
    }
    return item;
  }
  function timerRate(){const item=currentPowerUp();return item?1-item.slowdown:1;}
  function formatPowerUpTime(ms){const seconds=Math.max(0,Math.ceil(ms/1000)),minutes=Math.floor(seconds/60);return `${minutes}:${String(seconds%60).padStart(2,'0')}`;}
  const powerUpAssetBase=new URL('.',document.currentScript?.src||document.baseURI);
  const powerUpEmoji={banana:'🍌','energy-drink':'🥤',dryland:'🏋️','power-skating':'⛸️'};
  function powerUpImageUrl(item){return new URL(item.icon,powerUpAssetBase).href+'?v=56';}
  function installPowerUpFallback(img,item){
    if(img.dataset.fallbackInstalled)return;
    img.dataset.fallbackInstalled='true';
    img.addEventListener('error',()=>{
      const icon=document.createElement('span');
      icon.className=img.id==='powerUpIcon'?'powerup-indicator-fallback':'gear-preview powerup-preview powerup-fallback';
      icon.setAttribute('aria-hidden','true');icon.textContent=powerUpEmoji[item.id]||'🏒';
      img.replaceWith(icon);
      if(img.id==='powerUpIcon')ui.powerUpIcon=icon;
    },{once:true});
  }
  function updatePowerUpIndicator(){
    if(state.mode==='bonus'){ui.powerUpIndicator.hidden=true;ui.powerUpIndicator.style.opacity='0';return;}
    const item=currentPowerUp();
    if(!item){ui.powerUpIndicator.hidden=true;ui.powerUpIndicator.style.opacity='0';return;}
    const remaining=Math.max(0,activePowerUp.expiresAt-Date.now()),fraction=Math.max(0,Math.min(1,remaining/item.durationMs));
    if(ui.powerUpIcon.tagName==='IMG'){
      installPowerUpFallback(ui.powerUpIcon,item);
      ui.powerUpIcon.src=powerUpImageUrl(item);
      ui.powerUpIcon.alt='';
    }else ui.powerUpIcon.textContent=powerUpEmoji[item.id]||'🏒';
    ui.powerUpIndicator.hidden=false;
    ui.powerUpIndicator.style.opacity=String(fraction);ui.powerUpIndicator.style.setProperty('--power-progress',`${fraction*360}deg`);
    const description=`${item.name} active — ${Math.round(item.slowdown*100)}% slower timer — about ${formatPowerUpTime(remaining)} remaining`;
    ui.powerUpIndicator.setAttribute('aria-label',description);ui.powerUpIndicator.title=description;
  }
  function saveLocker(){localStorage.setItem('superHockeyCheesePoints',String(cheesePoints));localStorage.setItem('superHockeyLifetimeCheesePoints',String(lifetimeCheesePoints));localStorage.setItem('superHockeyOwned',JSON.stringify(ownedGear));localStorage.setItem('superHockeyLoadout',JSON.stringify(loadout));updateCheeseUI();}
  function updateCheeseUI(){if(ui.cheesePoints)ui.cheesePoints.textContent=cheesePoints;if(ui.lockerPoints)ui.lockerPoints.textContent=cheesePoints;}
  function cloudEventId(){return globalThis.crypto?.randomUUID?.()||`event_${Date.now()}_${Math.random().toString(36).slice(2)}`;}
  function readCloudQueue(){const value=safeStoredObject(cloudQueueKey,[]);return Array.isArray(value)?value:[];}
  function writeCloudQueue(queue){localStorage.setItem(cloudQueueKey,JSON.stringify(queue.slice(-2000)));}
  function localCloudSnapshot(){return {completedThrough:completedLevelCount(),cheesePoints:Math.max(0,Math.round(cheesePoints)),lifetimeCheesePoints:Math.max(0,Math.round(lifetimeCheesePoints)),ownedGear:Object.keys(ownedGear).filter(key=>ownedGear[key]),loadout:{...loadout}};}
  function queueCloudChange(change){
    const service=window.TopCheLeaderboard,owner=service?.playerId?.();
    if(!owner)return;
    const queue=readCloudQueue();queue.push({eventId:cloudEventId(),owner,cheeseDelta:0,lifetimeDelta:0,completedThrough:0,purchasedGear:[],loadout:{},...change});writeCloudQueue(queue);flushCloudProgress();
  }
  function applyCloudProgress(progress){
    if(!progress)return;
    cheesePoints=Math.max(0,Number(progress.cheesePoints)||0);lifetimeCheesePoints=Math.max(0,Number(progress.lifetimeCheesePoints)||0);
    const restoredOwned={};
    for(const key of progress.ownedGear||[]){const [category,id]=String(key).split(':');if(gearCatalog[category]?.some(item=>item.id===id))restoredOwned[key]=true;}
    Object.entries(gearCatalog).forEach(([category,items])=>{const starter=items.find(item=>item.cost===0);if(starter)restoredOwned[`${category}:${starter.id}`]=true;});ownedGear=restoredOwned;
    const restoredLoadout={...defaultLoadout};
    for(const [category,id] of Object.entries(progress.loadout||{})){if(gearCatalog[category]?.some(item=>item.id===id)&&ownedGear[`${category}:${id}`])restoredLoadout[category]=id;}
    loadout=restoredLoadout;
    const completed=Math.max(0,Math.min(levels.length,Number(progress.completedThrough)||0));localStorage.setItem('superHockeyCompletedThrough',String(completed));localStorage.setItem('superHockeyUnlocked',String(Math.min(levels.length,completed+1)));
    saveLocker();refreshCustomPlayer();if(ui.lockerDialog?.open)renderLocker();
    if(state.mode==='level'&&!state.active&&!ui.startOverlay.classList.contains('finish-mode'))showLevelSelect();
  }
  async function initializeCloudProgress(){
    const service=window.TopCheLeaderboard;if(cloudProgressStarting||!service?.hasProfile?.())return;
    cloudProgressStarting=true;
    try{const response=await service.bootstrapCloudProgress(localCloudSnapshot());cloudProgressReady=true;const owner=service.playerId?.();if(readCloudQueue().some(event=>event.owner===owner))await flushCloudProgress();else applyCloudProgress(response?.progress);}
    catch{/* Local play remains available while the cloud service is offline. */}
    finally{cloudProgressStarting=false;}
  }
  async function flushCloudProgress(){
    const service=window.TopCheLeaderboard,owner=service?.playerId?.();if(!cloudProgressReady||cloudProgressFlushing||!owner)return;
    cloudProgressFlushing=true;
    try{
      let queue=readCloudQueue(),index=queue.findIndex(event=>event.owner===owner),latestProgress=null;
      while(index>=0){
        const event=queue[index];
        try{const response=await service.syncCloudProgress(event);latestProgress=response?.progress||latestProgress;queue=readCloudQueue().filter(item=>item.eventId!==event.eventId);writeCloudQueue(queue);}
        catch(error){
          if(error?.code==='INSUFFICIENT_CHEESE'){queue=readCloudQueue().filter(item=>item.eventId!==event.eventId);writeCloudQueue(queue);cloudProgressReady=false;setTimeout(initializeCloudProgress,50);}
          break;
        }
        index=queue.findIndex(item=>item.owner===owner);
      }
      if(latestProgress&&cloudProgressReady&&!readCloudQueue().some(item=>item.owner===owner))applyCloudProgress(latestProgress);
    }finally{cloudProgressFlushing=false;if(cloudProgressReady&&readCloudQueue().some(item=>item.owner===owner))setTimeout(flushCloudProgress,0);}
  }
  function awardCheese(amount){cheesePoints+=amount;lifetimeCheesePoints+=amount;saveLocker();queueCloudChange({cheeseDelta:amount,lifetimeDelta:amount});return amount;}
  function renderLocker() {
    ui.lockerTabs.innerHTML=lockerCategories.map(category=>`<button class="locker-tab ${category===lockerCategory?'active':''}" role="tab" aria-selected="${category===lockerCategory}" data-locker-category="${category}">${gearLabels[category]}</button>`).join('');
    ui.lockerTabs.querySelectorAll('[data-locker-category]').forEach(button=>button.addEventListener('click',()=>{lockerCategory=button.dataset.lockerCategory;ui.lockerStatus.textContent='';renderLocker();}));
    if(lockerCategory==='powerup'){
      const active=currentPowerUp();
      ui.lockerItems.innerHTML=powerUpCatalog.map(item=>{
        const isActive=active?.id===item.id;
        const durationMinutes=item.durationMs/60000;
        return `<button class="gear-card powerup-card ${isActive?'active':''}" data-powerup-id="${item.id}"><img class="gear-preview powerup-preview" src="${powerUpImageUrl(item)}" alt="" decoding="async"><strong>${item.name}</strong><small class="powerup-effect">Slows timer ${Math.round(item.slowdown*100)}% · ${durationMinutes} min</small><small>${isActive?'Active now':`🧀 ${item.cost}`}</small></button>`;
      }).join('');
      ui.lockerItems.querySelectorAll('[data-powerup-id]').forEach(button=>installPowerUpFallback(button.querySelector('img'),powerUpCatalog.find(item=>item.id===button.dataset.powerupId)));
      ui.lockerItems.querySelectorAll('[data-powerup-id]').forEach(button=>button.addEventListener('click',()=>selectPowerUp(button.dataset.powerupId)));
      updateCheeseUI();updatePowerUpIndicator();return;
    }
    ui.lockerItems.innerHTML=gearCatalog[lockerCategory].map(item=>{
      const levelLocked=Boolean(item.unlockLevel&&completedLevelCount()<item.unlockLevel);
      if(levelLocked)return `<button class="gear-card level-locked" disabled aria-label="${gearSingular[lockerCategory]} customization locked until Level ${item.unlockLevel} is completed"><div class="gear-lock-preview" aria-hidden="true"><span>🔒</span></div><strong>Mystery ${gearSingular[lockerCategory]}</strong><small>Complete Level ${item.unlockLevel}</small></button>`;
      const owned=Boolean(ownedGear[`${lockerCategory}:${item.id}`]),equipped=loadout[lockerCategory]===item.id;
      const status=equipped?'Equipped':owned?'Owned — tap to equip':`🧀 ${item.cost}`;
      return `<button class="gear-card ${equipped?'equipped ':''}${owned?'':'locked'}" data-gear-id="${item.id}" data-category="${lockerCategory}"><canvas class="gear-preview" width="240" height="116" aria-hidden="true"></canvas><strong>${item.name}</strong><small>${status}</small></button>`;
    }).join('');
    ui.lockerItems.querySelectorAll('[data-gear-id]').forEach(button=>button.addEventListener('click',()=>selectGear(lockerCategory,button.dataset.gearId)));
    scheduleGearPreviews();
    updateCheeseUI();
  }
  function selectGear(category,id) {
    const item=gearItem(category,id),key=`${category}:${id}`;
    if(item.unlockLevel&&completedLevelCount()<item.unlockLevel){ui.lockerStatus.textContent=`Complete Level ${item.unlockLevel} to reveal this ${gearSingular[category].toLowerCase()} customization.`;return;}
    let purchased=false;
    if(!ownedGear[key]){
      if(cheesePoints<item.cost){ui.lockerStatus.textContent=`You need ${item.cost-cheesePoints} more Cheese Points for ${item.name}.`;return;}
      cheesePoints-=item.cost;ownedGear[key]=true;purchased=true;ui.lockerStatus.textContent=`${item.name} unlocked and equipped!`;
    } else ui.lockerStatus.textContent=`${item.name} equipped.`;
    loadout[category]=id;saveLocker();queueCloudChange({cheeseDelta:purchased?-item.cost:0,purchasedGear:purchased?[key]:[],loadout:{[category]:id}});refreshCustomPlayer();renderLocker();
  }
  function selectPowerUp(id){
    const item=powerUpItem(id),active=currentPowerUp();
    if(!item)return;
    if(active?.id===id){ui.lockerStatus.textContent=`${item.name} is already active for another ${formatPowerUpTime(activePowerUp.expiresAt-Date.now())}.`;return;}
    if(cheesePoints<item.cost){ui.lockerStatus.textContent=`You need ${item.cost-cheesePoints} more Cheese Points for ${item.name}.`;return;}
    cheesePoints-=item.cost;
    const now=Date.now();activePowerUp={id:item.id,activatedAt:now,expiresAt:now+item.durationMs};
    localStorage.setItem('superHockeyActivePowerUp',JSON.stringify(activePowerUp));saveLocker();queueCloudChange({cheeseDelta:-item.cost});updatePowerUpIndicator();
    ui.lockerStatus.textContent=`${item.name} activated! The timer now counts down ${Math.round(item.slowdown*100)}% slower for ${item.durationMs/60000} minutes.`;
    renderLocker();
  }
  function openLocker(){
    if(ui.lockerDialog.open)return;
    if(state.active&&!state.paused){state.paused=true;state.pausedAt=performance.now();stopArenaMusic();}
    ui.lockerStatus.textContent='';showLockerCatalog();
    try{ui.lockerDialog.showModal();}catch{ui.lockerDialog.setAttribute('open','');}
    requestAnimationFrame(()=>{if(ui.lockerDialog.open)renderLocker();});
  }

  function resumeAfterLocker(){
    if(!state.paused)return;
    const pausedFor=Math.max(0,performance.now()-state.pausedAt);
    if(state.action)state.action.start+=pausedFor;
    else if(state.active&&!state.locked){state.startedAt+=pausedFor;if(state.mode==='bonus'&&state.bonusPhase==='waiting')state.bonusDropAt+=pausedFor;if(state.mode==='bonus'&&state.bonusReactionAt)state.bonusReactionAt+=pausedFor;}
    state.animStart+=pausedFor;state.lastTickAt=performance.now();state.paused=false;state.pausedAt=0;
    if(state.active)startArenaMusic(false);
  }

  function closeLocker(){
    if(ui.lockerDialog.open){if(typeof ui.lockerDialog.close==='function')ui.lockerDialog.close();else ui.lockerDialog.removeAttribute('open');}
    showLockerCatalog();
    resumeAfterLocker();
  }
  ui.bestScore.textContent = bestScore();

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rinkMetrics() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    return { w, h, cx:w/2, pad:Math.max(17,w*.045), top:0, bottom:h };
  }

  function line(x1,y1,x2,y2,color,width=2,dash=[]) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  }

  function attackingBlueLineY(m) { return m.h*.965; }

  function drawFaceoffCircle(x,y,r) {
    const red='rgba(200,49,58,.72)',mark=Math.max(4,r*.16);
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=red;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#c8313a';ctx.beginPath();ctx.arc(x,y,Math.max(3,r*.065),0,Math.PI*2);ctx.fill();
    [-1,1].forEach(side=>[-1,1].forEach(vertical=>{
      const yy=y+vertical*r*.42;
      line(x+side*(r-mark*.25),yy,x+side*(r+mark),yy,red,2);
    }));
    const boxGap=r*.22,boxWidth=r*.28,boxHeight=r*.17;
    [-1,1].forEach(side=>[-1,1].forEach(vertical=>{
      const innerX=x+side*boxGap,outerX=innerX+side*boxWidth,yy=y+vertical*boxGap;
      line(innerX,yy,outerX,yy,red,2);
      line(innerX,yy,innerX,yy+vertical*boxHeight,red,2);
    }));
  }

  function drawRink(m) {
    const {w,h,cx,pad}=m;
    ctx.clearRect(0,0,w,h);
    const grad=ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,'#e8f5f7'); grad.addColorStop(1,'#cce5ea');
    ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.globalAlpha=.12; ctx.strokeStyle='#477f91'; ctx.lineWidth=1;
    for(let y=0;y<h;y+=14) line(0,y,w,y,'#427b8b',1);
    ctx.restore();
    ctx.strokeStyle='#5b9aaa'; ctx.lineWidth=3; ctx.strokeRect(pad, -12, w-pad*2, h+24);
    const goalLineY=h*.068,blueLineY=attackingBlueLineY(m),creaseRadius=w*.105;
    line(pad,goalLineY,w-pad,goalLineY,'#c8313a',Math.max(2,w*.005));
    ctx.beginPath();ctx.moveTo(cx+creaseRadius,goalLineY);ctx.arc(cx,goalLineY,creaseRadius,0,Math.PI);ctx.closePath();
    ctx.fillStyle='rgba(70,170,207,.24)';ctx.fill();ctx.strokeStyle='#c8313a';ctx.lineWidth=2;ctx.stroke();
    [[w*.25,h*.34],[w*.75,h*.34]].forEach(([x,y])=>drawFaceoffCircle(x,y,w*.105));
    line(pad,blueLineY,w-pad,blueLineY,'#2467bd',Math.max(5,w*.013));
  }

  function drawNet(m) {
    const {w,h,cx}=m;
    const frontY=h*.068,backY=h*.012,frontHalf=w*.115,backHalf=w*.078;
    ctx.save();
    ctx.fillStyle='rgba(25,63,72,.16)';
    ctx.beginPath();ctx.moveTo(cx-frontHalf+4,frontY+5);ctx.lineTo(cx+frontHalf+4,frontY+5);ctx.lineTo(cx+backHalf+7,backY+8);ctx.lineTo(cx-backHalf+7,backY+8);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(247,252,252,.5)';
    ctx.beginPath();ctx.moveTo(cx-frontHalf,frontY);ctx.lineTo(cx+frontHalf,frontY);ctx.lineTo(cx+backHalf,backY);ctx.lineTo(cx-backHalf,backY);ctx.closePath();ctx.fill();
    for(let i=1;i<8;i++){
      const t=i/8,frontX=cx-frontHalf+(frontHalf*2*t),backX=cx-backHalf+(backHalf*2*t);
      line(frontX,frontY,backX,backY,'rgba(112,145,151,.62)',1);
    }
    for(let i=1;i<5;i++){
      const t=i/5,y=frontY+(backY-frontY)*t,half=frontHalf+(backHalf-frontHalf)*t;
      line(cx-half,y,cx+half,y,'rgba(112,145,151,.58)',1);
    }
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#d92532';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(cx-frontHalf,frontY);ctx.lineTo(cx-backHalf,backY);ctx.lineTo(cx+backHalf,backY);ctx.lineTo(cx+frontHalf,frontY);ctx.stroke();
    line(cx-frontHalf,frontY,cx+frontHalf,frontY,'#e12632',6);
    ctx.fillStyle='#e12632';
    [[cx-frontHalf,frontY],[cx+frontHalf,frontY]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();});
    ctx.restore();
  }

  function hexRgb(hex){const clean=hex.replace('#','');const value=parseInt(clean.length===3?clean.split('').map(c=>c+c).join(''):clean,16);return[(value>>16)&255,(value>>8)&255,value&255];}
  function insideEllipse(x,y,cx,cy,rx,ry){return Math.pow((x-cx)/rx,2)+Math.pow((y-cy)/ry,2)<=1;}
  function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy));return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));}
  function tintPixel(data,index,hex,brightness) {
    const [tr,tg,tb]=hexRgb(hex),shade=.28+brightness*.95,shine=Math.max(0,brightness-.66)*115;
    data[index]=Math.min(255,tr*shade+shine);data[index+1]=Math.min(255,tg*shade+shine);data[index+2]=Math.min(255,tb*shade+shine);
  }

  function contrastInk(hex){const [r,g,b]=hexRgb(hex),light=(.2126*r+.7152*g+.0722*b)/255;return light>.58?{fill:'#07131d',outline:'#ffffff'}:{fill:'#ffffff',outline:'#07131d'};}
  function tapePatternColor(item,x,y){
    const exposed='#151a20',wrap=Math.floor((x+y*.28)/10);
    if(item.design==='toe')return x<238?(wrap%4===0?item.accent:item.color):exposed;
    if(item.design==='candy')return Math.floor((x+y*1.25)/13)%2?item.color:item.accent;
    if(item.design==='half')return x<247?(wrap%4===0?item.accent:item.color):exposed;
    if(item.design==='three'){const taped=[[194,207],[222,235],[250,263]].some(([a,b])=>x>=a&&x<=b);return taped?(wrap%3===0?item.accent:item.color):exposed;}
    if(item.design==='split')return x<236?item.color:item.accent;
    if(item.design==='zebra')return Math.sin(x*.31+y*.18)>0?item.color:item.accent;
    if(item.design==='heel')return x>235?(wrap%3===0?item.accent:item.color):exposed;
    if(item.design==='rings')return Math.floor(Math.hypot(x-236,(y-49)*1.45)/7)%2?item.color:item.accent;
    return wrap%5===0?item.accent:item.color;
  }

  function shaftPatternColor(item,x,y){
    const dx=107,dy=128,t=clamp(((x-245)*dx+(y-53)*dy)/(dx*dx+dy*dy));
    if(item.design==='carbon')return (Math.floor(x/5)+Math.floor(y/5))%2?item.color:item.detail;
    if(item.design==='lightning'){const flash=Math.sin(t*31+x*.08-y*.11)>.72;return flash?item.accent:(t>.48?item.color:item.detail);}
    if(item.design==='woodgrain')return Math.sin(x*.16+y*.09+Math.sin(y*.17)*1.8)>.42?item.accent:(Math.sin(x*.08+y*.14)<-.35?item.detail:item.color);
    if(item.design==='frost')return Math.sin(t*27+x*.13)+Math.cos(y*.19)>.9?item.accent:(t>.58?item.color:item.detail);
    if(item.design==='matrix')return (Math.floor(x/7)+Math.floor(y/9))%5===0?item.accent:((Math.floor(x/4)+Math.floor(y/4))%2?item.color:item.detail);
    if(item.design==='sunset')return t>.68?item.detail:t>.35?item.color:item.accent;
    if(item.design==='circuit'){const trace=Math.abs(Math.sin(x*.21)+Math.cos(y*.17))<.22;return trace?item.accent:(t>.5?item.detail:item.color);}
    return item.color;
  }

  function sockPatternColor(item,x,y){
    if(item.design==='classic'){const band=Math.floor((y+8)/15)%6;return band===1?item.accent:band===2?item.detail:item.color;}
    if(item.design==='pulse'){const pulse=Math.abs(Math.sin(y*.18+x*.035));return pulse>.82?item.accent:pulse>.62?item.detail:item.color;}
    if(item.design==='chevron'){const zig=Math.floor((y+Math.abs((x%48)-24)*.7)/14)%5;return zig===0?item.accent:zig===1?item.detail:item.color;}
    if(item.design==='barber')return Math.floor((x+y*1.3)/17)%3===0?item.detail:Math.floor((x+y*1.3)/17)%2?item.accent:item.color;
    if(item.design==='wave'){const wave=Math.sin(y*.16+x*.09);return wave>.56?item.accent:wave<-.62?item.detail:item.color;}
    if(item.design==='static'){const cell=(Math.floor(x/8)*7+Math.floor(y/7)*11)%13;return cell<3?item.accent:cell<5?item.detail:item.color;}
    if(item.design==='flame'){const flame=Math.sin(x*.19+y*.045)*13+(y%52);return flame<19?item.accent:flame<30?item.detail:item.color;}
    if(item.design==='checker')return (Math.floor(x/16)+Math.floor(y/16))%2?item.color:item.accent;
    if(item.design==='orbit'){const ring=Math.floor(Math.hypot((x%68)-34,(y%78)-39)/8)%4;return ring===0?item.accent:ring===1?item.detail:item.color;}
    if(item.design==='shatter'){const crack=Math.abs(Math.sin(x*.21)+Math.cos(y*.17));return crack<.22?item.detail:crack>.95?item.accent:item.color;}
    if(item.design==='crosscut'){const slash=Math.floor((x*1.15+y)/13)%6;return slash===0?item.accent:slash===1?item.detail:item.color;}
    if(item.design==='diagonal'){const slash=Math.floor((x+y*1.7)/20)%5;return slash===0?item.accent:slash===1?item.detail:item.color;}
    if(item.design==='bands'){const band=Math.floor(y/12)%7;return band===1||band===2?item.accent:band===4?item.detail:item.color;}
    if(item.design==='confetti'){const cell=(Math.floor(x/9)*13+Math.floor(y/8)*17)%19;return cell<2?item.accent:cell===5||cell===11?item.detail:item.color;}
    if(item.design==='crown'){const peak=Math.floor((y+Math.abs((x%54)-27)*.8)/12)%7;return peak===0?item.accent:peak===1?item.detail:item.color;}
    return item.color;
  }

  function paintHelmetDesign(target,item,sx,sy){
    target.lineCap='round';target.lineJoin='round';
    if(item.design==='ice'){
      target.strokeStyle=item.accent;target.lineWidth=4*sx;[[350,214,379,238,361,268],[412,204,389,235,418,258],[382,190,381,222,398,249],[346,244,374,250,350,286]].forEach(points=>{target.beginPath();target.moveTo(points[0]*sx,points[1]*sy);target.lineTo(points[2]*sx,points[3]*sy);target.lineTo(points[4]*sx,points[5]*sy);target.stroke();});
      target.strokeStyle=item.detail;target.lineWidth=1.5*sx;target.beginPath();target.moveTo(379*sx,238*sy);target.lineTo(394*sx,247*sy);target.lineTo(386*sx,268*sy);target.stroke();
    } else if(item.design==='flame'){
      target.fillStyle=item.detail;target.beginPath();target.moveTo(340*sx,286*sy);target.quadraticCurveTo(351*sx,248*sy,363*sx,226*sy);target.quadraticCurveTo(368*sx,260*sy,382*sx,274*sy);target.quadraticCurveTo(389*sx,230*sy,404*sx,210*sy);target.quadraticCurveTo(407*sx,256*sy,431*sx,286*sy);target.closePath();target.fill();
      target.fillStyle=item.accent;target.beginPath();target.moveTo(359*sx,289*sy);target.quadraticCurveTo(369*sx,259*sy,376*sx,246*sy);target.quadraticCurveTo(383*sx,271*sy,391*sx,280*sy);target.quadraticCurveTo(399*sx,252*sy,407*sx,239*sy);target.quadraticCurveTo(412*sx,270*sy,422*sx,289*sy);target.closePath();target.fill();
    } else if(item.design==='pirate'){
      target.fillStyle=item.detail;target.fillRect(337*sx,266*sy,96*sx,17*sy);target.fillStyle=item.accent;target.font=`900 ${45*sy}px system-ui`;target.textAlign='center';target.textBaseline='middle';target.fillText('☠',384*sx,244*sy);
    } else if(item.design==='forest'){
      [[354,217,29,16,-.3,item.accent],[405,213,31,18,.2,item.detail],[370,252,36,19,.1,item.detail],[414,266,28,17,-.2,item.accent],[350,283,30,18,.25,item.detail]].forEach(([x,y,rx,ry,rot,color])=>{target.fillStyle=color;target.beginPath();target.ellipse(x*sx,y*sy,rx*sx,ry*sy,rot,0,Math.PI*2);target.fill();});
    } else if(item.design==='galaxy'){
      target.fillStyle=item.detail;[[352,218,3],[375,204,2],[405,220,3],[365,250,2],[416,261,2],[387,278,3]].forEach(([x,y,r])=>{target.beginPath();target.arc(x*sx,y*sy,r*sx,0,Math.PI*2);target.fill();});
      target.strokeStyle=item.accent;target.lineWidth=3*sx;target.beginPath();target.arc(383*sx,242*sy,31*sx,-.5,2.4);target.stroke();
    } else if(item.design==='shark'){
      target.fillStyle=item.detail;target.beginPath();target.moveTo(337*sx,259*sy);target.quadraticCurveTo(384*sx,222*sy,432*sx,259*sy);target.lineTo(432*sx,285*sy);target.lineTo(337*sx,285*sy);target.closePath();target.fill();
      target.fillStyle=item.accent;for(let x=346;x<426;x+=14){target.beginPath();target.moveTo(x*sx,260*sy);target.lineTo((x+7)*sx,276*sy);target.lineTo((x+14)*sx,260*sy);target.closePath();target.fill();}
    } else if(item.design==='checker'){
      const size=18;for(let y=198;y<292;y+=size)for(let x=336;x<435;x+=size){target.fillStyle=((x+y)/size)%2<1?item.accent:item.detail;target.fillRect(x*sx,y*sy,size*sx,size*sy);}
    } else {
      target.strokeStyle=item.accent;target.lineWidth=5*sx;target.beginPath();target.moveTo(376*sx,190*sy);target.lineTo(376*sx,275*sy);target.moveTo(392*sx,190*sy);target.lineTo(392*sx,275*sy);target.stroke();
    }
  }

  function drawHelmetGraphics(target,item,sx,sy){
    // Paint the artwork flat first, then project it onto the domed shell in
    // narrow strips. The crown stays broad while artwork at both temples is
    // compressed, lowered and slightly darkened so it visibly wraps over the
    // top and down the sides instead of reading as a flat sticker.
    const design=document.createElement('canvas');design.width=Math.ceil(456*sx);design.height=Math.ceil(320*sy);
    const designTarget=design.getContext('2d');paintHelmetDesign(designTarget,item,sx,sy);
    const sourceLeft=Math.floor(332*sx),sourceRight=Math.ceil(436*sx),sourceTop=Math.floor(181*sy),sourceBottom=Math.ceil(310*sy);
    const sourceCenter=384*sx,sourceRadius=52*sx,destCenter=384*sx,destRadius=48*sx;
    target.save();target.globalCompositeOperation='source-atop';target.beginPath();target.ellipse(destCenter,248*sy,destRadius,59*sy,0,0,Math.PI*2);target.clip();
    for(let sourceX=sourceLeft;sourceX<sourceRight;sourceX++){
      const t=Math.max(-1,Math.min(1,(sourceX-sourceCenter)/sourceRadius));
      const nextT=Math.max(-1,Math.min(1,(sourceX+1-sourceCenter)/sourceRadius));
      const destX=destCenter+Math.sin(t*Math.PI/2)*destRadius;
      const nextDestX=destCenter+Math.sin(nextT*Math.PI/2)*destRadius;
      const side=Math.pow(Math.abs(t),1.45),drop=side*24*sy,verticalScale=1-side*.18;
      target.globalAlpha=.68+(1-side)*.32;
      target.drawImage(design,sourceX,sourceTop,1,sourceBottom-sourceTop,destX,sourceTop+drop,Math.max(1,nextDestX-destX+.35),Math.max(1,(sourceBottom-sourceTop)*verticalScale));
    }
    target.globalAlpha=1;
    // A restrained edge shade reinforces that the last portion of the graphic
    // has turned down the shell rather than extending beyond its silhouette.
    const edgeShade=target.createLinearGradient(336*sx,0,432*sx,0);edgeShade.addColorStop(0,'rgba(3,12,20,.24)');edgeShade.addColorStop(.18,'rgba(3,12,20,0)');edgeShade.addColorStop(.82,'rgba(3,12,20,0)');edgeShade.addColorStop(1,'rgba(3,12,20,.24)');
    target.fillStyle=edgeShade;target.fillRect(334*sx,184*sy,100*sx,126*sy);target.restore();
  }

  function drawJerseyPrint(target,options,sx,sy) {
    const logo=gearItem('logo',options.logo),jersey=gearItem('jersey',options.jersey),numberInk=contrastInk(jersey.color);
    target.save();target.globalCompositeOperation='source-atop';target.translate(385*sx,334*sy);target.rotate(.035);target.textAlign='center';target.textBaseline='middle';
    target.fillStyle=logo.accent||numberInk.fill;target.strokeStyle=numberInk.outline;target.lineCap='round';target.lineJoin='round';target.lineWidth=5*sx;
    if(logo.id==='cheese'){
      target.beginPath();target.moveTo(-19*sx,13*sy);target.lineTo(20*sx,10*sy);target.lineTo(-4*sx,-19*sy);target.closePath();target.stroke();target.fill();
      target.fillStyle='#8b6319';[[-4,2],[8,6],[-3,10]].forEach(([x,y])=>{target.beginPath();target.arc(x*sx,y*sy,2.5*sx,0,Math.PI*2);target.fill();});
    } else if(logo.id==='sticks'){
      target.beginPath();target.moveTo(-16*sx,-16*sy);target.lineTo(16*sx,16*sy);target.moveTo(16*sx,-16*sy);target.lineTo(-16*sx,16*sy);target.stroke();
    } else {
      target.font=`900 ${36*sy}px system-ui`;target.fillText(logo.symbol||'★',0,0);
    }
    target.fillStyle=numberInk.fill;target.strokeStyle=numberInk.outline;target.lineWidth=8*sx;target.font=`950 ${43*sy}px system-ui`;target.strokeText(options.number,0,38*sy);target.fillText(options.number,0,38*sy);target.restore();
  }

  function createCustomizedPlayer(overrides={}) {
    if(!spritesReady)return null;
    const options={...loadout,...overrides},cellW=Math.round(hockeySprites.width/2),cellH=Math.round(hockeySprites.height/2),sx=cellW/648,sy=cellH/608;
    const surface=document.createElement('canvas');surface.width=cellW;surface.height=cellH;
    const target=surface.getContext('2d',{willReadFrequently:true});target.drawImage(hockeySprites,0,0,hockeySprites.width/2,hockeySprites.height/2,0,0,cellW,cellH);
    const image=target.getImageData(0,0,cellW,cellH),data=image.data;
    const jersey=gearItem('jersey',options.jersey),helmet=gearItem('helmet',options.helmet),tape=gearItem('tape',options.tape),shaft=gearItem('shaft',options.shaft),socks=gearItem('socks',options.socks),gloves=gearItem('gloves',options.gloves),skates=gearItem('skates',options.skates);
    for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){
      const i=(y*cellW+x)*4;if(data[i+3]<24)continue;
      const xr=x/sx,yr=y/sy,r=data[i],g=data[i+1],b=data[i+2],brightness=Math.max(r,g,b)/255;
      const skin=r>75&&r>g*1.08&&g>b*1.08;
      const helmetMask=insideEllipse(xr,yr,384,248,51,62)&&!skin;
      const leftGlove=insideEllipse(xr,yr,335,158,34,43),rightGlove=insideEllipse(xr,yr,450,247,38,46),gloveMask=(leftGlove||rightGlove)&&!skin;
      const skateMask=insideEllipse(xr,yr,353,472,33,57)||insideEllipse(xr,yr,411,534,37,65);
      const bluePixel=b>55&&b>r*1.28&&b>g*1.02;
      const whiteUniformPixel=brightness>.5&&Math.max(r,g,b)-Math.min(r,g,b)<42;
      // Socks begin below the jersey hem. Keeping this as a distinct lower-leg
      // mask prevents patterned socks from recolouring the overlapping torso.
      const sockMask=yr>=408&&yr<545&&(insideEllipse(xr,yr,350,438,42,65)||insideEllipse(xr,yr,408,486,43,76))&&!skin&&(bluePixel||whiteUniformPixel);
      const tapeMask=xr>180&&xr<288&&yr>23&&yr<76;
      const shaftMask=segmentDistance(xr,yr,245,53,352,181)<12;
      const jerseyMask=bluePixel&&xr>230&&xr<525&&yr>162&&yr<420;
      const stripeMask=xr>273&&xr<476&&yr>360&&yr<418&&brightness>.48&&!skin;
      if(tapeMask)tintPixel(data,i,tapePatternColor(tape,xr,yr),brightness);
      else if(helmetMask)tintPixel(data,i,helmet.color,brightness);
      else if(gloveMask)tintPixel(data,i,brightness>.54?gloves.accent:gloves.color,brightness);
      else if(skateMask)tintPixel(data,i,brightness>.58?skates.accent:skates.color,brightness);
      else if(shaftMask)tintPixel(data,i,shaftPatternColor(shaft,xr,yr),brightness);
      // Jersey layers have priority wherever the top-down artwork overlaps a leg.
      else if(stripeMask)tintPixel(data,i,yr>394?(jersey.detail||jersey.accent):jersey.accent,brightness);
      else if(jerseyMask)tintPixel(data,i,jersey.color,brightness);
      else if(sockMask)tintPixel(data,i,sockPatternColor(socks,xr,yr),brightness);
    }
    target.putImageData(image,0,0);drawHelmetGraphics(target,helmet,sx,sy);drawJerseyPrint(target,options,sx,sy);return surface;
  }

  function paintFallenHelmetDesign(target,item){
    target.lineCap='round';target.lineJoin='round';
    if(item.design==='ice'){
      target.strokeStyle=item.accent;target.lineWidth=4;[[229,83,252,103,237,127],[281,80,260,103,282,122],[255,68,255,96,270,111]].forEach(points=>{target.beginPath();target.moveTo(points[0],points[1]);target.lineTo(points[2],points[3]);target.lineTo(points[4],points[5]);target.stroke();});
    } else if(item.design==='flame'){
      target.fillStyle=item.detail;target.beginPath();target.moveTo(220,137);target.quadraticCurveTo(231,110,239,91);target.quadraticCurveTo(245,116,256,128);target.quadraticCurveTo(264,96,276,80);target.quadraticCurveTo(280,116,292,138);target.closePath();target.fill();
      target.fillStyle=item.accent;target.beginPath();target.moveTo(236,139);target.quadraticCurveTo(245,116,251,106);target.quadraticCurveTo(256,126,263,132);target.quadraticCurveTo(269,111,276,101);target.quadraticCurveTo(280,124,286,139);target.closePath();target.fill();
    } else if(item.design==='pirate'){
      target.fillStyle=item.detail;target.fillRect(220,121,72,12);target.fillStyle=item.accent;target.font='900 34px system-ui';target.textAlign='center';target.textBaseline='middle';target.fillText('☠',256,103);
    } else if(item.design==='forest'){
      [[235,84,22,12,-.2,item.accent],[272,83,24,13,.2,item.detail],[247,108,28,14,.1,item.detail],[277,122,20,12,-.2,item.accent],[233,128,20,12,.2,item.detail]].forEach(([x,y,rx,ry,rot,color])=>{target.fillStyle=color;target.beginPath();target.ellipse(x,y,rx,ry,rot,0,Math.PI*2);target.fill();});
    } else if(item.design==='galaxy'){
      target.fillStyle=item.detail;[[232,88,3],[249,75,2],[275,90,3],[241,110,2],[281,119,2],[258,131,3]].forEach(([x,y,r])=>{target.beginPath();target.arc(x,y,r,0,Math.PI*2);target.fill();});target.strokeStyle=item.accent;target.lineWidth=3;target.beginPath();target.arc(256,105,25,-.5,2.4);target.stroke();
    } else if(item.design==='shark'){
      target.fillStyle=item.detail;target.beginPath();target.moveTo(220,112);target.quadraticCurveTo(256,83,292,112);target.lineTo(292,136);target.lineTo(220,136);target.closePath();target.fill();target.fillStyle=item.accent;for(let x=226;x<288;x+=12){target.beginPath();target.moveTo(x,113);target.lineTo(x+6,128);target.lineTo(x+12,113);target.closePath();target.fill();}
    } else if(item.design==='checker'){
      const size=14;for(let y=72;y<140;y+=size)for(let x=220;x<294;x+=size){target.fillStyle=((x+y)/size)%2<1?item.accent:item.detail;target.fillRect(x,y,size,size);}
    } else {
      target.strokeStyle=item.accent;target.lineWidth=4;target.beginPath();target.moveTo(250,66);target.lineTo(250,137);target.moveTo(262,66);target.lineTo(262,137);target.stroke();
    }
  }

  function drawFallenHelmetGraphics(target,item){
    const design=document.createElement('canvas');design.width=310;design.height=155;
    const designTarget=design.getContext('2d');paintFallenHelmetDesign(designTarget,item);
    const sourceLeft=216,sourceRight=296,sourceTop=60,sourceBottom=150,sourceCenter=256,sourceRadius=40,destCenter=256,destRadius=36;
    target.save();target.globalCompositeOperation='source-atop';target.beginPath();target.ellipse(destCenter,106,destRadius,42,0,0,Math.PI*2);target.clip();
    for(let sourceX=sourceLeft;sourceX<sourceRight;sourceX++){
      const t=Math.max(-1,Math.min(1,(sourceX-sourceCenter)/sourceRadius));
      const nextT=Math.max(-1,Math.min(1,(sourceX+1-sourceCenter)/sourceRadius));
      const destX=destCenter+Math.sin(t*Math.PI/2)*destRadius;
      const nextDestX=destCenter+Math.sin(nextT*Math.PI/2)*destRadius;
      const side=Math.pow(Math.abs(t),1.45),drop=side*17,verticalScale=1-side*.18;
      target.globalAlpha=.68+(1-side)*.32;
      target.drawImage(design,sourceX,sourceTop,1,sourceBottom-sourceTop,destX,sourceTop+drop,Math.max(1,nextDestX-destX+.35),Math.max(1,(sourceBottom-sourceTop)*verticalScale));
    }
    target.globalAlpha=1;const edgeShade=target.createLinearGradient(220,0,292,0);edgeShade.addColorStop(0,'rgba(3,12,20,.24)');edgeShade.addColorStop(.2,'rgba(3,12,20,0)');edgeShade.addColorStop(.8,'rgba(3,12,20,0)');edgeShade.addColorStop(1,'rgba(3,12,20,.24)');target.fillStyle=edgeShade;target.fillRect(218,62,76,88);target.restore();
  }

  function drawFallenJerseyPrint(target,options){
    const logo=gearItem('logo',options.logo),jersey=gearItem('jersey',options.jersey),ink=contrastInk(jersey.color);
    target.save();target.globalCompositeOperation='source-atop';target.textAlign='center';target.textBaseline='middle';target.lineCap='round';target.lineJoin='round';target.fillStyle=logo.accent||ink.fill;target.strokeStyle=ink.outline;target.lineWidth=5;
    if(logo.id==='cheese'){
      target.beginPath();target.moveTo(235,174);target.lineTo(278,171);target.lineTo(251,137);target.closePath();target.stroke();target.fill();target.fillStyle='#8b6319';[[253,158],[263,164],[250,168]].forEach(([x,y])=>{target.beginPath();target.arc(x,y,3,0,Math.PI*2);target.fill();});
    } else if(logo.id==='sticks'){
      target.beginPath();target.moveTo(239,143);target.lineTo(273,174);target.moveTo(273,143);target.lineTo(239,174);target.stroke();
    } else {
      target.font='900 38px system-ui';target.fillText(logo.symbol||'★',256,157);
    }
    target.fillStyle=ink.fill;target.strokeStyle=ink.outline;target.lineWidth=9;target.font='950 58px system-ui';target.strokeText(options.number,256,211);target.fillText(options.number,256,211);target.restore();
  }

  function createCustomizedFallen(){
    if(!fallenPlayerReady)return null;
    const surface=document.createElement('canvas');surface.width=fallenPlayerSprite.naturalWidth||512;surface.height=fallenPlayerSprite.naturalHeight||512;
    const target=surface.getContext('2d',{willReadFrequently:true});target.drawImage(fallenPlayerSprite,0,0,surface.width,surface.height);
    const image=target.getImageData(0,0,surface.width,surface.height),data=image.data;
    const jersey=gearItem('jersey',loadout.jersey),helmet=gearItem('helmet',loadout.helmet),socks=gearItem('socks',loadout.socks),gloves=gearItem('gloves',loadout.gloves),skates=gearItem('skates',loadout.skates);
    for(let y=0;y<surface.height;y++)for(let x=0;x<surface.width;x++){
      const i=(y*surface.width+x)*4;if(data[i+3]<24)continue;
      const r=data[i],g=data[i+1],b=data[i+2],brightness=Math.max(r,g,b)/255,skin=r>75&&r>g*1.08&&g>b*1.08;
      const helmetMask=insideEllipse(x,y,256,106,39,45)&&!skin;
      const gloveMask=(insideEllipse(x,y,51,66,39,38)||insideEllipse(x,y,461,66,39,38))&&!skin;
      const skateMask=insideEllipse(x,y,63,438,48,43)||insideEllipse(x,y,449,438,48,43);
      const bluePixel=b>55&&b>r*1.28&&b>g*1.02;
      const whiteUniformPixel=brightness>.5&&Math.max(r,g,b)-Math.min(r,g,b)<42;
      const sockMask=y>318&&y<447&&(x<220||x>292)&&!skin&&(bluePixel||whiteUniformPixel);
      const jerseyMask=bluePixel&&y<331;
      const uniformStripe=brightness>.5&&!skin&&x>175&&x<337&&y>220&&y<270;
      if(helmetMask)tintPixel(data,i,helmet.color,brightness);
      else if(gloveMask)tintPixel(data,i,brightness>.54?gloves.accent:gloves.color,brightness);
      else if(skateMask)tintPixel(data,i,brightness>.58?skates.accent:skates.color,brightness);
      else if(uniformStripe)tintPixel(data,i,y%28>14?(jersey.detail||jersey.accent):jersey.accent,brightness);
      else if(jerseyMask)tintPixel(data,i,jersey.color,brightness);
      else if(sockMask)tintPixel(data,i,sockPatternColor(socks,x,y),brightness);
    }
    target.putImageData(image,0,0);drawFallenHelmetGraphics(target,helmet);drawFallenJerseyPrint(target,loadout);return surface;
  }

  function refreshCustomPlayer(){
    const key=JSON.stringify(loadout);
    if(spritesReady&&key!==customPlayerKey){customPlayerSprite=createCustomizedPlayer();customPlayerKey=key;motionFrames.clear();motionParts.clear();}
    if(fallenPlayerReady&&key!==customFallenKey){customFallenSprite=createCustomizedFallen();customFallenKey=key;}
  }

  function collectionFrame(target,style,width,height,double=false){
    target.strokeStyle=style.accent;target.lineWidth=Math.max(6,width*.018);target.strokeRect(width*.032,height*.023,width*.936,height*.954);
    if(double){target.strokeStyle=style.detail;target.lineWidth=Math.max(2,width*.006);target.strokeRect(width*.057,height*.042,width*.886,height*.916);}
  }

  function collectionDots(target,width,height,color,spacing=42){
    target.fillStyle=color;for(let y=spacing/2;y<height;y+=spacing)for(let x=spacing/2;x<width;x+=spacing){target.beginPath();target.arc(x,y,Math.max(2,spacing*.1),0,Math.PI*2);target.fill();}
  }

  function drawCollectionBackground(target,style,width,height){
    target.fillStyle=style.color;target.fillRect(0,0,width,height);
    switch(style.motif){
      case 'frost':{
        const g=target.createLinearGradient(0,0,width,height);g.addColorStop(0,'#ffffff');g.addColorStop(.48,style.color);g.addColorStop(1,'#9edeea');target.fillStyle=g;target.fillRect(0,0,width,height);
        target.strokeStyle='rgba(27,158,195,.24)';target.lineWidth=5;for(let i=0;i<18;i++){const x=(i*113%997)/997*width,y=(i*197%991)/991*height;target.beginPath();target.moveTo(x-45,y);target.lineTo(x+45,y);target.moveTo(x,y-45);target.lineTo(x,y+45);target.stroke();}collectionFrame(target,style,width,height,true);break;
      }
      case 'paper':
        target.fillStyle='#ead8ab';target.fillRect(0,0,width,height);target.strokeStyle='rgba(83,57,31,.09)';target.lineWidth=2;for(let y=0;y<height;y+=17){target.beginPath();target.moveTo(0,y);target.lineTo(width,y+9);target.stroke();}target.fillStyle=style.accent;target.fillRect(0,0,width*.075,height);target.fillRect(width*.925,0,width*.075,height);collectionFrame(target,style,width,height,true);break;
      case 'pop':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);collectionDots(target,width*.48,height,'rgba(241,59,103,.3)',34);target.fillStyle=style.detail;target.beginPath();target.moveTo(width*.54,0);target.lineTo(width,0);target.lineTo(width,height*.7);target.lineTo(width*.72,height);target.lineTo(width*.43,height*.58);target.closePath();target.fill();target.strokeStyle=style.ink;target.lineWidth=12;target.stroke();collectionFrame(target,style,width,height,false);break;
      case 'blueprint':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.strokeStyle='rgba(112,223,242,.22)';target.lineWidth=2;for(let x=0;x<width;x+=54){target.beginPath();target.moveTo(x,0);target.lineTo(x,height);target.stroke();}for(let y=0;y<height;y+=54){target.beginPath();target.moveTo(0,y);target.lineTo(width,y);target.stroke();}target.strokeStyle='rgba(255,255,255,.5)';target.lineWidth=5;target.beginPath();target.arc(width*.48,height*.48,width*.27,0,Math.PI*2);target.stroke();collectionFrame(target,style,width,height,true);break;
      case 'ticket':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.strokeStyle=style.accent;target.lineWidth=7;target.setLineDash([18,14]);target.strokeRect(width*.07,height*.05,width*.86,height*.9);target.setLineDash([]);target.fillStyle=style.accent;target.fillRect(0,height*.18,width,height*.085);target.fillRect(0,height*.76,width,height*.085);for(let y=height*.1;y<height;y+=height*.15){target.fillStyle='#f8e0a1';target.beginPath();target.arc(0,y,22,0,Math.PI*2);target.arc(width,y,22,0,Math.PI*2);target.fill();}break;
      case 'wood':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.strokeStyle='rgba(57,28,9,.35)';for(let y=30;y<height;y+=62){target.lineWidth=9;target.beginPath();target.moveTo(0,y);target.bezierCurveTo(width*.25,y-22,width*.7,y+25,width,y-6);target.stroke();}target.fillStyle='rgba(240,208,151,.15)';target.fillRect(width*.1,0,width*.13,height);collectionFrame(target,style,width,height,true);break;
      case 'newsprint':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.fillStyle='rgba(0,0,0,.07)';for(let y=120;y<height;y+=38)target.fillRect(60,y,width-120,3);target.strokeStyle=style.accent;target.lineWidth=10;target.strokeRect(28,28,width-56,height-56);target.fillStyle=style.detail;target.fillRect(0,height*.45,width,height*.025);collectionFrame(target,style,width,height,false);break;
      case 'arcade':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.strokeStyle='rgba(94,245,223,.16)';target.lineWidth=3;for(let x=0;x<width;x+=52){target.beginPath();target.moveTo(x,0);target.lineTo(x,height);target.stroke();}for(let y=0;y<height;y+=52){target.beginPath();target.moveTo(0,y);target.lineTo(width,y);target.stroke();}target.fillStyle=style.detail;for(let i=0;i<22;i++)target.fillRect((i*83%width),((i*151)%height),18,18);collectionFrame(target,style,width,height,true);break;
      case 'graffiti':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.lineCap='round';for(let i=0;i<12;i++){target.strokeStyle=i%2?style.accent:style.detail;target.globalAlpha=.28;target.lineWidth=22+(i%3)*11;target.beginPath();target.moveTo(-80,height*(i/12));target.bezierCurveTo(width*.25,height*((i+4)%12/12),width*.7,height*((i+8)%12/12),width+80,height*((i+2)%12/12));target.stroke();}target.globalAlpha=1;collectionDots(target,width,height,'rgba(255,255,255,.1)',48);collectionFrame(target,style,width,height,false);break;
      case 'knit':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.strokeStyle=style.detail;target.lineWidth=6;for(let y=70;y<height;y+=105){for(let x=-40;x<width+40;x+=80){target.beginPath();target.moveTo(x,y);target.lineTo(x+24,y+24);target.lineTo(x+48,y);target.stroke();}}target.fillStyle=style.accent;target.fillRect(0,height*.18,width,height*.06);target.fillRect(0,height*.78,width,height*.06);collectionFrame(target,style,width,height,true);break;
      case 'banner':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.fillStyle=style.accent;target.beginPath();target.moveTo(0,0);target.lineTo(width*.34,0);target.lineTo(width*.2,height);target.lineTo(0,height);target.closePath();target.fill();target.fillStyle='rgba(241,203,87,.17)';target.beginPath();target.moveTo(width*.8,0);target.lineTo(width,height);target.lineTo(width*.58,height);target.closePath();target.fill();collectionFrame(target,style,width,height,true);break;
      case 'etched':
        {const g=target.createLinearGradient(0,0,width,0);g.addColorStop(0,'#8f9ba2');g.addColorStop(.3,'#f6f8f8');g.addColorStop(.58,'#a4afb5');g.addColorStop(.8,'#edf1f2');g.addColorStop(1,'#6b7a83');target.fillStyle=g;target.fillRect(0,0,width,height);}target.strokeStyle='rgba(17,26,34,.22)';target.lineWidth=2;for(let x=-height;x<width+height;x+=36){target.beginPath();target.moveTo(x,0);target.lineTo(x+height,height);target.stroke();}collectionFrame(target,style,width,height,true);break;
      case 'lava':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);for(let i=0;i<13;i++){const x=(i*137%997)/997*width,y=(i*223%991)/991*height,r=45+(i%4)*31;const g=target.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,style.detail);g.addColorStop(.45,style.accent);g.addColorStop(1,'rgba(255,75,33,0)');target.fillStyle=g;target.beginPath();target.arc(x,y,r,0,Math.PI*2);target.fill();}collectionFrame(target,style,width,height,true);break;
      case 'shards':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.globalAlpha=.35;for(let i=0;i<18;i++){target.fillStyle=i%2?style.accent:style.detail;target.beginPath();target.moveTo((i*97%1000)/1000*width,0);target.lineTo((i*61%1000)/1000*width,height);target.lineTo(((i*61+180)%1000)/1000*width,height);target.closePath();target.fill();}target.globalAlpha=1;collectionFrame(target,style,width,height,true);break;
      case 'metro':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);for(let i=0;i<6;i++){target.strokeStyle=i%2?style.accent:style.detail;target.lineWidth=13;target.beginPath();target.moveTo(-40,height*(.15+i*.12));target.lineTo(width*(.28+i*.06),height*(.42+i*.04));target.lineTo(width+40,height*(.22+i*.11));target.stroke();}collectionFrame(target,style,width,height,false);break;
      case 'comic':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);collectionDots(target,width,height,'rgba(255,222,52,.4)',30);target.fillStyle=style.detail;target.beginPath();target.moveTo(width*.52,0);target.lineTo(width,0);target.lineTo(width,height);target.lineTo(width*.75,height*.72);target.closePath();target.fill();target.strokeStyle=style.ink;target.lineWidth=13;target.stroke();collectionFrame(target,style,width,height,true);break;
      case 'sunset':
        {const g=target.createLinearGradient(0,0,0,height);g.addColorStop(0,'#2a1748');g.addColorStop(.48,style.accent);g.addColorStop(1,style.detail);target.fillStyle=g;target.fillRect(0,0,width,height);}target.fillStyle='rgba(255,235,166,.55)';target.beginPath();target.arc(width*.58,height*.38,width*.28,0,Math.PI*2);target.fill();target.fillStyle=style.color;for(let y=height*.27;y<height*.5;y+=22)target.fillRect(width*.28,y,width*.6,10);collectionFrame(target,style,width,height,true);break;
      case 'carbon':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);for(let y=0;y<height;y+=36)for(let x=-36;x<width;x+=72){target.fillStyle=((x+y)/36)%2?'#1c2730':'#0a1016';target.beginPath();target.moveTo(x,y);target.lineTo(x+36,y);target.lineTo(x+72,y+36);target.lineTo(x+36,y+36);target.closePath();target.fill();}target.globalAlpha=1;collectionFrame(target,style,width,height,true);break;
      case 'royal':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.strokeStyle='rgba(213,173,88,.24)';target.lineWidth=6;for(let r=.12;r<.8;r+=.12){target.beginPath();target.arc(width*.5,height*.46,width*r,0,Math.PI*2);target.stroke();}target.fillStyle='rgba(244,231,198,.1)';target.beginPath();target.moveTo(0,height*.25);target.lineTo(width,height*.08);target.lineTo(width,height*.3);target.lineTo(0,height*.47);target.closePath();target.fill();collectionFrame(target,style,width,height,true);break;
      case 'prism':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);for(let i=0;i<17;i++){target.globalAlpha=.22;target.fillStyle=i%3===0?style.accent:i%3===1?style.detail:'#ffe781';target.beginPath();target.moveTo((i*71%1000)/1000*width,0);target.lineTo(((i*71+350)%1000)/1000*width,height);target.lineTo(((i*71+520)%1000)/1000*width,height);target.closePath();target.fill();}target.globalAlpha=1;collectionFrame(target,style,width,height,true);break;
      case 'laser':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.lineWidth=5;for(let i=0;i<12;i++){target.shadowColor=i%2?style.accent:style.detail;target.shadowBlur=16;target.strokeStyle=i%2?style.accent:style.detail;target.beginPath();target.moveTo(width*.5,height*.38);target.lineTo((i/11)*width,height);target.stroke();}target.shadowBlur=0;target.strokeStyle='rgba(54,242,219,.35)';for(let y=height*.45;y<height;y+=54){target.beginPath();target.moveTo(0,y);target.lineTo(width,y);target.stroke();}collectionFrame(target,style,width,height,true);break;
      case 'record':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.fillStyle=style.accent;target.beginPath();target.arc(width*.58,height*.43,width*.34,0,Math.PI*2);target.fill();target.strokeStyle=style.detail;target.lineWidth=18;target.beginPath();target.arc(width*.58,height*.43,width*.25,-Math.PI*.4,Math.PI*1.3);target.stroke();target.lineWidth=8;for(let i=0;i<8;i++){const a=i*Math.PI/4;target.beginPath();target.moveTo(width*.58,height*.43);target.lineTo(width*.58+Math.cos(a)*width*.31,height*.43+Math.sin(a)*width*.31);target.stroke();}collectionFrame(target,style,width,height,false);break;
      case 'wave':
        {const g=target.createLinearGradient(0,0,width,height);g.addColorStop(0,'#f8f9ff');g.addColorStop(.35,style.color);g.addColorStop(.62,'#ab9ad8');g.addColorStop(1,'#eef4f8');target.fillStyle=g;target.fillRect(0,0,width,height);}for(let i=0;i<8;i++){target.strokeStyle=i%2?style.accent:'rgba(255,255,255,.75)';target.lineWidth=16-i;target.beginPath();target.moveTo(-100,height*(.2+i*.1));target.bezierCurveTo(width*.26,height*(.02+i*.1),width*.68,height*(.42+i*.06),width+100,height*(.12+i*.11));target.stroke();}collectionFrame(target,style,width,height,true);break;
      case 'masterpiece':
        target.fillStyle=style.color;target.fillRect(0,0,width,height);target.fillStyle='#f5ead0';target.fillRect(width*.09,height*.07,width*.82,height*.86);target.fillStyle='#071b2b';target.fillRect(width*.14,height*.11,width*.72,height*.78);target.strokeStyle=style.accent;target.lineWidth=18;target.strokeRect(width*.115,height*.088,width*.77,height*.824);target.strokeStyle='#f5ead0';target.lineWidth=4;target.strokeRect(width*.145,height*.112,width*.71,height*.776);break;
    }
  }

  function drawCardStyleBackground(target,style,width,height){
    target.save();target.fillStyle=style.color;target.fillRect(0,0,width,height);
    if(style.design==='classic'){
      const ice=target.createLinearGradient(0,0,0,height);ice.addColorStop(0,'#f9feff');ice.addColorStop(.56,'#d7f0f4');ice.addColorStop(1,'#7aabb8');target.fillStyle=ice;target.fillRect(0,0,width,height);
      target.fillStyle='#08283b';target.fillRect(0,0,width,height*.105);target.fillStyle='#f3c64d';target.fillRect(0,height*.105,width,height*.016);
      target.strokeStyle='rgba(35,125,153,.2)';target.lineWidth=Math.max(2,width*.006);target.beginPath();target.arc(width*.5,height*.51,width*.28,0,Math.PI*2);target.stroke();
      target.strokeStyle='rgba(203,45,53,.22)';target.beginPath();target.moveTo(width*.08,height*.58);target.lineTo(width*.92,height*.58);target.stroke();
    }else if(style.design==='burst'){
      const bg=target.createRadialGradient(width*.48,height*.44,width*.04,width*.48,height*.44,width*.82);bg.addColorStop(0,'#fff27a');bg.addColorStop(.28,'#35e1e7');bg.addColorStop(.72,'#08739c');bg.addColorStop(1,'#061d36');target.fillStyle=bg;target.fillRect(0,0,width,height);
      target.translate(width*.5,height*.47);for(let i=0;i<28;i++){target.rotate(Math.PI/14);target.fillStyle=i%2?'rgba(255,255,255,.24)':'rgba(255,211,66,.28)';target.beginPath();target.moveTo(0,0);target.lineTo(width*.035,-height);target.lineTo(-width*.035,-height);target.closePath();target.fill();}target.setTransform(1,0,0,1,0,0);
      target.strokeStyle='#ffe35d';target.lineWidth=Math.max(5,width*.024);target.beginPath();target.moveTo(0,height*.16);target.lineTo(width*.18,height*.08);target.lineTo(width*.82,height*.08);target.lineTo(width,height*.16);target.lineTo(width,height*.84);target.lineTo(width*.82,height*.92);target.lineTo(width*.18,height*.92);target.lineTo(0,height*.84);target.closePath();target.stroke();
      target.save();target.translate(width*.07,height*.72);target.rotate(-Math.PI/2);target.fillStyle='rgba(255,255,255,.35)';target.font=`900 ${Math.max(18,width*.085)}px Arial, sans-serif`;target.letterSpacing=`${Math.max(1,width*.008)}px`;target.fillText('ROOKIE',0,0);target.restore();
    }else if(style.design==='vintage'){
      target.fillStyle='#efe5c5';target.fillRect(0,0,width,height);for(let y=0;y<height;y+=Math.max(8,height*.018)){target.fillStyle=y%(Math.max(16,height*.036))?'rgba(91,63,31,.025)':'rgba(255,255,255,.06)';target.fillRect(0,y,width,Math.max(1,height*.006));}
      target.fillStyle='#a62c33';target.fillRect(0,0,width*.055,height);target.fillRect(width*.945,0,width*.055,height);target.fillStyle='#173d59';target.fillRect(width*.065,0,width*.027,height);target.fillRect(width*.908,0,width*.027,height);
      target.fillStyle='#f7f0d9';target.beginPath();target.moveTo(width*.13,height*.13);target.quadraticCurveTo(width*.5,height*.015,width*.87,height*.13);target.lineTo(width*.87,height*.78);target.quadraticCurveTo(width*.5,height*.9,width*.13,height*.78);target.closePath();target.fill();target.strokeStyle='#a62c33';target.lineWidth=Math.max(3,width*.012);target.stroke();
    }else if(style.design==='aurora'){
      const night=target.createLinearGradient(0,0,0,height);night.addColorStop(0,'#030b24');night.addColorStop(.55,'#132d58');night.addColorStop(1,'#07101f');target.fillStyle=night;target.fillRect(0,0,width,height);
      for(let i=0;i<74;i++){const x=(i*97%997)/997*width,y=(i*193%991)/991*height*.72,r=Math.max(1,width*(i%7===0?.005:.002));target.fillStyle=i%6===0?'rgba(255,255,255,.9)':'rgba(160,227,255,.55)';target.beginPath();target.arc(x,y,r,0,Math.PI*2);target.fill();}
      [['rgba(75,255,203,.62)',.24],['rgba(79,167,255,.55)',.42],['rgba(196,82,255,.46)',.58]].forEach(([color,offset],i)=>{target.strokeStyle=color;target.lineWidth=height*(.08-i*.012);target.beginPath();target.moveTo(-width*.15,height*offset);target.bezierCurveTo(width*.2,height*(offset-.2),width*.58,height*(offset+.22),width*1.15,height*(offset-.08));target.stroke();});
      target.strokeStyle='rgba(126,255,225,.72)';target.lineWidth=Math.max(3,width*.009);target.beginPath();target.moveTo(width*.07,height*.93);target.lineTo(width*.28,height*.12);target.lineTo(width*.93,height*.12);target.stroke();
    }else if(style.design==='foil'){
      const foil=target.createLinearGradient(0,0,width,height);foil.addColorStop(0,'#ffffff');foil.addColorStop(.18,'#8ff4f0');foil.addColorStop(.37,'#fff2a1');foil.addColorStop(.58,'#efa6ff');foil.addColorStop(.77,'#9fe7ff');foil.addColorStop(1,'#eefcff');target.fillStyle=foil;target.fillRect(0,0,width,height);
      target.fillStyle='rgba(255,255,255,.57)';target.beginPath();target.moveTo(width*.12,height*.06);target.lineTo(width*.9,height*.12);target.lineTo(width*.79,height*.88);target.lineTo(width*.18,height*.94);target.lineTo(width*.06,height*.52);target.closePath();target.fill();
      target.strokeStyle='#c39b2d';target.lineWidth=Math.max(5,width*.021);target.stroke();target.strokeStyle='rgba(255,255,255,.9)';target.lineWidth=Math.max(2,width*.007);target.stroke();
      target.strokeStyle='rgba(34,134,175,.26)';target.lineWidth=Math.max(1,width*.004);for(let x=-height;x<width+height;x+=width*.13){target.beginPath();target.moveTo(x,0);target.lineTo(x+height,height);target.stroke();}
    }else if(style.design==='anton'){
      const paper=target.createLinearGradient(0,0,width,height);paper.addColorStop(0,'#f7df9d');paper.addColorStop(.5,'#f16a42');paper.addColorStop(1,'#b3192d');target.fillStyle=paper;target.fillRect(0,0,width,height);
      target.fillStyle='#101d34';target.beginPath();target.moveTo(0,height*.19);target.lineTo(width,height*.05);target.lineTo(width,height*.26);target.lineTo(0,height*.38);target.closePath();target.fill();
      target.fillStyle='rgba(248,214,77,.82)';target.beginPath();target.arc(width*.12,height*.58,width*.42,0,Math.PI*2);target.fill();target.strokeStyle='rgba(16,29,52,.18)';target.lineWidth=Math.max(2,width*.006);for(let y=height*.34;y<height*.9;y+=height*.028){target.beginPath();target.moveTo(0,y);target.lineTo(width,y-height*.12);target.stroke();}
      target.strokeStyle='#f8e6ba';target.lineWidth=Math.max(6,width*.018);target.strokeRect(width*.025,height*.018,width*.95,height*.964);target.strokeStyle='#101d34';target.lineWidth=Math.max(2,width*.007);target.strokeRect(width*.045,height*.032,width*.91,height*.936);
    }else if(style.design==='bungee'){
      target.fillStyle='#5126a8';target.fillRect(0,0,width,height);target.fillStyle='#31d8e8';target.beginPath();target.moveTo(0,height*.13);target.lineTo(width*.73,0);target.lineTo(width,height*.28);target.lineTo(width*.18,height*.47);target.closePath();target.fill();target.fillStyle='#f5cf3f';target.beginPath();target.moveTo(width*.62,0);target.lineTo(width,height*.03);target.lineTo(width,height*.7);target.lineTo(width*.83,height*.78);target.closePath();target.fill();
      target.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<42;i++){const x=(i*137%997)/997*width,y=(i*211%991)/991*height,r=4+(i%4)*3;target.beginPath();target.arc(x,y,r,0,Math.PI*2);target.fill();}
      target.strokeStyle='#10152b';target.lineWidth=Math.max(8,width*.025);target.strokeRect(width*.035,height*.025,width*.93,height*.95);target.strokeStyle='#fff';target.lineWidth=Math.max(2,width*.008);target.strokeRect(width*.055,height*.04,width*.89,height*.92);
    }else if(style.design==='blackops'){
      const tactical=target.createLinearGradient(0,0,width,height);tactical.addColorStop(0,'#101a15');tactical.addColorStop(.48,'#07120f');tactical.addColorStop(1,'#17251b');target.fillStyle=tactical;target.fillRect(0,0,width,height);
      target.strokeStyle='rgba(148,239,59,.13)';target.lineWidth=Math.max(1,width*.004);for(let x=-height;x<width+height;x+=width*.08){target.beginPath();target.moveTo(x,0);target.lineTo(x-height*.35,height);target.stroke();}
      target.fillStyle='#94ef3b';target.fillRect(width*.86,0,width*.14,height);target.fillStyle='#07120f';for(let y=-width;y<height+width;y+=width*.13){target.beginPath();target.moveTo(width*.86,y);target.lineTo(width,y+width*.12);target.lineTo(width,y+width*.2);target.lineTo(width*.86,y+width*.08);target.closePath();target.fill();}
      target.strokeStyle='#94ef3b';target.lineWidth=Math.max(4,width*.014);target.strokeRect(width*.03,height*.022,width*.94,height*.956);target.strokeStyle='rgba(220,232,221,.36)';target.lineWidth=Math.max(1,width*.004);target.strokeRect(width*.055,height*.04,width*.89,height*.92);
    }else if(style.design==='graduate'){
      target.fillStyle='#efe0b3';target.fillRect(0,0,width,height);target.fillStyle='#7e1828';target.fillRect(0,0,width,height*.09);target.fillRect(0,height*.91,width,height*.09);target.fillStyle='#153f68';target.fillRect(0,height*.09,width,height*.025);target.fillRect(0,height*.885,width,height*.025);
      target.strokeStyle='rgba(21,63,104,.12)';target.lineWidth=Math.max(1,width*.004);for(let x=0;x<width;x+=width*.055){target.beginPath();target.moveTo(x,0);target.lineTo(x+height*.12,height);target.stroke();}
      target.strokeStyle='#7e1828';target.lineWidth=Math.max(7,width*.02);target.beginPath();target.moveTo(width*.08,height*.17);target.quadraticCurveTo(width*.5,height*.08,width*.92,height*.17);target.lineTo(width*.92,height*.82);target.quadraticCurveTo(width*.5,height*.9,width*.08,height*.82);target.closePath();target.stroke();
    }else if(style.design==='alfa'){
      const luxe=target.createRadialGradient(width*.5,height*.38,width*.05,width*.5,height*.45,width*.75);luxe.addColorStop(0,'#5b3920');luxe.addColorStop(.48,'#28140b');luxe.addColorStop(1,'#0d0805');target.fillStyle=luxe;target.fillRect(0,0,width,height);
      target.strokeStyle='rgba(213,173,88,.34)';target.lineWidth=Math.max(2,width*.006);for(let r=.13;r<.72;r+=.1){target.beginPath();target.arc(width*.5,height*.42,width*r,Math.PI,Math.PI*2);target.stroke();}
      target.strokeStyle='#d5ad58';target.lineWidth=Math.max(7,width*.02);target.strokeRect(width*.035,height*.025,width*.93,height*.95);target.strokeStyle='#f6ead0';target.lineWidth=Math.max(2,width*.006);target.strokeRect(width*.06,height*.043,width*.88,height*.914);
      target.fillStyle='rgba(213,173,88,.12)';target.beginPath();target.moveTo(0,height*.62);target.lineTo(width,height*.42);target.lineTo(width,height*.66);target.lineTo(0,height*.84);target.closePath();target.fill();
    }else if(style.design==='russo'){
      const future=target.createLinearGradient(0,0,width,height);future.addColorStop(0,'#071739');future.addColorStop(.55,'#152a68');future.addColorStop(1,'#070a22');target.fillStyle=future;target.fillRect(0,0,width,height);
      target.fillStyle='#ff455d';target.beginPath();target.moveTo(0,0);target.lineTo(width*.34,0);target.lineTo(width*.16,height);target.lineTo(0,height);target.closePath();target.fill();target.fillStyle='rgba(89,229,243,.24)';target.beginPath();target.moveTo(width*.19,0);target.lineTo(width*.62,0);target.lineTo(width*.86,height);target.lineTo(width*.43,height);target.closePath();target.fill();
      target.strokeStyle='#59e5f3';target.lineWidth=Math.max(4,width*.014);target.beginPath();target.moveTo(width*.035,height*.95);target.lineTo(width*.23,height*.04);target.lineTo(width*.94,height*.04);target.lineTo(width*.97,height*.76);target.stroke();
      target.strokeStyle='rgba(255,255,255,.22)';target.lineWidth=Math.max(1,width*.004);for(let y=height*.15;y<height*.88;y+=height*.06){target.beginPath();target.moveTo(width*.14,y);target.lineTo(width*.92,y-height*.08);target.stroke();}
    }else if(style.design==='monoton'){
      const neon=target.createRadialGradient(width*.5,height*.38,0,width*.5,height*.45,width*.8);neon.addColorStop(0,'#25115a');neon.addColorStop(.55,'#08031b');neon.addColorStop(1,'#020008');target.fillStyle=neon;target.fillRect(0,0,width,height);
      target.strokeStyle='rgba(79,245,239,.28)';target.lineWidth=Math.max(1,width*.004);for(let i=0;i<12;i++){const y=height*(.48+i*.055);target.beginPath();target.moveTo(width*.04,y);target.lineTo(width*.96,y);target.stroke();}for(let i=-4;i<11;i++){target.beginPath();target.moveTo(width*.5,height*.42);target.lineTo(width*(i*.16),height);target.stroke();}
      target.shadowColor='#ff4fd8';target.shadowBlur=24;target.strokeStyle='#ff4fd8';target.lineWidth=Math.max(5,width*.016);target.strokeRect(width*.035,height*.025,width*.93,height*.95);target.shadowColor='#4ff5ef';target.strokeStyle='#4ff5ef';target.lineWidth=Math.max(2,width*.007);target.strokeRect(width*.06,height*.043,width*.88,height*.914);target.shadowBlur=0;
      target.strokeStyle='rgba(255,79,216,.44)';target.lineWidth=Math.max(3,width*.01);for(let r=.16;r<.72;r+=.13){target.beginPath();target.ellipse(width*.53,height*.38,width*r,height*r*.55,-.18,0,Math.PI*2);target.stroke();}
    }else if(style.design==='collection'){
      drawCollectionBackground(target,style,width,height);
    }else if(style.design==='anton'){
      target.fillStyle='#101d34';target.strokeStyle='#f8d64d';target.lineWidth=9;target.beginPath();target.moveTo(cx-size*.58,cy-size*.38);target.lineTo(cx+size*.45,cy-size*.48);target.lineTo(cx+size*.58,cy+size*.3);target.lineTo(cx-size*.46,cy+size*.48);target.closePath();target.fill();target.stroke();
      target.fillStyle='#fff0bd';target.font=`400 ${size*.5}px "Anton", sans-serif`;
    }else if(style.design==='bungee'){
      target.save();target.translate(cx+8,cy+8);target.rotate(-.11);target.fillStyle='#10152b';target.fillRect(-size*.52,-size*.43,size*1.04,size*.86);target.restore();target.save();target.translate(cx,cy);target.rotate(-.11);target.fillStyle='#f5cf3f';target.strokeStyle='#fff';target.lineWidth=8;target.fillRect(-size*.52,-size*.43,size*1.04,size*.86);target.strokeRect(-size*.52,-size*.43,size*1.04,size*.86);target.restore();
      target.fillStyle='#5126a8';target.font=`400 ${size*.4}px "Bungee", sans-serif`;
    }else if(style.design==='blackops'){
      target.fillStyle='#07120f';target.strokeStyle='#94ef3b';target.lineWidth=8;target.beginPath();target.moveTo(cx-size*.48,cy-size*.5);target.lineTo(cx+size*.48,cy-size*.5);target.lineTo(cx+size*.58,cy);target.lineTo(cx+size*.38,cy+size*.48);target.lineTo(cx-size*.38,cy+size*.48);target.lineTo(cx-size*.58,cy);target.closePath();target.fill();target.stroke();
      target.fillStyle='#94ef3b';target.font=`400 ${size*.42}px "Black Ops One", sans-serif`;
    }else if(style.design==='graduate'){
      target.fillStyle='#efe0b3';target.strokeStyle='#7e1828';target.lineWidth=11;target.beginPath();target.arc(cx,cy,size*.55,0,Math.PI*2);target.fill();target.stroke();target.strokeStyle='#153f68';target.lineWidth=4;target.setLineDash([12,8]);target.beginPath();target.arc(cx,cy,size*.43,0,Math.PI*2);target.stroke();target.setLineDash([]);
      target.fillStyle='#7e1828';target.font=`400 ${size*.42}px "Graduate", serif`;
    }else if(style.design==='alfa'){
      const seal=target.createRadialGradient(cx-size*.12,cy-size*.15,4,cx,cy,size*.62);seal.addColorStop(0,'#fff1ae');seal.addColorStop(.48,'#d5ad58');seal.addColorStop(1,'#6e4619');target.fillStyle=seal;target.strokeStyle='#f6ead0';target.lineWidth=6;target.beginPath();for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI/10,r=i%2?size*.53:size*.61;target.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}target.closePath();target.fill();target.stroke();
      target.fillStyle='#28140b';target.font=`400 ${size*.36}px "Alfa Slab One", serif`;
    }else if(style.design==='russo'){
      target.fillStyle='#071739';target.strokeStyle='#59e5f3';target.lineWidth=8;target.beginPath();target.moveTo(cx-size*.5,cy-size*.35);target.lineTo(cx-size*.22,cy-size*.56);target.lineTo(cx+size*.45,cy-size*.45);target.lineTo(cx+size*.58,cy);target.lineTo(cx+size*.25,cy+size*.5);target.lineTo(cx-size*.44,cy+size*.42);target.lineTo(cx-size*.58,cy);target.closePath();target.fill();target.stroke();target.strokeStyle='#ff455d';target.lineWidth=4;target.stroke();
      target.fillStyle='#fff';target.font=`400 ${size*.38}px "Russo One", sans-serif`;
    }else if(style.design==='monoton'){
      target.shadowColor='#ff4fd8';target.shadowBlur=24;target.fillStyle='rgba(8,3,27,.88)';target.strokeStyle='#ff4fd8';target.lineWidth=9;target.beginPath();target.arc(cx,cy,size*.56,0,Math.PI*2);target.fill();target.stroke();target.shadowColor='#4ff5ef';target.strokeStyle='#4ff5ef';target.lineWidth=4;target.beginPath();target.arc(cx,cy,size*.43,0,Math.PI*2);target.stroke();target.shadowBlur=0;
      target.fillStyle='#fff';target.font=`400 ${size*.34}px "Monoton", sans-serif`;
    }else{
      const space=target.createRadialGradient(width*.68,height*.35,width*.04,width*.52,height*.48,width*.82);space.addColorStop(0,'#31556c');space.addColorStop(.32,'#0d1b2b');space.addColorStop(1,'#02050a');target.fillStyle=space;target.fillRect(0,0,width,height);
      target.strokeStyle='rgba(87,236,246,.38)';target.lineWidth=Math.max(1,width*.006);for(let r=.14;r<.72;r+=.11){target.beginPath();target.ellipse(width*.56,height*.45,width*r,height*r*.56,-.35,0,Math.PI*2);target.stroke();}
      target.fillStyle='rgba(213,171,62,.23)';target.beginPath();target.moveTo(0,height*.1);target.lineTo(width*.48,0);target.lineTo(width*.92,height*.18);target.lineTo(width,height*.72);target.lineTo(width*.64,height);target.lineTo(width*.13,height*.9);target.closePath();target.fill();
      target.strokeStyle='#d5ab3e';target.lineWidth=Math.max(4,width*.017);target.stroke();target.strokeStyle='#67e5ed';target.lineWidth=Math.max(2,width*.007);target.beginPath();target.moveTo(width*.05,height*.33);target.lineTo(width*.22,height*.08);target.lineTo(width*.88,height*.14);target.lineTo(width*.95,height*.69);target.lineTo(width*.71,height*.91);target.stroke();
    }
    target.restore();
  }

  function drawCardBrand(target,style,width,height,compact=false){
    const logoSize=compact?Math.max(48,width*.22):190;
    const corners={classic:'tl',burst:'tr',vintage:'tr',aurora:'tl',foil:'tr',diamond:'tl',anton:'tr',bungee:'tl',blackops:'bl',graduate:'tr',alfa:'bl',russo:'tr',monoton:'tl'};
    let corner=style.logoCorner||corners[style.design]||'tl';
    if(style.design==='collection'&&!compact){
      const horizontal=corner[1]||'l';
      if(style.layout==='topbar')corner=`b${horizontal}`;
      else if(['bottom','diagonalUp','diagonalDown','split'].includes(style.layout))corner=`t${horizontal}`;
      else if(style.layout==='leftside'&&horizontal==='l')corner=`${corner[0]||'t'}r`;
      else if(style.layout==='rightside'&&horizontal==='r')corner=`${corner[0]||'t'}l`;
    }
    const right=corner[1]==='r',bottom=corner[0]==='b';
    const margin=compact?8:44,logoX=right?width-logoSize-margin:margin,logoY=bottom?height-logoSize*1.03-margin:margin;
    if(cheeseLogo.complete&&cheeseLogo.naturalWidth){target.save();target.shadowColor='rgba(0,0,0,.3)';target.shadowBlur=compact?3:14;target.drawImage(cheeseLogo,logoX,logoY,logoSize,logoSize*1.03);target.restore();}
  }

  function cardPlayerPlacement(style){
    if(style.design==='collection'){
      if(style.layout==='topbar')return {x:120,y:270,w:840,h:1002};
      if(style.layout==='leftside')return {x:205,y:150,w:820,h:978};
      if(style.layout==='rightside')return {x:55,y:150,w:820,h:978};
      if(style.layout==='split')return {x:120,y:205,w:840,h:1002};
      return {x:90,y:145,w:900,h:1074};
    }
    if(style.design==='vintage')return {x:155,y:205,w:770,h:918};
    if(style.design==='aurora')return {x:58,y:150,w:930,h:1109};
    if(style.design==='foil')return {x:132,y:182,w:815,h:972};
    if(style.design==='diamond')return {x:70,y:152,w:930,h:1109};
    if(style.design==='burst')return {x:60,y:135,w:960,h:1145};
    if(style.design==='anton')return {x:115,y:255,w:850,h:1014};
    if(style.design==='bungee')return {x:55,y:135,w:970,h:1157};
    if(style.design==='blackops')return {x:75,y:165,w:845,h:1008};
    if(style.design==='graduate')return {x:125,y:180,w:825,h:984};
    if(style.design==='alfa')return {x:115,y:260,w:850,h:1014};
    if(style.design==='russo')return {x:150,y:150,w:850,h:1014};
    if(style.design==='monoton')return {x:60,y:130,w:960,h:1145};
    return {x:110,y:210,w:860,h:1025};
  }

  function drawCollectionBadge(target,style,cx,cy,size){
    const fill=style.detail,stroke=style.accent,shape=style.badge;target.fillStyle=fill;target.strokeStyle=stroke;target.lineWidth=Math.max(6,size*.055);target.beginPath();
    if(['puck','coin','seal','roundel','sun','target','stopwatch'].includes(shape)){
      target.arc(cx,cy,size*.53,0,Math.PI*2);target.fill();target.stroke();
      if(shape==='target'||shape==='roundel'){target.lineWidth=Math.max(3,size*.025);target.beginPath();target.arc(cx,cy,size*.38,0,Math.PI*2);target.stroke();}
      if(shape==='stopwatch'){target.fillRect(cx-size*.13,cy-size*.69,size*.26,size*.18);target.beginPath();target.moveTo(cx+size*.39,cy-size*.42);target.lineTo(cx+size*.53,cy-size*.57);target.stroke();}
    }else if(['hex','patch','crystal'].includes(shape)){
      const sides=shape==='crystal'?4:6,turn=shape==='crystal'?Math.PI/4:-Math.PI/2;for(let i=0;i<sides;i++){const a=turn+i*Math.PI*2/sides;target.lineTo(cx+Math.cos(a)*size*.56,cy+Math.sin(a)*size*.56);}target.closePath();target.fill();target.stroke();
    }else if(shape==='burst'||shape==='flame'||shape==='spray'){
      const points=shape==='burst'?14:10;for(let i=0;i<points;i++){const a=-Math.PI/2+i*Math.PI*2/points,r=i%2?size*.4:size*.62;target.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}target.closePath();target.fill();target.stroke();
    }else if(shape==='shield'){
      target.moveTo(cx-size*.5,cy-size*.48);target.lineTo(cx+size*.5,cy-size*.48);target.lineTo(cx+size*.42,cy+size*.25);target.lineTo(cx,cy+size*.6);target.lineTo(cx-size*.42,cy+size*.25);target.closePath();target.fill();target.stroke();
    }else if(shape==='crown'){
      target.moveTo(cx-size*.55,cy+size*.4);target.lineTo(cx-size*.48,cy-size*.42);target.lineTo(cx-size*.15,cy-size*.12);target.lineTo(cx,cy-size*.58);target.lineTo(cx+size*.18,cy-size*.12);target.lineTo(cx+size*.5,cy-size*.42);target.lineTo(cx+size*.55,cy+size*.4);target.closePath();target.fill();target.stroke();
    }else{
      target.moveTo(cx-size*.56,cy-size*.42);target.lineTo(cx+size*.56,cy-size*.42);target.lineTo(cx+size*.48,cy+size*.42);target.lineTo(cx-size*.48,cy+size*.42);target.closePath();target.fill();target.stroke();
    }
    target.fillStyle=cardContrast(fill);target.font=`400 ${size*(shape==='pixel'?.36:.42)}px "${style.font}", sans-serif`;
  }

  function cardContrast(color){
    const value=String(color||'#000').replace('#',''),hex=value.length===3?value.split('').map(char=>char+char).join(''):value;
    if(!/^[0-9a-f]{6}$/i.test(hex))return '#fff';const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    return (r*.299+g*.587+b*.114)>154?'#102033':'#ffffff';
  }

  function drawCardNumberEmblem(target,style,cx,cy,size){
    const number=`#${loadout.number}`;target.save();target.textAlign='center';target.textBaseline='middle';target.lineJoin='round';
    if(style.design==='collection'){
      drawCollectionBadge(target,style,cx,cy,size);
    }else if(style.design==='classic'){
      target.fillStyle='#071f32';target.strokeStyle='#f3c64d';target.lineWidth=10;target.beginPath();target.moveTo(cx-size*.52,cy-size*.45);target.lineTo(cx+size*.52,cy-size*.45);target.lineTo(cx+size*.43,cy+size*.28);target.lineTo(cx,cy+size*.57);target.lineTo(cx-size*.43,cy+size*.28);target.closePath();target.fill();target.stroke();
      target.fillStyle='#fff';target.font=`900 ${size*.48}px "Card Block", sans-serif`;
    }else if(style.design==='burst'){
      target.translate(cx,cy);target.fillStyle='#ffe35d';target.strokeStyle='#061d36';target.lineWidth=9;target.beginPath();for(let i=0;i<12;i++){const a=-Math.PI/2+i*Math.PI/6,r=i%2?size*.46:size*.62;target.lineTo(Math.cos(a)*r,Math.sin(a)*r);}target.closePath();target.fill();target.stroke();target.setTransform(1,0,0,1,0,0);
      target.fillStyle='#061d36';target.font=`italic 900 ${size*.52}px "Card Slant", monospace`;
    }else if(style.design==='vintage'){
      target.fillStyle='#f7f0d9';target.strokeStyle='#a62c33';target.lineWidth=11;target.beginPath();target.arc(cx,cy,size*.54,0,Math.PI*2);target.fill();target.stroke();target.strokeStyle='#173d59';target.lineWidth=4;target.beginPath();target.arc(cx,cy,size*.43,0,Math.PI*2);target.stroke();
      target.fillStyle='#a62c33';target.font=`900 ${size*.48}px "Card Serif", serif`;
    }else if(style.design==='aurora'){
      target.shadowColor='#52efd2';target.shadowBlur=28;target.fillStyle='rgba(3,12,39,.94)';target.strokeStyle='#52efd2';target.lineWidth=9;target.beginPath();target.arc(cx,cy,size*.54,0,Math.PI*2);target.fill();target.stroke();target.shadowBlur=0;
      target.fillStyle='#fff';target.font=`900 ${size*.48}px "Card Mono", monospace`;
    }else if(style.design==='foil'){
      const medal=target.createRadialGradient(cx-size*.15,cy-size*.18,4,cx,cy,size*.65);medal.addColorStop(0,'#fff8bd');medal.addColorStop(.55,'#e7bd43');medal.addColorStop(1,'#9b6c13');target.fillStyle=medal;target.strokeStyle='#fff';target.lineWidth=7;target.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4;target.lineTo(cx+Math.cos(a)*size*.57,cy+Math.sin(a)*size*.57);}target.closePath();target.fill();target.stroke();
      target.fillStyle='#153c59';target.font=`900 ${size*.46}px "Card Serif", serif`;
    }else{
      target.translate(cx,cy);target.rotate(Math.PI/4);target.fillStyle='#02070d';target.strokeStyle='#d5ab3e';target.lineWidth=10;target.fillRect(-size*.42,-size*.42,size*.84,size*.84);target.strokeRect(-size*.42,-size*.42,size*.84,size*.84);target.strokeStyle='#67e5ed';target.lineWidth=4;target.strokeRect(-size*.32,-size*.32,size*.64,size*.64);target.rotate(-Math.PI/4);target.translate(-cx,-cy);
      target.fillStyle='#fff';target.font=`italic 900 ${size*.5}px "Card Slant", monospace`;
    }
    target.fillText(number,cx,cy+size*.015,size*1.02);target.restore();
  }

  function playerRinkName(){
    try{
      const profile=JSON.parse(localStorage.getItem('topCheGlobalLeaderboardProfile')||'null'),name=String(profile?.username||'').trim();
      return /^[A-Za-z0-9]{1,8}$/.test(name)?name.toUpperCase():'MYPLAYER';
    }catch{return 'MYPLAYER';}
  }

  function playerCardLevel(){return `LEVEL ${completedLevelCount()}`;}

  function fitCardFont(target,text,maxWidth,maxSize,minSize,fontBuilder){
    let size=maxSize;
    do{target.font=fontBuilder(size);if(target.measureText(text).width<=maxWidth)break;size-=2;}while(size>=minSize);
    return size;
  }

  function drawCollectionStats(target,style,width,height,rinkName,points){
    const font=`"${style.font}", sans-serif`,leftLogo=style.logoCorner?.[1]==='l',bottomLogo=style.logoCorner?.[0]==='b',panelInk=cardContrast(style.detail),levelLabel=playerCardLevel();
    target.textBaseline='alphabetic';target.lineJoin='round';
    if(style.layout==='topbar'){
      target.fillStyle=style.detail;target.globalAlpha=.96;target.beginPath();target.moveTo(0,0);target.lineTo(width,0);target.lineTo(width*.92,245);target.lineTo(width*.08,270);target.closePath();target.fill();target.globalAlpha=1;
      const badgeX=leftLogo?width-155:155,textX=leftLogo?270:300;drawCardNumberEmblem(target,style,badgeX,145,150);target.textAlign='left';target.fillStyle=panelInk;target.font=`400 25px ${font}`;target.fillText(levelLabel,textX,92,520);fitCardFont(target,rinkName,570,76,42,size=>`400 ${size}px ${font}`);target.fillText(rinkName,textX,188,570);target.font=`400 19px ${font}`;target.fillText(points,textX,228,600);
    }else if(style.layout==='bottom'){
      target.fillStyle=style.detail;target.globalAlpha=.96;target.fillRect(0,height-240,width,240);target.globalAlpha=1;target.fillStyle=style.accent;target.fillRect(0,height-240,width,13);const badgeX=bottomLogo&&style.logoCorner==='br'?150:175;drawCardNumberEmblem(target,style,badgeX,height-125,150);target.textAlign='left';target.fillStyle=panelInk;target.font=`400 20px ${font}`;target.fillText(levelLabel,310,height-184,580);fitCardFont(target,rinkName,600,62,40,size=>`400 ${size}px ${font}`);target.fillText(rinkName,310,height-116,600);target.font=`400 20px ${font}`;target.fillText(points,312,height-70,600);
    }else if(style.layout==='leftside'||style.layout==='rightside'){
      const right=style.layout==='rightside',x=right?width-185:0;target.fillStyle=style.detail;target.globalAlpha=.96;target.fillRect(x,0,185,height);target.globalAlpha=1;target.fillStyle=style.accent;target.fillRect(right?x:x+171,0,14,height);drawCardNumberEmblem(target,style,x+92,bottomLogo?height*.68:height-150,138);
      target.save();target.translate(x+98,height*.59);target.rotate(-Math.PI/2);target.textAlign='left';target.fillStyle=panelInk;target.font=`400 23px ${font}`;target.fillText(levelLabel,0,0);fitCardFont(target,rinkName,300,62,34,size=>`400 ${size}px ${font}`);target.fillText(rinkName,132,0,300);target.font=`400 18px ${font}`;target.fillText(points,455,0,590);target.restore();
    }else if(style.layout==='diagonalUp'||style.layout==='diagonalDown'){
      const angle=(style.layout==='diagonalUp'?-13:13)*Math.PI/180;target.save();target.translate(width*.5,height-145);target.rotate(angle);target.fillStyle=style.detail;target.globalAlpha=.96;target.fillRect(-width*.62,-112,width*1.24,224);target.globalAlpha=1;target.strokeStyle=style.accent;target.lineWidth=12;target.strokeRect(-width*.62,-112,width*1.24,224);const badgeX=bottomLogo&&leftLogo?width*.35:-width*.36;drawCardNumberEmblem(target,style,badgeX,0,145);const tx=badgeX>0?-width*.46:-width*.19;target.textAlign='left';target.fillStyle=panelInk;target.font=`400 18px ${font}`;target.fillText(levelLabel,tx,-51,570);fitCardFont(target,rinkName,590,56,36,size=>`400 ${size}px ${font}`);target.fillText(rinkName,tx,10,590);target.font=`400 18px ${font}`;target.fillText(points,tx,54,580);target.restore();
    }else{
      target.fillStyle=style.detail;target.globalAlpha=.95;target.beginPath();target.moveTo(0,height-245);target.lineTo(width*.72,height-285);target.lineTo(width,height-205);target.lineTo(width,height);target.lineTo(0,height);target.closePath();target.fill();target.globalAlpha=1;drawCardNumberEmblem(target,style,170,height-140,150);target.textAlign='left';target.fillStyle=panelInk;target.font=`400 20px ${font}`;target.fillText(levelLabel,315,height-188,590);fitCardFont(target,rinkName,600,62,38,size=>`400 ${size}px ${font}`);target.fillText(rinkName,315,height-118,600);target.font=`400 20px ${font}`;target.fillText(points,318,height-70,590);
    }
  }

  function drawCardFooter(target,style,width,height){
    const rinkName=playerRinkName(),levelLabel=playerCardLevel(),points=`${lifetimeCheesePoints.toLocaleString()} CHEESE POINTS EARNED`;
    target.save();target.textBaseline='alphabetic';
    if(style.design==='collection'){
      drawCollectionStats(target,style,width,height,rinkName,points);
    }else if(style.design==='anton'){
      target.fillStyle='rgba(16,29,52,.96)';target.beginPath();target.moveTo(0,0);target.lineTo(width*.79,0);target.lineTo(width*.72,245);target.lineTo(0,285);target.closePath();target.fill();target.strokeStyle='#f8d64d';target.lineWidth=10;target.beginPath();target.moveTo(0,282);target.lineTo(width*.73,242);target.stroke();
      drawCardNumberEmblem(target,style,158,153,168);target.textAlign='left';target.fillStyle='#f8d64d';target.font='400 29px "Anton", sans-serif';target.fillText(levelLabel,305,98);target.fillStyle='#fff0bd';fitCardFont(target,rinkName,500,86,48,size=>`400 ${size}px "Anton", sans-serif`);target.fillText(rinkName,300,190,500);target.fillStyle='#f8d64d';target.font='400 23px "Anton", sans-serif';target.fillText(points,300,238,470);
    }else if(style.design==='bungee'){
      target.save();target.translate(width*.5,height-154);target.rotate(12*Math.PI/180);target.fillStyle='#10152b';target.fillRect(-width*.58,-116,width*1.16,232);target.strokeStyle='#f5cf3f';target.lineWidth=14;target.strokeRect(-width*.58,-116,width*1.16,232);target.fillStyle='#31d8e8';target.fillRect(-width*.58,-116,38,232);drawCardNumberEmblem(target,style,-width*.36,0,162);target.textAlign='left';target.fillStyle='#31d8e8';target.font='400 18px "Bungee", sans-serif';target.fillText(levelLabel,-width*.18,-51,650);target.fillStyle='#fff';fitCardFont(target,rinkName,650,54,34,size=>`400 ${size}px "Bungee", sans-serif`);target.fillText(rinkName,-width*.18,9,650);target.fillStyle='#31d8e8';target.font='400 20px "Bungee", sans-serif';target.fillText(points,-width*.18,52,650);target.restore();
    }else if(style.design==='blackops'){
      target.fillStyle='rgba(7,18,15,.96)';target.fillRect(width-190,0,190,height);target.fillStyle='#94ef3b';target.fillRect(width-190,0,13,height);drawCardNumberEmblem(target,style,width-95,height-164,142);
      target.save();target.translate(width-72,height*.62);target.rotate(-Math.PI/2);target.textAlign='left';target.fillStyle='#94ef3b';target.font='400 26px "Black Ops One", sans-serif';target.fillText(levelLabel,0,0);target.fillStyle='#dce8dd';fitCardFont(target,rinkName,300,62,34,size=>`400 ${size}px "Black Ops One", sans-serif`);target.fillText(rinkName,144,0,300);target.fillStyle='#94ef3b';target.font='400 19px "Black Ops One", sans-serif';target.fillText(points,468,0,620);target.restore();
    }else if(style.design==='graduate'){
      target.save();target.translate(width*.5,height-150);target.rotate(-12*Math.PI/180);target.fillStyle='#efe0b3';target.fillRect(-width*.57,-108,width*1.14,216);target.strokeStyle='#7e1828';target.lineWidth=15;target.strokeRect(-width*.57,-108,width*1.14,216);target.strokeStyle='#153f68';target.lineWidth=5;target.strokeRect(-width*.54,-89,width*1.08,178);drawCardNumberEmblem(target,style,-width*.35,0,150);target.textAlign='left';target.fillStyle='#153f68';target.font='400 18px "Graduate", serif';target.fillText(levelLabel,-width*.18,-51,620);target.fillStyle='#7e1828';fitCardFont(target,rinkName,630,58,34,size=>`400 ${size}px "Graduate", serif`);target.fillText(rinkName,-width*.18,9,630);target.fillStyle='#153f68';target.font='400 21px "Graduate", serif';target.fillText(points,-width*.18,51,650);target.restore();
    }else if(style.design==='alfa'){
      target.fillStyle='rgba(20,10,5,.95)';target.beginPath();target.moveTo(width*.08,0);target.lineTo(width*.92,0);target.lineTo(width*.84,240);target.quadraticCurveTo(width*.5,292,width*.16,240);target.closePath();target.fill();target.strokeStyle='#d5ad58';target.lineWidth=9;target.stroke();drawCardNumberEmblem(target,style,188,145,165);
      target.textAlign='left';target.fillStyle='#d5ad58';target.font='400 25px "Alfa Slab One", serif';target.fillText(levelLabel,340,98);target.fillStyle='#f6ead0';fitCardFont(target,rinkName,540,68,38,size=>`400 ${size}px "Alfa Slab One", serif`);target.fillText(rinkName,336,182,540);target.fillStyle='#d5ad58';target.font='400 19px "Alfa Slab One", serif';target.fillText(points,340,226,580);
    }else if(style.design==='russo'){
      target.fillStyle='rgba(7,23,57,.97)';target.beginPath();target.moveTo(0,0);target.lineTo(185,0);target.lineTo(150,height);target.lineTo(0,height);target.closePath();target.fill();target.fillStyle='#ff455d';target.beginPath();target.moveTo(173,0);target.lineTo(195,0);target.lineTo(158,height);target.lineTo(136,height);target.closePath();target.fill();drawCardNumberEmblem(target,style,93,height-155,140);
      target.save();target.translate(90,height*.69);target.rotate(-Math.PI/2);target.textAlign='left';target.fillStyle='#59e5f3';target.font='400 25px "Russo One", sans-serif';target.fillText(levelLabel,0,0);target.fillStyle='#fff';fitCardFont(target,rinkName,300,64,34,size=>`400 ${size}px "Russo One", sans-serif`);target.fillText(rinkName,142,0,300);target.fillStyle='#59e5f3';target.font='400 19px "Russo One", sans-serif';target.fillText(points,466,0,610);target.restore();
    }else if(style.design==='monoton'){
      target.save();target.translate(width*.5,height-156);target.rotate(18*Math.PI/180);target.fillStyle='rgba(8,3,27,.94)';target.fillRect(-width*.62,-118,width*1.24,236);target.shadowColor='#ff4fd8';target.shadowBlur=22;target.strokeStyle='#ff4fd8';target.lineWidth=10;target.strokeRect(-width*.62,-118,width*1.24,236);target.shadowColor='#4ff5ef';target.strokeStyle='#4ff5ef';target.lineWidth=4;target.strokeRect(-width*.59,-95,width*1.18,190);target.shadowBlur=0;drawCardNumberEmblem(target,style,-width*.36,0,160);target.textAlign='left';target.fillStyle='#4ff5ef';target.font='400 18px "Russo One", sans-serif';target.fillText(levelLabel,-width*.18,-54,640);target.fillStyle='#fff';fitCardFont(target,rinkName,650,50,30,size=>`400 ${size}px "Monoton", sans-serif`);target.fillText(rinkName,-width*.18,9,650);target.fillStyle='#4ff5ef';target.font='400 20px "Russo One", sans-serif';target.fillText(points,-width*.18,54,650);target.restore();
    }else if(style.design==='vintage'){
      target.fillStyle='#173d59';target.fillRect(76,height-280,width-152,190);target.fillStyle='#a62c33';target.fillRect(76,height-280,18,190);drawCardNumberEmblem(target,style,190,height-183,154);
      target.textAlign='left';target.fillStyle='#f1d163';target.font='900 25px "Card Serif", serif';target.fillText(levelLabel,330,height-212);target.fillStyle='#f7f0d9';fitCardFont(target,rinkName,590,66,38,size=>`900 ${size}px "Card Serif", serif`);target.fillText(rinkName,326,height-132,590);target.fillStyle='#f1d163';target.font='900 22px "Card Block", sans-serif';target.fillText(points,330,height-88,640);
      target.strokeStyle='#f1d163';target.lineWidth=3;target.beginPath();target.moveTo(326,height-202);target.lineTo(width-116,height-202);target.stroke();
    }else if(style.design==='burst'){
      target.fillStyle='#061d36';target.beginPath();target.moveTo(0,height-285);target.lineTo(width,height-220);target.lineTo(width,height);target.lineTo(0,height);target.closePath();target.fill();target.strokeStyle='#ffe35d';target.lineWidth=14;target.stroke();
      drawCardNumberEmblem(target,style,160,height-153,160);target.save();target.translate(294,height-145);target.rotate(-.055);target.textAlign='left';target.lineJoin='round';target.fillStyle='#63f1f1';target.font='900 20px "Card Mono", monospace';target.fillText(levelLabel,0,-57,650);fitCardFont(target,rinkName,650,64,38,size=>`italic 900 ${size}px "Card Slant", monospace`);target.lineWidth=10;target.strokeStyle='#087a9b';target.strokeText(rinkName,0,6,650);target.fillStyle='#fff';target.fillText(rinkName,0,6,650);target.restore();
      target.textAlign='left';target.fillStyle='#63f1f1';target.font='900 23px "Card Mono", monospace';target.fillText(points,294,height-78,700);
    }else if(style.design==='aurora'){
      target.fillStyle='rgba(2,7,25,.91)';target.beginPath();target.moveTo(0,height-250);target.bezierCurveTo(width*.23,height-330,width*.65,height-170,width,height-265);target.lineTo(width,height);target.lineTo(0,height);target.closePath();target.fill();target.strokeStyle='#52efd2';target.lineWidth=9;target.stroke();
      drawCardNumberEmblem(target,style,184,height-157,150);target.textAlign='left';target.fillStyle='#52efd2';target.font='900 24px "Card Mono", monospace';target.fillText(`${levelLabel} //`,330,height-194);target.shadowColor='#52efd2';target.shadowBlur=18;target.fillStyle='#fff';fitCardFont(target,rinkName,620,68,38,size=>`900 ${size}px "Card Mono", monospace`);target.fillText(rinkName,326,height-116,620);target.shadowBlur=0;target.fillStyle='#52efd2';target.font='900 21px "Card Mono", monospace';target.fillText(points,330,height-72,650);
    }else if(style.design==='foil'){
      target.fillStyle='rgba(255,255,255,.92)';target.beginPath();target.moveTo(48,height-270);target.lineTo(width*.22,height-310);target.lineTo(width-48,height-238);target.lineTo(width-48,height-52);target.lineTo(48,height-52);target.closePath();target.fill();target.strokeStyle='#c39b2d';target.lineWidth=11;target.stroke();
      drawCardNumberEmblem(target,style,195,height-163,158);target.textAlign='left';target.fillStyle='#9b6c13';target.font='900 24px "Card Block", sans-serif';target.fillText(levelLabel,344,height-196,610);target.fillStyle='#153c59';fitCardFont(target,rinkName,600,70,40,size=>`900 ${size}px "Card Serif", serif`);target.fillText(rinkName,338,height-116,600);target.fillStyle='#27718e';target.font='900 22px "Card Block", sans-serif';target.fillText(points,344,height-70,630);
    }else if(style.design==='diamond'){
      target.fillStyle='rgba(1,5,10,.96)';target.beginPath();target.moveTo(0,height-265);target.lineTo(width*.34,height-335);target.lineTo(width,height-252);target.lineTo(width,height);target.lineTo(0,height);target.closePath();target.fill();target.strokeStyle='#d5ab3e';target.lineWidth=10;target.stroke();
      drawCardNumberEmblem(target,style,166,height-158,150);target.save();target.translate(300,height-92);target.rotate(-Math.PI/2);target.textAlign='left';target.fillStyle='#67e5ed';target.font='900 19px "Card Mono", monospace';target.fillText(levelLabel,0,0);target.restore();target.textAlign='left';target.lineJoin='round';fitCardFont(target,rinkName,600,70,38,size=>`italic 900 ${size}px "Card Slant", monospace`);target.strokeStyle='#d5ab3e';target.lineWidth=6;target.strokeText(rinkName,340,height-112,600);target.fillStyle='#fff';target.fillText(rinkName,340,height-112,600);target.fillStyle='#d5ab3e';target.font='900 21px "Card Mono", monospace';target.fillText(points,342,height-68,650);
    }else{
      target.fillStyle='#08283b';target.fillRect(0,height-238,width,238);target.fillStyle='#f3c64d';target.fillRect(0,height-238,width,14);
      drawCardNumberEmblem(target,style,170,height-137,150);target.textAlign='left';target.fillStyle='#78e2e9';target.font='900 26px "Card Mono", monospace';target.fillText(levelLabel,320,height-171);target.fillStyle='#fff';fitCardFont(target,rinkName,620,70,38,size=>`900 ${size}px "Card Block", sans-serif`);target.fillText(rinkName,316,height-98,620);target.fillStyle='#78e2e9';target.font='900 22px "Card Block", sans-serif';target.fillText(points,320,height-55,650);
    }
    target.restore();
  }

  function renderGearPreviews() {
    if(!spritesReady)return;
    const crops={jersey:[225,150,315,300],logo:[255,225,260,225],number:[270,250,235,205],helmet:[307,174,155,153],gloves:[288,105,215,210],socks:[304,362,166,205],skates:[305,410,155,190],shaft:[220,34,165,160],tape:[174,15,132,95]};
    ui.lockerItems.querySelectorAll('.gear-card[data-gear-id]').forEach(card=>{
      const item=gearItem(lockerCategory,card.dataset.gearId),preview=card.querySelector('.gear-preview');
      if(!preview)return;
      const rect=preview.getBoundingClientRect(),displayW=Math.max(180,Math.round(rect.width||240)),displayH=Math.max(96,Math.round(rect.height||96)),dpr=Math.min(window.devicePixelRatio||1,3);
      preview.width=Math.round(displayW*dpr);preview.height=Math.round(displayH*dpr);
      const previewCtx=preview.getContext('2d');previewCtx.setTransform(dpr,0,0,dpr,0,0);previewCtx.imageSmoothingEnabled=true;previewCtx.imageSmoothingQuality='high';
      if(lockerCategory==='cardstyle'){
        drawCardStyleBackground(previewCtx,item,displayW,displayH);
        const sprite=customPlayerSprite||createCustomizedPlayer(),scale=Math.min(displayW/510,displayH/575)*1.04,dw=510*scale,dh=575*scale;
        previewCtx.save();previewCtx.shadowColor='rgba(0,0,0,.35)';previewCtx.shadowBlur=9;previewCtx.drawImage(sprite,110,0,510,608,(displayW-dw)/2,displayH*.05,dw,dh);previewCtx.restore();
        drawCardBrand(previewCtx,item,displayW,displayH,true);
        return;
      }
      const sprite=createCustomizedPlayer({[lockerCategory]:item.id}),crop=crops[lockerCategory];
      const gradient=previewCtx.createRadialGradient(displayW/2,displayH*.48,8,displayW/2,displayH/2,Math.max(displayW,displayH)*.58);gradient.addColorStop(0,'#dff3f6');gradient.addColorStop(1,'#8db9c4');previewCtx.fillStyle=gradient;previewCtx.fillRect(0,0,displayW,displayH);
      const scale=Math.min(displayW/crop[2],displayH/crop[3])*.93,dw=crop[2]*scale,dh=crop[3]*scale;
      previewCtx.drawImage(sprite,crop[0]*sprite.width/648,crop[1]*sprite.height/608,crop[2]*sprite.width/648,crop[3]*sprite.height/608,(displayW-dw)/2,(displayH-dh)/2,dw,dh);
    });
  }

  function scheduleGearPreviews(){
    cancelAnimationFrame(lockerPreviewFrame);
    lockerPreviewFrame=requestAnimationFrame(()=>{if(ui.lockerDialog.open&&!ui.lockerCatalogView.hidden)renderGearPreviews();});
  }

  function equippedItems(){
    return Object.keys(gearCatalog).map(category=>({category,label:gearSingular[category],item:gearItem(category,loadout[category])}));
  }

  function showLockerCatalog(){
    if(!ui.lockerCatalogView||!ui.playerShowcase)return;
    ui.lockerCatalogView.hidden=false;ui.playerShowcase.hidden=true;ui.lockerDialog.scrollTop=0;
  }

  function showPlayerShowcase(){
    ui.lockerCatalogView.hidden=true;ui.playerShowcase.hidden=false;ui.lockerDialog.scrollTop=0;
    ui.shareStatus.textContent='';
    renderPlayerShowcase();ui.backToLockerButton.focus();
  }

  function renderPlayerShowcase(){
    const canvas=ui.playerRender;refreshCustomPlayer();
    const playerReady=paintPlayerCard(canvas,gearItem('cardstyle',loadout.cardstyle));ui.sharePlayerButton.disabled=!playerReady;ui.downloadPlayerButton.disabled=!playerReady;
    ui.equippedSummary.innerHTML=equippedItems().map(({label,item})=>`<span><strong>${label}:</strong> ${item.name}</span>`).join('');
  }

  function paintPlayerCard(canvas,cardStyle){
    const target=canvas.getContext('2d'),playerReady=Boolean(customPlayerSprite);
    canvas.width=1080;canvas.height=1512;target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';
    drawCardStyleBackground(target,cardStyle,canvas.width,canvas.height);
    const darkCollection=['blueprint','arcade','graffiti','knit','banner','lava','carbon','royal','laser','masterpiece'].includes(cardStyle.motif),darkCard=['diamond','aurora','blackops','alfa','russo','monoton'].includes(cardStyle.design)||darkCollection,playerGlow=target.createRadialGradient(540,690,80,540,710,520);playerGlow.addColorStop(0,darkCard?'rgba(105,240,237,.36)':'rgba(255,255,255,.8)');playerGlow.addColorStop(.6,darkCard?'rgba(80,126,180,.14)':'rgba(239,251,252,.34)');playerGlow.addColorStop(1,'rgba(255,255,255,0)');target.fillStyle=playerGlow;target.fillRect(20,150,1040,1210);
    if(cardStyle.design==='classic'||cardStyle.design==='vintage'){target.save();target.globalAlpha=.16;target.strokeStyle=cardStyle.design==='vintage'?cardStyle.accent:'#70b6c5';target.lineWidth=7;target.beginPath();target.arc(540,720,270,0,Math.PI*2);target.stroke();target.restore();}
    if(playerReady){
      const placement=cardPlayerPlacement(cardStyle);
      target.save();target.shadowColor='rgba(3,17,28,.38)';target.shadowBlur=38;target.shadowOffsetY=22;
      target.drawImage(customPlayerSprite,110,0,510,608,placement.x,placement.y,placement.w,placement.h);target.restore();
    } else {
      target.fillStyle='#5c8791';target.font='800 30px system-ui, sans-serif';target.textAlign='center';target.fillText('Lacing up your player…',540,720);
    }
    drawCardFooter(target,cardStyle,canvas.width,canvas.height);
    drawCardBrand(target,cardStyle,canvas.width,canvas.height);
    return playerReady;
  }

  function renderUnlockedCardPreview(canvas,cardStyle){
    if(!canvas||!cardStyle)return;
    refreshCustomPlayer();
    const fullCard=document.createElement('canvas');paintPlayerCard(fullCard,cardStyle);
    const target=canvas.getContext('2d');canvas.width=360;canvas.height=504;
    target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';
    target.clearRect(0,0,canvas.width,canvas.height);target.drawImage(fullCard,0,0,canvas.width,canvas.height);
  }

  function playerImageBlob(){
    renderPlayerShowcase();
    const dataUrl=ui.playerRender.toDataURL('image/png'),encoded=dataUrl.split(',')[1];
    if(!encoded)throw new Error('Could not create image.');
    const binary=atob(encoded),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:'image/png'});
  }

  function savePlayerBlob(blob){
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`top-ches-player-card-${loadout.number}.png`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  async function downloadPlayerImage(){
    ui.downloadPlayerButton.disabled=true;
    try{const blob=playerImageBlob();savePlayerBlob(blob);ui.shareStatus.textContent='Player image saved. It is ready to post.';}
    catch{ui.shareStatus.textContent='The image could not be saved. Please try again.';}
    finally{ui.downloadPlayerButton.disabled=false;}
  }

  async function sharePlayerImage(){
    ui.sharePlayerButton.disabled=true;
    try{
      const blob=playerImageBlob(),file=new File([blob],`top-ches-player-card-${loadout.number}.png`,{type:'image/png'});
      const shareData={title:"My Top Che’s Hockey Card",text:"Check out my customized player card from Top Che’s Hockey!",files:[file]};
      if(navigator.share&&(!navigator.canShare||navigator.canShare(shareData))){await navigator.share(shareData);ui.shareStatus.textContent='Player shared!';}
      else{savePlayerBlob(blob);ui.shareStatus.textContent='Your browser saved the image. Open Instagram or another app and choose it from your photos or downloads.';}
    } catch(error){if(error?.name!=='AbortError')ui.shareStatus.textContent='Sharing was not available. Try Save Image instead.';}
    finally{ui.sharePlayerButton.disabled=false;}
  }

  function player(x,y,team,label,angle=0,scale=1,opacity=1) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.globalAlpha=opacity;

    const halo = team==='orange' ? '#43a5ff' : team==='blue' ? '#1769ff' : '#d43f3f';
    ctx.fillStyle='rgba(5,22,32,.2)';
    ctx.beginPath(); ctx.ellipse(3,18,19.2*scale,8.8*scale,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=halo; ctx.globalAlpha=.8*opacity; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,2,20.8*scale,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=opacity;

    if (spritesReady) {
      const cellW=hockeySprites.width/2,cellH=hockeySprites.height/2;
      const source=team==='orange' ? [0,0] : team==='blue' ? [cellW,0] : [0,cellH];
      const height=83.2*scale,width=height*(cellW/cellH);
      if(team==='orange'){refreshCustomPlayer();ctx.drawImage(customPlayerSprite,-width/2,-height/2,width,height);}
      else ctx.drawImage(hockeySprites,source[0],source[1],cellW,cellH,-width/2,-height/2,width,height);
    } else {
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,14.4*scale,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font=`800 ${10*scale}px system-ui`;ctx.textAlign='center';ctx.fillText(label,0,4*scale);
    }
    ctx.restore();
  }

  // Rig the original recolourable skater as a layered figure. The planted skate,
  // pushing leg, hips, shoulders, both arms and blade move as one kinetic chain.
  const motionMasks={
    left:[[297,390],[381,390],[381,515],[297,515]],
    right:[[381,390],[475,390],[495,617],[380,617]],
    torso:[[174,0],[540,0],[540,430],[275,430]],
    leadArm:[[177,7],[271,7],[377,145],[374,186],[338,207],[339,256],[315,291],[245,282],[236,199],[284,142],[177,83]]
  };
  const motionParts=new Map();
  let teammateMotionSprite=null;
  function motionPath(target,points,ox=0,oy=0){
    target.beginPath();target.moveTo(points[0][0]+ox,points[0][1]+oy);
    for(let i=1;i<points.length;i++)target.lineTo(points[i][0]+ox,points[i][1]+oy);
    target.closePath();
  }
  function motionPart(source,points,cutouts=[]){
    const surface=document.createElement('canvas');surface.width=648;surface.height=608;
    const target=surface.getContext('2d');target.save();motionPath(target,points);target.clip();
    target.drawImage(source,0,0);target.restore();
    target.save();target.globalCompositeOperation='destination-out';
    for(const mask of cutouts){motionPath(target,mask);target.fill();}
    target.beginPath();target.ellipse(240,96,24,23,0,0,Math.PI*2);target.fill();target.restore();
    return surface;
  }
  function originalMotionFrame(name,team='orange'){
    refreshCustomPlayer();if(!customPlayerSprite||!spritesReady)return null;
    const key=`${team}:${name}`;
    if(motionFrames.has(key))return motionFrames.get(key);
    if(team==='blue'&&!teammateMotionSprite){
      teammateMotionSprite=document.createElement('canvas');teammateMotionSprite.width=648;teammateMotionSprite.height=608;
      const painter=teammateMotionSprite.getContext('2d');
      painter.filter='brightness(.83) saturate(.98)';
      painter.drawImage(hockeySprites,0,0,hockeySprites.width/2,hockeySprites.height/2,0,0,648,608);
    }
    const source=team==='blue'?teammateMotionSprite:customPlayerSprite;
    if(name==='ready'){
      const surface=document.createElement('canvas');surface.width=648;surface.height=608;
      const target=surface.getContext('2d');target.drawImage(source,0,0);
      target.globalCompositeOperation='destination-out';target.beginPath();
      target.ellipse(240,96,24,23,0,0,Math.PI*2);target.fill();
      motionFrames.set(key,surface);return surface;
    }
    if(!motionParts.has(team)){
      const parts={
        left:motionPart(source,motionMasks.left),right:motionPart(source,motionMasks.right),
        torso:motionPart(source,motionMasks.torso,[motionMasks.leadArm]),
        leadArm:motionPart(source,motionMasks.leadArm)
      };
      // The arm in the source covers part of the sweater beneath it. Rebuild a
      // narrow underlay so a shoulder turn cannot reveal a transparent hole.
      const core=parts.torso.getContext('2d');core.save();core.globalCompositeOperation='destination-over';
      core.fillStyle=team==='blue'?'#0754bf':gearItem('jersey',loadout.jersey).color;
      core.beginPath();core.ellipse(310,260,36,36,-.3,0,Math.PI*2);core.fill();
      core.restore();
      motionParts.set(team,parts);
    }
    const parts=motionParts.get(team);
    const poses={
      // [left stride, right stride, shoulder turn, lateral weight shift,
      //  lead arm, forward weight shift]
      'stride-left':[.45,.015,.075,10,-.035,2],
      'stride-right':[.015,-.45,-.075,-10,.035,2],
      'cross-left':[-.14,.12,-.075,-8,.04,0],
      'cross-right':[.12,-.14,.075,8,-.04,0],
      'forehand-load':[.08,-.13,-.11,-10,-.23,3],
      'forehand-contact':[.02,-.08,.09,9,.23,-7],
      'forehand-release':[.12,-.025,.16,15,.38,-13],
      'backhand-load':[.13,-.02,.105,9,.21,2],
      'backhand-contact':[-.07,.07,-.09,-8,-.23,-5],
      'backhand-release':[-.14,.08,-.16,-15,-.37,-12],
      'shot-load':[.02,-.25,-.19,-17,-.3,6],
      'shot-release':[.09,-.08,.12,12,.3,-11],
      'shot-follow':[.24,-.015,.22,20,.47,-17],
      'check-brace':[.24,-.18,-.1,-9,.11,2],
      'check-impact':[-.14,.21,.2,16,-.27,-8],
      'check-recoil':[-.35,.32,-.22,-19,-.42,2],
      'check-stumble':[.48,-.42,.25,22,.38,-9],
      'check-fall':[-.55,.52,-.29,-20,-.45,4]
    };
    const [left,right,shoulders,weight,leadArm,forward]=poses[name]||[0,0,0,0,0,0];
    const surface=document.createElement('canvas');surface.width=760;surface.height=760;
    const target=surface.getContext('2d'),ox=56,oy=76;
    target.drawImage(source,ox,oy);
    target.save();target.globalCompositeOperation='destination-out';
    for(const key of ['left','right','torso']){motionPath(target,motionMasks[key],ox,oy);target.fill();}
    target.beginPath();target.ellipse(ox+240,oy+96,24,23,0,0,Math.PI*2);target.fill();
    target.restore();
    for(const [part,angle,pivot,extension] of [
      [parts.left,left,[351,397],name==='stride-left'?1.085:1],
      [parts.right,right,[421,398],name==='stride-right'?1.085:1]
    ]){
      target.save();target.translate(ox+pivot[0],oy+pivot[1]);target.rotate(angle);
      target.scale(1,extension);target.drawImage(part,-pivot[0],-pivot[1]);target.restore();
    }
    target.save();target.translate(ox+385+weight,oy+411+forward);target.rotate(shoulders);
    target.drawImage(parts.torso,-385,-411);
    target.save();target.translate(302-385,250-411);target.rotate(leadArm);
    target.drawImage(parts.leadArm,-302,-250);target.restore();
    target.restore();
    motionFrames.set(key,surface);return surface;
  }

  function playerAnimationTrack(action,raw,phase,celebration){
    if(!action)return [{at:0,pose:'ready'}];
    if(celebration>.12&&action.good)return [{at:0,pose:'ready'}];
    const {choice,outcome}=action;
    if(choice==='left'||choice==='right'){
      const side=choice==='left'?'backhand':'forehand';
      return [{at:0,pose:`${side}-load`},{at:.12,pose:`${side}-contact`},{at:.25,pose:`${side}-release`},{at:.48,pose:'ready'}];
    }
    if(choice==='shoot'||outcome==='shot-blocked'||outcome==='goalie-easy-save')
      return [{at:0,pose:'shot-load'},{at:.15,pose:'shot-release'},{at:.27,pose:'shot-follow'},{at:.52,pose:'stride-left'},{at:.7,pose:'ready'}];
    if(choice==='rush'||outcome==='rush-bodycheck'){
      const track=[{at:0,pose:'stride-left'},{at:.12,pose:'stride-right'},{at:.24,pose:'stride-left'},
        {at:.36,pose:'stride-right'},{at:.48,pose:'stride-left'},{at:.6,pose:'stride-right'},
        {at:.72,pose:'stride-left'},{at:.84,pose:'stride-right'}];
      if(outcome==='rush-bodycheck')track.splice(4,4,
        {at:.44,pose:'check-brace'},{at:.49,pose:'check-impact'},
        {at:.56,pose:'check-recoil'},{at:.64,pose:'check-stumble'},
        {at:.73,pose:'check-fall'});
      else track.push({at:.91,pose:'shot-release'});
      return track;
    }
    if(choice==='regroup')return [{at:0,pose:'stride-left'},{at:.15,pose:'stride-right'},
      {at:.3,pose:'cross-left'},{at:.45,pose:'stride-left'},
      {at:.6,pose:'cross-right'},{at:.75,pose:'stride-right'},{at:.9,pose:'ready'}];
    return [{at:0,pose:'ready'}];
  }

  // Shared pose vocabulary for future teammate puck carriers as well as the
  // current receiver. A caller supplies progress from 0 to 1 for one action.
  function teammateAnimationTrack(kind){
    if(kind==='skate')return [{at:0,pose:'stride-left'},{at:.25,pose:'stride-right'},
      {at:.5,pose:'stride-left'},{at:.75,pose:'stride-right'}];
    if(kind==='pass-left'||kind==='pass-right'){
      const side=kind==='pass-left'?'backhand':'forehand';
      return [{at:0,pose:`${side}-load`},{at:.34,pose:`${side}-contact`},
        {at:.56,pose:`${side}-release`},{at:.87,pose:'ready'}];
    }
    if(kind==='shoot')return [{at:0,pose:'ready'},{at:.075,pose:'shot-load'},{at:.32,pose:'shot-release'},
      {at:.45,pose:'shot-follow'},{at:.82,pose:'ready'}];
    return [{at:0,pose:'ready'}];
  }

  function drawAnimatedSkater(x,y,angle,scale,team,label,track,raw,opacity=1){
    if(!spritesReady){player(x,y,team,label,angle,scale,opacity);return;}
    let index=0;while(index+1<track.length&&raw>=track[index+1].at)index++;
    const fade=.055;
    const mix=index>0?clamp((raw-track[index].at)/fade):1;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);if(team==='blue')ctx.scale(-1,1);
    ctx.globalAlpha=opacity;ctx.fillStyle='rgba(5,22,32,.2)';
    ctx.beginPath();ctx.ellipse(3,18,19.2*scale,8.8*scale,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=team==='blue'?'#1769ff':'#43a5ff';ctx.globalAlpha=.8*opacity;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(0,2,20.8*scale,0,Math.PI*2);ctx.stroke();
    const drawPose=(pose,alpha)=>{
      const frame=originalMotionFrame(pose,team);if(!frame)return;
      const height=83.2*scale,width=height*648/608,ratio=height/608;
      ctx.globalAlpha=opacity*alpha;
      if(pose==='ready')ctx.drawImage(frame,-width/2,-height/2,width,height);
      else ctx.drawImage(frame,-width/2-56*ratio,-height/2-76*ratio,760*ratio,760*ratio);
    };
    if(index>0&&mix<1)drawPose(track[index-1].pose,1-mix);
    drawPose(track[index].pose,mix);ctx.restore();
  }

  function animatedPlayer(x,y,angle,scale,action,raw,phase,celebration,opacity=1){
    drawAnimatedSkater(x,y,angle,scale,'orange','10',playerAnimationTrack(action,raw,phase,celebration),raw,opacity);
  }

  function animatedTeammate(x,y,label,angle,scale,kind='skate',raw=0,opacity=1){
    drawAnimatedSkater(x,y,angle,scale,'blue',label,teammateAnimationTrack(kind),raw,opacity);
  }

  function fallenPlayer(x,y,angle=0,scale=1,opacity=1) {
    if(!fallenPlayerReady||opacity<=0) return;
    refreshCustomPlayer();
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=opacity;
    ctx.fillStyle='rgba(5,22,32,.2)';ctx.beginPath();ctx.ellipse(2,7,49*scale,30*scale,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#43a5ff';ctx.globalAlpha=.75*opacity;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.ellipse(0,1,48*scale,43*scale,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=opacity;
    const size=112*scale;
    ctx.drawImage(customFallenSprite||fallenPlayerSprite,-size/2,-size/2,size,size);
    ctx.restore();
  }

  function goalie(x,y,offset,angle=0,scale=1,pose='ready',poseBlend=0) {
    ctx.save();ctx.translate(x+offset,y);ctx.rotate(angle);ctx.scale(scale,scale);
    const blend=pose==='ready'||!regularGoaliePoseReady[pose]?0:easeInOut(clamp(poseBlend));
    ctx.fillStyle='rgba(5,22,32,.18)';ctx.beginPath();ctx.ellipse(0,12,28+blend*21,9.6+blend*3.5,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#d43f3f';ctx.globalAlpha=.72;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,4,28.8,20,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    if(spritesReady){
      const cellW=hockeySprites.width/2,cellH=hockeySprites.height/2,height=97.6,width=height*(cellW/cellH);
      ctx.globalAlpha=1-blend;ctx.drawImage(hockeySprites,cellW,cellH,cellW,cellH,-width/2,-height/2,width,height);ctx.globalAlpha=1;
    } else {
      ctx.fillStyle='#edf7f8';ctx.strokeStyle='#bd2e35';ctx.lineWidth=3;ctx.fillRect(-20,-12,40,24);ctx.strokeRect(-20,-12,40,24);
    }
    if(blend>0){
      const image=regularGoaliePoseImages[pose],poseSize=pose==='glove'?132:pose==='blocker'?137:142;
      ctx.globalAlpha=blend;ctx.drawImage(image,-poseSize/2,-poseSize/2,poseSize,poseSize);ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function goaliePoseForShot(targetX,goalieX,lowShot=false){
    if(lowShot||Math.abs(targetX-goalieX)<18)return 'butterfly';
    // In the overhead assets the trapper reaches to screen-right and the
    // blocker-and-stick hand reaches to screen-left.
    return targetX>goalieX?'glove':'blocker';
  }

  function drawLane(x1,y1,x2,y2,open,alpha) {
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=open?'#168df2':'#df4c4c';ctx.lineWidth=4;ctx.setLineDash([8,9]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
  }

  function easeInOut(t) {
    return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  }

  function clamp(value,min=0,max=1){return Math.max(min,Math.min(max,value));}
  function lerp(start,end,t){return start+(end-start)*t;}
  function pointLerp(start,end,t){return {x:lerp(start.x,end.x,t),y:lerp(start.y,end.y,t)};}
  function segment(raw,start,end){return easeInOut(clamp((raw-start)/(end-start)));}

  function closestDefender(defenders,target) {
    if(!defenders.length) return -1;
    let best=0,bestDistance=Infinity;
    defenders.forEach((d,i)=>{
      const distance=Math.hypot(d.x-target.x,d.y-target.y);
      if(distance<bestDistance){best=i;bestDistance=distance;}
    });
    return best;
  }

  function scenarioDefenders(s,m){
    const defenders=s.defenders?s.defenders.map(([x,y])=>({x:m.w*x,y:m.h*y})):[];
    if(!s.defenders&&(s.cover==='left'||s.cover==='both'))defenders.push({x:m.w*.34,y:m.h*.48});
    if(!s.defenders&&(s.cover==='right'||s.cover==='both'))defenders.push({x:m.w*.66,y:m.h*.48});
    if(!s.defenders&&s.shot)defenders.push({x:m.cx,y:m.h*.34});
    return defenders;
  }

  // Look along the actual shot to the centre of the net. An opponent out on
  // a wing cannot intercept a puck travelling through the slot.
  function shotLaneBlocker(defenders,start,net){
    const dx=net.x-start.x,dy=net.y-start.y,lengthSquared=dx*dx+dy*dy;
    if(!lengthSquared)return null;
    let first=null;
    defenders.forEach((defender,index)=>{
      const along=((defender.x-start.x)*dx+(defender.y-start.y)*dy)/lengthSquared;
      if(along<=.06||along>=.94)return;
      const hit={x:start.x+dx*along,y:start.y+dy*along};
      if(Math.hypot(defender.x-hit.x,defender.y-hit.y)>34)return;
      if(!first||along<first.along)first={index,hit,along};
    });
    return first;
  }

  function drawImpact(position,progress) {
    if(!position||progress<=0||progress>=1) return;
    ctx.save();ctx.translate(position.x,position.y);ctx.globalAlpha=1-progress;
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,r1=24+progress*13,r2=35+progress*30;
      line(Math.cos(angle)*r1,Math.sin(angle)*r1,Math.cos(angle)*r2,Math.sin(angle)*r2,'#f4b942',4);
    }
    ctx.restore();
  }

  function drawSaveFlash(position,progress) {
    if(!position||progress<=0||progress>=1) return;
    ctx.save();ctx.globalAlpha=(1-progress)*.8;ctx.strokeStyle='#63e6ed';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(position.x,position.y,18+progress*32,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  function drawGoalFlash(position,progress) {
    if(!position||progress<=0||progress>=1) return;
    ctx.save();ctx.translate(position.x,position.y);ctx.globalAlpha=1-progress;
    ctx.strokeStyle='#87efaf';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(0,0,14+progress*36,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3,r1=18+progress*18,r2=28+progress*34;
      line(Math.cos(angle)*r1,Math.sin(angle)*r1,Math.cos(angle)*r2,Math.sin(angle)*r2,'#87efaf',3);
    }
    ctx.restore();
  }

  function drawGoalCelebration(m,progress,streak) {
    if(progress<=0)return;
    const pulse=.55+.45*Math.sin(progress*Math.PI*6);
    ctx.save();
    ctx.fillStyle=`rgba(255,207,84,${.08*(1-progress)})`;ctx.fillRect(0,0,m.w,m.h);
    [[m.cx-m.w*.13,m.h*.038],[m.cx+m.w*.13,m.h*.038]].forEach(([x,y],index)=>{
      ctx.fillStyle=index%2?'#ffcf54':'#ff4b3e';ctx.globalAlpha=.5+.5*pulse;ctx.beginPath();ctx.arc(x,y,7+5*pulse,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;
    const colors=['#ffcf54','#63e6ed','#ff6b35','#ffffff','#87efaf'];
    for(let i=0;i<34;i++){
      const delay=(i%8)*.045,q=clamp((progress-delay)/(1-delay));if(q<=0)continue;
      const angle=(i*2.399)+(streak%5)*.17,speed=m.w*(.16+(i%6)*.026);
      const x=m.cx+Math.cos(angle)*speed*q,y=m.h*.075+Math.sin(angle)*speed*.42*q+m.h*.32*q*q;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+q*Math.PI*5);ctx.globalAlpha=1-q*.35;ctx.fillStyle=colors[i%colors.length];
      if(i%5===0){ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();}else ctx.fillRect(-4,-2,8,4);
      ctx.restore();
    }
    const pop=Math.sin(clamp(progress/.42)*Math.PI);
    ctx.globalAlpha=Math.max(0,1-progress*.78);ctx.fillStyle='#071b2b';ctx.strokeStyle='#ffcf54';ctx.lineWidth=3;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`950 ${22+pop*8}px system-ui`;
    ctx.strokeText(streak>=5?'ON FIRE!':'TOP CHE!',m.cx,m.h*.2);ctx.fillStyle='#ffffff';ctx.fillText(streak>=5?'ON FIRE!':'TOP CHE!',m.cx,m.h*.2);ctx.restore();
  }

  function drawBonusConfetti(m,progress) {
    if(progress<=0||progress>=1)return;
    const colors=['#ffcf54','#63e6ed','#ff6b35','#ffffff','#87efaf'];
    ctx.save();
    for(let i=0;i<28;i++){
      const delay=(i%7)*.035,q=clamp((progress-delay)/(1-delay));if(q<=0)continue;
      const angle=-Math.PI*.93+(i/27)*Math.PI*.86,speed=m.w*(.18+(i%5)*.035);
      const x=m.cx+Math.cos(angle)*speed*q,y=m.h*.23+Math.sin(angle)*speed*.55*q+m.h*.4*q*q;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+q*Math.PI*(3+i%4));ctx.globalAlpha=Math.max(0,1-q*.72);ctx.fillStyle=colors[i%colors.length];
      if(i%4===0){ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();}else ctx.fillRect(-5,-2,10,4);
      ctx.restore();
    }
    ctx.restore();
  }

  function currentIntermission(){return intermissions[state.bonusIndex]||intermissions[0];}

  function openNetLayout(m){
    const left=m.w*.11,top=m.h*.17,width=m.w*.78,height=m.h*.49;
    const targets=[];
    const columns=[.055,.5,.945],rows=[.19,.49];
    for(let row=0;row<2;row++)for(let col=0;col<3;col++)targets.push({x:left+width*columns[col],y:top+height*rows[row],col,row});
    return {left,top,width,height,targets};
  }

  function openNetFlickResult(start,end,m,difficulty){
    const puck={x:m.cx,y:m.h*.92};
    if(Math.hypot(start.x-puck.x,start.y-puck.y)>m.w*.115||start.y-end.y<m.h*.18)return null;
    const targets=openNetLayout(m).targets,distances=targets.map(point=>Math.hypot(point.x-end.x,point.y-end.y));
    const choice=distances.indexOf(Math.min(...distances));
    const layout=openNetLayout(m),miss=distances[choice]>m.w*(difficulty==='Beginner'?.115:.09);
    const wide=end.x<layout.left-m.w*.025||end.x>layout.left+layout.width+m.w*.025||end.y<layout.top-m.h*.035||end.y>layout.top+layout.height+m.h*.025;
    return {choice,miss,wide:miss&&wide};
  }

  function drawBonusArena(m){
    ctx.clearRect(0,0,m.w,m.h);
    const stands=ctx.createLinearGradient(0,0,0,m.h*.3);stands.addColorStop(0,'#061522');stands.addColorStop(.58,'#123d55');stands.addColorStop(1,'#78adbc');ctx.fillStyle=stands;ctx.fillRect(0,0,m.w,m.h*.3);
    ctx.save();for(let i=0;i<34;i++){const x=(i*53)%m.w,y=m.h*(.09+(i%4)*.038);ctx.fillStyle=i%5===0?'rgba(235,106,48,.58)':i%3===0?'rgba(230,245,247,.72)':'rgba(18,49,65,.72)';ctx.beginPath();ctx.arc(x,y,4+(i%3),0,Math.PI*2);ctx.fill();}ctx.restore();
    const glass=ctx.createLinearGradient(0,m.h*.17,0,m.h*.48);glass.addColorStop(0,'rgba(210,244,251,.72)');glass.addColorStop(.62,'rgba(239,251,253,.9)');glass.addColorStop(1,'rgba(174,219,229,.96)');ctx.fillStyle=glass;ctx.fillRect(0,m.h*.17,m.w,m.h*.31);
    ctx.save();ctx.globalAlpha=.42;for(let i=0;i<=8;i++)line(m.w*i/8,m.h*.17,m.w*i/8,m.h*.48,'#78a9b7',2);line(0,m.h*.17,m.w,m.h*.17,'#dffaff',3);ctx.restore();
    ctx.save();ctx.globalAlpha=.96;for(let i=0;i<10;i++){const x=m.w*(.03+i*.105);ctx.fillStyle='#f6feff';ctx.shadowColor='#d8f8ff';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(x,m.h*.055,3+(i%3),0,Math.PI*2);ctx.fill();}ctx.restore();
    ctx.fillStyle='#fbfdfc';ctx.fillRect(0,m.h*.475,m.w,m.h*.095);line(0,m.h*.485,m.w,m.h*.485,'#d3e3e7',3);line(0,m.h*.555,m.w,m.h*.555,'#ddb72f',8);line(0,m.h*.57,m.w,m.h*.57,'#7897a2',2);
    const ice=ctx.createLinearGradient(0,m.h*.57,0,m.h);ice.addColorStop(0,'#f5fdfe');ice.addColorStop(.52,'#d4edf1');ice.addColorStop(1,'#9bc8d2');ctx.fillStyle=ice;ctx.fillRect(0,m.h*.575,m.w,m.h*.425);
    const reflection=ctx.createRadialGradient(m.cx,m.h*.64,0,m.cx,m.h*.78,m.w*.55);reflection.addColorStop(0,'rgba(255,255,255,.78)');reflection.addColorStop(1,'rgba(63,158,183,0)');ctx.fillStyle=reflection;ctx.fillRect(0,m.h*.575,m.w,m.h*.425);
    const goalLineY=m.h*.665;line(0,goalLineY,m.w,goalLineY,'rgba(196,38,50,.58)',4);
    ctx.save();ctx.fillStyle='rgba(125,205,225,.2)';ctx.strokeStyle='rgba(43,145,176,.7)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m.cx-m.w*.255,goalLineY);ctx.ellipse(m.cx,goalLineY,m.w*.255,m.h*.13,0,Math.PI,0,true);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.save();ctx.globalAlpha=.12;for(let y=m.h*.59;y<m.h;y+=12)line(0,y,m.w,y,'#2c7188',1);for(let i=0;i<30;i++)line((i*79)%m.w,m.h*(.61+(i%8)*.045),((i*79)%m.w)+22,m.h*(.608+(i%8)*.045),'#fff',1);ctx.restore();
  }

  function premiumNetLayout(m){return {left:m.w*.11,top:m.h*.17,width:m.w*.78,height:m.h*.49,bottom:m.h*.66};}

  function drawPremiumNet(m){
    const n=premiumNetLayout(m),depth=m.w*.04,backRise=m.h*.05;
    ctx.save();ctx.fillStyle='rgba(219,244,247,.2)';ctx.beginPath();ctx.moveTo(n.left,n.top);ctx.lineTo(n.left-depth,n.top+backRise*.35);ctx.lineTo(n.left-depth,n.bottom-backRise);ctx.lineTo(n.left,n.bottom);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(n.left+n.width,n.top);ctx.lineTo(n.left+n.width+depth,n.top+backRise*.35);ctx.lineTo(n.left+n.width+depth,n.bottom-backRise);ctx.lineTo(n.left+n.width,n.bottom);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(228,247,250,.16)';ctx.fillRect(n.left,n.top,n.width,n.height);

    // Bright diamond mesh sits behind the goalie and attaches to the posts and crossbar.
    ctx.save();ctx.beginPath();ctx.rect(n.left,n.top,n.width,n.height);ctx.clip();ctx.strokeStyle='rgba(238,252,253,.76)';ctx.lineWidth=Math.max(1,m.w*.0017);const mesh=Math.max(20,m.w*.036);
    for(let x=n.left-n.height;x<n.left+n.width+n.height;x+=mesh){ctx.beginPath();ctx.moveTo(x,n.bottom);ctx.lineTo(x+n.height,n.top);ctx.stroke();}
    for(let x=n.left-n.height;x<n.left+n.width+n.height;x+=mesh){ctx.beginPath();ctx.moveTo(x,n.top);ctx.lineTo(x+n.height,n.bottom);ctx.stroke();}
    ctx.restore();

    ctx.shadowColor='rgba(0,25,38,.5)';ctx.shadowBlur=14;ctx.fillStyle='rgba(13,65,83,.22)';ctx.beginPath();ctx.ellipse(m.cx,n.bottom+7,n.width*.52,m.h*.025,0,0,Math.PI*2);ctx.fill();

    // The rear/base support is white; there is deliberately no red bar across the ice.
    ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=5;ctx.strokeStyle='rgba(235,247,249,.9)';ctx.lineWidth=Math.max(4,m.w*.006);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(n.left,n.bottom);ctx.quadraticCurveTo(m.cx,n.bottom+m.h*.022,n.left+n.width,n.bottom);ctx.stroke();

    const drawRedFrame=(color,width,shadow,blur)=>{ctx.shadowColor=shadow;ctx.shadowBlur=blur;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(n.left,n.bottom);ctx.lineTo(n.left,n.top);ctx.lineTo(n.left+n.width,n.top);ctx.lineTo(n.left+n.width,n.bottom);ctx.stroke();};
    drawRedFrame('#8f0710',Math.max(12,m.w*.019),'rgba(0,0,0,.55)',13);drawRedFrame('#e41f2d',Math.max(7,m.w*.011),'#ff4754',5);ctx.restore();return n;
  }

  function goaliePosition(m,t){
    const n=premiumNetLayout(m),elapsed=Math.max(0,t-state.bonusGoalieMoveAt),p=easeInOut(clamp(elapsed/760));
    const shift=lerp(state.bonusGoalieFrom||0,state.bonusGoalieTo||0,p),maxShift=n.width*.105,ambient=currentIntermission().type==='deflection'?Math.sin(t/560)*n.width*.018:0;
    return {x:m.cx+shift*maxShift+ambient,y:n.bottom+m.h*.065,shift,p};
  }

  function drawPremiumGoalie(m,t,pose='ready',forcedSavePose=null){
    const n=premiumNetLayout(m),g=goaliePosition(m,t);
    const reboundSaving=currentIntermission().type==='rebound'&&pose==='save';
    let actionProgress=state.action?easeInOut(clamp((t-state.action.start)/Math.max(1,state.action.duration))):0;
    if(reboundSaving&&!state.action){
      actionProgress=state.bonusPhase==='shot'?easeInOut(clamp((t-state.startedAt)/520)):1-easeInOut(clamp((t-(state.bonusReactionAt||t))/420));
    }
    const reboundSavePoint=currentIntermission().type==='rebound'?state.bonusPuck?.save:null;
    const choicePoint=Number.isInteger(state.bonusChoice)?openNetLayout(m).targets[state.bonusChoice]:reboundSavePoint||state.bonusPuck?.end||state.bonusGoalTarget||{x:m.cx,y:n.top+n.height*.55};
    const direction=Math.sign(choicePoint.x-m.cx)||1,goalieW=n.width*.84,goalieH=n.height*1.04;
    const maximumCentreShift=Math.max(0,n.width*.5-goalieW*.5-n.width*.012),reaction=pose==='save'?1:pose==='miss'?.05:0;
    const saveReach=easeInOut(clamp(actionProgress/.72)),activeShift=direction*maximumCentreShift*reaction*saveReach,blend=pose==='ready'?0:saveReach,targetHigh=choicePoint.y<n.top+n.height*.36;
    const deflectionReach=currentIntermission().type==='deflection'&&pose!=='ready';
    const savePose=forcedSavePose||(deflectionReach?(direction<0?'blocker':'trapper'):(targetHigh?(direction<0?'blocker':'trapper'):'pad'));
    const drawPose=(image,alpha,yOffset=0)=>{if(!image?.complete||!image.naturalWidth)return false;ctx.save();ctx.globalAlpha=alpha;ctx.translate(g.x+activeShift,g.y+yOffset);ctx.shadowColor='rgba(0,0,0,.58)';ctx.shadowBlur=18;ctx.shadowOffsetY=10;ctx.drawImage(image,-goalieW/2,-goalieH,goalieW,goalieH);ctx.restore();return true;};
    if(goaliePoseImagesReady===goaliePoseFiles.length){drawPose(goaliePoseImages.ready,1-blend);if(blend)drawPose(goaliePoseImages[savePose],blend,savePose==='pad'?m.h*.035*blend:0);}
    else {ctx.save();ctx.translate(g.x+activeShift,g.y);if(intermissionGoalieReady)ctx.drawImage(intermissionGoalie,-goalieW/2,-goalieH,goalieW,goalieH);else goalie(0,-goalieH*.3,0,0,1.8);ctx.restore();}
    return {x:g.x+activeShift,y:g.y,w:goalieW,h:goalieH,pose:savePose};
  }

  function drawIceInstruction(m,text){const y=m.h*.035,h=49,objectiveFont=`800 ${Math.max(9,m.w*.014)}px system-ui`,instructionFont=`900 ${Math.max(14,m.w*.024)}px system-ui`;ctx.save();ctx.font=instructionFont;const w=Math.min(m.w*.9,Math.max(m.w*.62,ctx.measureText(text).width+54)),x=(m.w-w)/2;ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=18;const panel=ctx.createLinearGradient(x,y,x+w,y);panel.addColorStop(0,'rgba(5,23,37,.96)');panel.addColorStop(.5,'rgba(15,52,72,.96)');panel.addColorStop(1,'rgba(5,23,37,.96)');ctx.fillStyle=panel;ctx.strokeStyle='rgba(99,230,237,.62)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();ctx.stroke();ctx.fillStyle='#ffcf54';ctx.fillRect(x,y,5,h);ctx.shadowBlur=0;ctx.fillStyle='#8fadb9';ctx.textAlign='center';ctx.font=objectiveFont;ctx.fillText('BONUS OBJECTIVE',m.cx,y+16);ctx.fillStyle='#fff';ctx.font=instructionFont;ctx.fillText(text,m.cx,y+36);ctx.restore();}

  function drawOpenNetBonus(m,t){
    drawBonusArena(m);const layout=openNetLayout(m),n=drawPremiumNet(m),pulse=.55+.45*Math.sin(t/115),advanced=currentIntermission().difficulty!=='Beginner';
    const answer=Number.isInteger(state.bonusAnswer)?state.bonusAnswer:0,target=layout.targets[answer],goaliePose=state.action?(state.action.good?'miss':'save'):'ready';drawPremiumGoalie(m,t,goaliePose);
    const r=Math.max(15,m.w*(advanced?.025:.031));if(!state.locked){ctx.save();ctx.globalAlpha=.75+.25*pulse;ctx.strokeStyle='#63e6ed';ctx.lineWidth=4;ctx.shadowColor='#63e6ed';ctx.shadowBlur=20;ctx.fillStyle='rgba(99,230,237,.14)';ctx.beginPath();ctx.arc(target.x,target.y,r*(1+.08*pulse),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
    const puckStart={x:m.cx,y:m.h*.92};
    if(!state.locked){
      ctx.save();ctx.strokeStyle='rgba(99,230,237,.75)';ctx.lineWidth=3;ctx.shadowColor='#63e6ed';ctx.shadowBlur=17;ctx.beginPath();ctx.arc(puckStart.x,puckStart.y,m.w*.055+3*pulse,0,Math.PI*2);ctx.stroke();
      if(state.bonusFlick){const aim=state.bonusFlick.current;line(puckStart.x,puckStart.y,aim.x,aim.y,'rgba(99,230,237,.9)',3,[8,6]);ctx.beginPath();ctx.arc(aim.x,aim.y,Math.max(8,m.w*.014),0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }
    if(!state.action)drawPuckMotion(puckStart);
    if(state.action){
      const raw=clamp((t-state.action.start)/state.action.duration),chosen=layout.targets[Number.isInteger(state.bonusChoice)?state.bonusChoice:answer];
      if(state.action.good){const p=easeInOut(raw),puck=pointLerp(puckStart,chosen,p),previous=pointLerp(puckStart,chosen,Math.max(0,p-.08));drawPuckMotion(puck,previous);if(raw>.7)drawGoalFlash(chosen,segment(raw,.7,1));}
      else if(state.bonusWide){const miss=state.bonusMissPoint||{x:m.cx,y:m.h*.16},p=easeInOut(raw),puck=pointLerp(puckStart,miss,p);drawPuckMotion(puck,pointLerp(puckStart,miss,Math.max(0,p-.08)));}
      else {const contact=pointLerp(puckStart,chosen,.82),flight=easeInOut(segment(raw,0,.68)),saved=pointLerp(puckStart,contact,flight),rebound=segment(raw,.68,1),puck={x:lerp(saved.x,m.cx+(contact.x-m.cx)*.9,rebound),y:saved.y+m.h*.045*rebound},previous=pointLerp(puckStart,contact,Math.max(0,flight-.08));drawPuckMotion(puck,previous);if(raw>.62)drawSaveFlash(contact,segment(raw,.62,1));}
    }
    if(!state.locked)drawIceInstruction(m,'FLICK THE PUCK INTO THE GAP');
  }

  function deflectionPuckPosition(m,t){
    const elapsed=state.bonusPhase==='aim'?0:Math.max(0,t-(state.bonusReactionAt||state.startedAt)),flight=clamp(elapsed/950),end=state.bonusPuck?.end||{x:m.cx,y:m.h*.42},start=state.bonusPuck?.start||{x:m.cx,y:m.h*.91};
    return pointLerp(start,end,easeInOut(flight));
  }

  function drawUserStick(position,angle=0,active=true,outline=false){
    const width=Math.min(430,canvas.clientWidth*.61),height=width*(743/1831);ctx.save();ctx.translate(position.x,position.y);ctx.rotate(angle);ctx.globalAlpha=outline?.34:1;ctx.shadowColor=outline?'#63e6ed':'rgba(0,0,0,.55)';ctx.shadowBlur=outline?24:10;
    if(deflectionStickReady){if(outline)ctx.filter='brightness(0) saturate(100%) invert(86%) sepia(39%) saturate(1097%) hue-rotate(134deg) brightness(99%) contrast(90%)';ctx.drawImage(deflectionStick,-width*.16,-height*.78,width,height);ctx.filter='none';}
    else {ctx.lineCap='round';line(0,0,width*.72,-height*.45,outline?'#63e6ed':'#252a2e',10);line(0,0,-width*.08,-height*.05,outline?'#63e6ed':'#111820',18);}
    ctx.restore();
  }

  function drawDeflectionBonus(m,t){
    drawBonusArena(m);drawPremiumNet(m);drawPremiumGoalie(m,t,state.action?.good?'miss':'ready');
    const puck=deflectionPuckPosition(m,t),stick=state.bonusStick||{x:m.cx,y:m.h*.67};
    if(state.bonusStickTarget&&!state.locked)drawUserStick(state.bonusStickTarget,0,true,true);
    if(state.action?.good){const raw=clamp((t-state.action.start)/state.action.duration),target=state.bonusGoalTarget||{x:m.w*.73,y:m.h*.22},flight=quadraticPoint(puck,{x:m.cx,y:m.h*.27},target,easeInOut(raw));drawPuckMotion(flight,puck);if(raw>.72)drawGoalFlash(target,segment(raw,.72,1));}
    else if(state.action&&!state.action.good){const raw=clamp((t-state.action.start)/state.action.duration),hit=state.bonusPuck?.hit||{x:m.cx,y:m.h*.47},impact=pointLerp(puck,hit,easeInOut(segment(raw,0,.58)));drawPuckMotion(impact);if(raw>.48)drawSaveFlash(hit,segment(raw,.48,.9));}
    else drawPuckMotion(puck,state.bonusPuck?.previous);
    state.bonusPuck={...(state.bonusPuck||{}),previous:puck};drawUserStick(stick,0,!state.locked);
    if(!state.locked){ctx.save();ctx.strokeStyle='rgba(99,230,237,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(puck.x,puck.y,18+5*Math.sin(t/100),0,Math.PI*2);ctx.stroke();ctx.restore();}
    if(!state.locked)drawIceInstruction(m,'DRAG YOUR BLADE IN FRONT OF THE PUCK');
  }

  function deflectionStickOnTarget(m){
    return Boolean(state.bonusStick&&state.bonusStickTarget&&Math.hypot(state.bonusStick.x-state.bonusStickTarget.x,state.bonusStick.y-state.bonusStickTarget.y)<m.w*.075);
  }

  const reboundTiming={toBounce:240,bounceHold:200,rise:150,apexHold:200,fall:170,slide:1500};
  const reboundTotalTime=Object.values(reboundTiming).reduce((sum,value)=>sum+value,0);

  function reboundPuckPosition(m,t){
    const candidate=state.bonusPuck,hasReboundPath=candidate&&candidate.start&&candidate.save&&candidate.bounce&&candidate.apex&&candidate.land&&candidate.exit;
    const p=hasReboundPath?candidate:{start:{x:m.cx,y:m.h*.9},save:{x:m.cx,y:m.h*.48},bounce:{x:m.cx,y:m.h*.7},apex:{x:m.cx,y:m.h*.73},land:{x:m.cx,y:m.h*.77},exit:{x:m.w*1.08,y:m.h*.8}};
    const place=(ground,height,stage,progress=0,tappable=false,tier=null,windowRemaining=0,done=false)=>({x:ground.x,y:ground.y-height,groundX:ground.x,groundY:ground.y,height,stage,progress,tappable,tier,windowRemaining,done});
    if(state.bonusPhase==='shot'){const q=easeInOut(clamp((t-state.startedAt)/700)),ground=pointLerp(p.start,p.save,q);return place(ground,0,'shot',q);}
    if(state.bonusPhase==='result'){const point=state.bonusTapPoint||p.exit;return place(point,0,'result',1);}
    const elapsed=Math.max(0,t-(state.bonusReactionAt||t)),a=reboundTiming.toBounce,b=a+reboundTiming.bounceHold,c=b+reboundTiming.rise,d=c+reboundTiming.apexHold,e=d+reboundTiming.fall,f=e+reboundTiming.slide,maxHeight=m.h*.075;
    if(elapsed<a){const q=easeInOut(elapsed/a),ground=pointLerp(p.save,p.bounce,q);return place(ground,Math.sin(q*Math.PI)*maxHeight*.72,'flight',q);}
    if(elapsed<b)return place(p.bounce,0,'bounce',0,true,'max',b-elapsed);
    if(elapsed<c){const q=easeInOut((elapsed-b)/reboundTiming.rise),ground=pointLerp(p.bounce,p.apex,q);return place(ground,maxHeight*q,'rise',q);}
    if(elapsed<d)return place(p.apex,maxHeight,'apex',0,true,'max',d-elapsed);
    if(elapsed<e){const q=easeInOut((elapsed-d)/reboundTiming.fall),ground=pointLerp(p.apex,p.land,q);return place(ground,maxHeight*(1-q),'fall',q);}
    if(elapsed<f){const q=(elapsed-e)/reboundTiming.slide,ground=pointLerp(p.land,p.exit,easeInOut(q));return place(ground,0,'slide',q,true,'slide',f-elapsed);}
    return place(p.exit,0,'escaped',1,false,null,0,true);
  }

  function drawReboundPuck(motion,t){
    if(motion.stage==='shot'){drawPuckMotion(motion);return;}
    const airborne=motion.height>0,wobble=airborne?Math.sin(t/24)*.82:Math.sin(t/34)*(.42*(1-motion.progress));
    ctx.save();ctx.globalAlpha=.26;ctx.fillStyle='#07131a';ctx.beginPath();ctx.ellipse(motion.groundX,motion.groundY,8+motion.height*.08,2.7+motion.height*.025,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(motion.x,motion.y);ctx.rotate(wobble);const face=Math.max(.24,Math.abs(Math.cos(t/(airborne?42:68))));ctx.scale(1,airborne?.3+.65*face:.38+.12*face);ctx.fillStyle='#0b1115';ctx.strokeStyle='rgba(210,235,240,.72)';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(0,0,8,4.2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.arc(-1,-1,5.6,Math.PI*1.05,Math.PI*1.8);ctx.stroke();ctx.restore();
  }

  function drawReboundBonus(m,t){
    const goalieStillRecovering=state.bonusPhase==='rebound'&&t-(state.bonusReactionAt||0)<420;
    drawBonusArena(m);drawPremiumNet(m);drawPremiumGoalie(m,t,state.bonusPhase==='shot'||goalieStillRecovering?'save':'ready',state.bonusSavePose||'pad');const motion=reboundPuckPosition(m,t),puck={x:motion.x,y:motion.y};
    if(state.action?.good){const raw=clamp((t-state.action.start)/state.action.duration),target=state.bonusGoalTarget||{x:m.w*.72,y:m.h*.22};drawUserStick(pointLerp({x:m.cx-m.w*.24,y:m.h*.82},puck,easeInOut(segment(raw,0,.35))),-.58);if(raw>.32){const shot=pointLerp(puck,target,easeInOut(segment(raw,.32,1)));drawPuckMotion(shot);if(raw>.78)drawGoalFlash(target,segment(raw,.78,1));}}
    else drawReboundPuck(motion,t);
    if(motion.tappable&&!state.locked){const pulse=.5+.5*Math.sin(t/55);ctx.save();ctx.strokeStyle=motion.tier==='max'?'#ffcf54':'#63e6ed';ctx.lineWidth=4;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=20;ctx.beginPath();ctx.arc(puck.x,puck.y,18+7*pulse,0,Math.PI*2);ctx.stroke();ctx.restore();}
    if(!state.locked)drawIceInstruction(m,state.bonusPhase==='shot'?'WATCH THE SAVE':motion.tappable?(motion.tier==='max'?'TAP NOW · MAX POINTS':'TAP BEFORE IT ESCAPES'):'TRACK THE BOUNCING PUCK');
  }

  function drawOpenNetBonusLegacy(m,t){
    drawBonusArena(m);const layout=openNetLayout(m),pulse=.55+.45*Math.sin(t/115),advanced=currentIntermission().difficulty!=='Beginner';
    ctx.save();ctx.fillStyle='rgba(238,249,250,.35)';ctx.fillRect(layout.left,layout.top,layout.width,layout.height);
    ctx.strokeStyle='rgba(220,244,248,.38)';ctx.lineWidth=1;
    for(let i=1;i<12;i++)line(layout.left+layout.width*i/12,layout.top,layout.left+layout.width*i/12,layout.top+layout.height,'rgba(188,220,226,.42)',1);
    for(let i=1;i<8;i++)line(layout.left,layout.top+layout.height*i/8,layout.left+layout.width,layout.top+layout.height*i/8,'rgba(188,220,226,.42)',1);
    ctx.strokeStyle='#df2633';ctx.lineWidth=Math.max(7,m.w*.014);ctx.lineCap='round';ctx.strokeRect(layout.left,layout.top,layout.width,layout.height);ctx.restore();
    const answer=Number.isInteger(state.bonusAnswer)?state.bonusAnswer:0,target=layout.targets[answer],goalieCol=target.col===0?2:target.col===2?0:1;
    const goalieX=layout.left+layout.width*(goalieCol+.5)/3+(target.col===1?(target.row?layout.width*.16:-layout.width*.14):0);
    const goalieW=m.w*(advanced?.48:.54),goalieH=goalieW*(intermissionGoalie.height/intermissionGoalie.width||.84);
    if(intermissionGoalieReady){ctx.save();ctx.shadowColor='rgba(0,0,0,.42)';ctx.shadowBlur=16;ctx.drawImage(intermissionGoalie,goalieX-goalieW/2,layout.top+layout.height-goalieH*.82,goalieW,goalieH);ctx.restore();}
    else goalie(goalieX,layout.top+layout.height*.72,0,0,1.65);
    layout.targets.forEach((point,index)=>{
      const active=index===answer&&!state.locked,r=Math.max(20,m.w*(advanced?.034:.044));ctx.save();ctx.globalAlpha=active?.82+.18*pulse:.2;ctx.strokeStyle=active?'#63e6ed':'#d7eef2';ctx.lineWidth=active?5:2;ctx.beginPath();ctx.arc(point.x,point.y,r*(active?1+.08*pulse:1),0,Math.PI*2);ctx.stroke();if(active){ctx.fillStyle='rgba(99,230,237,.18)';ctx.fill();ctx.shadowColor='#63e6ed';ctx.shadowBlur=22;ctx.stroke();}ctx.restore();
    });
    const puckStart={x:m.cx,y:m.h*.9};drawPuckMotion(puckStart);
    if(state.action){
      const raw=clamp((t-state.action.start)/state.action.duration),chosen=layout.targets[Number.isInteger(state.bonusChoice)?state.bonusChoice:answer],p=easeInOut(raw);
      const puck=pointLerp(puckStart,chosen,p),previous=pointLerp(puckStart,chosen,Math.max(0,p-.08));drawPuckMotion(puck,previous);
      if(raw>.72)(state.action.good?drawGoalFlash:drawSaveFlash)(chosen,segment(raw,.72,1));
    }
    ctx.save();ctx.fillStyle='rgba(4,19,31,.76)';ctx.fillRect(m.w*.2,m.h*.735,m.w*.6,42);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`900 ${Math.max(15,m.w*.028)}px system-ui`;ctx.fillText('FIND THE OPEN SPACE',m.cx,m.h*.735+27);ctx.restore();
  }

  function drawFaceoffBonus(m,t){
    const grad=ctx.createLinearGradient(0,0,m.w,m.h);grad.addColorStop(0,'#eef9fa');grad.addColorStop(1,'#b9dce3');ctx.fillStyle=grad;ctx.fillRect(0,0,m.w,m.h);
    ctx.save();ctx.globalAlpha=.15;for(let y=0;y<m.h;y+=14)line(0,y,m.w,y,'#427b8b',1);ctx.restore();
    const r=m.w*.29,drop={x:m.cx,y:m.h*.52};ctx.beginPath();ctx.arc(drop.x,drop.y,r,0,Math.PI*2);ctx.strokeStyle='rgba(194,40,51,.82)';ctx.lineWidth=5;ctx.stroke();line(drop.x-r,drop.y,drop.x+r,drop.y,'rgba(194,40,51,.58)',3);line(drop.x,drop.y-r,drop.x,drop.y+r,'rgba(194,40,51,.58)',3);
    ctx.fillStyle='#c8313a';ctx.beginPath();ctx.arc(drop.x,drop.y,8,0,Math.PI*2);ctx.fill();
    player(m.w*.27,m.h*.62,'blue','7',-Math.PI/2,1.45);player(m.w*.73,m.h*.62,'white','9',Math.PI/2,1.45);
    const live=state.bonusPhase==='live',waiting=state.bonusPhase==='waiting';
    const ringProgress=live?clamp((t-state.bonusReactionAt)/(currentIntermission().time*1000)):0;
    ctx.save();ctx.strokeStyle=live?'#ffb13b':'#63e6ed';ctx.lineWidth=6;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(drop.x,drop.y,r*(waiting?.78:Math.max(.14,.78-ringProgress*.64)),0,Math.PI*2);ctx.stroke();ctx.restore();
    const puckY=waiting?m.h*.31:lerp(m.h*.31,drop.y,clamp((t-state.bonusReactionAt)/300));
    ctx.save();ctx.fillStyle='#111b20';ctx.beginPath();ctx.ellipse(drop.x,puckY,10,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(m.cx,m.h*.12);ctx.fillStyle='#f0f2f2';ctx.fillRect(-24,0,48,m.h*.18);for(let y=8;y<m.h*.18;y+=18){ctx.fillStyle='#111820';ctx.fillRect(-24,y,48,9);}ctx.restore();
    const label=waiting?'WAIT FOR THE DROP':state.locked?(state.bonusResult==='good'?'DRAW WON!':'TOO SLOW'):'GO!';ctx.save();ctx.textAlign='center';ctx.fillStyle=waiting?'#0d3850':state.locked&&state.bonusResult!=='good'?'#a42b32':'#0b7e72';ctx.font=`950 ${Math.max(22,m.w*.052)}px system-ui`;ctx.fillText(label,m.cx,m.h*.84);ctx.restore();
    if(state.action){const raw=clamp((t-state.action.start)/state.action.duration);(state.action.good?drawGoalFlash:drawImpact)(drop,raw);}
  }

  function drawReboundBonusLegacy(m,t){
    drawRink(m);drawNet(m);const lanes=['left','middle','right'],answer=state.bonusAnswer||'middle',answerIndex=Math.max(0,lanes.indexOf(answer)),advanced=currentIntermission().difficulty==='Advanced';
    const laneCenters=[m.w*.24,m.cx,m.w*.76],laneWidth=m.w*.25,pulse=.55+.45*Math.sin(t/110);
    laneCenters.forEach((x,index)=>{ctx.save();ctx.globalAlpha=index===answerIndex&&!state.locked?.13+.09*pulse:.035;ctx.fillStyle=index===answerIndex?'#28c8e8':'#6b92a0';ctx.beginPath();ctx.moveTo(m.cx,m.h*.2);ctx.lineTo(x-laneWidth/2,m.h*.72);ctx.lineTo(x+laneWidth/2,m.h*.72);ctx.closePath();ctx.fill();ctx.restore();});
    goalie(m.cx,m.h*.105,0,0,1.25);player(m.w*.79,m.h*.42,'white','6',-.28,1.05);if(advanced)player(m.w*.21,m.h*.44,'white','4',.25,.92);
    let skater={x:m.cx,y:m.h*.82},puck={x:lerp(m.cx,laneCenters[answerIndex],.78),y:m.h*.55};
    if(!state.locked){const flight=clamp((t-state.startedAt)/(currentIntermission().time*1000));puck={x:lerp(m.cx,laneCenters[answerIndex],flight*.78),y:lerp(m.h*.17,m.h*.55,flight)};}
    if(state.action){const raw=clamp((t-state.action.start)/state.action.duration),choiceIndex=Math.max(0,lanes.indexOf(state.bonusChoice));skater=pointLerp(skater,{x:laneCenters[choiceIndex],y:m.h*.58},easeInOut(raw));if(state.action.good)puck=pointLerp(puck,{x:m.cx,y:m.h*.055},segment(raw,.42,1));}
    player(skater.x,skater.y,'orange','10',0,1.35);drawPuckMotion(puck);
    if(state.action){const raw=clamp((t-state.action.start)/state.action.duration);if(raw>.68)(state.action.good?drawGoalFlash:drawImpact)(state.action.good?{x:m.cx,y:m.h*.055}:puck,segment(raw,.68,1));}
    ctx.save();ctx.fillStyle='rgba(4,19,31,.8)';ctx.fillRect(m.w*.16,m.h*.73,m.w*.68,42);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`900 ${Math.max(15,m.w*.028)}px system-ui`;ctx.fillText('CHASE THE REBOUND',m.cx,m.h*.73+27);ctx.restore();
  }

  function drawBonusGame(t){
    resizeCanvas();const m=rinkMetrics(),bonus=currentIntermission();
    if(state.bonusPhase==='intro'){
      drawBonusArena(m);drawPremiumNet(m);drawPremiumGoalie(m,t,'ready');return;
    }
    if(bonus.type==='open-net')drawOpenNetBonus(m,t);
    else if(bonus.type==='deflection')drawDeflectionBonus(m,t);
    else drawReboundBonus(m,t);
    if(state.action?.good)drawBonusConfetti(m,clamp((t-state.action.start)/state.action.duration));
  }

  function drawLooseStick(position,angle,opacity=1) {
    if(!position) return;
    const shaft=gearItem('shaft',loadout.shaft),tape=gearItem('tape',loadout.tape);
    ctx.save();ctx.translate(position.x,position.y);ctx.rotate(angle);ctx.globalAlpha=opacity;ctx.lineCap='round';ctx.lineJoin='round';
    line(-3,-25,2,17,shaft.color,7);line(2,17,16,25,'#151a20',8);
    if(shaft.design==='carbon'){ctx.setLineDash([2,3]);line(-3,-25,2,17,shaft.detail,3,[2,3]);}
    else if(shaft.design==='lightning'){ctx.strokeStyle=shaft.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,-23);ctx.lineTo(2,-12);ctx.lineTo(-1,-5);ctx.lineTo(3,5);ctx.lineTo(1,15);ctx.stroke();}
    else if(shaft.design==='woodgrain'){line(-1,-24,3,16,shaft.accent,1.5);line(-4,-20,0,12,shaft.detail,1.2);}
    else {ctx.strokeStyle=shaft.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-24);ctx.lineTo(2,-16);ctx.lineTo(-1,-9);ctx.lineTo(3,-2);ctx.lineTo(0,7);ctx.lineTo(3,15);ctx.stroke();}
    if(tape.design==='toe')line(10,22,16,25,tape.color,7);
    else if(tape.design==='half')line(8,21,16,25,tape.color,7);
    else if(tape.design==='three'){[[4,19,6,20],[9,21,11,22],[14,24,16,25]].forEach(p=>line(...p,tape.color,7));}
    else if(tape.design==='split'){line(2,17,9,21,tape.color,7);line(9,21,16,25,tape.accent,7);}
    else if(tape.design==='candy'){line(2,17,16,25,tape.color,7);[[5,19,7,20],[10,22,12,23],[14,24,16,25]].forEach(p=>line(...p,tape.accent,7));}
    else {line(2,17,16,25,tape.color,7);ctx.setLineDash([2,3]);line(2,17,16,25,tape.accent,1.4,[2,3]);}
    ctx.restore();
  }

  function quadraticPoint(start,control,end,t) {
    const a=(1-t)*(1-t),b=2*(1-t)*t,c=t*t;
    return {x:a*start.x+b*control.x+c*end.x,y:a*start.y+b*control.y+c*end.y};
  }

  function quadraticDirection(start,control,end,t) {
    return {x:2*(1-t)*(control.x-start.x)+2*t*(end.x-control.x),y:2*(1-t)*(control.y-start.y)+2*t*(end.y-control.y)};
  }

  function skaterAngle(direction,team='orange') {
    const travelAngle=Math.atan2(direction.y,direction.x);
    return travelAngle+(team==='white'?-Math.PI/2:Math.PI/2);
  }

  function playerPuckPosition(playerPosition,angle,team='orange') {
    const ox=team==='blue'?18:-18;
    const oy=team==='white'?30:-30;
    return {x:playerPosition.x+ox*Math.cos(angle)-oy*Math.sin(angle),y:playerPosition.y+ox*Math.sin(angle)+oy*Math.cos(angle)};
  }

  function drawPuckMotion(position,previous,opacity=1) {
    ctx.save();ctx.globalAlpha=opacity;
    if(previous){ctx.strokeStyle='rgba(18,42,50,.28)';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(position.x,position.y);ctx.stroke();}
    ctx.fillStyle='#10181c';ctx.beginPath();ctx.ellipse(position.x,position.y,7,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function teammateVisible(s,side){
    const passPlay=s.answer==='left'||s.answer==='right';
    return side==='left'?(s.showLeft??(s.answer==='shoot'?false:passPlay?s.answer==='left':true)):(s.showRight??(s.answer==='shoot'?false:passPlay?s.answer==='right':true));
  }

  function scenarioHasDefenders(s){
    if(Array.isArray(s.defenders))return s.defenders.length>0;
    return s.cover==='left'||s.cover==='right'||s.cover==='both'||Boolean(s.shot);
  }

  function soloScenario(s){return !teammateVisible(s,'left')&&!teammateVisible(s,'right')&&!scenarioHasDefenders(s);}

  function regroupLoop(puck,m,progress){
    const side=puck.x>m.cx?-1:1,turn=progress*Math.PI*2;
    const rx=m.w*.12,ry=m.h*.075;
    return {position:{x:puck.x+side*rx*(1-Math.cos(turn)),y:puck.y-ry*Math.sin(turn)},
      direction:{x:side*rx*Math.sin(turn),y:-ry*Math.cos(turn)}};
  }

  function routeFraction(s,route,phase){
    if(!s.timedRoutes)return (1-Math.cos(phase*Math.PI*2))/2;
    const begin=route[4]??0,end=route[5]??1;
    return Math.max(0,Math.min(1,(phase-begin)/(end-begin)));
  }

  function drawDevelopingRoutes(s,left,right,defenders,phase,m,showGuide=true){
    if(!s.routes)return;
    for(const route of s.routes){
      const [team,who,px,py]=route,progress=routeFraction(s,route,phase);
      const skater=team==='blue'?(who==='left'?left:right):defenders[who];
      if(!skater)continue;
      const start={x:skater.x,y:skater.y},end={x:px*m.w,y:py*m.h};
      const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy);
      if(length<8)continue;
      if(showGuide){
        ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle=team==='blue'?'#267dda':'#ce6060';
        ctx.lineWidth=2.5;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();
        ctx.setLineDash([]);ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();
        ctx.moveTo(end.x,end.y);ctx.lineTo(end.x-dx/length*10-dy/length*5,end.y-dy/length*10+dx/length*5);
        ctx.lineTo(end.x-dx/length*10+dy/length*5,end.y-dy/length*10-dx/length*5);ctx.fill();ctx.restore();
      }
      skater.x+=dx*progress;skater.y+=dy*progress;
    }
  }

  function shotBlockerAtDecision(s,m,routePhase){
    const defenders=scenarioDefenders(s,m);
    const leftSpot=s.teammates?.[0]||[s.answer==='left'?.17:.22,.45];
    const rightSpot=s.teammates?.[1]||[s.answer==='right'?.83:.78,.45];
    const left={x:m.w*leftSpot[0],y:m.h*leftSpot[1]};
    const right={x:m.w*rightSpot[0],y:m.h*rightSpot[1]};
    drawDevelopingRoutes(s,left,right,defenders,routePhase,m,false);
    const carrier=s.carrier||[.5,.76];
    const start=playerPuckPosition({x:m.w*carrier[0],y:m.h*carrier[1]},0);
    return shotLaneBlocker(defenders,start,{x:m.cx+8,y:m.h*.095+16});
  }

  function drawGame(t) {
    if(state.mode==='bonus'){
      drawBonusGame(t);
      raf=requestAnimationFrame(drawGame);
      return;
    }
    resizeCanvas();
    const m=rinkMetrics(); drawRink(m); drawNet(m);
    const gameTime=state.paused&&state.pausedAt?state.pausedAt:t;
    const phase=((gameTime-state.animStart)%2200)/2200;
    const s=state.scenario || scenarios[0];
    const carrierPuckPosition=playerPuckPosition;
    const carrierSpot=s.carrier||[.5,.76];
    const puck={x:m.w*carrierSpot[0],y:m.h*carrierSpot[1]};
    const leftVisible=teammateVisible(s,'left');
    const rightVisible=teammateVisible(s,'right');
    const leftSpot=s.teammates?.[0]||[s.answer==='left'?.17:.22,.45];
    const rightSpot=s.teammates?.[1]||[s.answer==='right'?.83:.78,.45];
    const left={x:m.w*leftSpot[0],y:m.h*leftSpot[1]};
    const right={x:m.w*rightSpot[0],y:m.h*rightSpot[1]};
    const goalY=m.h*.095;
    const defenders=scenarioDefenders(s,m);
    const routePhase=s.timedRoutes
      ?(state.action?.routeProgress??(state.active?1-state.timeLeft/state.duration:0))
      :(((state.action?.start??gameTime)-state.animStart)%2200)/2200;
    drawDevelopingRoutes(s,left,right,defenders,routePhase,m);

    let carrier={...puck},carrierAngle=0,carrierScale=1.08,carrierFallen=0,fallenAngle=0,movingPuck=null,previousPuck=null,puckOpacity=1;
    let actionRaw=0;
    let goalieOffset=s.goalie*m.w*.09,goalieAngle=0,goalieScale=1,goaliePose='ready',goaliePoseBlend=0,leftAngle=-.08,rightAngle=.08;
    let movingOpponent=null,movingOpponentIndex=-1,impact=null,impactProgress=0,looseStick=null,saveFlash=null,saveProgress=0,goalFlash=null,goalProgress=0,celebrationProgress=0;
    if(state.action){
      const raw=Math.min(1,(gameTime-state.action.start)/state.action.duration),progress=easeInOut(raw);
      actionRaw=raw;
      const {choice,outcome,good}=state.action;
      if(good&&choice!=='regroup'){
        const celebrationStart=choice==='shoot'?.7:choice==='left'||choice==='right'?.84:.9;
        celebrationProgress=segment(raw,celebrationStart,1);
      }
      if(good&&(choice==='left'||choice==='right')){
        const start=carrierPuckPosition(puck,0);
        const target=choice==='left'?left:right;
        const goal={x:m.cx+(choice==='left'?m.w*.045:-m.w*.045),y:m.h*.027};
        const receiverAngle=skaterAngle({x:goal.x-target.x,y:goal.y-target.y},'blue');
        if(choice==='left')leftAngle=receiverAngle;else rightAngle=receiverAngle;
        const receive=playerPuckPosition(target,receiverAngle,'blue');
        if(raw<.42){
          const p=segment(raw,0,.42);movingPuck=pointLerp(start,receive,p);previousPuck=pointLerp(start,receive,Math.max(0,p-.1));
        } else if(raw<.54){
          movingPuck=receive;previousPuck=null;
        } else {
          const p=segment(raw,.54,.93);movingPuck=pointLerp(receive,goal,p);previousPuck=pointLerp(receive,goal,Math.max(0,p-.1));
          const goalieTarget=choice==='left'?-m.w*.065:m.w*.065;
          goalieOffset=lerp(s.goalie*m.w*.09,goalieTarget,segment(raw,.48,.82));goalieAngle=choice==='left'?-0.16:0.16;goalieScale=1.06;
          goaliePose=goaliePoseForShot(goal.x,m.cx+goalieOffset);goaliePoseBlend=segment(raw,.56,.82);
          if(raw>.84){goalFlash=goal;goalProgress=segment(raw,.84,1);}
          if(raw>.97)puckOpacity=1-(raw-.97)/.03;
        }
      } else if(good&&choice==='shoot'){
        const releaseAt=.22,glideEnd=.34,shotSpot={x:lerp(puck.x,m.cx,.08),y:puck.y-m.h*.045};
        const approach={x:shotSpot.x-puck.x,y:shotSpot.y-puck.y};
        const approachAngle=skaterAngle(approach,'orange');
        const glideProgress=easeInOut(segment(raw,0,glideEnd));
        carrier=pointLerp(puck,shotSpot,glideProgress);carrierAngle=approachAngle;
        if(raw<releaseAt){
          movingPuck=carrierPuckPosition(carrier,carrierAngle);
        } else {
          const releaseProgress=easeInOut(segment(releaseAt,0,glideEnd));
          const releaseSpot=pointLerp(puck,shotSpot,releaseProgress);
          const start=carrierPuckPosition(releaseSpot,approachAngle),target={x:m.cx-s.goalie*m.w*.075,y:m.h*.055};
          const shotProgress=segment(raw,releaseAt,.68);movingPuck=pointLerp(start,target,shotProgress);previousPuck=pointLerp(start,target,Math.max(0,shotProgress-.1));
          goaliePose=goaliePoseForShot(target.x,m.cx+goalieOffset);goaliePoseBlend=segment(raw,.3,.62);
          if(raw>.66){goalFlash=target;goalProgress=segment(raw,.66,.94);}
          if(raw>.7)puckOpacity=Math.max(0,1-segment(raw,.7,.8));
        }
        goalieAngle=s.goalie*.18;goalieScale=1.06;
      } else if(good&&choice==='rush') {
        const lane=s.rush||'centre';
        if(lane==='centre'){
          const fake={x:m.cx-m.w*.085,y:m.h*.42},finish={x:m.cx+m.w*.09,y:m.h*.17};
          if(raw<.42){
            const p=segment(raw,0,.42),control={x:m.cx-m.w*.015,y:m.h*.58};
            carrier=quadraticPoint(puck,control,fake,p);
            carrierAngle=skaterAngle(quadraticDirection(puck,control,fake,p),'orange');
            goalieOffset=lerp(0,-m.w*.045,segment(raw,.12,.42));
            movingPuck=carrierPuckPosition(carrier,carrierAngle);
          } else if(raw<.82){
            const p=segment(raw,.42,.82),control={x:m.cx-m.w*.13,y:m.h*.29};
            carrier=quadraticPoint(fake,control,finish,p);
            carrierAngle=skaterAngle(quadraticDirection(fake,control,finish,p),'orange');
            goalieOffset=lerp(-m.w*.045,-m.w*.08,segment(raw,.42,.7));goalieAngle=-.2;goalieScale=1.06;
            movingPuck=carrierPuckPosition(carrier,carrierAngle);
          } else {
            const shotStart=carrierPuckPosition(finish,skaterAngle({x:finish.x-fake.x,y:finish.y-fake.y},'orange'));
            const goal={x:m.cx+m.w*.025,y:m.h*.025},shotProgress=segment(raw,.82,.97);
            carrier=finish;carrierAngle=skaterAngle({x:finish.x-fake.x,y:finish.y-fake.y},'orange');
            goalieOffset=-m.w*.08;goalieAngle=-.2;goalieScale=1.06;
            movingPuck=pointLerp(shotStart,goal,shotProgress);previousPuck=pointLerp(shotStart,goal,Math.max(0,shotProgress-.1));
            goaliePose=goaliePoseForShot(goal.x,m.cx+goalieOffset);goaliePoseBlend=segment(raw,.8,.94);
            if(raw>.93){goalFlash=goal;goalProgress=segment(raw,.93,1);}
            if(raw>.98)puckOpacity=1-(raw-.98)/.02;
          }
        } else {
          const side=lane==='left'?-1:1;
          const wide={x:m.cx+side*m.w*.36,y:m.h*.34};
          const cut={x:m.cx+side*m.w*.13,y:m.h*.17};
          if(raw<.44){
            const p=segment(raw,0,.44),control={x:m.cx+side*m.w*.32,y:m.h*.59};
            carrier=quadraticPoint(puck,control,wide,p);
            carrierAngle=skaterAngle(quadraticDirection(puck,control,wide,p),'orange');
            movingPuck=carrierPuckPosition(carrier,carrierAngle);
          } else if(raw<.79){
            const p=segment(raw,.44,.79),control={x:m.cx+side*m.w*.37,y:m.h*.2};
            carrier=quadraticPoint(wide,control,cut,p);
            carrierAngle=skaterAngle(quadraticDirection(wide,control,cut,p),'orange');
            movingPuck=carrierPuckPosition(carrier,carrierAngle);
            goalieOffset=lerp(s.goalie*m.w*.09,side*m.w*.065,segment(raw,.52,.79));goalieAngle=side*.16;goalieScale=1.05;
          } else {
            const approachAngle=skaterAngle({x:cut.x-wide.x,y:cut.y-wide.y},'orange');
            const shotStart=carrierPuckPosition(cut,approachAngle),goal={x:m.cx-side*m.w*.06,y:m.h*.025};
            const shotProgress=segment(raw,.79,.97);
            carrier=cut;carrierAngle=approachAngle;goalieOffset=side*m.w*.065;goalieAngle=side*.16;goalieScale=1.05;
            movingPuck=pointLerp(shotStart,goal,shotProgress);previousPuck=pointLerp(shotStart,goal,Math.max(0,shotProgress-.1));
            goaliePose=goaliePoseForShot(goal.x,m.cx+goalieOffset);goaliePoseBlend=segment(raw,.8,.93);
            if(raw>.91){goalFlash=goal;goalProgress=segment(raw,.91,1);}
            if(raw>.98)puckOpacity=1-(raw-.98)/.02;
          }
        }
      } else if(choice==='regroup') {
        // One closed loop: begin toward the net, curl inward around pressure,
        // skate behind the start point, and finish facing the net again.
        const {position,direction}=regroupLoop(puck,m,progress);
        carrier=position;
        carrierAngle=skaterAngle(direction,'orange');
        movingPuck=carrierPuckPosition(carrier,carrierAngle);
      } else if(outcome==='shot-blocked') {
        const start=carrierPuckPosition(puck,0);
        const index=state.action.shotBlockerIndex;
        const blocker=defenders[index];
        const receive=state.action.shotBlockerHit;
        movingOpponentIndex=index;
        if(raw<.16){
          movingPuck=start;
        } else if(raw<.46){
          const p=segment(raw,.16,.46);movingPuck=pointLerp(start,receive,p);
          previousPuck=pointLerp(start,receive,Math.max(0,p-.1));
          movingOpponent={position:blocker,angle:0,label:'4'};
        } else {
          const p=segment(raw,.46,1),side=blocker.x<m.cx?-1:1;
          const exit={x:m.cx-side*m.w*.2,y:m.h*1.08};
          const control={x:blocker.x+side*m.w*.18,y:m.h*.72};
          const position=quadraticPoint(blocker,control,exit,p);
          const direction=quadraticDirection(blocker,control,exit,p);
          const angle=skaterAngle(direction,'white');
          movingOpponent={position,angle,label:'4'};movingPuck=playerPuckPosition(position,angle,'white');
        }
      } else if(outcome==='goalie-easy-save') {
        const start=carrierPuckPosition(puck,0),shuffle=segment(raw,0,.55);
        goalieOffset=lerp(s.goalie*m.w*.09,0,shuffle);goalieScale=1+Math.sin(Math.min(1,raw/.7)*Math.PI)*.06;
        const save={x:m.cx+goalieOffset+8,y:goalY+16};
        goaliePose='butterfly';goaliePoseBlend=segment(raw,.28,.66);
        const p=segment(raw,.16,.72);movingPuck=pointLerp(start,save,p);
        previousPuck=raw<.16?null:pointLerp(start,save,Math.max(0,p-.1));
        if(raw>.72){movingPuck=save;saveFlash=save;saveProgress=segment(raw,.72,1);}
      } else if(outcome==='empty-pass') {
        const start=carrierPuckPosition(puck,0),side=choice==='left'?-1:1;
        const corner={x:side<0?m.pad+m.w*.035:m.w-m.pad-m.w*.035,y:m.h*.12};
        const control={x:m.cx+side*m.w*.3,y:m.h*.43},p=segment(raw,0,.88);
        movingPuck=quadraticPoint(start,control,corner,p);previousPuck=quadraticPoint(start,control,corner,Math.max(0,p-.08));
        if(raw>.88)puckOpacity=1-segment(raw,.88,1)*.35;
      } else if(outcome==='pass-intercepted') {
        const start=carrierPuckPosition(puck,0),target=choice==='left'?left:right;
        const index=closestDefender(defenders,puck),base=index>=0?defenders[index]:{x:m.cx,y:m.h*.37};
        const meeting=pointLerp(puck,target,.62);
        movingOpponentIndex=index;
        if(raw<.4){
          const puckProgress=segment(raw,0,.4),skateProgress=segment(raw,0,.38);
          movingPuck=pointLerp(start,meeting,puckProgress);previousPuck=pointLerp(start,meeting,Math.max(0,puckProgress-.1));
          const position=pointLerp(base,meeting,skateProgress),direction={x:meeting.x-base.x,y:meeting.y-base.y};
          movingOpponent={position,angle:skaterAngle(direction,'white'),label:'5'};
        } else {
          const p=segment(raw,.4,1),side=meeting.x<m.cx?-1:1;
          const exit={x:m.cx-side*m.w*.18,y:m.h*1.08};
          const control={x:meeting.x+side*m.w*.2,y:m.h*.72};
          const position=quadraticPoint(meeting,control,exit,p),direction=quadraticDirection(meeting,control,exit,p);
          const angle=skaterAngle(direction,'white');
          movingOpponent={position,angle,label:'5'};movingPuck=playerPuckPosition(position,angle,'white');
        }
      } else if(outcome==='rush-bodycheck') {
        const index=closestDefender(defenders,{x:m.cx,y:m.h*.48});
        const checker=index>=0?defenders[index]:{x:m.cx+m.w*.07,y:m.h*.43};
        const collision={x:lerp(puck.x,checker.x,.72),y:lerp(puck.y,checker.y,.72)};
        movingOpponentIndex=index;
        if(raw<.48){
          const p=segment(raw,0,.48),direction={x:collision.x-puck.x,y:collision.y-puck.y};
          carrier=pointLerp(puck,collision,p);carrierAngle=skaterAngle(direction,'orange');
          const defenderPosition=pointLerp(checker,collision,segment(raw,.12,.48));
          const checkingDirection={x:collision.x-checker.x,y:collision.y-checker.y};
          movingOpponent={position:defenderPosition,angle:skaterAngle(checkingDirection,'white'),label:'6'};movingPuck=carrierPuckPosition(carrier,carrierAngle);
        } else {
          const p=segment(raw,.48,1),side=collision.x<m.cx?-1:1;
          const impactAngle=skaterAngle({x:collision.x-puck.x,y:collision.y-puck.y},'orange');
          const exit={x:side<0?m.w*.14:m.w*.86,y:Math.min(m.h*.89,collision.y+m.h*.24)};
          carrier=pointLerp(collision,exit,p);
          carrierAngle=lerp(impactAngle,impactAngle+side*Math.PI*.55,Math.min(1,p*1.3));carrierScale=lerp(1.08,.96,p);
          carrierFallen=segment(raw,.72,.88);fallenAngle=impactAngle+side*.35;
          movingOpponent={position:collision,angle:side*.18,label:'6'};
          movingPuck={x:collision.x-side*m.w*.16*p,y:collision.y+m.h*.1*p};
          impact=collision;impactProgress=segment(raw,.48,.82);
          looseStick={position:{x:collision.x-side*m.w*.34*p,y:collision.y-m.h*.2*p},angle:-side*p*Math.PI*4,opacity:1-p*.25};
        }
      } else if(outcome==='rush-goalie-recovery') {
        const approach={x:m.cx+s.goalie*m.w*.025,y:m.h*.19},p=segment(raw,0,.72);
        const control={x:lerp(puck.x,approach.x,.5),y:m.h*.44};
        carrier=quadraticPoint(puck,control,approach,p);
        const direction=quadraticDirection(puck,control,approach,p);carrierAngle=skaterAngle(direction,'orange');
        goalieOffset=lerp(s.goalie*m.w*.09,0,segment(raw,.08,.76));
        if(raw<.74)movingPuck=carrierPuckPosition(carrier,carrierAngle);
        else {
          const start=carrierPuckPosition(approach,carrierAngle),save={x:m.cx+8,y:goalY+17},saveP=segment(raw,.74,.93);
          movingPuck=pointLerp(start,save,saveP);previousPuck=pointLerp(start,save,Math.max(0,saveP-.1));
          goalieAngle=-s.goalie*.18;goalieScale=1.08;goaliePose='butterfly';goaliePoseBlend=segment(raw,.74,.91);
          if(raw>.9){movingPuck=save;saveFlash=save;saveProgress=segment(raw,.9,1);}
        }
      }
      if(celebrationProgress>0){
        const hop=Math.sin(celebrationProgress*Math.PI*4)*(1-celebrationProgress*.45);
        if(choice==='left'||choice==='right'){
          const celebrating=choice==='left'?left:right;celebrating.y-=m.h*.035*celebrationProgress;celebrating.x+=(choice==='left'?1:-1)*m.w*.035*celebrationProgress;
          if(choice==='left')leftAngle+=hop*.48;else rightAngle+=hop*.48;
        } else {
          carrier.y-=m.h*.026*celebrationProgress;carrier.x+=Math.sin(celebrationProgress*Math.PI*2)*m.w*.022;carrierAngle+=hop*.55;carrierScale=1.08+Math.sin(celebrationProgress*Math.PI)*.14;
        }
      }
    }
    if(state.active && !state.locked && state.levelIndex<8) {
      const guideStrength=state.levelIndex<4?.28:.13;
      if(leftVisible) drawLane(puck.x,puck.y,left.x,left.y,s.answer==='left',guideStrength);
      if(rightVisible) drawLane(puck.x,puck.y,right.x,right.y,s.answer==='right',guideStrength);
      drawLane(puck.x,puck.y,m.cx,goalY,s.answer==='shoot',guideStrength*.78);
    }
    // Subtle shuffling keeps the goalie alive between shots. It fades as a
    // committed save pose takes over so the movement remains controlled.
    const idleWeight=1-goaliePoseBlend,idleShift=Math.sin(phase*Math.PI*2)*m.w*.004*idleWeight;
    goalieAngle+=Math.sin(phase*Math.PI*2+.8)*.025*idleWeight;
    goalie(m.cx,goalY,goalieOffset+idleShift,goalieAngle,goalieScale,goaliePose,goaliePoseBlend);
    const receiver=state.action?.good&&(state.action.choice==='left'||state.action.choice==='right')?state.action.choice:null;
    const teammateMotion=side=>{
      if(receiver===side){
        if(actionRaw<.37)return {kind:'ready',raw:0};
        return {kind:'shoot',raw:clamp((actionRaw-.37)/.53)};
      }
      return {kind:'ready',raw:0};
    };
    if(leftVisible){const motion=teammateMotion('left');animatedTeammate(left.x,left.y,'7',leftAngle,1,motion.kind,motion.raw);}
    if(rightVisible){const motion=teammateMotion('right');animatedTeammate(right.x,right.y,'9',rightAngle,1,motion.kind,motion.raw);}
    defenders.forEach((d,i)=>{if(i!==movingOpponentIndex)player(d.x,d.y,'white',String(i+2),0,.95);});
    if(movingOpponent)player(movingOpponent.position.x,movingOpponent.position.y,'white',movingOpponent.label,movingOpponent.angle,.95);
    animatedPlayer(carrier.x,carrier.y,carrierAngle,carrierScale,state.action,actionRaw,phase,celebrationProgress,1-carrierFallen);
    fallenPlayer(carrier.x,carrier.y,fallenAngle,1,carrierFallen);
    if(movingPuck) drawPuckMotion(movingPuck,previousPuck,puckOpacity);
    else drawPuckMotion(carrierPuckPosition(puck,0));
    if(impact)drawImpact(impact,impactProgress);
    if(looseStick)drawLooseStick(looseStick.position,looseStick.angle,looseStick.opacity);
    if(saveFlash)drawSaveFlash(saveFlash,saveProgress);
    if(goalFlash)drawGoalFlash(goalFlash,goalProgress);
    drawGoalCelebration(m,celebrationProgress,state.streak);
    raf=requestAnimationFrame(drawGame);
  }

  function getAudioContext() {
    if(!state.sound) return null;
    const AudioEngine=window.AudioContext||window.webkitAudioContext;
    if(!AudioEngine) return null;
    if(!audioCtx){audioCtx=new AudioEngine();preloadHockeySounds(audioCtx);}
    if(audioCtx.state==='suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(startFrequency,endFrequency,duration,volume=.05,type='sine',delay=0) {
    const audio=getAudioContext();if(!audio)return;
    const start=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();
    o.type=type;o.frequency.setValueAtTime(startFrequency,start);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);
    g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(volume,start+.025);
    g.gain.exponentialRampToValueAtTime(.001,start+duration);
    o.connect(g).connect(audio.destination);o.start(start);o.stop(start+duration+.02);
  }

  const midiFrequency=note=>440*Math.pow(2,(note-69)/12);
  const arenaOrganBlueprints=[
    {
      name:'Rink Rally',beatMs:178,quality:'major',
      roots:[48,48,53,55,48,57,53,55,48,53,55,48,57,53,55,48,48,53,55,57,53,55,48,48],
      riff:[12,16,19,24,19,16,14,19,12,16,21,19,17,16,14,12]
    },
    {
      name:'Blue-Line Boogie',beatMs:188,quality:'dominant',swing:true,
      roots:[50,50,55,50,57,55,50,57,50,55,57,50,59,57,55,50,50,55,50,57,55,57,50,50],
      riff:[12,15,19,21,22,21,19,15,12,null,19,22,24,22,19,17]
    },
    {
      name:'Power-Play Parade',beatMs:166,quality:'major',staccato:true,
      roots:[53,53,58,60,53,57,58,60,53,58,60,57,53,55,57,60,53,58,55,60,57,58,60,53],
      riff:[24,19,17,19,21,17,14,17,24,21,19,17,21,24,19,null]
    },
    {
      name:'Overtime Charge',beatMs:154,quality:'major',
      roots:[52,57,59,52,57,59,61,52,52,59,57,61,52,57,59,64,52,54,57,59,61,59,57,52],
      riff:[12,16,19,23,16,19,23,28,19,23,28,31,28,23,19,16]
    }
  ];

  function buildArenaOrganTrack(blueprint){
    const chordIntervals=blueprint.quality==='dominant'?[0,4,7,10]:[0,4,7];
    const steps=[];
    blueprint.roots.forEach((root,bar)=>{
      for(let beat=0;beat<4;beat++){
        const index=bar*4+beat,leadOffset=blueprint.riff[index%blueprint.riff.length];
        const chordRoot=root+12+(beat===3&&bar%4===3?2:0);
        steps.push({
          bass:midiFrequency(root+(beat%2?7:0)),
          chord:chordIntervals.map(interval=>midiFrequency(chordRoot+interval)),
          lead:leadOffset===null?null:midiFrequency(root+leadOffset+(bar%8>=4&&beat===3?12:0)),
          accent:beat===0?1.18:beat===2?1.05:.88
        });
      }
    });
    return {...blueprint,steps};
  }
  const arenaOrganTracks=arenaOrganBlueprints.map(buildArenaOrganTrack);

  function playOrganStep(step,track) {
    const audio=getAudioContext();if(!audio||!state.active||!state.sound||!step)return;
    const start=audio.currentTime,seconds=track.beatMs/1000,filter=audio.createBiquadFilter();
    filter.type='lowpass';filter.frequency.value=track.name==='Overtime Charge'?2850:2500;filter.Q.value=.75;filter.connect(audio.destination);
    const voices=[
      {frequency:step.bass,type:'square',volume:.0068,duration:seconds*.8},
      ...step.chord.map(frequency=>({frequency,type:'triangle',volume:.0046,duration:seconds*(track.staccato?.48:.72)})),
      ...(step.lead?[{frequency:step.lead,type:'square',volume:.0048,duration:seconds*(track.staccato?.52:.66)}]:[])
    ];
    voices.forEach((voice,index)=>{
      const oscillator=audio.createOscillator(),gain=audio.createGain(),peak=voice.volume*step.accent;
      oscillator.type=voice.type;oscillator.frequency.value=voice.frequency;
      if(index===voices.length-1&&step.lead){const vibrato=audio.createOscillator(),depth=audio.createGain();vibrato.frequency.value=5.5;depth.gain.value=2.1;vibrato.connect(depth).connect(oscillator.frequency);vibrato.start(start);vibrato.stop(start+voice.duration+.02);}
      gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(peak,start+.012);
      gain.gain.setValueAtTime(peak,start+Math.max(.018,voice.duration-.045));gain.gain.exponentialRampToValueAtTime(.001,start+voice.duration);
      oscillator.connect(gain).connect(filter);oscillator.start(start);oscillator.stop(start+voice.duration+.025);
    });
  }

  function shuffledTrackOrder(previous=-1){
    const order=arenaOrganTracks.map((_,index)=>index);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    if(order[0]===previous)[order[0],order[1]]=[order[1],order[0]];
    return order;
  }

  function startArenaMusic(reset=true) {
    stopArenaMusic();
    if(reset||arenaMusicTrackIndex<0){arenaMusicTrackOrder=shuffledTrackOrder();arenaMusicTrackIndex=arenaMusicTrackOrder.shift();arenaMusicStep=0;}
    const generation=arenaMusicGeneration;
    const playNext=()=>{
      if(generation!==arenaMusicGeneration||!state.active||state.paused)return;
      const track=arenaOrganTracks[arenaMusicTrackIndex];
      if(arenaMusicStep>=track.steps.length){
        const previous=arenaMusicTrackIndex;
        if(!arenaMusicTrackOrder.length)arenaMusicTrackOrder=shuffledTrackOrder(previous);
        arenaMusicTrackIndex=arenaMusicTrackOrder.shift();arenaMusicStep=0;
        arenaMusicTimer=setTimeout(playNext,700);return;
      }
      if(state.sound)playOrganStep(track.steps[arenaMusicStep],track);
      const swingScale=track.swing?(arenaMusicStep%2?.76:1.24):1;
      arenaMusicStep++;arenaMusicTimer=setTimeout(playNext,Math.round(track.beatMs*swingScale));
    };
    playNext();
  }

  function stopArenaMusic() {
    arenaMusicGeneration++;
    if(arenaMusicTimer!==null){clearTimeout(arenaMusicTimer);arenaMusicTimer=null;}
  }

  function playNoise(duration,volume=.04,frequency=900,delay=0,type='bandpass') {
    const audio=getAudioContext();if(!audio)return;
    const start=audio.currentTime+delay,length=Math.max(1,Math.floor(audio.sampleRate*duration));
    const buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length*.35);
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
    source.buffer=buffer;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.8;
    gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.025);
    gain.gain.exponentialRampToValueAtTime(.001,start+duration);
    source.connect(filter).connect(gain).connect(audio.destination);source.start(start);source.stop(start+duration+.02);
  }

  // Load the short rink recordings only after a player enables audio. This keeps
  // the initial screen fast and lets iOS unlock Web Audio during a tap.
  const hockeySoundFiles={shot:'puck-shot.mp3',pass:'puck-pass.mp3',receive:'puck-receive.mp3',skate:'fast-skating.mp3',bodycheck:'bodycheck.mp3'};
  const hockeySounds={};
  function preloadHockeySounds(audio){
    Object.entries(hockeySoundFiles).forEach(([kind,file])=>{
      fetch(new URL(`assets/sounds/${file}`,powerUpAssetBase))
        .then(response=>{if(!response.ok)throw new Error(`Audio ${response.status}`);return response.arrayBuffer();})
        .then(bytes=>audio.decodeAudioData(bytes))
        .then(buffer=>{hockeySounds[kind]=buffer;})
        .catch(()=>{/* Keep the generated sound if a recording cannot load. */});
    });
  }
  function playHockeySound(kind,durationMs){
    const buffer=hockeySounds[kind];if(!buffer)return false;
    const audio=getAudioContext();if(!audio||!state.sound)return false;
    const source=audio.createBufferSource(),gain=audio.createGain(),start=audio.currentTime;
    const duration=kind==='skate'?Math.max(.15,durationMs/1000):buffer.duration;
    source.buffer=buffer;source.loop=kind==='skate'&&duration>buffer.duration;
    gain.gain.setValueAtTime(.001,start);
    gain.gain.linearRampToValueAtTime(kind==='skate'?.42:kind==='shot'?.72:.58,start+.025);
    gain.gain.setValueAtTime(kind==='skate'?.42:kind==='shot'?.72:.58,start+Math.max(.03,duration-.09));
    gain.gain.linearRampToValueAtTime(.001,start+duration);
    source.connect(gain).connect(audio.destination);source.start(start);
    source.stop(start+duration+.01);
    return true;
  }

  function playSkating(durationMs) {
    if(playHockeySound('skate',durationMs))return;
    const audio=getAudioContext();if(!audio)return;
    const duration=Math.max(.25,durationMs/1000),start=audio.currentTime;
    const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.12),audio.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
    source.buffer=buffer;source.loop=true;filter.type='highpass';filter.frequency.value=1250;
    gain.gain.setValueAtTime(.012,start);
    for(let time=0;time<duration;time+=.18){gain.gain.linearRampToValueAtTime(.05,start+Math.min(duration,time+.07));gain.gain.linearRampToValueAtTime(.012,start+Math.min(duration,time+.16));}
    gain.gain.linearRampToValueAtTime(.001,start+duration);
    source.connect(filter).connect(gain).connect(audio.destination);source.start(start);source.stop(start+duration+.02);
  }

  function playPuckKnock() {
    if(!playHockeySound('shot')){playNoise(.07,.11,620,0,'bandpass');playTone(145,82,.1,.08,'square');}
  }
  function playPassSound(){if(!playHockeySound('pass'))playPuckKnock();}
  function playReceiveSound(){if(!playHockeySound('receive'))playPuckKnock();}

  function playCheer() {
    playNoise(.7,.045,1250,0,'bandpass');
    [[380,720,0],[470,850,.06],[560,980,.12]].forEach(([start,end,delay])=>playTone(start,end,.55,.035,'sawtooth',delay));
  }

  function playGoalCelebrationSound() {
    playTone(185,185,.52,.055,'sawtooth');playTone(233,233,.52,.045,'sawtooth');playTone(277,277,.52,.04,'sawtooth');
    setTimeout(playCheer,130);setTimeout(()=>playNoise(.8,.055,1450,0,'bandpass'),360);
  }

  function playAww() {
    playNoise(.55,.025,430,0,'lowpass');
    [[260,145,0],[220,118,.04],[185,96,.09]].forEach(([start,end,delay])=>playTone(start,end,.58,.035,'triangle',delay));
  }

  function playBonusDing() {
    playTone(880,1320,.34,.085,'sine');playTone(1760,1980,.24,.035,'triangle',.025);
  }

  function playBonusBuzzer() {
    playTone(155,105,.52,.065,'sawtooth');playTone(110,78,.52,.04,'square',.015);
  }

  function playBodycheckImpact() {
    if(!playHockeySound('bodycheck'))playNoise(.12,.1,340,.2,'bandpass');
  }

  function playBodycheckOh() {
    playTone(285,105,.75,.075,'sine');playTone(570,210,.7,.025,'triangle',.02);
  }

  function playDecisionSounds(choice,good,outcome,actionDuration,scenario) {
    if(!state.sound||choice==='timeout') return;
    if(choice==='left'||choice==='right')playPassSound();
    if(choice==='shoot'&&!good)setTimeout(playPuckKnock,Math.round(actionDuration*.16));
    if(choice==='left'||choice==='right')setTimeout(playReceiveSound,Math.round(actionDuration*.54));
    if(good&&choice==='shoot')setTimeout(playPuckKnock,Math.round(actionDuration*.22));
    if(good&&choice==='rush')setTimeout(playPuckKnock,Math.round(actionDuration*(scenario.rush==='centre'?.82:.79)));
    const skatingOutcome=['shot-blocked','goalie-easy-save','pass-intercepted','rush-bodycheck','rush-goalie-recovery'].includes(outcome);
    if(choice==='rush'||choice==='regroup'||skatingOutcome||(good&&choice==='shoot')){
      const skateDuration=good&&choice==='shoot'?actionDuration*.34:outcome==='rush-bodycheck'?actionDuration*.48:outcome==='goalie-easy-save'?actionDuration*.58:actionDuration*.88;
      playSkating(skateDuration);
    }
    if(good){
      const delay=choice==='rush'?Math.round(actionDuration*.9):choice==='left'||choice==='right'?Math.round(actionDuration*.84):choice==='shoot'?Math.round(actionDuration*.68):280;
      setTimeout(choice==='regroup'?playCheer:playGoalCelebrationSound,delay);
    } else {
      setTimeout(playAww,180);
      if(outcome==='rush-bodycheck'){
        // The recording starts with a brief approach; its hit lands at the collision pose.
        setTimeout(playBodycheckImpact,Math.round(actionDuration*.39));
        setTimeout(playBodycheckOh,Math.round(actionDuration*.48));
      }
    }
  }

  function clearBonusTimers(){bonusTimers.forEach(clearTimeout);bonusTimers=[];bonusRunToken++;}
  function scheduleBonus(callback,delay){const token=bonusRunToken,id=setTimeout(()=>{bonusTimers=bonusTimers.filter(timer=>timer!==id);if(token===bonusRunToken)callback();},delay);bonusTimers.push(id);return id;}

  function playBonusIntroSound(){
    playTone(220,440,.22,.05,'square');playTone(330,660,.3,.045,'triangle',.12);playTone(440,880,.42,.04,'sawtooth',.25);setTimeout(playCheer,310);
  }

  function setStandardControls(){ui.standardControls.hidden=false;ui.bonusControls.hidden=true;ui.bonusControls.innerHTML='';ui.bonusControls.className='bonus-controls';canvas.className='';}

  function setBonusControls(bonus){
    ui.standardControls.hidden=true;ui.bonusControls.hidden=false;
    ui.bonusControls.className='bonus-controls ice-direct';
    const instruction=bonus.type==='open-net'?'Flick the puck into the glowing opening':bonus.type==='deflection'?'Drag your blade in front of the puck':'Tap the rebound before it escapes';
    ui.bonusControls.innerHTML=`<div class="ice-instruction"><span class="instruction-mark" aria-hidden="true">★</span><span class="instruction-copy"><small>ON-ICE CHALLENGE</small><strong>${instruction}</strong></span><span class="instruction-speed">REACT FAST</span></div>`;
    canvas.className=`bonus-interactive${bonus.type==='deflection'?' deflection':''}`;
  }

  function setBonusPanel(index){
    const bonus=intermissions[index];
    ui.levelEyebrow.textContent=`INTERMISSION · AFTER LEVEL ${bonus.afterLevel}`;ui.missionTitle.textContent=bonus.title;
    ui.missionCopy.textContent=`${bonus.difficulty} bonus game. It awards Cheese Points and never blocks progress.`;
    ui.skillLabel.textContent=bonus.type==='open-net'?'Find the open space':bonus.type==='deflection'?'Control the blade':'React to the rebound';
    ui.coachText.textContent=bonus.cue;ui.roundText.textContent=`0 / ${bonus.rounds}`;ui.roundProgress.style.width='0%';
  }

  function startIntermission(index,fromProgression=false){
    loadIntermissionAssets();clearBonusTimers();stopArenaMusic();const bonus=intermissions[index];setBonusPanel(index);
    state={...state,mode:'bonus',bonusIndex:index,bonusFromProgression:fromProgression,active:false,locked:true,round:0,total:bonus.rounds,score:0,streak:0,correct:0,elapsedTotal:0,action:null,bonusAnswer:null,bonusChoice:null,bonusResult:null,bonusPhase:'intro',bonusPuck:null,bonusStick:null,bonusStickTarget:null,bonusFlick:null,bonusAimMiss:false,bonusWide:false,bonusMissPoint:null,bonusGoalTarget:null,bonusTapPoint:null,bonusReboundStage:null,bonusReboundTier:null,bonusReactionAt:0,bonusDropAt:0,bonusGoalieFrom:0,bonusGoalieTo:0,bonusGoalieMoveAt:performance.now(),paused:false,pausedAt:0};
    canvas.setAttribute('aria-label',`${bonus.title} intermission reaction game`);ui.startOverlay.classList.remove('finish-mode');ui.startOverlay.classList.add('hidden');ui.standardControls.hidden=true;ui.bonusControls.hidden=true;ui.feedback.className='feedback';ui.powerUpIndicator.hidden=true;ui.lockerButton.disabled=true;updateUI();
    ui.bonusBannerTitle.textContent=bonus.title;ui.bonusBannerCopy.textContent=bonus.type==='open-net'?'Start on the puck. Flick into the gap.':bonus.type==='deflection'?'Track it. Tip it. Score.':'Watch the save. Attack the rebound.';
    ui.bonusBanner.hidden=false;requestAnimationFrame(()=>ui.bonusBanner.classList.add('show'));playBonusIntroSound();
    scheduleBonus(()=>{ui.bonusBanner.classList.remove('show');scheduleBonus(()=>{ui.bonusBanner.hidden=true;beginIntermission();},340);},2200);
  }

  function beginIntermission(){
    const bonus=currentIntermission();state.active=true;state.locked=false;state.round=0;state.total=bonus.rounds;state.animStart=performance.now();state.lastTickAt=state.animStart;
    ui.lockerButton.disabled=false;setBonusControls(bonus);startArenaMusic();updateUI();beginBonusRound();
  }

  function chooseDifferentAnswer(options){
    const available=options.filter(value=>value!==state.bonusLastAnswer),choice=available[Math.floor(Math.random()*available.length)];state.bonusLastAnswer=choice;return choice;
  }

  function beginBonusRound(){
    if(state.round>=state.total){finishBonus();return;}
    const bonus=currentIntermission(),now=performance.now();state.locked=false;state.action=null;state.bonusChoice=null;state.bonusResult=null;state.bonusFlick=null;state.bonusAimMiss=false;state.bonusWide=false;state.bonusMissPoint=null;state.startedAt=now;state.lastTickAt=now;
    const m=rinkMetrics(),side=Math.random()<.5?-1:1;state.bonusGoalTarget={x:m.cx+side*m.w*(.245+Math.random()*.045),y:m.h*(.205+Math.random()*.115)};
    state.bonusGoalieFrom=0;state.bonusGoalieTo=0;state.bonusGoalieMoveAt=now;
    if(bonus.type==='open-net'){
      state.bonusAnswer=chooseDifferentAnswer([0,2,3,5]);state.bonusPhase='live';state.duration=bonus.time;state.timeLeft=bonus.time;ui.timer.textContent=state.timeLeft.toFixed(1);ui.skillLabel.textContent='Flick from the puck';
    } else if(bonus.type==='deflection'){
      const shotSide=chooseDifferentAnswer([-1,1]),contact={x:m.cx+shotSide*m.w*(.18+Math.random()*.045),y:m.h*(.39+Math.random()*.07)},hit={x:m.cx+shotSide*m.w*.035,y:m.h*.47};state.bonusGoalTarget={x:m.cx-shotSide*m.w*(.265+Math.random()*.025),y:m.h*(.205+Math.random()*.08)};state.bonusAnswer='deflect';state.bonusPhase='aim';state.duration=bonus.time;state.timeLeft=bonus.time;state.bonusDropAt=now+720;state.bonusReactionAt=0;state.bonusStickTarget=contact;state.bonusStick={x:m.w*.19,y:m.h*.78};state.bonusPuck={start:{x:m.cx+shotSide*m.w*(.025+Math.random()*.035),y:m.h*.91},end:contact,hit,previous:null};ui.timer.textContent='READY';ui.skillLabel.textContent='Find the glowing blade';
    } else {
      const saveOptions=['pad','blocker','trapper'].filter(pose=>pose!==state.bonusLastSavePose),savePose=saveOptions[Math.floor(Math.random()*saveOptions.length)],saveSide=savePose==='blocker'?-1:savePose==='trapper'?1:side,save={x:m.cx+saveSide*m.w*(savePose==='pad'?.045:.075),y:m.h*(savePose==='pad'?.47:.385+Math.random()*.045)},exitDirection=chooseDifferentAnswer(['left','right','bottom']),lateral=exitDirection==='left'?-1:exitDirection==='right'?1:side,bounce={x:m.cx+lateral*m.w*(.12+Math.random()*.1),y:m.h*(.68+Math.random()*.045)},apex={x:bounce.x+lateral*m.w*(.045+Math.random()*.035),y:bounce.y+m.h*.025},land={x:bounce.x+lateral*m.w*(.1+Math.random()*.055),y:m.h*(.76+Math.random()*.055)},exit=exitDirection==='bottom'?{x:clamp(land.x+lateral*m.w*(.06+Math.random()*.08),m.w*.08,m.w*.92),y:m.h*1.08}:{x:exitDirection==='left'?-m.w*.1:m.w*1.1,y:clamp(land.y+m.h*(Math.random()*.08-.025),m.h*.72,m.h*.9)};state.bonusSavePose=savePose;state.bonusLastSavePose=savePose;state.bonusAnswer='rebound';state.bonusPhase='shot';state.duration=reboundTotalTime/1000;state.timeLeft=0;state.bonusReactionAt=0;state.bonusReboundStage='shot';state.bonusReboundTier=null;state.bonusTapPoint=null;state.bonusPuck={start:{x:m.cx,y:m.h*.91},save,bounce,apex,land,exit,end:bounce};ui.timer.textContent='WATCH';ui.skillLabel.textContent='Watch the save';
    }
  }

  function handleBonusChoice(choice){
    if(state.mode!=='bonus'||!state.active||state.locked)return;
    const bonus=currentIntermission(),now=performance.now();let good=false,result='miss';
    if(bonus.type==='rebound'&&choice!=='timeout'){const motion=reboundPuckPosition(rinkMetrics(),now);if(!motion.tappable)return;state.bonusReboundTier=motion.tier;state.bonusTapPoint={x:motion.x,y:motion.y};state.timeLeft=Math.max(.001,motion.windowRemaining/1000);}
    if(bonus.type==='deflection'&&choice!=='timeout'&&!deflectionStickOnTarget(rinkMetrics()))return;
    if((bonus.type==='rebound'&&state.bonusPhase==='shot')||(bonus.type==='deflection'&&state.bonusPhase==='aim'))return;
    good=choice===state.bonusAnswer&&state.timeLeft>0&&!state.bonusAimMiss;result=good?'good':'miss';
    state.locked=true;state.bonusFlick=null;state.bonusChoice=choice==='timeout'?state.bonusAnswer:choice;state.bonusResult=result;state.action=choice==='timeout'&&(bonus.type==='open-net'||bonus.type==='rebound')?null:{choice:state.bonusChoice,good,start:now,duration:900};
    state.elapsedTotal+=state.bonusReactionAt?Math.max(0,(now-state.bonusReactionAt)/1000):Math.max(0,(now-state.startedAt)/1000);
    let cheeseEarned=0,pointsEarned=0;if(good){state.correct++;state.streak++;const speed=Math.round(state.timeLeft*100),base=bonus.type==='rebound'?(state.bonusReboundTier==='max'?400:175):150+speed;pointsEarned=base+Math.min(180,state.streak*25);state.score+=pointsEarned;cheeseEarned=awardCheese(5+(state.streak%3===0?5:0));playPuckKnock();setTimeout(playBonusDing,90);setTimeout(playCheer,190);}else{state.streak=0;playBonusBuzzer();}
    state.round++;state.bonusPhase='result';
    const missText=bonus.type==='open-net'?(state.bonusWide?'NO GOAL — shot wide':'NO GOAL — goalie save'):bonus.type==='deflection'?'NO GOAL — no deflection':'NO GOAL — puck escaped';
    const reboundResult=state.bonusReboundTier==='max'?'MAX REACTION':'QUICK FINISH';ui.feedback.textContent=good?(bonus.type==='rebound'?`GOAL! ${reboundResult} · +${pointsEarned} points`:`GOAL! +${cheeseEarned} Cheese Points`):choice==='timeout'?(bonus.type==='rebound'?'NO GOAL — puck escaped':'NO GOAL — time expired'):missText;ui.feedback.className=`feedback show ${good?'good':'bad'}`;updateUI();
    scheduleBonus(()=>{ui.feedback.className='feedback';beginBonusRound();},1100);
  }

  function finishBonus(){
    clearBonusTimers();state.active=false;state.locked=true;state.action=null;state.bonusPhase='complete';stopArenaMusic();ui.bonusControls.hidden=true;ui.lockerButton.disabled=false;
    const bonus=currentIntermission(),completionAward=awardCheese(15+state.correct*2),nextIndex=Math.min(levels.length-1,bonus.afterLevel),perfect=state.correct===state.total;
    const celebration=`<div class="finish-confetti" aria-hidden="true">${Array.from({length:36},(_,i)=>`<i style="--x:${(i*29)%100}%;--delay:${(i%9)*.07}s;--spin:${(i%2?1:-1)*(240+i*17)}deg;--colour:${['#ffcf54','#63e6ed','#ff6b35','#87efaf','#ffffff'][i%5]}"></i>`).join('')}</div>`;
    ui.startOverlay.classList.remove('finish-mode');ui.startOverlay.innerHTML=`${celebration}<div class="unlock-banner">Intermission complete</div><div class="score-logo" aria-hidden="true"><span>${state.correct}/${state.total}</span></div><p class="overline">BONUS GAME</p><h2>${perfect?'Perfect bonus!':'Great reactions!'}</h2><p>You scored <strong>${state.score}</strong> and earned a <strong>🧀 ${completionAward}</strong> completion bonus. Your regular level progress is safe.</p><div class="overlay-actions"><button class="primary-button" id="nextButton">Continue to Level ${nextIndex+1} <span>→</span></button><button class="secondary-button" id="levelsButton">Choose a level</button></div>`;
    ui.startOverlay.classList.remove('hidden');document.getElementById('nextButton').addEventListener('click',()=>startGame(nextIndex));document.getElementById('levelsButton').addEventListener('click',showLevelSelect);playGoalCelebrationSound();
  }

  function shuffledScenarios(level) {
    const ids=[...level.scenarios],used=new Set();
    for(const index of freshScenariosByLevel[levels.indexOf(level)]||[]){
      let replace=-1;
      for(let i=ids.length-1;i>=0;i--){if(!used.has(i)&&scenarios[ids[i]].answer===scenarios[index].answer){replace=i;break;}}
      if(replace<0)for(let i=ids.length-1;i>=0;i--){if(!used.has(i)){replace=i;break;}}
      ids[replace]=index;used.add(replace);
    }
    const deck=ids.map(index=>({...scenarios[index]}));
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    if(levels.indexOf(level)<5){
      const arrange=(remaining,result=[])=>{
        if(!remaining.length)return result;
        const blocked=result.length>1&&result.at(-1).answer===result.at(-2).answer?result.at(-1).answer:null;
        const choices=remaining.map((scenario,index)=>({scenario,index})).filter(({scenario})=>scenario.answer!==blocked);
        for(const {scenario,index} of choices){const next=arrange([...remaining.slice(0,index),...remaining.slice(index+1)],[...result,scenario]);if(next)return next;}
        return null;
      };
      return (arrange(deck)||deck).slice(0,level.rounds);
    }
    return deck.slice(0,level.rounds);
  }

  function setLevelPanel(index) {
    const level=levels[index];
    ui.levelEyebrow.textContent=`LEVEL ${index+1}`;ui.missionTitle.textContent=level.title;
    ui.missionCopy.textContent=level.mission;ui.skillLabel.textContent=level.focus;
    ui.roundText.textContent=`0 / ${level.rounds}`;ui.roundProgress.style.width='0%';
  }

  function showLevelSelect() {
    clearBonusTimers();stopArenaMusic();state.active=false;state.locked=true;state.mode='level';state.bonusIndex=null;ui.bonusBanner.classList.remove('show');ui.bonusBanner.hidden=true;setStandardControls();
    const unlocked=unlockedCount(),completed=completedLevelCount(),bonusUnlocked=bonusTestMode?intermissions.length:intermissions.filter(bonus=>completed>=bonus.afterLevel).length;
    ui.lockerButton.disabled=false;
    ui.levelStatus.textContent=`${unlocked} of ${levels.length} levels · ${bonusUnlocked} of ${intermissions.length} bonuses`;
    const levelGrid=`<div class="level-grid" aria-label="Hockey challenges">${levels.map((level,index)=>{const locked=index>=unlocked,complete=index<unlocked-1,targetLabel=index===levels.length-1?'TARGET':'TO ADVANCE';return `<button class="level-card" data-level="${index}" ${locked?'disabled':''}><span class="level-number">LEVEL ${index+1} · ${level.unlock}/${level.rounds} ${targetLabel}</span><strong>${level.title}</strong><small>${level.short}</small><span class="level-state">${locked?'🔒':complete?'✓':'▶'}</span></button>`;}).join('')}</div>`;
    const bonusGrid=`<p class="bonus-heading">INTERMISSION BONUSES</p><div class="bonus-grid" aria-label="Intermission bonus games">${intermissions.map((bonus,index)=>{const locked=!bonusTestMode&&completed<bonus.afterLevel;return `<button class="bonus-card" data-bonus="${index}" ${locked?'disabled':''}><span>AFTER LEVEL ${bonus.afterLevel} · ${bonus.difficulty.toUpperCase()}</span><strong>${bonus.title}</strong><small>${locked?'Complete Level '+bonus.afterLevel:bonus.short}</small></button>`;}).join('')}</div>`;
    const testBadge=bonusTestMode?`<div class="bonus-test-badge">BONUS TEST MODE · ALL ${intermissions.length} UNLOCKED</div>`:'';
    ui.startOverlay.classList.remove('finish-mode');ui.startOverlay.innerHTML=`<img class="cheese-hero-logo" src="assets/top-ches-logo-v44.png" alt=""><p class="overline">${bonusTestMode?'INTERMISSION TEST BENCH':'LEVEL UP YOUR HOCKEY BRAIN'}</p><h2>Choose your<br><em>${bonusTestMode?'bonus game.':'challenge.'}</em></h2><p>${bonusTestMode?'Jump directly into any intermission bonus. Your regular level unlocks stay unchanged.':'Beat the accuracy target to unlock the next level.'}</p>${testBadge}${bonusTestMode?bonusGrid+levelGrid:levelGrid+bonusGrid}`;
    ui.startOverlay.classList.remove('hidden');
    ui.startOverlay.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>startGame(Number(button.dataset.level))));
    ui.startOverlay.querySelectorAll('[data-bonus]').forEach(button=>button.addEventListener('click',()=>startIntermission(Number(button.dataset.bonus),false)));
    setLevelPanel(Math.max(0,unlocked-1));
  }

  function beginRound() {
    if(state.round>=state.total) return finish();
    const level=levels[state.levelIndex];
    state.scenario=state.deck[state.round]; state.reveal=null; state.action=null; state.locked=false;
    state.duration=Math.max(level.minTime,level.time-state.round*.07);state.timeLeft=state.duration;state.startedAt=performance.now();state.lastTickAt=state.startedAt;state.animStart=performance.now();
    choiceButtons.forEach(b=>b.disabled=false);
    ui.skillLabel.textContent=state.scenario.situation||level.focus;
    ui.timer.textContent=state.timeLeft.toFixed(1);
  }

  function startGame(levelIndex=0) {
    clearBonusTimers();const level=levels[levelIndex];setLevelPanel(levelIndex);setStandardControls();ui.bonusBanner.classList.remove('show');ui.bonusBanner.hidden=true;
    canvas.setAttribute('aria-label','Top-down hockey rink showing fully equipped skaters, passing lanes, defenders, and goalie');
    state={...state,mode:'level',bonusIndex:null,active:true,locked:false,round:0,total:level.rounds,levelIndex,score:0,streak:0,correct:0,elapsedTotal:0,reveal:null,action:null,deck:shuffledScenarios(level),paused:false,pausedAt:0};
    ui.startOverlay.classList.remove('finish-mode');ui.startOverlay.classList.add('hidden');ui.feedback.className='feedback';ui.lockerButton.disabled=false;
    updateUI();beginRound();startArenaMusic();
  }

  function decide(choice) {
    if(!state.active||state.locked) return;
    state.locked=true;choiceButtons.forEach(b=>b.disabled=true);
    const elapsed=Math.max(0,(performance.now()-state.startedAt)/1000);state.elapsedTotal+=elapsed;
    const good=choice===state.scenario.answer;
    let cheeseEarned=0;
    if(good) { const scoreTimeLeft=Math.max(0,state.timeLeft-(levels[state.levelIndex].scoreTimeOffset||0)),speed=Math.round(scoreTimeLeft*80);state.streak++;state.correct++;state.score+=100+speed+Math.min(200,state.streak*20);cheeseEarned=awardCheese(10+(state.streak%3===0?5:0)); }
    else state.streak=0;
    const actionStartedAt=performance.now();
    const routeProgress=state.scenario.timedRoutes?Math.max(0,Math.min(1,1-state.timeLeft/state.duration)):null;
    const routePhase=routeProgress??(((actionStartedAt-state.animStart)%2200)/2200);
    const shotBlocker=!good&&choice==='shoot'?shotBlockerAtDecision(state.scenario,rinkMetrics(),routePhase):null;
    let outcome='success';
    if(!good&&choice==='shoot')outcome=shotBlocker?'shot-blocked':'goalie-easy-save';
    else if(!good&&(choice==='left'||choice==='right'))outcome=soloScenario(state.scenario)||state.scenario.rush===choice?'empty-pass':'pass-intercepted';
    else if(!good&&choice==='rush')outcome=state.scenario.answer==='shoot'?'rush-goalie-recovery':'rush-bodycheck';
    const outcomeDurations={
      'shot-blocked':2100,'goalie-easy-save':1550,'empty-pass':2200,'pass-intercepted':2200,
      'rush-bodycheck':2200,'rush-goalie-recovery':2150
    };
    const correctCentreRush=good&&choice==='rush'&&state.scenario.rush==='centre';
    const correctSideRush=good&&choice==='rush'&&state.scenario.rush!=='centre';
    const correctPass=good&&(choice==='left'||choice==='right');
    const correctShoot=good&&choice==='shoot';
    const actionDuration=choice==='timeout'?700:outcomeDurations[outcome]||(choice==='regroup'?1500:correctCentreRush||correctSideRush?2900:choice==='rush'?1200:correctPass?2400:correctShoot?2200:760);
    state.action=choice==='timeout'?null:{choice,outcome,good,start:actionStartedAt,duration:actionDuration,
      routeProgress,shotBlockerIndex:shotBlocker?.index,shotBlockerHit:shotBlocker?.hit};
    state.round++;state.reveal=null;playDecisionSounds(choice,good,outcome,actionDuration,state.scenario);
    const outcomeText={
      'shot-blocked':'Shot blocked — turnover','goalie-easy-save':'Goalie square — easy save',
      'empty-pass':'No teammate — turnover','pass-intercepted':'Pass intercepted',
      'rush-bodycheck':'Lane closed — bodychecked','rush-goalie-recovery':'Goalie recovers — saved'
    };
    const resultText=outcomeText[outcome]||'Nope';
    const streakCallout=state.streak>=10?'UNSTOPPABLE!':state.streak>=5?'ON FIRE!':state.streak===3?'HAT-TRICK READ!':'Great read';
    ui.feedback.textContent=good?`${streakCallout} · +${cheeseEarned} Cheese Points`:choice==='timeout'?'Time — lane closed':`${resultText} · Better option: ${label(state.scenario.answer)}`;
    ui.feedback.className=`feedback show ${good?'good':'bad'}`;
    ui.coachText.textContent=state.scenario.cue;updateUI();
    const completedAction=state.action;
    const advanceWhenReady=()=>{
      if(state.action!==completedAction)return;
      const remaining=completedAction?completedAction.start+completedAction.duration+180-performance.now():0;
      if(state.paused||remaining>20){setTimeout(advanceWhenReady,state.paused?120:Math.min(250,Math.max(30,remaining)));return;}
      ui.feedback.className='feedback';beginRound();
    };
    setTimeout(advanceWhenReady,actionDuration+180);
  }

  function label(choice){return choice==='left'?'pass left':choice==='right'?'pass right':choice==='rush'?'rush':choice==='regroup'?'regroup':'shoot';}
  function updateUI(){
    ui.score.textContent=String(state.score).padStart(4,'0');ui.streak.textContent=`×${state.streak}`;
    ui.roundText.textContent=`${state.round} / ${state.total}`;ui.roundProgress.style.width=`${state.round/state.total*100}%`;
    ui.reads.textContent=state.round;ui.accuracy.textContent=state.round?`${Math.round(state.correct/state.round*100)}%`:'—';
    ui.avgTime.textContent=state.round?`${(state.elapsedTotal/state.round).toFixed(1)}s`:'—';
  }

  function finish(){
    state.active=false;state.locked=true;state.action=null;state.paused=false;state.pausedAt=0;stopArenaMusic();choiceButtons.forEach(b=>b.disabled=true);
    ui.lockerButton.disabled=false;
    const level=levels[state.levelIndex],oldBest=bestScore();if(state.score>oldBest)localStorage.setItem('superHockeyBest',state.score);
    const previouslyUnlocked=unlockedCount(),completedBefore=completedLevelCount(),passed=state.correct>=level.unlock,nextLevel=levels[state.levelIndex+1];
    const unlockedNew=passed&&nextLevel&&previouslyUnlocked<state.levelIndex+2;
    const firstCompletion=passed&&completedBefore<state.levelIndex+1;
    const unlockedCard=firstCompletion?gearCatalog.cardstyle.find(item=>item.unlockLevel===state.levelIndex+1):null;
    if(unlockedNew)localStorage.setItem('superHockeyUnlocked',String(state.levelIndex+2));
    if(passed)localStorage.setItem('superHockeyCompletedThrough',String(Math.max(completedLevelCount(),state.levelIndex+1)));
    if(passed)queueCloudChange({completedThrough:completedLevelCount()});
    const cheeseBonus=passed?awardCheese(25+(unlockedNew?75:0)):0;
    const nowUnlocked=unlockedCount(),nowCompleted=completedLevelCount(),bonusUnlocked=intermissions.filter(bonus=>nowCompleted>=bonus.afterLevel).length;
    ui.bestScore.textContent=Math.max(oldBest,state.score);
    ui.levelStatus.textContent=`${nowUnlocked} of ${levels.length} levels · ${bonusUnlocked} of ${intermissions.length} bonuses`;
    const revealedGear=passed?Object.entries(gearCatalog).flatMap(([category,items])=>items.filter(item=>category!=='cardstyle'&&item.unlockLevel===state.levelIndex+1)).length:0;
    const revealMessage=revealedGear?` Plus ${revealedGear} more Locker ${revealedGear===1?'item is':'items are'} now available.`:'';
    const message=passed?`You made ${state.correct} of ${state.total} best-play decisions and earned <strong>🧀 ${cheeseBonus}</strong>.${revealMessage}`:`Get ${level.unlock} correct to advance. You made ${state.correct} this time.`;
    const nextIndex=passed&&nextLevel?state.levelIndex+1:state.levelIndex,intermissionIndex=passed?intermissions.findIndex(bonus=>bonus.afterLevel===state.levelIndex+1):-1;
    const hasIntermission=intermissionIndex>=0,primaryLabel=hasIntermission?'Play bonus game':passed&&nextLevel?'Play next level':'Try again';
    const celebration=passed?`<div class="finish-confetti" aria-hidden="true">${Array.from({length:30},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${(i%10)*.08}s;--spin:${(i%2?1:-1)*(180+i*19)}deg;--colour:${['#ffcf54','#63e6ed','#ff6b35','#87efaf','#ffffff'][i%5]}"></i>`).join('')}</div>`:'';
    if(passed){
      const unlockLabel=hasIntermission?'INTERMISSION BONUS':unlockedNew?'NEXT CHALLENGE':state.levelIndex===levels.length-1?'MILESTONE':'LEVEL STATUS';
      const unlockTitle=hasIntermission?`${intermissions[intermissionIndex].title} unlocked`:unlockedNew?`${nextLevel.title} unlocked`:state.levelIndex===levels.length-1?'New heights reached':'Challenge cleared';
      const cardMarkup=unlockedCard?`<section class="finish-card-reveal" aria-label="New card revealed: ${unlockedCard.name}"><div class="finish-card-label"><span>NEW CARD</span><strong>REVEALED</strong></div><div class="finish-card-tilt"><canvas id="unlockedCardPreview" class="finish-card-canvas" width="360" height="504" aria-label="Preview of ${unlockedCard.name}"></canvas></div><h3>${unlockedCard.name}</h3><p>Level ${state.levelIndex+1} reward</p><button class="finish-locker-button" id="unlockedCardLockerButton">View in Locker <span>→</span></button></section>`:'';
      ui.startOverlay.classList.add('finish-mode');
      ui.startOverlay.innerHTML=`${celebration}<div class="finish-layout ${unlockedCard?'has-card':'no-card'}"><section class="finish-result"><div class="finish-unlock-status"><span>${unlockLabel}</span><strong>${unlockTitle}</strong></div><p class="finish-kicker">CHALLENGE CLEARED</p><h2 class="finish-title"><span>LEVEL ${state.levelIndex+1}</span> COMPLETE</h2><div class="finish-score"><strong>${Math.round(state.correct/state.total*100)}%</strong><span>${state.correct}/${state.total} best reads<br>${state.score} points</span></div><p class="finish-copy">${message}</p></section>${cardMarkup}<div class="overlay-actions finish-actions"><button class="primary-button" id="nextButton">${primaryLabel} <span>→</span></button><button class="secondary-button" id="levelsButton">Choose a level</button></div><small class="finish-best">${state.score>oldBest?'NEW PERSONAL BEST':'BEST SCORE '+Math.max(oldBest,state.score)}</small></div>`;
      if(unlockedCard){
        requestAnimationFrame(()=>renderUnlockedCardPreview(document.getElementById('unlockedCardPreview'),unlockedCard));
        document.getElementById('unlockedCardLockerButton').addEventListener('click',()=>{lockerCategory='cardstyle';openLocker();});
      }
    }else{
      ui.startOverlay.classList.add('finish-mode');
      ui.startOverlay.innerHTML=`<div class="finish-layout no-card finish-unsuccessful"><section class="finish-result"><p class="finish-kicker">LEVEL ${state.levelIndex+1} RESULT</p><h2 class="finish-title"><span>KEEP READING</span>SO CLOSE!</h2><div class="finish-score"><strong>${Math.round(state.correct/state.total*100)}%</strong><span>${state.correct}/${state.total} best reads<br>${state.score} points</span></div><p class="finish-copy">${message}</p></section><div class="overlay-actions finish-actions"><button class="primary-button" id="nextButton">${primaryLabel} <span>→</span></button><button class="secondary-button" id="levelsButton">Choose a level</button></div><small class="finish-best">${state.score>oldBest?'NEW PERSONAL BEST':'BEST SCORE '+Math.max(oldBest,state.score)}</small></div>`;
    }
    ui.startOverlay.classList.remove('hidden');
    window.TopCheLeaderboard?.recordLevelResult({
      level:state.levelIndex+1,
      levelId:level.id,
      levelTitle:level.title,
      score:state.score,
      correct:state.correct,
      total:state.total,
      elapsedMs:Math.max(0,Math.round(state.elapsedTotal*1000)),
      passed
    });
    document.getElementById('nextButton').addEventListener('click',()=>hasIntermission?startIntermission(intermissionIndex,true):startGame(nextIndex));
    document.getElementById('levelsButton').addEventListener('click',showLevelSelect);
    if(passed)setTimeout(playGoalCelebrationSound,120);
  }

  function tick(){
    const now=performance.now();
    if(state.active&&!state.locked&&!state.paused){
      const elapsed=Math.max(0,now-(state.lastTickAt||now))/1000;state.lastTickAt=now;
      if(state.mode==='bonus'){
        const bonus=currentIntermission();
        if(bonus.type==='deflection'&&state.bonusPhase==='aim'){
          if(now>=state.bonusDropAt){state.bonusPhase='live';state.bonusReactionAt=now;state.startedAt=now;state.lastTickAt=now;state.timeLeft=bonus.time;playPuckKnock();ui.skillLabel.textContent='Move the blade into position';ui.timer.textContent=state.timeLeft.toFixed(1);if(deflectionStickOnTarget(rinkMetrics()))handleBonusChoice('deflect');}
          else ui.timer.textContent='READY';
        } else if(bonus.type==='rebound'){
          if(state.bonusPhase==='shot'){
            if(now-state.startedAt>=700){state.bonusPhase='rebound';state.bonusReactionAt=now;state.lastTickAt=now;state.timeLeft=0;playPuckKnock();ui.skillLabel.textContent='Track the bouncing puck';ui.timer.textContent='TRACK';}
            else ui.timer.textContent='WATCH';
          } else if(state.bonusPhase==='rebound'){
            const motion=reboundPuckPosition(rinkMetrics(),now);if(motion.stage!==state.bonusReboundStage){if(motion.stage==='bounce'||motion.stage==='slide')playPuckKnock();state.bonusReboundStage=motion.stage;}
            if(motion.tappable){state.timeLeft=Math.max(0,motion.windowRemaining/1000);ui.skillLabel.textContent=motion.tier==='max'?'Tap now — max points':'Tap before it escapes';ui.timer.textContent=(Math.ceil(state.timeLeft*10)/10).toFixed(1);}else{state.timeLeft=0;ui.skillLabel.textContent='Track the bouncing puck';ui.timer.textContent='TRACK';}
            if(motion.done)handleBonusChoice('timeout');
          }
        } else {
          state.timeLeft=Math.max(0,state.timeLeft-elapsed);
          if(state.timeLeft<=0)handleBonusChoice('timeout');
          ui.timer.textContent=state.timeLeft.toFixed(1);
        }
      } else {
        state.timeLeft=Math.max(0,state.timeLeft-elapsed*timerRate());
        if(state.timeLeft<=0)decide('timeout');
        ui.timer.textContent=state.timeLeft.toFixed(1);
      }
    } else state.lastTickAt=now;
    updatePowerUpIndicator();
    requestAnimationFrame(tick);
  }

  choiceButtons.forEach(b=>b.addEventListener('click',()=>decide(b.dataset.choice)));
  document.addEventListener('keydown',e=>{
    if(e.repeat)return;
    if(state.mode==='bonus'&&state.active){
      const bonus=currentIntermission();let choice;
      if(bonus.type==='open-net')choice={KeyQ:0,KeyW:1,KeyE:2,KeyA:3,KeyS:4,KeyD:5}[e.code];
      else if(bonus.type==='deflection'&&(e.code==='Space'||e.code==='Enter'))choice='deflect';
      else if(bonus.type==='rebound'&&(e.code==='Space'||e.code==='Enter'))choice='rebound';
      if(choice!==undefined){e.preventDefault();handleBonusChoice(choice);}return;
    }
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rush',ArrowDown:'regroup',Space:'shoot'},choice=map[e.code]||map[e.key];if(choice){e.preventDefault();decide(choice);}
  });
  canvas.addEventListener('pointerdown',event=>{
    if(state.mode!=='bonus'||!state.active||state.locked)return;
    const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,m=rinkMetrics(),bonus=currentIntermission();
    if(bonus.type==='open-net'){
      if(Math.hypot(x-m.cx,y-m.h*.92)<=m.w*.115){
        canvas.setPointerCapture?.(event.pointerId);state.bonusFlick={pointerId:event.pointerId,start:{x,y},current:{x,y}};
      }
    } else if(bonus.type==='deflection'){
      canvas.setPointerCapture?.(event.pointerId);state.bonusStick={x,y};if(state.bonusPhase==='live'&&deflectionStickOnTarget(m))handleBonusChoice('deflect');
    } else if(state.bonusPhase==='rebound'){
      const puck=reboundPuckPosition(m,performance.now());if(puck.tappable&&Math.hypot(puck.x-x,puck.y-y)<m.w*.08)handleBonusChoice('rebound');
    }
  });
  canvas.addEventListener('pointermove',event=>{
    if(state.mode!=='bonus'||!state.active||state.locked)return;
    if(currentIntermission().type==='open-net'){
      if(state.bonusFlick?.pointerId===event.pointerId){const rect=canvas.getBoundingClientRect();state.bonusFlick.current={x:event.clientX-rect.left,y:event.clientY-rect.top};}return;
    }
    if(currentIntermission().type!=='deflection')return;
    const rect=canvas.getBoundingClientRect(),m=rinkMetrics(),x=clamp(event.clientX-rect.left,20,m.w-20),y=clamp(event.clientY-rect.top,m.h*.32,m.h*.9);state.bonusStick={x,y};
    if(state.bonusPhase==='live'&&deflectionStickOnTarget(m))handleBonusChoice('deflect');
  });
  canvas.addEventListener('pointerup',event=>{
    if(state.mode!=='bonus'||!state.active||state.locked||currentIntermission().type!=='open-net'||state.bonusFlick?.pointerId!==event.pointerId)return;
    const rect=canvas.getBoundingClientRect(),m=rinkMetrics(),end={x:event.clientX-rect.left,y:event.clientY-rect.top};
    const result=openNetFlickResult(state.bonusFlick.start,end,m,currentIntermission().difficulty);state.bonusFlick=null;
    if(result){state.bonusAimMiss=result.miss;state.bonusWide=result.wide;state.bonusMissPoint=end;handleBonusChoice(result.choice);}
  });
  canvas.addEventListener('pointercancel',event=>{if(state.bonusFlick?.pointerId===event.pointerId)state.bonusFlick=null;});
  ui.soundButton.addEventListener('click',()=>{
    state.sound=!state.sound;
    if(state.sound&&audioCtx?.state==='suspended')audioCtx.resume();
    if(!state.sound&&audioCtx?.state==='running')audioCtx.suspend();
    ui.soundButton.textContent='♪';ui.soundButton.dataset.muted=String(!state.sound);ui.soundButton.setAttribute('aria-label',state.sound?'Mute music and sound':'Turn on music and sound');
  });
  ui.howButton.addEventListener('click',()=>ui.howDialog.showModal());ui.closeHow.addEventListener('click',()=>ui.howDialog.close());
  ui.howDialog.addEventListener('click',e=>{if(e.target===ui.howDialog)ui.howDialog.close();});
  ui.lockerButton.addEventListener('click',openLocker);ui.closeLocker.addEventListener('click',closeLocker);
  ui.viewPlayerButton.addEventListener('click',showPlayerShowcase);ui.backToLockerButton.addEventListener('click',()=>{showLockerCatalog();scheduleGearPreviews();ui.viewPlayerButton.focus();});
  ui.sharePlayerButton.addEventListener('click',sharePlayerImage);ui.downloadPlayerButton.addEventListener('click',downloadPlayerImage);
  ui.lockerDialog.addEventListener('click',e=>{if(e.target===ui.lockerDialog)closeLocker();});ui.lockerDialog.addEventListener('close',resumeAfterLocker);
  window.addEventListener('resize',()=>{resizeCanvas();if(ui.lockerDialog?.open)scheduleGearPreviews();});
  window.addEventListener('online',()=>{initializeCloudProgress();flushCloudProgress();});
  window.addEventListener('topche:profile-ready',()=>{cloudProgressReady=false;initializeCloudProgress();});
  resizeCanvas();showLevelSelect();setTimeout(initializeCloudProgress,700);cancelAnimationFrame(raf);raf=requestAnimationFrame(drawGame);requestAnimationFrame(tick);
})();
