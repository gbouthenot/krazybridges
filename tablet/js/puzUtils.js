// puzUtils.js
if (puzzleType == undefined) {
    var puzzleType = 'Sudoku';
}

function handleSearch() {
    var volumeNumber = $('#volumeNumber').val();
    var bookNumber = $('#bookNumber').val();
    var puzzleNumber = $('#puzzleNumber').val();
    var kind = $('#kind').val();
    window.location.href = '?kind=' + kind + '&volumeNumber=' + volumeNumber + '&bookNumber=' + bookNumber + '&puzzleNumber=' + puzzleNumber;
    return false;
}

var gInitState = true;

function setupNavDialog(kind) {
  // console.log("Setting up nav dialog for " + kind);
  if (maxVolume > 1) {
    if (gInitState) {
      $("input#volumeNumber").TouchSpin({
          min: 1,
          max: maxVolume,
          initval: volumeNumber,
      });
    }
  }

  var maxBooks = 100;
  if (typeof getMaxBooks == 'function') { 
      maxBooks = getMaxBooks(kind);
  }

  if (gInitState) {
    $("input#bookNumber").TouchSpin({
        min: 1,
        max: maxBooks,
        initval: bookNumber,
    });
  } else {
    var bookNumber = Math.max(maxBooks, $('#bookNumber').val());
    $('input#bookNumber').trigger("touchspin.updatesettings",{'max':maxBooks, 'initval':bookNumber});
  }

  var maxPuzzlesPerBook = 8;
  if (typeof getMaxPuzzlesPerBook == 'function') { 
      maxPuzzlesPerBook = getMaxPuzzlesPerBook(kind);
  }

  if (gInitState) {
    $("input#puzzleNumber").TouchSpin({
        min: 1,
        max: maxPuzzlesPerBook,
        initval: puzzleNumber,
    });
  } else {
    var puzzleNumber = Math.max(maxPuzzlesPerBook, $('input#puzzleNumber').val());
    $('input#puzzleNumber').trigger("touchspin.updatesettings",{'max':maxPuzzlesPerBook, 'initval':puzzleNumber});
  }
     
  if (gInitState) {
    $("#myNavigation").draggable({
      handle: ".modal-header"
      });
  }
  gInitState = false;
}

function launchNavigation() {
    // Load current settings
    $('select#kind').val(pkind);
    if (maxVolume > 1) {
      $('input#volumeNumber').val(volumeNumber);
    }
    $('input#bookNumber').val(bookNumber);
    $('input#puzzleNumber').val(puzzleNumber);

    setupNavDialog(pkind);
       
    $(document).off('keydown'); // prevent keydown handler from killing stuff...

    $('#myNavigation').modal({});

    $('#myNavigation').on('hidden.bs.modal', function (e) {
        $(document).on('keydown',getKey);
        // do something...
    })

    // Setup button handlers...

    $('#myNavigationForm').submit(handleSearch);

    $('#search-variety').off('click');
    $('#search-variety').on('click',function() {
          window.location.href = '/tablet/';
          return false;
    });

    $('#search-submit').off('click');
    $('#search-submit').on('click',handleSearch);

    $('select#kind').off('change');
    $('select#kind').on('change', function() {
      var val = $(this).val();
      // console.log("Got typechange: " + val);
      setupNavDialog(val);
    });

    return false;

}

function gotoNextPuzzle() {
  // console.log("Next Puzzle");
  window.location.href = nextPuz;
  return false;
}

function gotoPrevPuzzle() {
  // console.log("Prev Puzzle");
  window.location.href = prevPuz;
  return false;
}



function killPuzzleMessage()
{
    $('#ballooncontainer').fadeOut('slow', function() {  $(this).hide(); });
}

function puzzleMessage(textary, forceDurationSecs)
{
    var markup = textary.join('<br>')
    $('#ballooncontainer').html(markup);
    // $('#ballooncontainer').show();
    $('#ballooncontainer').fadeIn('slow');
    $('#ballooncontainer').off('click');
    var duration = 2000+textary.length*2000;

    if (forceDurationSecs != undefined)
        duration = forceDurationSecs*1000;

    if (forceDurationSecs != -1) {
        var itsTimer = setTimeout(function() {
            killPuzzleMessage(); // $('#ballooncontainer').hide('fast');
        }, duration);
    }
    $('#ballooncontainer').on('click', function(e) {
        gIsDragging = false;
        clearTimeout(itsTimer);
        killPuzzleMessage(); // $('#ballooncontainer').hide('fast');
    });
}

if ($.cookie('puzzle_prefs')) {
  // Override prefs if present
  var prefs = $.parseJSON($.cookie('puzzle_prefs'));
  for (var key in prefs) {
    puzzlePrefs[key] = prefs[key];
  }
}

// puzSettings
function launchSettings() {
    // Load current settings
    for (var key in puzzlePrefs) {
        var id = '#prefs-' + key;
        $(id).bootstrapToggle(puzzlePrefs[key]? 'on' : 'off');
    }
    $("#mySettings").draggable({
      handle: ".modal-header"
      });
    $(document).off('keydown');
    $('#mySettings').modal({});
    $('.prefs-toggle').change(function() {
        var field = $(this).data('prefs');
        var isOn = $(this).prop('checked');
        // console.log(field + " is " + isOn);
        puzzlePrefs[field] = isOn;
        refreshCanvas();
        // save cookie here...
        $.cookie('puzzle_prefs', JSON.stringify(puzzlePrefs), {expires:7});
    });
    $('#mySettings').on('hidden.bs.modal', function (e) {
        $(document).on('keydown',getKey);
        // do something...
    });

    // Setup button handlers...
    return false;
}

// Calculator
var gCalcAnswer = 0;
var gCalcOp = ' ';
var gCalcStack = 0;

function setAnswer(ans) {
        $('#calc-answer').html(ans + '<span id="op-feedback">' + gCalcOp + '</span>');
}

function launchCalculator() {
    $("#myCalculator").draggable({
      handle: ".modal-header"
      });
    $('#myCalculator').modal({});

    gCalcAnswer = 0;
    gCalcStack = 0;
    gCalcOp = ' ';

    $('.calc-btn').off('click');
    $('.calc-btn').on('click', function(e) {
        var cmd = $(this).data('calc');
        // console.log("cmd:" + cmd);
        switch (''+cmd) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                gCalcAnswer = (gCalcAnswer * 10) + parseInt(cmd);
                setAnswer(gCalcAnswer);
                break;
            case '+':
            case '-':
                gCalcAnswer = (gCalcOp == '-')? gCalcStack - gCalcAnswer : gCalcStack + gCalcAnswer;
                gCalcStack = gCalcAnswer;
                gCalcOp = cmd;
                gCalcAnswer = 0;
                setAnswer(gCalcStack);
                break;
            case '=':
                gCalcAnswer = (gCalcOp == '-')? gCalcStack - gCalcAnswer : gCalcStack + gCalcAnswer;
                gCalcStack = gCalcAnswer;
                gCalcAnswer = 0;
                gCalcOp = ' ';
                setAnswer(gCalcStack);
                break;
            case 'C':
                gCalcAnswer = 0;
                gCalcStack = 0;
                gCalcOp = ' ';
                setAnswer(gCalcAnswer);
                break;
            default:
                console.log("Unknown input:" + cmd);
                break;
        }
    });
}

function supports_canvas() {
  return !!document.createElement('canvas').getContext;
}

function supports_canvas_text() {
  if (!supports_canvas()) { return false; }
  var dummy_canvas = document.createElement('canvas');
  var context = dummy_canvas.getContext('2d');
  return typeof context.fillText == 'function';
}

function readableElapsed(seconds) {
  var unit_name = '';
  var unit_div = 1;
  if (seconds > 60*60*24) {
    unit_name = 'day';
    unit_div = 60*60*24;
  } else if (seconds > 60*60) {
    unit_name = 'hour';
    unit_div = 60*60;
  } else if (seconds > 60) {
    unit_name = 'minute';
    unit_div = 60;
  } else {
    unit_name = 'second';
    unit_div = 1;
  }
  var units = Math.floor(seconds / unit_div);
  return '' + units + " " + unit_name + (units != 1? "s" : "") + " elapsed";
}

function SuccessAnimationFrame()
{
  var ts = (new Date()).getTime();
  if (doSuccessAnimation) {
    if (ts - doSuccessAnimationTS < doSuccessDuration) {
      setTimeout("SuccessAnimationFrame();", 100);
    }
    else {
      doSuccessAnimation = false;
    }
  }
  refreshCanvas();
}

function SuccessLog()
{
  var url = 'https://krazydad.com/img/kpuzzlesuccess.gif?id=' + puzzleID + '&r=' + (Math.floor(Math.random()*0x7fffff));
  var imageObj = new Image();
  imageObj.src = url;
}

var donateLink = 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dad%40krazydad%2ecom&item_name=KrazyDad+-+Jim+Bumgardner+-+Interactive+Puzzles&item_number=Tablet+Puzzles&no_shipping=1&cn=Your%20comments%20are%20welcome&tax=0&currency_code=USD&bn=PP%2dDonationsBF&charset=UTF%2d8&return=http%3A%2F%2Fkrazydad.com%2Finteractive%2Fpuzzles.php%3Fpaypal%3Dsuccess&cancel_return=http%3A%2F%2Fkrazydad.com%2Finteractive%2Fpuzzles.php%3Fpaypal%3Dcancel&amount=5.0';
var donatePleas = ['<a href="' + donateLink + '">Click here</a> to help support this website.',
                   'The puzzles are free, but web hosting isn\'t!<br><a href="' + donateLink + '">Click here</a> to help support this website.',
                   'Your donations go towards paying my web hosting fees.<br>Want to help? <a href="' + donateLink + '">Click here.</a>',
                   'Want to help me pay my Internet bill?  <a href="' + donateLink + '">Make a donation via PayPal</a>. Thank you!!',
                   'Your PayPal donations keep KrazyDad alive and ticking.<br>Thank you for <a href="' + donateLink + '">helping out</a>!',
                   'If you\'ve already donated, thank you so much!  I really appreciate your support.<br><a href="' + donateLink + '">Click here</a> to help support this website.',
                   'If you can afford it, please help keep KrazyDad running by <a href="' + donateLink + '">making a donation</a> via PayPal. Thank you!!',
                   'Help me pay for my cat\'s Internet bill by  <a href="' + donateLink + '">making a donation</a> via PayPal. Thank you!!',
                   'Help me pay for my puppie\'s tango lessons by  <a href="' + donateLink + '">donating with Paypal</a>. Thank you!!',
                   'Want to help me repair my broken pencil sharpener? <a href="' + donateLink + '">Put some money in the tip jar with Paypal</a>. Thank you!!',
                   ]

function DebutSuccessMessage()
{
  var endTime = (new Date()).getTime();
  var elapsed = Math.floor((endTime - startTime)/1000);

  var cookie = pRec.cookie_data.join('<br>');

  var msg = ["Puzzle Solved!",readableElapsed(elapsed)];

  var maxPuzzlesPerBook = 8;
  if (typeof getMaxPuzzlesPerBook == 'function') { 
      maxPuzzlesPerBook = getMaxPuzzlesPerBook(pkind);
  }
  if (puzzleNumber >= maxPuzzlesPerBook) {
    // donation msg goes here... - turning it off for now...
    msg.push("");
    msg.push("<em>Congratulations on completing book " + bookNumber + "!</em><p>");
    /* plea = donatePleas[bookNumber % donatePleas.length];
       msg.push('<p><br><font size="-1">' + plea + '</font><p>');
    */

    // Every 4th book (32 puzzles or more), throw up an interstitial.
    // This proved to be too rare, switched it to every book-end.
    var interstitial_interval = 1;

    if (bookNumber % interstitial_interval == 0 && !nextPuz.includes('Interstitial')) {
      // Insert Interstitial
      var ist_nextLink = '/tablet/' + currentPuzzleType.toLowerCase() + '/' + nextPuz;
      var vPuzzleType = currentPuzzleType;
      if (vPuzzleType == 'Killer' || vPuzzleType == 'Comparison' || vPuzzleType == 'Jigsaw') {
        vPuzzleType += ' Sudoku';
      } else if (vPuzzleType == 'VSlitherlink') {
        vPuzzleType == 'Variety Slitherlink';
      }
      var ist_title = "Thank you for visiting and supporting the site!";
      var ist_puzzleName = vPuzzleType;
      var ist_puzzleDir = currentPuzzleType.toLowerCase();
      // ppic=<puzzle pic>  (mostly optional)
      nextPuz = '/tablet/tabInterstitial.php?nl=' + encodeURIComponent(ist_nextLink) + 
                '&ti=' + encodeURIComponent(ist_title) + 
                '&pn=' + encodeURIComponent(ist_puzzleName) + 
                '&pd=' + encodeURIComponent(ist_puzzleDir) + 
                '&in=' + encodeURIComponent(vPuzzleType + ' puzzles');
    }
  }

  msg.push("");
  msg.push(cookie);

  puzzleMessage(msg, -1);
}


function DebutSuccessAnimation()
{
  if (doSuccessAnimation)
    return;

  DebutSuccessMessage();

  gIsDragging = false;

  doSuccessAnimation = true;
  doSuccessAnimationTS = (new Date()).getTime();
  SuccessAnimationFrame();
}


function getKey(evt)
{
  if (!evt)
    evt = window.event;  
  var keyCode = evt.keyCode;

  var keyString = String.fromCharCode(keyCode);

  generateKey(keyString, keyCode, evt.shiftKey);
  if (evt.altKey || evt.metaKey) {
    return 1;
  }
  else {
    evt.preventDefault();
    evt.stopPropagation();
    return 0;
  }
}

function setError(msg)
{
  $('#estatus').html(msg);
}

var tmh = null;
function setStatus(msg)
{
  $('#pstatus').html(msg);
    if (msg != '') {
      clearTimeout(tmh);
        tmh = setTimeout("setStatus('');", 5*1000);
    }
}

function checkSolutionButton()
{
  checkSolution(false);
}


function simulateDblClickTouchEvent(oo) {
  var $oo = !oo?{}:$(oo);
  if( !$oo[0] ){ return false; }
  $oo[0].__taps = 0;
  $oo.bind('touchend', function(e) {
    var ot = this;
    ++ot.__taps;
    $d( ot.__taps );
    if( !ot.__tabstm ) /* don't start it twice */  {
      ot.__tabstm = setTimeout( function() {
      if( ot.__taps >= 2 ) {  
        ot.__taps = 0;
        $(ot).trigger('dblclick'); 
      }
      ot.__tabstm = 0;
      ot.__taps = 0;
      }, 800);
    }
  });
  return true;
}
var lastClick;
var lastClickIdx = -1;
var gIsDragging = false;

function canvasTouchDrag(e) {
  e.preventDefault();
  gIsDragging = true;
  canvasClick(e);
  gIsDragging = false;
}

function canvasDrag(e) {
  if (gIsDragging) {
    e.preventDefault();
    canvasClick(e);
  }
}

function isError(addr) {
  if (puzzlePrefs['autoCheckAnswers'] && mySolution.substr(addr,1) != '.' && mySolution.substr(addr,1) != myAnswer.substr(addr,1)) {
    return true;
  }
  return (addr in errorcells) && errorcells[addr];
}

function clearMarks(saveCookie) {
  markcells = {};
  refreshCanvas();
  $.cookie(currentPuzzleType.toLowerCase() + '_markcells', JSON.stringify(markcells), {expires:14});
}

function reinitNewPuzzle()
{
  var moveRec = createSweepCommand('clearpuzzle');
  PushMove(moveRec);
  $.cookie(currentPuzzleType.toLowerCase() + '_startTime', (new Date()).getTime());
}

function loadAnswer() {
  var moveRec = createSweepCommand('loadanswer');
  PushMove(moveRec);
}

function exportImage()
{
  var url = gCanv.toDataURL();
  var win = window.open(url, '_blank');
  win.focus();
}

function setupCanvas()
{
  gCanv.width = gPuzzleWidth;
  gCanv.height = gPuzzleHeight;
  if (typeof localSetupCanvas == 'function') {  // use this to override metrics for specific puzzles
    localSetupCanvas();
  }
  gDC = gCanv.getContext('2d');
}

// UNDO FUNCTIONALITY

gUndoHistory = {'idx':0, 'moveRecs':[]};
var undoQuotaExceeded = false;

function SetUndoVisualState()
{
  var undoIsActive = gUndoHistory.idx > 0;
  var redoIsActive = gUndoHistory.idx < gUndoHistory.moveRecs.length;
  $('#tool_undo').toggleClass('disabled',!undoIsActive);
  $('#tool_redo').toggleClass('disabled',!redoIsActive);
}

function SaveUndoCookie()
{
    // There is currently not enough localstorage to save a full undo history
    // consider measuring it here, and if it exceeds some max size, truncate it and decrement idx
    // if (undoQuotaExceeded)
    //   return;

    // var hist = JSON.stringify(gUndoHistory);
    // // var histc = LZString.compress(hist);
    // console.log("Saving undo hist " + hist.length);
    // // Too slow using compression
    // try {
    //   $.cookie(currentPuzzleType.toLowerCase() + '_undohistory', hist, {expires:14});
    // } finally {
    //   console.log("quota exceeded >>");
    //   undoQuotaExceeded = true;
    // }
}

function LoadUndoCookie()
{
  ClearUndoHistory();

    // if ($.cookie(currentPuzzleType.toLowerCase() + '_undohistory')) {
    //   // console.log("Got Undo Cookie");
    //   try {
    //     var strc = $.cookie(currentPuzzleType.toLowerCase() + '_undohistory');
    //   } finally {
    //     console.log("quota exceeded <<");
    //   }
    //   // gUndoHistory = $.parseJSON(LZString.decompress(strc)); // too slow
    //   gUndoHistory = $.parseJSON(strc);
    // } else {
    //   ClearUndoHistory();
    // }
}

function PushMove(moveRec) {
    // console.log("push move");
    ApplyMove(moveRec);
    if (gUndoHistory.idx < gUndoHistory.moveRecs.length) {
      // Truncate array to current history, redo will no longer work
      gUndoHistory.moveRecs = gUndoHistory.moveRecs.slice(0, gUndoHistory.idx);
    }
    gUndoHistory.moveRecs.push(moveRec);
    gUndoHistory.idx += 1;
    refreshCanvas();
    SetUndoVisualState();
    SaveUndoCookie();
    saveSolutionCookies();
}

function UndoMove()
{
  // console.log("called undomove\n");
  if (gUndoHistory.idx > 0) {
    gUndoHistory.idx -= 1;
    var moveRec = gUndoHistory.moveRecs[gUndoHistory.idx];
    // console.log("calling unapply from undomove\n");
    UnapplyMove(moveRec);
    // console.log("done calling unapply from undomove");
    $('#ballooncontainer').hide();  // hide success balloons on undo
    doSuccessAnimation = false;
    refreshCanvas();
    SetUndoVisualState();
    SaveUndoCookie();
    saveSolutionCookies();
  }
}

function RedoMove()
{
  // console.log("redo move");
  if (gUndoHistory.idx < gUndoHistory.moveRecs.length) {
    var moveRec = gUndoHistory.moveRecs[gUndoHistory.idx];
    gUndoHistory.idx += 1;
    ApplyMove(moveRec);
    refreshCanvas();
    SetUndoVisualState();
    SaveUndoCookie();
    saveSolutionCookies();
  }
}

function ClearUndoHistory()
{
  gUndoHistory = {'idx':0, 'moveRecs':[]};
  // SetUndoVisualState();
  // Do not save cookie here, wait til first move...
}



