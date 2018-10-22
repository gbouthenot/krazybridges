convert 0*.png -append spritesv.png
pngcrush -brute spritesv.png spritesv-p.png

convert 0*.png +append spritesh.png
pngcrush -brute spritesh.png spritesh-p.png
