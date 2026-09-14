(() => {
  'use strict';

  const canvas = document.getElementById('rink');
  const ctx = canvas.getContext('2d');
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
    powerUpIcon: document.getElementById('powerUpIcon')
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
    { situation:'Five-man box', answer:'regroup', carrier:[.5,.71], goalie:0, shot:true, rush:null, showLeft:true, showRight:true, teammates:[[.16,.38],[.84,.38]], defenders:[[.16,.36],[.32,.48],[.5,.33],[.68,.48],[.84,.36]], cue:'The five-player box is intact. Do not feed the counterattack—reset the formation.' }
  ];

  const levels = [
    { id:'rookie', title:'Rookie Reads', short:'Pass or shoot', mission:'Learn to spot the open pass and the perfect shot.', focus:'See the simple play', rounds:6, time:4.2, minTime:3.7, unlock:4, scenarios:[0,2,4,5,1,3] },
    { id:'open-ice', title:'Open Ice', short:'Add the Rush', mission:'Read covered teammates and attack a wide-open skating lane.', focus:'Find open ice', rounds:8, time:3.8, minTime:3.25, unlock:6, scenarios:[0,2,4,5,6,7,8,1] },
    { id:'pressure', title:'Pressure Test', short:'Add Regroup', mission:'Protect the puck when every forward option has disappeared.', focus:'Manage pressure', rounds:10, time:3.4, minTime:2.8, unlock:7, scenarios:[0,1,2,3,4,5,6,7,9,10] },
    { id:'super', title:'Super Lab', short:'All core skills', mission:'Use every core hockey read at game speed and master the full challenge.', focus:'Game-speed decisions', rounds:12, time:3, minTime:2.35, unlock:9, scenarios:[0,1,2,3,4,5,6,7,8,9,10,11] },
    { id:'odd-man', title:'Odd-Man Rush', short:'2-on-1s · backdoor plays', mission:'Read whether the defender gives you the pass, shot, or open ice.', focus:'Odd-man decisions', rounds:8, time:2.9, minTime:2.35, unlock:6, scenarios:[12,13,14,15,16,17,6,8] },
    { id:'net-front', title:'Net-Front Chaos', short:'Rebounds · low-cycle reads', mission:'React to rebounds, backdoor openings, and pressure below the circles.', focus:'Net-front instincts', rounds:10, time:2.7, minTime:2.15, unlock:7, scenarios:[14,15,18,19,20,23,9,10,12,13] },
    { id:'power-play', title:'Power-Play Brain', short:'Seams · lanes · traps', mission:'Move defenders, recognize clean lanes, and reset against layered pressure.', focus:'Power-play vision', rounds:12, time:2.5, minTime:2, unlock:9, scenarios:[18,19,20,21,22,23,12,13,14,15,16,17] },
    { id:'championship', title:'Championship Qualifier', short:'Every core situation', mission:'Handle every core situation quickly enough to enter the elite levels.', focus:'Championship reads', rounds:16, time:2.3, minTime:1.8, unlock:12, scenarios:[12,13,14,15,16,17,18,19,20,21,22,23,6,8,9,11] },
    { id:'transition', title:'Transition Reads', short:'Counters · weak-side plays', mission:'Recognize counterattacks and weak-side openings without lane guides.', focus:'Transition scanning', rounds:14, time:2.2, minTime:1.7, unlock:11, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,39] },
    { id:'cycle', title:'Cycle Control', short:'Rotations · wall escapes', mission:'Read rotations, escapes, and possession choices as coverage shifts.', focus:'Cycle awareness', rounds:14, time:2.1, minTime:1.58, unlock:11, scenarios:[28,29,30,31,32,33,37,38,39,40,41,42,44,45] },
    { id:'special-teams', title:'Special Teams', short:'Power play · penalty kill', mission:'Find the single best play inside compact special-teams formations.', focus:'Special-teams vision', rounds:14, time:2, minTime:1.48, unlock:12, scenarios:[18,19,24,25,34,36,39,40,41,44,45,46,47,31] },
    { id:'east-west', title:'East-West Elite', short:'Seams · backdoor disguises', mission:'See through layered traffic to find late east-west openings.', focus:'Deception and seams', rounds:15, time:1.9, minTime:1.38, unlock:13, scenarios:[14,18,20,24,25,32,33,39,40,43,44,45,46,47,30] },
    { id:'counter', title:'Counterattack', short:'Instant transition choices', mission:'Choose the pass, shot, rush, or reset immediately after a turnover.', focus:'Counterattack speed', rounds:16, time:1.8, minTime:1.28, unlock:14, scenarios:[13,16,21,23,26,27,28,29,34,35,36,37,38,39,40,43] },
    { id:'pressure-cooker', title:'Pressure Cooker', short:'Crowded ice · little time', mission:'Keep your eyes up while multiple defenders close at once.', focus:'Poise under pressure', rounds:16, time:1.7, minTime:1.18, unlock:14, scenarios:[17,18,20,22,24,25,30,31,32,33,39,40,41,42,45,46] },
    { id:'vision', title:'Vision Lab', short:'Decoys · hidden openings', mission:'Ignore convincing decoys and identify the one genuinely open option.', focus:'Elite scanning', rounds:17, time:1.6, minTime:1.08, unlock:15, scenarios:[24,25,26,27,30,31,32,33,34,35,36,39,40,41,42,45,46] },
    { id:'pro-speed', title:'Pro Speed', short:'Every read · no guides', mission:'Process advanced formations at professional decision speed.', focus:'Pro-speed recognition', rounds:18, time:1.5, minTime:1, unlock:16, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,43] },
    { id:'elite-chaos', title:'Elite Chaos', short:'Broken plays · deception', mission:'Solve unpredictable-looking plays before the defence can recover.', focus:'Chaos recognition', rounds:18, time:1.4, minTime:.92, unlock:17, scenarios:[14,15,17,20,22,23,24,25,26,27,30,31,34,35,39,40,45,46] },
    { id:'sudden-death', title:'Sudden Death', short:'One mistake changes everything', mission:'Make near-perfect decisions under an unforgiving clock.', focus:'Clutch decisions', rounds:18, time:1.3, minTime:.84, unlock:17, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,41,42,47] },
    { id:'impossible-ice', title:'Impossible Ice', short:'Almost no reaction time', mission:'Read twenty elite situations with virtually no hesitation.', focus:'Instant recognition', rounds:20, time:1.18, minTime:.76, unlock:19, scenarios:[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,47] },
    { id:'gauntlet', title:'Top Che’s Gauntlet', short:'Perfect reads required', mission:'Complete the hardest test in the Lab: twenty perfect decisions at maximum speed.', focus:'Master-level hockey sense', rounds:20, time:1.08, minTime:.7, unlock:20, scenarios:[45,26,31,37,24,43,29,40,34,42,25,36,30,46,27,41,35,38,44,47] }
  ];

  let state = {
    active:false, locked:true, round:0, total:6, levelIndex:0, score:0, streak:0, correct:0,
    elapsedTotal:0, duration:3.4, timeLeft:3.4, scenario:null, startedAt:0, sound:true,
    animStart:performance.now(), reveal:null, action:null, deck:[], paused:false, pausedAt:0, lastTickAt:0
  };
  let raf;
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
      {id:'cosmic-violet',name:'Cosmic Violet',cost:520,unlockLevel:16,color:'#592f99',accent:'#5ce6ef',detail:'#1a123d'}
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
      {id:'diamond',name:'Championship Diamond',cost:540,unlockLevel:18,symbol:'◆',color:'#25205c',accent:'#ffd85d'}
    ],
    helmet:[
      {id:'classic-navy',name:'Classic Pro',cost:0,color:'#071b2b',accent:'#2b6384',detail:'#b8d1dc',design:'classic'},
      {id:'polar-white',name:'Ice Storm',cost:65,color:'#e7f7fb',accent:'#38a7df',detail:'#ffffff',design:'ice'},
      {id:'captain-red',name:'Flame Runner',cost:85,color:'#a91424',accent:'#ffcf45',detail:'#f06422',design:'flame'},
      {id:'royal-blue',name:'Pirate Skull',cost:95,color:'#12171c',accent:'#f3f0df',detail:'#8b1d2c',design:'pirate'},
      {id:'gold-stripe',name:'Forest Camo',cost:125,color:'#284f35',accent:'#8aa35a',detail:'#14291e',design:'forest'},
      {id:'galaxy-dome',name:'Galaxy Dome',cost:190,unlockLevel:2,color:'#21154f',accent:'#81e8ff',detail:'#ffdc6b',design:'galaxy'},
      {id:'shark-attack',name:'Shark Attack',cost:315,unlockLevel:8,color:'#166b8a',accent:'#dff9ff',detail:'#082d45',design:'shark'},
      {id:'checker-pro',name:'Checker Pro',cost:470,unlockLevel:15,color:'#f0f5f7',accent:'#142331',detail:'#ffca45',design:'checker'}
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
      {id:'target-rings',name:'Target Rings',cost:390,unlockLevel:17,color:'#ea324d',accent:'#ffffff',design:'rings'}
    ],
    shaft:[
      {id:'midnight',name:'Carbon Weave',cost:0,color:'#111820',accent:'#d3a62c',detail:'#2e3942',design:'carbon'},
      {id:'red-speed',name:'Lightning Fade',cost:100,color:'#f12d48',accent:'#ffffff',detail:'#ff8a39',design:'lightning'},
      {id:'woodland',name:'Woodgrain Classic',cost:115,color:'#a46a2d',accent:'#e8c794',detail:'#573414',design:'woodgrain'},
      {id:'ice-blue',name:'Frost Fracture',cost:130,color:'#24b8ee',accent:'#ffffff',detail:'#75e8ff',design:'frost'},
      {id:'digital-grid',name:'Digital Grid',cost:240,unlockLevel:5,color:'#15567d',accent:'#9dffdc',detail:'#2b98bb',design:'matrix'},
      {id:'sunset-burst',name:'Sunset Burst',cost:370,unlockLevel:12,color:'#ef4e29',accent:'#ffd84b',detail:'#64196f',design:'sunset'},
      {id:'power-circuit',name:'Power Circuit',cost:560,unlockLevel:19,color:'#3154c8',accent:'#8df4ff',detail:'#c14dff',design:'circuit'}
    ],
    socks:[
      {id:'home-ice',name:'Home Ice Bands',cost:0,color:'#1769ff',accent:'#ffffff',detail:'#071b2b',design:'classic'},
      {id:'maple-pulse',name:'Maple Pulse',cost:70,color:'#d81f35',accent:'#ffffff',detail:'#9b1222',design:'pulse'},
      {id:'nordic-crown',name:'Nordic Crown',cost:90,color:'#1f63b7',accent:'#ffda45',detail:'#ffffff',design:'chevron'},
      {id:'candy-clash',name:'Candy Cane Clash',cost:105,color:'#e1273e',accent:'#ffffff',detail:'#17498f',design:'barber'},
      {id:'coastal-current',name:'Coastal Current',cost:125,color:'#0098a6',accent:'#eefcff',detail:'#062f3a',design:'wave'},
      {id:'neon-static',name:'Neon Static',cost:195,unlockLevel:4,color:'#9cff38',accent:'#ff4fa3',detail:'#332080',design:'static'},
      {id:'solar-flame',name:'Solar Flame',cost:275,unlockLevel:7,color:'#ef6d1f',accent:'#ffe26b',detail:'#a61e31',design:'flame'},
      {id:'gold-checker',name:'Gold Checker',cost:365,unlockLevel:11,color:'#e7b52c',accent:'#16191e',detail:'#ffffff',design:'checker'},
      {id:'cosmic-orbit',name:'Cosmic Orbit',cost:475,unlockLevel:16,color:'#592f99',accent:'#5ce6ef',detail:'#ffcf54',design:'orbit'},
      {id:'arctic-shatter',name:'Arctic Shatter',cost:590,unlockLevel:20,color:'#eefcff',accent:'#55d9ff',detail:'#17498f',design:'shatter'}
    ],
    gloves:[
      {id:'navy-gloves',name:'Navy Gloves',cost:0,color:'#071b2b',accent:'#2d6590'},
      {id:'red-white',name:'Red & White',cost:85,color:'#c82032',accent:'#ffffff'},
      {id:'blue-gold',name:'Blue & Gold',cost:100,color:'#154b9b',accent:'#e9bd39'},
      {id:'black-gold',name:'Black & Gold',cost:115,color:'#15191e',accent:'#d7ad36'},
      {id:'teal-white',name:'Teal & White',cost:120,color:'#078995',accent:'#ffffff'},
      {id:'arctic-gloves',name:'Arctic Flash',cost:205,unlockLevel:4,color:'#eaf8fb',accent:'#209bd1'},
      {id:'voltage-gloves',name:'Voltage',cost:320,unlockLevel:9,color:'#20242b',accent:'#b8f241'},
      {id:'royal-gloves',name:'Royal Elite',cost:455,unlockLevel:14,color:'#4b237d',accent:'#f0c95c'}
    ],
    skates:[
      {id:'classic-black',name:'Classic Black',cost:0,color:'#111419',accent:'#d9e4e8'},
      {id:'copper-edge',name:'Copper Edge',cost:105,color:'#12161c',accent:'#d2854e'},
      {id:'red-runner',name:'Red Runner',cost:115,color:'#15191e',accent:'#dc3442'},
      {id:'blue-runner',name:'Blue Runner',cost:125,color:'#111821',accent:'#2499db'},
      {id:'frost-blade',name:'Frost Blade',cost:250,unlockLevel:6,color:'#e5f8ff',accent:'#36b8e8'},
      {id:'gold-pulse',name:'Gold Pulse',cost:390,unlockLevel:13,color:'#15191e',accent:'#f0bd35'},
      {id:'whiteout-skates',name:'Whiteout Pro',cost:590,unlockLevel:20,color:'#eef5f7',accent:'#333d48'}
    ],
    number:[
      ...[10,8,9,19,29,71,87,97,99].map((number,index)=>({id:String(number),name:`Number ${number}`,symbol:String(number),cost:index?45+index*10:0,color:'#12344a',accent:'#ffffff'})),
      {id:'11',name:'Number 11',symbol:'11',cost:140,unlockLevel:2,color:'#12344a',accent:'#ffffff'},
      {id:'16',name:'Number 16',symbol:'16',cost:245,unlockLevel:7,color:'#12344a',accent:'#ffffff'},
      {id:'21',name:'Number 21',symbol:'21',cost:430,unlockLevel:15,color:'#12344a',accent:'#ffffff'}
    ]
  };
  const powerUpCatalog=[
    {id:'banana',name:'Banana',cost:100,slowdown:.02,durationMs:5*60*1000,icon:'assets/powerup-banana.png'},
    {id:'energy-drink',name:'Energy Drink',cost:250,slowdown:.04,durationMs:5*60*1000,icon:'assets/powerup-energy-drink.png'},
    {id:'dryland',name:'Dryland',cost:2500,slowdown:.10,durationMs:15*60*1000,icon:'assets/powerup-dryland.png'},
    {id:'power-skating',name:'Power Skating',cost:5000,slowdown:.25,durationMs:15*60*1000,icon:'assets/powerup-power-skating.png'}
  ];
  const lockerCategories=[...Object.keys(gearCatalog),'powerup'];
  const gearLabels={jersey:'Jerseys',logo:'Logos',helmet:'Helmets',tape:'Tape',shaft:'Sticks',socks:'Socks',gloves:'Gloves',skates:'Skates',number:'Numbers',powerup:'Power Ups'};
  const gearSingular={jersey:'Jersey',logo:'Logo',helmet:'Helmet',tape:'Tape',shaft:'Stick',socks:'Sock design',gloves:'Gloves',skates:'Skates',number:'Number'};
  const defaultLoadout={jersey:'home-navy',logo:'cheese',helmet:'classic-navy',tape:'white-tape',shaft:'midnight',socks:'home-ice',gloves:'navy-gloves',skates:'classic-black',number:'10'};
  let lockerCategory='jersey';
  let lockerPreviewFrame=0;
  let cheesePoints=Number(localStorage.getItem('superHockeyCheesePoints')||0);
  let ownedGear=safeStoredObject('superHockeyOwned',{});
  let loadout={...defaultLoadout,...safeStoredObject('superHockeyLoadout',{})};
  let activePowerUp=safeStoredObject('superHockeyActivePowerUp',null);
  const hockeySprites = new Image();
  let spritesReady = false;
  let customPlayerSprite=null,customPlayerKey='',customFallenSprite=null,customFallenKey='';
  hockeySprites.onload = () => { spritesReady = true;refreshCustomPlayer();if(ui.lockerDialog?.open){if(ui.playerShowcase.hidden)scheduleGearPreviews();else renderPlayerShowcase();} };
  hockeySprites.src = 'assets/hockey-sprites.png';
  const cheeseLogo = new Image();
  cheeseLogo.onload = () => { if(ui.playerShowcase&&!ui.playerShowcase.hidden)renderPlayerShowcase(); };
  cheeseLogo.src = 'assets/cheese-logo.png';
  const fallenPlayerSprite = new Image();
  let fallenPlayerReady = false;
  fallenPlayerSprite.onload = () => { fallenPlayerReady = true;refreshCustomPlayer(); };
  fallenPlayerSprite.src = 'assets/fallen-player.png';

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
  function updatePowerUpIndicator(){
    const item=currentPowerUp();
    if(!item){ui.powerUpIndicator.hidden=true;ui.powerUpIndicator.style.opacity='0';return;}
    const remaining=Math.max(0,activePowerUp.expiresAt-Date.now()),fraction=Math.max(0,Math.min(1,remaining/item.durationMs));
    ui.powerUpIcon.src=item.icon;ui.powerUpIcon.alt='';ui.powerUpIndicator.hidden=false;
    ui.powerUpIndicator.style.opacity=String(fraction);ui.powerUpIndicator.style.setProperty('--power-progress',`${fraction*360}deg`);
    const description=`${item.name} active — ${Math.round(item.slowdown*100)}% slower timer — about ${formatPowerUpTime(remaining)} remaining`;
    ui.powerUpIndicator.setAttribute('aria-label',description);ui.powerUpIndicator.title=description;
  }
  function saveLocker(){localStorage.setItem('superHockeyCheesePoints',String(cheesePoints));localStorage.setItem('superHockeyOwned',JSON.stringify(ownedGear));localStorage.setItem('superHockeyLoadout',JSON.stringify(loadout));updateCheeseUI();}
  function updateCheeseUI(){if(ui.cheesePoints)ui.cheesePoints.textContent=cheesePoints;if(ui.lockerPoints)ui.lockerPoints.textContent=cheesePoints;}
  function awardCheese(amount){cheesePoints+=amount;saveLocker();return amount;}
  function renderLocker() {
    ui.lockerTabs.innerHTML=lockerCategories.map(category=>`<button class="locker-tab ${category===lockerCategory?'active':''}" role="tab" aria-selected="${category===lockerCategory}" data-locker-category="${category}">${gearLabels[category]}</button>`).join('');
    ui.lockerTabs.querySelectorAll('[data-locker-category]').forEach(button=>button.addEventListener('click',()=>{lockerCategory=button.dataset.lockerCategory;ui.lockerStatus.textContent='';renderLocker();}));
    if(lockerCategory==='powerup'){
      const active=currentPowerUp();
      ui.lockerItems.innerHTML=powerUpCatalog.map(item=>{
        const isActive=active?.id===item.id;
        const durationMinutes=item.durationMs/60000;
        return `<button class="gear-card powerup-card ${isActive?'active':''}" data-powerup-id="${item.id}"><img class="gear-preview powerup-preview" src="${item.icon}" alt=""><strong>${item.name}</strong><small class="powerup-effect">Slows timer ${Math.round(item.slowdown*100)}% · ${durationMinutes} min</small><small>${isActive?'Active now':`🧀 ${item.cost}`}</small></button>`;
      }).join('');
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
    if(!ownedGear[key]){
      if(cheesePoints<item.cost){ui.lockerStatus.textContent=`You need ${item.cost-cheesePoints} more Cheese Points for ${item.name}.`;return;}
      cheesePoints-=item.cost;ownedGear[key]=true;ui.lockerStatus.textContent=`${item.name} unlocked and equipped!`;
    } else ui.lockerStatus.textContent=`${item.name} equipped.`;
    loadout[category]=id;saveLocker();refreshCustomPlayer();renderLocker();
  }
  function selectPowerUp(id){
    const item=powerUpItem(id),active=currentPowerUp();
    if(!item)return;
    if(active?.id===id){ui.lockerStatus.textContent=`${item.name} is already active for another ${formatPowerUpTime(activePowerUp.expiresAt-Date.now())}.`;return;}
    if(cheesePoints<item.cost){ui.lockerStatus.textContent=`You need ${item.cost-cheesePoints} more Cheese Points for ${item.name}.`;return;}
    cheesePoints-=item.cost;
    const now=Date.now();activePowerUp={id:item.id,activatedAt:now,expiresAt:now+item.durationMs};
    localStorage.setItem('superHockeyActivePowerUp',JSON.stringify(activePowerUp));saveLocker();updatePowerUpIndicator();
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
    else if(state.active&&!state.locked)state.startedAt+=pausedFor;
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
    return item.color;
  }

  function drawHelmetGraphics(target,item,sx,sy){
    target.save();target.globalCompositeOperation='source-atop';target.beginPath();target.ellipse(384*sx,248*sy,48*sx,59*sy,0,0,Math.PI*2);target.clip();target.lineCap='round';target.lineJoin='round';
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
    target.restore();
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
      const sockMask=yr>=418&&(insideEllipse(xr,yr,350,430,30,48)||insideEllipse(xr,yr,408,486,31,62))&&!skin&&(bluePixel||whiteUniformPixel);
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

  function drawFallenHelmetGraphics(target,item){
    target.save();target.globalCompositeOperation='source-atop';target.beginPath();target.ellipse(256,106,36,42,0,0,Math.PI*2);target.clip();target.lineCap='round';target.lineJoin='round';
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
    target.restore();
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
      const sockMask=y>331&&y<436&&(x<207||x>305)&&!skin&&(bluePixel||whiteUniformPixel);
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
    if(spritesReady&&key!==customPlayerKey){customPlayerSprite=createCustomizedPlayer();customPlayerKey=key;}
    if(fallenPlayerReady&&key!==customFallenKey){customFallenSprite=createCustomizedFallen();customFallenKey=key;}
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
    ui.shareStatus.textContent='On iPhone, choose Instagram or another app from the share sheet.';
    renderPlayerShowcase();ui.backToLockerButton.focus();
  }

  function renderPlayerShowcase(){
    const canvas=ui.playerRender,target=canvas.getContext('2d');refreshCustomPlayer();
    const playerReady=Boolean(customPlayerSprite);ui.sharePlayerButton.disabled=!playerReady;ui.downloadPlayerButton.disabled=!playerReady;
    canvas.width=1080;canvas.height=1350;target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';
    const ice=target.createLinearGradient(0,0,1080,1350);ice.addColorStop(0,'#effbfc');ice.addColorStop(.58,'#c9e7ec');ice.addColorStop(1,'#9fcbd4');target.fillStyle=ice;target.fillRect(0,0,1080,1350);
    target.save();target.globalAlpha=.22;target.strokeStyle='#4891a4';target.lineWidth=7;target.strokeRect(42,42,996,1266);
    target.beginPath();target.arc(540,610,205,0,Math.PI*2);target.stroke();target.strokeStyle='#1769ff';target.lineWidth=15;target.beginPath();target.moveTo(55,325);target.lineTo(1025,325);target.stroke();target.strokeStyle='#c9343c';target.beginPath();target.moveTo(55,895);target.lineTo(1025,895);target.stroke();target.restore();
    target.fillStyle='#176170';target.font='800 22px system-ui, sans-serif';target.textAlign='left';target.fillText("TOP CHE’S HOCKEY",128,104);target.fillText('MY PLAYER',128,136);
    if(cheeseLogo.complete&&cheeseLogo.naturalWidth)target.drawImage(cheeseLogo,48,53,66,68);
    if(playerReady){
      target.save();target.shadowColor='rgba(3,17,28,.38)';target.shadowBlur=38;target.shadowOffsetY=22;
      target.drawImage(customPlayerSprite,145,0,445,608,220,155,640,875);target.restore();
    } else {
      target.fillStyle='#5c8791';target.font='800 30px system-ui, sans-serif';target.textAlign='center';target.fillText('Lacing up your player…',540,610);
    }
    const jersey=gearItem('jersey',loadout.jersey),logo=gearItem('logo',loadout.logo);
    const panel=target.createLinearGradient(0,1040,0,1350);panel.addColorStop(0,'rgba(7,27,43,.94)');panel.addColorStop(1,'#06131f');target.fillStyle=panel;target.fillRect(0,1030,1080,320);
    target.textAlign='left';target.fillStyle='#63e6ed';target.font='850 25px system-ui, sans-serif';target.fillText('EQUIPPED LOOK',58,1090);
    target.fillStyle='#ffffff';target.font='950 82px system-ui, sans-serif';target.fillText(`#${loadout.number}`,58,1180);
    target.font='850 32px system-ui, sans-serif';target.fillText(jersey.name,224,1140);target.fillStyle='#a9c3cd';target.font='650 24px system-ui, sans-serif';target.fillText(`${logo.name} · ${gearItem('helmet',loadout.helmet).name}`,224,1180);
    target.fillText(`${gearItem('shaft',loadout.shaft).name} · ${gearItem('tape',loadout.tape).name}`,224,1218);
    target.fillText(`${gearItem('socks',loadout.socks).name} · ${gearItem('skates',loadout.skates).name}`,224,1256);
    target.fillText(gearItem('gloves',loadout.gloves).name,224,1294);
    target.fillStyle='#ffcf54';target.font='800 18px system-ui, sans-serif';target.fillText('BUILD YOUR LOOK. MAKE THE SMART PLAY.',58,1330);
    ui.equippedSummary.innerHTML=equippedItems().map(({label,item})=>`<span><strong>${label}:</strong> ${item.name}</span>`).join('');
  }

  function playerImageBlob(){
    renderPlayerShowcase();
    const dataUrl=ui.playerRender.toDataURL('image/png'),encoded=dataUrl.split(',')[1];
    if(!encoded)throw new Error('Could not create image.');
    const binary=atob(encoded),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:'image/png'});
  }

  function savePlayerBlob(blob){
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`top-ches-player-${loadout.number}.png`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
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
      const blob=playerImageBlob(),file=new File([blob],`top-ches-player-${loadout.number}.png`,{type:'image/png'});
      const shareData={title:"My Top Che’s Hockey Player",text:"Check out my customized player from Top Che’s Hockey!",files:[file]};
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

  function goalie(x,y,offset,angle=0,scale=1) {
    ctx.save();ctx.translate(x+offset,y);ctx.rotate(angle);ctx.scale(scale,scale);
    ctx.fillStyle='rgba(5,22,32,.18)';ctx.beginPath();ctx.ellipse(0,12,28,9.6,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#d43f3f';ctx.globalAlpha=.72;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,4,28.8,20,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    if(spritesReady){
      const cellW=hockeySprites.width/2,cellH=hockeySprites.height/2,height=97.6,width=height*(cellW/cellH);
      ctx.drawImage(hockeySprites,cellW,cellH,cellW,cellH,-width/2,-height/2,width,height);
    } else {
      ctx.fillStyle='#edf7f8';ctx.strokeStyle='#bd2e35';ctx.lineWidth=3;ctx.fillRect(-20,-12,40,24);ctx.strokeRect(-20,-12,40,24);
    }
    ctx.restore();
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

  function drawGame(t) {
    resizeCanvas();
    const m=rinkMetrics(); drawRink(m); drawNet(m);
    const gameTime=state.paused&&state.pausedAt?state.pausedAt:t;
    const phase=((gameTime-state.animStart)%2200)/2200;
    const sway=Math.sin(phase*Math.PI*2);
    const s=state.scenario || scenarios[0];
    const carrierSpot=s.carrier||[.5,.76];
    const puck={x:m.w*carrierSpot[0],y:m.h*carrierSpot[1]};
    const leftVisible=teammateVisible(s,'left');
    const rightVisible=teammateVisible(s,'right');
    const leftSpot=s.teammates?.[0]||[s.answer==='left'?.17:.22,.45];
    const rightSpot=s.teammates?.[1]||[s.answer==='right'?.83:.78,.45];
    const left={x:m.w*leftSpot[0]+sway*4,y:m.h*leftSpot[1]};
    const right={x:m.w*rightSpot[0]-sway*4,y:m.h*rightSpot[1]};
    const goalY=m.h*.095;
    const defenders=s.defenders ? s.defenders.map(([x,y])=>({x:m.w*x,y:m.h*y})) : [];
    if(!s.defenders&&(s.cover==='left'||s.cover==='both')) defenders.push({x:m.w*.34,y:m.h*.48});
    if(!s.defenders&&(s.cover==='right'||s.cover==='both')) defenders.push({x:m.w*.66,y:m.h*.48});
    if(!s.defenders&&s.shot) defenders.push({x:m.cx+sway*5,y:m.h*.34});

    let carrier={...puck},carrierAngle=0,carrierScale=1.08,carrierFallen=0,fallenAngle=0,movingPuck=null,previousPuck=null,puckOpacity=1;
    let goalieOffset=s.goalie*m.w*.09,goalieAngle=0,goalieScale=1,leftAngle=-.08,rightAngle=.08;
    let movingOpponent=null,movingOpponentIndex=-1,impact=null,impactProgress=0,looseStick=null,saveFlash=null,saveProgress=0,goalFlash=null,goalProgress=0,celebrationProgress=0;
    if(state.action){
      const raw=Math.min(1,(gameTime-state.action.start)/state.action.duration),progress=easeInOut(raw);
      const {choice,outcome,good}=state.action;
      if(good&&choice!=='regroup'){
        const celebrationStart=choice==='shoot'?.7:choice==='left'||choice==='right'?.84:.9;
        celebrationProgress=segment(raw,celebrationStart,1);
      }
      if(good&&(choice==='left'||choice==='right')){
        const start=playerPuckPosition(puck,0);
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
          movingPuck=playerPuckPosition(carrier,carrierAngle);
        } else {
          const releaseProgress=easeInOut(segment(releaseAt,0,glideEnd));
          const releaseSpot=pointLerp(puck,shotSpot,releaseProgress);
          const start=playerPuckPosition(releaseSpot,approachAngle),target={x:m.cx-s.goalie*m.w*.075,y:m.h*.055};
          const shotProgress=segment(raw,releaseAt,.68);movingPuck=pointLerp(start,target,shotProgress);previousPuck=pointLerp(start,target,Math.max(0,shotProgress-.1));
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
            movingPuck=playerPuckPosition(carrier,carrierAngle);
          } else if(raw<.82){
            const p=segment(raw,.42,.82),control={x:m.cx-m.w*.13,y:m.h*.29};
            carrier=quadraticPoint(fake,control,finish,p);
            carrierAngle=skaterAngle(quadraticDirection(fake,control,finish,p),'orange');
            goalieOffset=lerp(-m.w*.045,-m.w*.08,segment(raw,.42,.7));goalieAngle=-.2;goalieScale=1.06;
            movingPuck=playerPuckPosition(carrier,carrierAngle);
          } else {
            const shotStart=playerPuckPosition(finish,skaterAngle({x:finish.x-fake.x,y:finish.y-fake.y},'orange'));
            const goal={x:m.cx+m.w*.025,y:m.h*.025},shotProgress=segment(raw,.82,.97);
            carrier=finish;carrierAngle=skaterAngle({x:finish.x-fake.x,y:finish.y-fake.y},'orange');
            goalieOffset=-m.w*.08;goalieAngle=-.2;goalieScale=1.06;
            movingPuck=pointLerp(shotStart,goal,shotProgress);previousPuck=pointLerp(shotStart,goal,Math.max(0,shotProgress-.1));
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
            movingPuck=playerPuckPosition(carrier,carrierAngle);
          } else if(raw<.79){
            const p=segment(raw,.44,.79),control={x:m.cx+side*m.w*.37,y:m.h*.2};
            carrier=quadraticPoint(wide,control,cut,p);
            carrierAngle=skaterAngle(quadraticDirection(wide,control,cut,p),'orange');
            movingPuck=playerPuckPosition(carrier,carrierAngle);
            goalieOffset=lerp(s.goalie*m.w*.09,side*m.w*.065,segment(raw,.52,.79));goalieAngle=side*.16;goalieScale=1.05;
          } else {
            const approachAngle=skaterAngle({x:cut.x-wide.x,y:cut.y-wide.y},'orange');
            const shotStart=playerPuckPosition(cut,approachAngle),goal={x:m.cx-side*m.w*.06,y:m.h*.025};
            const shotProgress=segment(raw,.79,.97);
            carrier=cut;carrierAngle=approachAngle;goalieOffset=side*m.w*.065;goalieAngle=side*.16;goalieScale=1.05;
            movingPuck=pointLerp(shotStart,goal,shotProgress);previousPuck=pointLerp(shotStart,goal,Math.max(0,shotProgress-.1));
            if(raw>.91){goalFlash=goal;goalProgress=segment(raw,.91,1);}
            if(raw>.98)puckOpacity=1-(raw-.98)/.02;
          }
        }
      } else if(choice==='regroup') {
        const theta=Math.PI*2*progress,rx=m.w*.15;
        const playerClearance=Math.max(42,m.w*.09);
        const roomBeforeBlueLine=Math.max(0,attackingBlueLineY(m)-playerClearance-puck.y);
        const ry=Math.min(m.h*.06,roomBeforeBlueLine/2);
        carrier={x:puck.x-Math.sin(theta)*rx,y:puck.y+(1-Math.cos(theta))*ry};
        const direction={x:-Math.cos(theta)*rx,y:Math.sin(theta)*ry};
        carrierAngle=skaterAngle(direction,'orange');
        movingPuck=playerPuckPosition(carrier,carrierAngle);
      } else if(outcome==='shot-blocked') {
        const start=playerPuckPosition(puck,0);
        const index=closestDefender(defenders,{x:m.cx,y:m.h*.31});
        const blocker=index>=0?defenders[index]:{x:m.cx,y:m.h*.36};
        const receive={x:blocker.x,y:blocker.y+18};
        movingOpponentIndex=index;
        if(raw<.38){
          const p=segment(raw,0,.38);movingPuck=pointLerp(start,receive,p);
          previousPuck=pointLerp(start,receive,Math.max(0,p-.1));
          movingOpponent={position:blocker,angle:0,label:'4'};
        } else {
          const p=segment(raw,.38,1),side=blocker.x<m.cx?-1:1;
          const exit={x:m.cx-side*m.w*.2,y:m.h*1.08};
          const control={x:blocker.x+side*m.w*.18,y:m.h*.72};
          const position=quadraticPoint(blocker,control,exit,p);
          const direction=quadraticDirection(blocker,control,exit,p);
          const angle=skaterAngle(direction,'white');
          movingOpponent={position,angle,label:'4'};movingPuck=playerPuckPosition(position,angle,'white');
        }
      } else if(outcome==='goalie-easy-save') {
        const start=playerPuckPosition(puck,0),shuffle=segment(raw,0,.55);
        goalieOffset=lerp(s.goalie*m.w*.09,0,shuffle);goalieScale=1+Math.sin(Math.min(1,raw/.7)*Math.PI)*.06;
        const save={x:m.cx+goalieOffset+8,y:goalY+16};
        const p=segment(raw,0,.62);movingPuck=pointLerp(start,save,p);
        previousPuck=pointLerp(start,save,Math.max(0,p-.1));
        if(raw>.58){movingPuck=save;saveFlash=save;saveProgress=segment(raw,.58,1);}
      } else if(outcome==='empty-pass') {
        const start=playerPuckPosition(puck,0),side=choice==='left'?-1:1;
        const corner={x:side<0?m.pad+m.w*.035:m.w-m.pad-m.w*.035,y:m.h*.12};
        const control={x:m.cx+side*m.w*.3,y:m.h*.43},p=segment(raw,0,.88);
        movingPuck=quadraticPoint(start,control,corner,p);previousPuck=quadraticPoint(start,control,corner,Math.max(0,p-.08));
        if(raw>.88)puckOpacity=1-segment(raw,.88,1)*.35;
      } else if(outcome==='pass-intercepted') {
        const start=playerPuckPosition(puck,0),target=choice==='left'?left:right;
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
          movingOpponent={position:defenderPosition,angle:skaterAngle(checkingDirection,'white'),label:'6'};movingPuck=playerPuckPosition(carrier,carrierAngle);
        } else {
          const p=segment(raw,.48,1),side=collision.x<m.cx?-1:1;
          const impactAngle=skaterAngle({x:collision.x-puck.x,y:collision.y-puck.y},'orange');
          const exit={x:side<0?-m.w*.2:m.w*1.2,y:Math.min(m.h*1.06,collision.y+m.h*.28)};
          carrier=pointLerp(collision,exit,p);
          carrierAngle=lerp(impactAngle,impactAngle+side*Math.PI*.55,Math.min(1,p*1.3));carrierScale=lerp(1.08,.96,p);
          carrierFallen=segment(raw,.5,.7);fallenAngle=impactAngle+side*.35;
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
        if(raw<.74)movingPuck=playerPuckPosition(carrier,carrierAngle);
        else {
          const start=playerPuckPosition(approach,carrierAngle),save={x:m.cx+8,y:goalY+17},saveP=segment(raw,.74,.93);
          movingPuck=pointLerp(start,save,saveP);previousPuck=pointLerp(start,save,Math.max(0,saveP-.1));
          goalieAngle=-s.goalie*.18;goalieScale=1.08;
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
    goalie(m.cx,goalY,goalieOffset,goalieAngle,goalieScale);
    if(leftVisible) player(left.x,left.y,'blue','7',leftAngle);
    if(rightVisible) player(right.x,right.y,'blue','9',rightAngle);
    defenders.forEach((d,i)=>{if(i!==movingOpponentIndex)player(d.x,d.y,'white',String(i+2),0,.95);});
    if(movingOpponent)player(movingOpponent.position.x,movingOpponent.position.y,'white',movingOpponent.label,movingOpponent.angle,.95);
    player(carrier.x,carrier.y,'orange','10',carrierAngle,carrierScale,1-carrierFallen);
    fallenPlayer(carrier.x,carrier.y,fallenAngle,1,carrierFallen);
    if(movingPuck) drawPuckMotion(movingPuck,previousPuck,puckOpacity);
    else drawPuckMotion(playerPuckPosition(puck,0));
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
    audioCtx ||= new AudioEngine();
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

  function playSkating(durationMs) {
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
    playNoise(.07,.11,620,0,'bandpass');playTone(145,82,.1,.08,'square');
  }

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

  function playBodycheckOh() {
    playNoise(.12,.1,340,0,'bandpass');
    playTone(285,105,.75,.075,'sine');playTone(570,210,.7,.025,'triangle',.02);
  }

  function playDecisionSounds(choice,good,outcome,actionDuration,scenario) {
    if(!state.sound||choice==='timeout') return;
    if(choice==='left'||choice==='right'||(choice==='shoot'&&!good))playPuckKnock();
    if(good&&(choice==='left'||choice==='right'))setTimeout(playPuckKnock,Math.round(actionDuration*.54));
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
      if(outcome==='rush-bodycheck')setTimeout(playBodycheckOh,Math.round(actionDuration*.48));
    }
  }

  function shuffledScenarios(level) {
    const deck=level.scenarios.map(index=>({...scenarios[index]}));
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    return deck.slice(0,level.rounds);
  }

  function setLevelPanel(index) {
    const level=levels[index];
    ui.levelEyebrow.textContent=`LEVEL ${index+1}`;ui.missionTitle.textContent=level.title;
    ui.missionCopy.textContent=level.mission;ui.skillLabel.textContent=level.focus;
    ui.roundText.textContent=`0 / ${level.rounds}`;ui.roundProgress.style.width='0%';
  }

  function showLevelSelect() {
    const unlocked=unlockedCount();
    ui.lockerButton.disabled=false;
    ui.levelStatus.textContent=`${unlocked} of ${levels.length} levels unlocked`;
    ui.startOverlay.innerHTML=`<img class="cheese-hero-logo" src="assets/cheese-logo.png" alt=""><p class="overline">LEVEL UP YOUR HOCKEY BRAIN</p><h2>Choose your<br><em>challenge.</em></h2><p>Beat the accuracy target to unlock the next level.</p><div class="level-grid" aria-label="Hockey challenges">${levels.map((level,index)=>{const locked=index>=unlocked,complete=index<unlocked-1,targetLabel=index===levels.length-1?'TARGET':'TO ADVANCE';return `<button class="level-card" data-level="${index}" ${locked?'disabled':''}><span class="level-number">LEVEL ${index+1} · ${level.unlock}/${level.rounds} ${targetLabel}</span><strong>${level.title}</strong><small>${level.short}</small><span class="level-state">${locked?'🔒':complete?'✓':'▶'}</span></button>`;}).join('')}</div>`;
    ui.startOverlay.classList.remove('hidden');
    ui.startOverlay.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>startGame(Number(button.dataset.level))));
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
    const level=levels[levelIndex];setLevelPanel(levelIndex);
    state={...state,active:true,locked:false,round:0,total:level.rounds,levelIndex,score:0,streak:0,correct:0,elapsedTotal:0,reveal:null,action:null,deck:shuffledScenarios(level),paused:false,pausedAt:0};
    ui.startOverlay.classList.add('hidden');ui.feedback.className='feedback';ui.lockerButton.disabled=false;
    updateUI();beginRound();startArenaMusic();
  }

  function decide(choice) {
    if(!state.active||state.locked) return;
    state.locked=true;choiceButtons.forEach(b=>b.disabled=true);
    const elapsed=Math.max(0,(performance.now()-state.startedAt)/1000);state.elapsedTotal+=elapsed;
    const good=choice===state.scenario.answer;
    let cheeseEarned=0;
    if(good) { const speed=Math.round(state.timeLeft*80);state.streak++;state.correct++;state.score+=100+speed+Math.min(200,state.streak*20);cheeseEarned=awardCheese(10+(state.streak%3===0?5:0)); }
    else state.streak=0;
    let outcome='success';
    if(!good&&choice==='shoot')outcome=state.scenario.shot===false?'goalie-easy-save':'shot-blocked';
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
    state.action=choice==='timeout'?null:{choice,outcome,good,start:performance.now(),duration:actionDuration};
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
    const previouslyUnlocked=unlockedCount(),passed=state.correct>=level.unlock,nextLevel=levels[state.levelIndex+1];
    const unlockedNew=passed&&nextLevel&&previouslyUnlocked<state.levelIndex+2;
    if(unlockedNew)localStorage.setItem('superHockeyUnlocked',String(state.levelIndex+2));
    if(passed)localStorage.setItem('superHockeyCompletedThrough',String(Math.max(completedLevelCount(),state.levelIndex+1)));
    const cheeseBonus=passed?awardCheese(25+(unlockedNew?75:0)):0;
    const nowUnlocked=unlockedCount();
    ui.bestScore.textContent=Math.max(oldBest,state.score);
    ui.levelStatus.textContent=`${nowUnlocked} of ${levels.length} levels unlocked`;
    const headline=unlockedNew?`${nextLevel.title} unlocked!`:passed&&state.levelIndex===levels.length-1?'Gauntlet conquered!':passed?'Level complete!':'So close!';
    const revealedGear=passed?Object.values(gearCatalog).flat().filter(item=>item.unlockLevel===state.levelIndex+1).length:0;
    const revealMessage=revealedGear?` <strong>${revealedGear} new mystery ${revealedGear===1?'customization has':'customizations have'} been revealed in the Locker!</strong>`:'';
    const message=passed?`You made ${state.correct} of ${state.total} best-play decisions, scored <strong>${state.score}</strong>, and earned a <strong>🧀 ${cheeseBonus}</strong> level bonus.${revealMessage}`:`Get ${level.unlock} correct to advance. You made ${state.correct} this time.`;
    const nextIndex=passed&&nextLevel?state.levelIndex+1:state.levelIndex;
    const celebration=passed?`<div class="finish-confetti" aria-hidden="true">${Array.from({length:30},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${(i%10)*.08}s;--spin:${(i%2?1:-1)*(180+i*19)}deg;--colour:${['#ffcf54','#63e6ed','#ff6b35','#87efaf','#ffffff'][i%5]}"></i>`).join('')}</div>`:'';
    ui.startOverlay.innerHTML=`${celebration}${unlockedNew?'<div class="unlock-banner">New challenge unlocked</div>':''}<div class="score-logo" aria-hidden="true"><span>${Math.round(state.correct/state.total*100)}%</span></div><p class="overline">LEVEL ${state.levelIndex+1} COMPLETE</p><h2>${headline}</h2><p>${message}</p><div class="overlay-actions"><button class="primary-button" id="nextButton">${passed&&nextLevel?'Play next level':'Try again'} <span>→</span></button><button class="secondary-button" id="levelsButton">Choose a level</button></div><small>${state.score>oldBest?'New personal best':'Best score: '+Math.max(oldBest,state.score)}</small>`;
    ui.startOverlay.classList.remove('hidden');
    document.getElementById('nextButton').addEventListener('click',()=>startGame(nextIndex));
    document.getElementById('levelsButton').addEventListener('click',showLevelSelect);
    if(passed)setTimeout(playGoalCelebrationSound,120);
  }

  function tick(){
    const now=performance.now();
    if(state.active&&!state.locked&&!state.paused){
      const elapsed=Math.max(0,now-(state.lastTickAt||now))/1000;state.lastTickAt=now;
      state.timeLeft=Math.max(0,state.timeLeft-elapsed*timerRate());
      if(state.timeLeft<=0)decide('timeout');
      ui.timer.textContent=state.timeLeft.toFixed(1);
    } else state.lastTickAt=now;
    updatePowerUpIndicator();
    requestAnimationFrame(tick);
  }

  choiceButtons.forEach(b=>b.addEventListener('click',()=>decide(b.dataset.choice)));
  document.addEventListener('keydown',e=>{if(e.repeat)return;const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rush',ArrowDown:'regroup',Space:'shoot'};const choice=map[e.code]||map[e.key];if(choice){e.preventDefault();decide(choice);}});
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
  window.addEventListener('resize',()=>{resizeCanvas();if(ui.lockerDialog?.open)scheduleGearPreviews();});resizeCanvas();showLevelSelect();cancelAnimationFrame(raf);raf=requestAnimationFrame(drawGame);requestAnimationFrame(tick);
})();
