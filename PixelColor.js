class PixelColor{



  // ints!
  constructor(r,g,b){
    this.red = r;
    this.green = g;
    this.blue = b;
  }
}

PixelColor.BLACK = new PixelColor(0,0,0);
PixelColor.WHITE = new PixelColor(255,255,255);
PixelColor.RED = new PixelColor(255,0,0);
PixelColor.BLUE = new PixelColor(0,0,255);
PixelColor.GREEN = new PixelColor(0,255,0);
PixelColor.YELLOW = new PixelColor(255,255,0);
PixelColor.PURPLE = new PixelColor(255,0,255);
PixelColor.CYAN = new PixelColor(0,255,255);



module.exports = PixelColor;
