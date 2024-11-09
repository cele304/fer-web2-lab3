
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameConfig = {    //pocetni parametri igre (broj cigli po stupcima i redovima i brzina loptice), koji se konfiguriraju na pocetnoj stranici prije pokretanja igre
  brickRowCount: 5,   //odabrane vrijednosti za brzinu loptice i veličinu palice su takve da je igru moguće igrati, odnosno da nije preteška
  brickColumnCount: 8,
  ballSpeed: 4
};
let score = 0;  //igra mjeri broj bodova, cilj igrača je postići što više bodova razbijanjem svih cigli bez gubitka loptice
let highScore = localStorage.getItem('highScore') || 0; //najbolje ostvareni rezultat od kad je igra prvi put pokrenuta pohranjuje se koristeći local storage pomoću HTML5 Web Storage API-ja
let gameOver = false;
let isPaused = false;

//igra se prikazuje u Canvas objektu koji pokriva cijeli prozor web preglednika
canvas.width = window.innerWidth - 10;  //minus 10 zbog bordera, jer se inace ne bi prikazao na donjoj i desnoj strani
canvas.height = window.innerHeight - 10;

let ball, paddle, bricks;
let leftPressed = false;
let rightPressed = false;

//igra pocinje nakon sto korisnik odabere pocetne parametre igre
//na pocetku igre generira se odabran broj cigli koje igrac mora razbiti kako bi pobijedio
function startGame() {
  document.getElementById("config").style.display = "none";
  document.getElementById("gameTitle").style.display = "none";
  gameConfig.brickRowCount = parseInt(document.getElementById("brickRows").value);
  gameConfig.brickColumnCount = parseInt(document.getElementById("brickColumns").value);
  gameConfig.ballSpeed = parseInt(document.getElementById("ballSpeed").value);

  initializeGame();
  draw();
}

function initializeGame() {
  score = 0;
  gameOver = false;
  isPaused = false;

  //objekt koji predstavlja lopticu, loptica se inicijalno generira na središtu palice i počinje se kretati prema gore pod slučajnim kutem
  //loptica se odbija o palicu koju igrac kontrolira na dnu ekrana pomocu strelica lijevo i desno
  ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 10,
    speedX: Math.cos(Math.random() * Math.PI / 3 + Math.PI / 3) * gameConfig.ballSpeed, 
    speedY: -Math.sin(Math.random() * Math.PI / 3 + Math.PI / 3) * gameConfig.ballSpeed,
    color: "#ff9800"
  };

  //objekt koji predstavlja palicu je pravokutnik crvene boje, sjencanje je izvedeno u funkciji drawPaddle
  paddle = {
    height: 10,
    width: 150,
    x: (canvas.width - 150) / 2,
    color: "red"
  };

  //objekt koji predstavlja ciglu je pravokutnik, sjencanje je izvedeno u funkciji drawBricks
  bricks = [];
  const brickWidth = (canvas.width - (gameConfig.brickColumnCount + 1) * 10) / gameConfig.brickColumnCount;
  for (let c = 0; c < gameConfig.brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < gameConfig.brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}


//igrac palicom upravlja pomocu tipkovnice sa strelicama lijevo i desno
//ako zeli pauzirati igru to moze uciniti pritiskom na tipku P, a kad zeli nastaviti igru pritisne istu tu tipku za nastavak igre
//kada je igra pauzirana pritiskom na tipku R moze pokrenuti novu igru s istim postavkama, a ako zeli promijeniti postavke igre to moze uciniti pritiskom na tipku C
//ako je igra zavrsila (korisnik je izgubio ili pobijedio), korisnik ima mogucnosti pokrenuti novu igru s istim postavkama (tipka R) ili promijeniti postavke nove igre (tipka C)
document.addEventListener("keydown", (e) => {
  if (gameOver) {
    if (e.key === "r" || e.key === "R") startGame();
    else if (e.key === "c" || e.key === "C") showConfigScreen();
  } else if (isPaused) {
    if (e.key === "r" || e.key === "R") startGame();
    else if (e.key === "c" || e.key === "C") showConfigScreen();
    else if (e.key === "p" || e.key === "P") {
      isPaused = false;
      draw();
    }
  } else {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    else if (e.key === "p" || e.key === "P") {
      isPaused = true;
      drawPauseScreen();
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

//funkcija za prikaz zaslona sa postavkama igre
function showConfigScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("config").style.display = "block";
  document.getElementById("gameTitle").style.display = "block";
}

//funkcija za prikaz ekrana kada je igra gotova, neovisno o tome je li korisnik pobijedio ili izgubio
function drawGameOver(message) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "48px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);

  ctx.font = "24px Arial";
  ctx.fillText("Press 'R' to restart or 'C' to open settings", canvas.width / 2, canvas.height / 2 + 40);
}

//funkcija za prikaz ekrana kada je igra pauzirana
function drawPauseScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "48px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);

  ctx.font = "24px Arial";
  ctx.fillText("Press 'P' to resume, 'R' to restart, or 'C' to open settings", canvas.width / 2, canvas.height / 2 + 40);
}

//objekt koji predstavlja ciglu je pravokutnik sa sjencanjem ruba
//ova funkcija crta cigle u objektu Canvas i prikazuje ih pomocu Canvas API-ja
function drawBricks() {
  const brickWidth = (canvas.width - (gameConfig.brickColumnCount + 1) * 10) / gameConfig.brickColumnCount;
  const brickHeight = 20;
  const brickPadding = 10;
  const brickOffsetTop = 30;

  for (let c = 0; c < gameConfig.brickColumnCount; c++) {
    for (let r = 0; r < gameConfig.brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + 10;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#0095DD";
        ctx.shadowColor = 'black'; //boja sjencanja sjencanja
        ctx.shadowBlur = 10;       //intenzitet sjencanja
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

//funkcija za crtanje loptice u objektu Canvas
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.closePath();
}

//objekt koji predstavlja palicu je crveni pravokutnik sa sjencanjem ruba
//ova funkcija crta palicu u objektu Canvas i prikazuje ju pomocu Canvas API-ja
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
  ctx.fillStyle = paddle.color;
  ctx.shadowColor = 'black'; //boja sjencanja sjencanja
  ctx.shadowBlur = 10;       //intenzitet sjencanja
  ctx.fill();
  ctx.closePath();

}

//funkcija koja prikazuje trenutni broj bodova i maksimalni broj bodova u gornjem desnom rubu Canvasa
function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#FFF";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + score + " | High Score: " + highScore, canvas.width - 10, 20);
}


//U svakom koraku animacije detektira se kolizija (sudar) loptice s ciglama, palicom i rubovima ekrana 
//Nakon svakog sudara s ciglom, cigla nestaje, a igrač dobiva bodove (1 uništena cigla = 1 bod).
function collisionDetection() {
  let allBricksCleared = true;
  for (let c = 0; c < gameConfig.brickColumnCount; c++) {
    for (let r = 0; r < gameConfig.brickRowCount; r++) {
      const brick = bricks[c][r];
      if (brick.status === 1) {
        allBricksCleared = false; // nisu sve cigle uklonjene
        if (
          ball.x > brick.x &&
          ball.x < brick.x + (canvas.width / gameConfig.brickColumnCount) &&
          ball.y > brick.y &&
          ball.y < brick.y + 20
        ) {
          ball.speedY = -ball.speedY; //ako je loptica dosla do cigle vraca se natrag
          brick.status = 0;
          score++;
          if (score > highScore) {      //ako je trenutni rezultat veći od trenutnog maksimuma, postavlja se novi maksimalni rezultat koji je jednak trenutnom rezultatu
            highScore = score;
            localStorage.setItem('highScore', highScore);
          }
        }
      }
    }
  }

  if (allBricksCleared) {       //ako su sve cigle uklonjene prikazuje se ekran sa porukom da je korisnik pobijedio
    gameOver = true;
    drawGameOver("YOU WON!");
  }
}

//funkcija za inicijalizaciju same igre, cigle su raspoređene u nekoliko redova na vrhu ekrana, dok se loptica i palica nalaze na dnu
function draw() {
  if (gameOver) return;
  if (isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  collisionDetection();

  if (ball.y + ball.speedY > canvas.height - ball.radius) {   //ako loptica izađe izvan donjeg ruba ekrana, igra završava, te se preko sredine Canvasa prikazuje obavijest "GAME OVER" velikih slova
    gameOver = true;
    drawGameOver("GAME OVER");
    return;
  }

  //Loptica se kreće konstantnom brzinom, a smjer mijenja prilikom udara o palicu, cigle ili rubove ekrana. 
  ball.x += ball.speedX; //povećavaj brzinu loptice
  ball.y += ball.speedY;

  if (ball.x + ball.speedX > canvas.width - ball.radius || ball.x + ball.speedX < ball.radius) { 
    ball.speedX = -ball.speedX;
  }
  if (ball.y + ball.speedY < ball.radius) {
    ball.speedY = -ball.speedY;
  } else if (ball.y + ball.speedY > canvas.height - ball.radius) {
    if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      ball.speedY = -ball.speedY;
    }
  }

  if (rightPressed && paddle.x < canvas.width - paddle.width) { //pomicanje palice svakim pritiskom na tipke lijevo ili desno
    paddle.x += 7;
  } else if (leftPressed && paddle.x > 0) {
    paddle.x -= 7;
  }

  requestAnimationFrame(draw);
}
