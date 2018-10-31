// loopUtils.js - for Slitherlink Variants, Bridges and Galaxies
function generateKey(keyString, keyCode, domark) 
{
  if (keyCode == 192)
      keyString = '~';

  switch (keyString) {
    case 'a':
    case 'A':
      checkSolutionButton();
      break;
    // case 'h':
    // case 'H':
    //   provideHint();
    //   break;
    case 'i':
    case 'I':
      provideInstructions();
      break;

    case '~':
      loadAnswer();
      break;
  }
  refreshCanvas();
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

function provideInstructions()
{
  var myInstructions = puzzleInstructions;

   puzzleMessage(myInstructions, -1);
}

function checkSolution(quiet)
{
  var endTime = (new Date()).getTime();
  var elapsed = Math.floor((endTime - startTime)/1000);
  var nbrErrors = checkForErrors(true);
  if (nbrErrors == 0) {
      puzzleMessage(["Nothing wrong yet!",readableElapsed(elapsed)]);
  }
  refreshCanvas();
}

function provideHint()
{

}

function myResize(e) {
  // GB var maxPuzzleHeight = Math.min(window.innerWidth-50,window.innerHeight - (128 + (useSlitherlinkTools? 48 : 0)));
  //var maxPuzzleHeight = Math.min(window.innerHeight-50,window.innerHeight - (128 + (useSlitherlinkTools? 48 : 0)));
  //var maxPuzzleWidth = window.innerWidth - 56;
  var maxPuzzleHeight = window.innerHeight-50;
  var maxPuzzleWidth = window.innerWidth;

  if (gGridWidth/gGridHeight > maxPuzzleWidth/maxPuzzleHeight) {
    // scale by max-width
    gPuzzleWidth = Math.max(200,maxPuzzleWidth);
    gPuzzleHeight = (gPuzzleWidth * gGridHeight) / gGridWidth;
  } else {
    // scale by max-height
    gPuzzleHeight = Math.max(200,maxPuzzleHeight);
    gPuzzleWidth = (gPuzzleHeight * gGridWidth) / gGridHeight;
  }
  if (typeof localAdjustPuzzleFrame == 'function') {  // use this to override metrics for specific puzzles
    localAdjustPuzzleFrame();
  }

  $('#puzzlecontainer').css('width',gPuzzleWidth);
  $('#puzzlecontainer').css('height',gPuzzleHeight);
  $('#canvascontainer').css('width',gPuzzleWidth);
  $('#canvascontainer').css('height',gPuzzleHeight);
  $('#canvascontainer').css('min-height',gPuzzleHeight);
  $('#titlecontainer').css('top',gPuzzleHeight);
  $('#copycontainer').css('top',gPuzzleHeight);
  $('#copycontainer').css('left',gPuzzleWidth-157);
  $('#logocontainer').css('width',gPuzzleWidth);
  $('#logocontainer').css('top',gPuzzleHeight/2-45);
  var logoWidth = Math.min(gPuzzleWidth-50, 405);
  $('#logocontainer img').css('width',logoWidth);
  $('#logocontainer img').css('height','auto');
  $('.puzzlebuttons').css('width',Math.min(500,gPuzzleWidth));
  $('.toolbuttons').css('width',Math.min(500,gPuzzleWidth)*4/5);
  gCellWidth = (gPuzzleWidth-gPuzzMarginH*2) / puzzWidth;
  gCellHeight = (gPuzzleHeight-gPuzzMarginV*2) / puzzHeight;
  gFontHeight = Math.round((25/50)*gCellHeight);

  // console.log("  puzzle resized: " + [gPuzzleWidth, gPuzzleWidth, (gPuzzleWidth-gPuzzMarginH*2)/gCellWidth, (gPuzzleWidth-gPuzzMarginV*2)/gCellHeight])

  setupCanvas();

  if (typeof localResize == 'function') {  // use this to override metrics for specific puzzles
    localResize();
  }

  refreshCanvas();
}



