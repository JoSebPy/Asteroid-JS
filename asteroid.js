//Asteroid ver. 0.1
//set the canvas
var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx = canvas.getContext("2d");
var counter = 0;
//Event listeners for controllers
var keyPressed = {
  up : false,
  left : false,
  right : false,
  down : false,
  p : false,
  esc : false,
  shift : false,
  e : false,
  b : false,
  space : false
}

window.addEventListener("keydown", function(e){
 switch(e.code){
   case "KeyW":
   case "ArrowUp":
     keyPressed.up = true;
     break;
   case "KeyA":
   case "ArrowLeft":
     keyPressed.left = true;
     break;
   case "KeyD":
   case "ArrowRight":
     keyPressed.right = true;
     break;
   case "KeyS":
   case "ArrowDown":
     keyPressed.down = true;
     break;
   case "KeyP":
     keyPressed.p = true;
     break;
   case "Escape":
     keyPressed.esc = true;
     break;
   case "KeyE":
     keyPressed.e = true;
     break;
   case "KeyB":
     keyPressed.b = true;
     break;
   case "ShiftLeft":
     keyPressed.shift = true;
     break;
   case "Space":
     keyPressed.space = true;
     break;
 }
}, false) 

window.addEventListener("keyup", function(e){
  switch(e.code){
    case "KeyW":
    case "ArrowUp":
      keyPressed.up = false;
      break;
    case "KeyA":
    case "ArrowLeft":
      keyPressed.left = false;
      break;
    case "KeyD":
    case "ArrowRight":
      keyPressed.right = false;
      break;
    case "KeyS":
    case "ArrowDown":
      keyPressed.down = false;
      break;
    case "KeyP":
      keyPressed.p = false;
      pause();
      break;
    case "Escape":
      keyPressed.esc = false;
      pause();
      break;
    case "KeyE":
      keyPressed.e = false;
      break;
    case "KeyB":
      keyPressed.b = false;
      break;
    case "ShiftLeft":
      keyPressed.shift = false;
      break;
    case "Space":
    keyPressed.space = false;
    break;
  }
 }, false)
 
 
 

//----------------------- Constants

const minAsteroid = 5;
const totalSparkles = 100;
//Frame Rate update
const fR = 1000/60;

//The size of the map
const mapWidth = 5000;
const mapHeight = 5000;

//------------------- Variables

var lu = Date.now();
var originX = 0;
var originY = 0;
var middleX = canvas.width/2;
var middleY = canvas.height/2;
var dt = 0;
var fps = 0;
var curSecFrames = 0;
var latestFrameUpdate = 0;
var running = true;


//-------------------- Public Functions
//Turning degree to radian for trigonometric calculation
function toRad(deg){
  return deg * Math.PI / 180;
}

//If Object is in screen
 
function insideCanvas(obj){
  if(obj.pos.x > originX-obj.w  
    && obj.pos.x < originX + canvas.width
    && obj.pos.y > originY-obj.h 
    && obj.pos.y < originY + canvas.height)
    return true;
}

//Collision check with SAT

function checkCollision(shape1, shape2){
  var mtv = Infinity;
    for(let a=0; a<2; a++){
      //for 2 shapes
      if(a == 1){
        temp = shape1 
        shape1 = shape2;
        shape2 = temp;
      }

      //Iterate over all shape's edges
      for(let v=0; v<shape1.p.length; v++){
          let s = shape1.p[v];
          let e = shape1.p[(v+1) % shape1.p.length];
          //get the edge and get the normal axis
          var axis = [e[0]-s[0], e[1]-s[1]];
          var normAxis = [-axis[1], axis[0]];
          var magNAxis = Math.sqrt(normAxis[0]*normAxis[0] + normAxis[1]*normAxis[1]);
          var unitAxis = [normAxis[0]/magNAxis, normAxis[1]/magNAxis];
          //Getting the "shadow cast" of shapes on to the normal axis
          
          //initialize min and max edge magnitudes of shape 1 projection on normal axis
          var minMag1 = Infinity; var maxMag1 = -Infinity;
          for(let p=0; p<shape1.p.length; p++){
            //calculate the scalar projection of every vector on to the normal axis
            var projection = unitAxis[0] * shape1.p[p][0] + unitAxis[1] * shape1.p[p][1];
            //get min max
            minMag1 = Math.min(projection, minMag1);
            maxMag1 = Math.max(projection, maxMag1);
          }

          //get the min max too for the second shape 
          var minMag2 = Infinity; var maxMag2 = -Infinity

          for(let p=0; p<shape2.p.length; p++){
            var projection = unitAxis[0] * shape2.p[p][0] + unitAxis[1] * shape2.p[p][1];
            minMag2 = Math.min(projection, minMag2);
            maxMag2 = Math.max(projection, maxMag2);
          }
          //if at least a projection of an edges
          if(minMag1 > maxMag2 || maxMag1 < minMag2){return false;}
          mtv =  Math.min( Math.min(maxMag2, maxMag1) - Math.max(minMag2, minMag1), mtv); 
      }
    }
    //Shape 1 is now asteroid, reversed
    let dis = [shape2.pos.x - shape1.pos.x, shape2.pos.y - shape1.pos.y]
    let mag = Math.sqrt(dis[0]*dis[0] + dis[1]*dis[1]);
    disposition = [dis[0]/mag * mtv, dis[1]/mag * mtv];
    
    shape2.pos.x += disposition[0];
    shape2.pos.y += disposition[1];

    if(shape2.type == "Player"){
    shape1.xVelo *= -1;
    shape1.yVelo *= -1;
    }
    shape1.pos.x -= disposition[0];
    shape1.pos.y -= disposition[1];
    return true;
}

//--------------------------- Map
function maps(w, h){
  this.width = w;
  this.height = h;
  this.img = null;
  //last position for interpolating
  this.lastPosition = {'x' : originX, 'y' : originY};

  ctx.canvas.width = this.width;
  ctx.canvas.height = this.height;
  ctx.fillStyle = 'rgb(0, 0, 0)'
  ctx.fillRect(0, 0, this.width, this.height);
  this.img = new Image();
  this.img.src = ctx.canvas.toDataURL('image/png');
  
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

maps.prototype.draw = function(ctx, alpha){
  ctx.drawImage(this.img, this.lastPosition.x * (1-alpha) + originX * alpha, this.lastPosition.y * (1-alpha) + originY * alpha, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
}

maps.prototype.follow = function(x, y){
  this.lastPosition = {'x' : originX, 'y' : originY};

  if(x - originX + middleX > canvas.width) originX = x - middleX;
  if(x - canvas.width < originX) originX = x - middleX;
  if(y - originY + middleY > canvas.height) originY =  y - middleY;
  if(y - canvas.height < originY) originY = y - middleY;

  if(originX < 0) originX = 0;
  if(originY < 0) originY = 0;
  if(originX + canvas.width > this.width ) originX = this.width - canvas.width;
  if(originY + canvas.height > this.height ) originY = this.height - canvas.height;
}

//------------------------Classes

function Polygon(x, y, w, h, lv, rv){
  this.pos = {x : x, y : y};
  this.angle = 0;
  this.linearVelo = lv || Math.floor(Math.random() * 1) +0.3;
  this.rotVelo = rv || Math.floor(Math.random() * 1) +0.1;
  this.o = [];
  this.p = [];
  this.h = h;
  this.w = w;
  this.overlap = false;
  this.rgb = 'rgb(0,0,0)';
  this.lastPosition = {'x' : this.pos.x, 'y' : this.pos.y};

  this.render = function(ctx, alpha){
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.rgba || this.rgb;
    if(this.overlap)
    ctx.fillStyle = 'rgb(255,0,0)';
    // if(counter < 30)
    // console.log("Asteroid " + this.counter +" | " + this.p[0] + " | " + this.o[0] + " | " + this.isUpdated)
    ctx.moveTo(this.p[0][0] - originX, this.p[0][1] - originY);
    for(let i = 1; i<this.p.length; i++){
        
        ctx.lineTo(this.p[i][0] - originX, this.p[i][1] - originY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

//--------------------------- Asteroids logic

// Asteroid Constructors
function Asteroid(x, y, width, height, speed, orientation, lineArray, rotVelo){
  var asteroid = new Polygon(x, y, w, h, speed, rotVelo);
  asteroid.x = x;
  asteroid.y = y;
  asteroid.width = width;
  asteroid.height = height;
  asteroid.orientation = orientation;
  asteroid.active = 1;
  asteroid.type = "Asteroid";
  asteroid.counter = counter;
  asteroid.isUpdated = false;
  asteroid.rgb = 'rgb(55,55,55)';
  counter ++;
  
  for(let i=0; i<lineArray.length; i++){
    asteroid.o.push(lineArray[i]);
  }

  asteroid.update = function(timestep){
    for(let i=0; i<this.o.length; i++){
      this.p[i] = [
        Math.cos(toRad(this.angle)) * this.o[i][0] - Math.sin(toRad(this.angle)) * this.o[i][1] + this.pos.x,
        Math.sin(toRad(this.angle)) * this.o[i][0] + Math.cos(toRad(this.angle)) * this.o[i][1] + this.pos.y
      ]
    }
    this.isUpdated = true;
    this.lastPosition.x = this.pos.x;
    this.lastPosition.y = this.pos.y;
    this.pos.x += Math.cos(toRad(this.orientation)) * this.linearVelo * timestep;
    this.pos.y += -Math.sin(toRad(this.orientation)) * this.linearVelo * timestep;

    this.angle += this.rotVelo * timestep;
    if(this.angle > 360) this.angle -= 360;
    if(this.angle < 0) this.angle += 360;
  }

  asteroid.checkLimit = function(){
    //Remove asteroid if they're outside screen boundaries (by flagging)
    limit = 600
    if(this.pos.x - originX < -limit || this.pos.x - originX > canvas.width+limit || this.pos.y - originY < -limit || this.pos.y - originY > canvas.height+limit){
        this.active = 0;
    } 
  }
  return asteroid;
}

function generateAsteroid(){
  wRatio = (canvas.width+100) / canvas.width;
  hRatio = (canvas.height+100) / canvas.height;
  // console.log("Pushing new asteroid | Counter is now at " + counter)
  w = Math.floor(Math.random() * 50 + 50);
  h = Math.floor(Math.random() * 50 + 50);
  var lineArray = [
    [0, -Math.floor(Math.random() * 100 + 50)],
    [Math.floor(Math.random() * 100 * Math.cos(toRad(30))+ 50),
      -Math.floor(Math.random() * 100 * Math.sin(toRad(30))+ 50)],
    [Math.floor(Math.random() * 100 * Math.cos(toRad(60))+ 50), 
      Math.floor(Math.random() * 100 * Math.sin(toRad(60)) + 50)],
    [-Math.floor(Math.random() * 100 * Math.cos(toRad(60))+ 50), 
      Math.floor(Math.random() * 100 * Math.sin(toRad(60)) + 50)],
    [-Math.floor(Math.random() * 100 * Math.cos(toRad(30))+ 50),
      -Math.floor(Math.random() * 100 * Math.sin(toRad(30))+ 50)]
  ]
  
  //Random X and Y position outside of screen
  x = Math.floor( (Math.random() * wRatio*2 - wRatio) * canvas.width) + originX;
  if(x - originX < -w || x - originX > canvas.width)
    y = Math.floor(Math.random() * (canvas.height  - h*2) + h) + originY;
  else
  {
    y = Math.floor(Math.random() * 2);
    if (y >= 1)
      y = Math.floor( (Math.random() * 100) + canvas.width) + originY;
    else
      y = Math.floor( (Math.random() * -100) - h) + originY;
  }

  s = Math.random() * 0.15 + 0.03;
  o = Math.random() * 360;
  var rotVelo = Math.random() * 0.2 - 0.1;
  if(rotVelo == 0) rotVel = 0.1;
  ast = new Asteroid(x, y, w, h, s, o, lineArray, rotVelo);
  return ast;
}


//-------------------- Player Logic
function Player(h, w){
  var player = new Polygon(768, 380, w, h, 0.2, 0.08);
  player.orientation = 270;
  player.maxVelocity = 350;
  player.maxAcceleration = 0.001;
  player.xVelo = 0;
  player.yVelo = 0;
  player.angle = 270;
  player.type = "Player";
  player.rgb = 'rgb(255,255,255)';
  //Player is triangle
  player.o.push([player.w/2, 0]);
  player.o.push([-player.w/2, player.h/2]);
  player.o.push([-player.w/2, -player.h/2]);

  player.update = function(timestep){
    for(let i=0; i<this.o.length; i++){
      this.p[i] = [
        Math.cos(toRad(this.angle)) * this.o[i][0] - Math.sin(toRad(this.angle)) * this.o[i][1] + this.pos.x,
        Math.sin(toRad(this.angle)) * this.o[i][0] + Math.cos(toRad(this.angle)) * this.o[i][1] + this.pos.y
      ]
    }

    this.lastPosition.x = this.pos.x;
    this.lastPosition.y = this.pos.y;

    //since there's no stopping force on outer space, player has to manually stop it, toFixed to make sure
    //it can actually stop
    this.pos.x += timestep * this.xVelo.toFixed(2) * this.maxAcceleration;
    this.pos.y += timestep * this.yVelo.toFixed(2) * this.maxAcceleration;

    if(keyPressed.left)
    this.angle -= timestep * this.rotVelo;

    if(keyPressed.right)
    this.angle += timestep * this.rotVelo;

    if(this.angle > 360) this.angle = 0;

    //Then Boost ship on the x and y axis based on the orientation
    if(keyPressed.up){
      this.xVelo += Math.floor(Math.cos(toRad(this.angle)) * this.linearVelo * timestep);
      this.yVelo += Math.floor(Math.sin(toRad(this.angle)) * this.linearVelo * timestep);
    }

    if(keyPressed.down){ 
      this.xVelo -= Math.floor(Math.cos(toRad(this.angle)) * this.linearVelo * timestep);
      this.yVelo -= Math.floor(Math.sin(toRad(this.angle)) * this.linearVelo * timestep);
    }
    
    if(this.xVelo >= this.maxVelocity) this.xVelo = this.maxVelocity;
    if(this.xVelo <= -this.maxVelocity) this.xVelo = -this.maxVelocity;
    if(this.yVelo >= this.maxVelocity) this.yVelo = this.maxVelocity;
    if(this.yVelo <= -this.maxVelocity) this.yVelo = -this.maxVelocity;

    if(this.pos.x < 0) {this.pos.x = 0; this.xVelo = 0;}
    if(this.pos.x > mapWidth) {this.pos.x = mapWidth; this.xVelo = 0;}
    if(this.pos.y < 0) {this.pos.y = 0; this.yVelo = 0;}
    if(this.pos.y > mapHeight) {this.pos.y = mapHeight; this.yVelo = 0;}
  }
  return player;  
}

//------------------------------------ Sparkles

function Sparkles(x, y, w, h, a, s, l){
  var sparkle = new Polygon(x, y, w, h, 0, 0);
  sparkle.a = a;
  sparkle.alphaFlag = Math.floor(Math.random() * 2 - 1);
  if(sparkle.alphaFlag == 0) sparkle.alphaFlag = 1;
  sparkle.alphaSpeed = s;
  sparkle.linearSpeed = l;
  sparkle.type = "Sparkle";
  sparkle.rgba = 'rgb(255,255,255,'+ sparkle.a +')';

  sparkle.p.push([sparkle.w/2 + sparkle.pos.x, 0 + sparkle.pos.y]);
  sparkle.p.push([sparkle.w * 9/16 + sparkle.pos.x, sparkle.h * 7/16  + sparkle.pos.y]);
  sparkle.p.push([sparkle.w + sparkle.pos.x, sparkle.h/2  + sparkle.pos.y])
  sparkle.p.push([sparkle.w * 9/16 + sparkle.pos.x, sparkle.h * 9/16  + sparkle.pos.y]);
  sparkle.p.push([sparkle.w/2 + sparkle.pos.x, sparkle.h  + sparkle.pos.y])
  sparkle.p.push([sparkle.w * 7/16 + sparkle.pos.x, sparkle.h * 9/16  + sparkle.pos.y]);
  sparkle.p.push([0 + sparkle.pos.x, sparkle.h/2  + sparkle.pos.y])
  sparkle.p.push([sparkle.w * 7/16 + sparkle.pos.x, sparkle.h * 7/16  + sparkle.pos.y]);
  var parentRender = sparkle.render;
  sparkle.render = function(ctx, alpha){

    if(!insideCanvas(this)) return ;
    // console.log('Rendering sparkle at ' + this.pos.x + ", " + this.pos.y)
    if(this.a >= 1.2) this.alphaFlag *= -1; 
    if(this.a <= -0.5) this.alphaFlag *= -1; 
    this.lastPosition = {'x' : this.pos.x, 'y' : this.pos.y};
    parentRender.call(sparkle, ctx);
    this.a += 0.0005 * this.alphaFlag;
    this.rgba = 'rgb(255,255,255,'+ this.a +')';
    // ctx.save();
    //   //ctx.setTransform(1, 0, 0, 1, (this.lastPosition.x * (1-alpha) + this.pos.x * alpha - originX) * this.linearSpeed, (this.lastPosition.y * (1-alpha) + this.pos.y * alpha  - originY) * this.linearSpeed);
    //   ctx.setTransform(1, 0, 0, 1, this.pos.x - originX, this.pos.y - originY);
    //   ctx.fillStyle = 'rgba(255,255,255,'+ this.a +')';
    //   ctx.beginPath();
    //   ctx.moveTo(this.w/2, 0);
    //   ctx.bezierCurveTo(this.w/2, this.h/2, this.w/2, this.h/2, this.w, this.h/2);
    //   ctx.bezierCurveTo(this.w/2, this.h/2, this.w/2, this.h/2, this.w/2, this.h);
    //   ctx.bezierCurveTo(this.w/2, this.h/2, this.w/2, this.h/2, 0, this.h/2);
    //   ctx.bezierCurveTo(this.w/2, this.h/2, this.w/2, this.h/2, this.w/2, 0);
    //   ctx.fill();
    // ctx.restore();
    // this.a += 0.005 * this.alphaFlag;
  }
  return sparkle;
}


function randomSparkle(){
  x = Math.floor( Math.random() * mapWidth )
  y = Math.floor( Math.random() * mapHeight )
  h = Math.random() * 20 + 10;
  w = h * 3/4;
  a = Math.random() * 0.8 + 0.1;
  s = Math.random() * 0.005 + 0.001;
  l = Math.random() * h/15 + 1;

  return new Sparkles(x,y,w,h,a,s,l);
}


//-------------------- Initial state definition

var sparkles = [];
for(let i=0; i<totalSparkles; i++){
  sparkles.push(new randomSparkle()); 
}

var asteroids = [];
for(let i=0; i<minAsteroid; i++){
  asteroids.push(new generateAsteroid());
}

var map = new maps(mapWidth, mapHeight);
var player = new Player(25, 25);




//-------------------- Filling Asteroids Function Chunk

function fillAsteroids(){
  while(asteroids.length != minAsteroid){
    
    // if(counter < 30)
    // console.log("generating asteroid | Counter is now at " + counter)
    asteroids.push(new generateAsteroid());
  }
}

//-------------------- Removing Asteroids Function Chunk

function dumpAsteroids(){
  for(let i=0; i<asteroids.length; i++){
    if(asteroids[i].active == 0){
      // if(counter < 30)
      // console.log("Dumping asteroid " + asteroids[i].counter)
      asteroids.splice(i, 1);
      i--;
    }
  }
}

//--------------------Draw function

function draw(alpha) { 

  //draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  map.draw(ctx, alpha);

  drawDebug(ctx);

  player.render(ctx, alpha);

  for(let i=0; i< totalSparkles; i++){
    sparkles[i].render(ctx, alpha);
    // console.log("Rendering Sparkle " + [i] +" On position " + sparkles[i].pos.x +", " +sparkles[i].pos.y)
  }

  for(ast of asteroids){
    // if(counter < 30)
    // console.log("Rendering " + ast.counter);
    ast.render(ctx, alpha);
  }
  
  if(!running){
    ctx.fillStyle =  'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

//----------------- Update Function
function update(){
  if(dt < fR)
    return 0;
  while(dt >= fR){
    checkKey();
    player.update(fR);

    for(ast of asteroids){
      // if(counter < 30)
      // console.log("Updating " + ast.counter);
      ast.update(fR);
      ast.checkLimit();
    }

    map.follow(player.pos.x, player.pos.y);

    dt -= fR;
  }
  return dt;
}

//--------------------- Game loop

function gameLoop(){
  if(!running){
    lu = Date.now();
    drawDebug();  
  }

  else{
  //Getting delta time
    var now = Date.now();
    dt += now - lu;
    lu = Date.now();
  
    //Getting fps
    if(now > latestFrameUpdate + 1000){
      fps = 0.9 * curSecFrames + (1.0 - 0.9) * fps;
      latestFrameUpdate = now;
      curSecFrames = 0;
    }
    curSecFrames ++;  


    fillAsteroids();


    const dtLeft = update();

    if(dtLeft == 0) return ;
    var alpha = dtLeft/fR;

    draw(alpha);
    for(let i=0; i<asteroids.length; i++){
      for(let j=i+1; j<asteroids.length; j++){
        asteroids[i].overlap = false
        checkCollision(asteroids[i], asteroids[j]);
        if(asteroids[i].overlap){
          asteroids[i].orientation *= -1;
          asteroids[j].orientation *= -1;
        }
      }
    }

    for(let i=0; i<asteroids.length; i++){
      player.overlap = false
      checkCollision(player, asteroids[i]);
    }

    dumpAsteroids();
  } 
  // if(counter < 30)
  // console.log("---End of loop---")
}


//--------------------Key Press Functions
function checkKey(){
  if(keyPressed.shift){
    
  }
  if(keyPressed.space){
    
  }
  if(keyPressed.b){
    
  }
  if(keyPressed.e){
    
  }
}

//--------------------Debug stuffs
function drawDebug(ctx){
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillText(fps, 10, 10);
  ctx.fillText("X Velocity : " + player.xVelo, 10, 20);
  ctx.fillText("Y Velocity : " + player.yVelo, 10, 30);
  ctx.fillText("Player X : " + player.pos.x, 10, 40);
  ctx.fillText("Player Y : " + player.pos.y, 10, 50);
  ctx.fillText("Origin X : " + originX, 10, 60);
  ctx.fillText("Origin Y : " + originY, 10, 70);
  ctx.fillText((player.xVelo < player.maxVelocity  && player.xVelo > -player.maxVelocity), 10, 80);
  ctx.fillText((player.yVelo < player.maxVelocity  && player.yVelo > -player.maxVelocity), 10, 90);
  ctx.fillText("Origin To Middle (X) : " + middleX, 10, 100);
  ctx.fillText("Origin To Middle (Y) : " + middleY, 10, 110);
  ctx.fillText("Canvas Width : " + canvas.width, 10, 120);
  ctx.fillText("Canvas Height : " + canvas.height, 10, 130);
}

//On Pause
function pause(){
  running = !running;
  draw();
}

setInterval(gameLoop, 1);