// puzOverrideDefaults.js
function getB(addr) { // only used for regular sudoku-variants
  var x = getX(addr);
  var y = getY(addr);
  return Math.floor(x/3) + Math.floor(y/3)*3;
}

function getX(addr) {
  return addr % puzzWidth;
}

function getY(addr) {
  return Math.floor(addr / puzzWidth);
}

function coordsToAddress(x,y) {
  return y*puzzWidth + x;
}

function deltaSelect(dx,dy,isShift)
{
  if (isShift == undefined) {
    isShift = false;
  }
    if (lastHilite == null) {
        gridClick(0,0);
        return;
    }
    var px = getX(lastHilite);
    var py = getY(lastHilite);
    px += dx;
    py += dy;
  if (px < 0)   px += puzzWidth;
  if (px >= puzzWidth)  px -= puzzWidth;
  if (py < 0)   py += puzzHeight;
  if (py >= puzzHeight) py -= puzzHeight;
    gridClick(px,py,isShift);
}

