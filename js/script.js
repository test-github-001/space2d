'use strict';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.font = '9px Roboto-Regular';
ctx.fillStyle = 'orangered';
ctx.textBaseline = 'top';

document.body.prepend(canvas);

var background = new Image();
background.src = "./src/images/space-bg.jpg";
background.width = 3840;
background.height = 2400;

let vw, vh, bgX, bgY, bgW, bgH, outside, maxStars;

window.addEventListener('resize', updateSizes);
function updateSizes() {
    canvas.width = vw = window.innerWidth;
    canvas.height = vh = window.innerHeight;

    let k_w = background.width / vw;  // 3840/360 = 10.67
    let k_h = background.height / vh; // 2400/720 = 3,33
    let k = k_w < k_h ? k_w : k_h;    // 3,33
    bgW = Math.floor(vw * k);         // 1198
    bgH = Math.floor(vh * k);         // 2397
    bgX = Math.floor((background.width - bgW) / 2);
    bgY = Math.floor((background.height - bgH) / 2);

    outside = (vw > vh) ? Math.floor(vw / 4) : Math.floor(vh / 4);

    maxStars = vw * vh / 250;
}
updateSizes();

const getDistance = (x1, y1, x2, y2) => Math.sqrt( Math.pow( (x1 - x2), 2) + Math.pow( (y1 - y2), 2) );

class Star {

    constructor(x, y) {
        this.speed = 0.001 + Math.random() / 1000;
        this.fuelWeight = 4 + Math.ceil(Math.random() * 6);
        this.usedWeight = 2 + Math.ceil(Math.random() * 8);
        this.weight = this.getWeight();
        this.temperature = this.getTemperature();
        this.color = this.getColor();
        this.size = this.getSize();
        // 0 - top; 1 - right; 2 - bottom; 3 - left.
        let starSide = Math.floor(Math.random() * 4);
        this.x = x || (starSide === 0 || starSide === 2) ? Math.floor(Math.random() * vw) 
            : (starSide === 1)? vw + this.size : 0 - this.size;
        this.y = y || (starSide === 1 || starSide === 3) ? Math.floor(Math.random() * vh)
            : (starSide === 2) ? vh + this.size : 0 - this.size;

        let targetX = (starSide === 0 || starSide === 2) ? Math.floor(Math.random() * vw) 
            : (starSide === 3)? vw + this.size : 0 - this.size;
        let targetY = (starSide === 1 || starSide === 3) ? Math.floor(Math.random() * vh)
            : (starSide === 0) ? vh + this.size : 0 - this.size;
        
        let dx = targetX - this.x; // - 10
        let dy = targetY - this.y; //  4.5
        let path = Math.sqrt( Math.pow(dx, 2) + Math.pow(dy, 2) );
        let steps = path / this.speed;

        this.stepX = dx / steps;
        this.stepY = dy / steps;
        
        this.isExist = true;
    }

    draw() {
        this.x += this.stepX;
        this.y += this.stepY;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        if (this.size > 12) {
            let text1 = `Fuel: ${Math.ceil(this.fuelWeight)} / Used: ${Math.floor(this.usedWeight)}`;
            let text2 = `weight: ${Math.ceil(this.weight)};`;
            let text3 = `t: ${Math.round(this.temperature)}; R: ${Math.round(this.size)}`;
            ctx.fillStyle = '#00ff00';
            ctx.fillText  (text1, this.x + this.size + 5, this.y - this.size);
            ctx.fillText  (text2, this.x + this.size + 5, this.y - this.size + 12);
            ctx.fillText  (text3, this.x + this.size + 5, this.y - this.size + 24);
        }

        this.burn();

        if (this.x + this.size + this.speed < -outside
        || this.x - this.size - this.speed > vw + outside
        || this.y + this.size + this.speed < -outside
        || this.y - this.size - this.speed > vh + outside)
        {
            this.isExist = false;
        }
    }

    burn() {
        let fuelNeed = this.weight / 10000;
        if (this.fuelWeight > fuelNeed) {
            this.fuelWeight -= fuelNeed;
            this.usedWeight += fuelNeed * 2;
            this.weight += fuelNeed;
            this.temperature = (this.temperature < this.getTemperature()) ? this.temperature + 1 : this.temperature - 1;
        } else if (this.temperature > 1) {
            this.temperature -= 100 / this.weight;
            this.color = this.getColor();
        } else {
            this.isExist = false;
            explosionsArr.push( new Explosion(this.x, this.y, this.weight, this.size) );
            if (this.weight > 50) starsArr.push( new Star(this.x, this.y) );
        }
        this.weight = this.getWeight();
        this.color = this.getColor();
        this.size = this.getSize();
        
    }

    getTemperature() {
        return Math.ceil( (this.fuelWeight / this.weight) * 1000 );
    }

    getColor() {
        if (this.temperature >= 765) return `rgb(0, 255, 255)`;
        if (this.temperature > 509)  return `rgb(${255 - (this.temperature - 510)}, 255, 255)`;
        if (this.temperature > 254)  return `rgb(255, 255, ${this.temperature - 255})`;
        return `rgb(255, ${this.temperature}, 0)`;
    }

    getWeight() {
        return this.fuelWeight + this.usedWeight * 2;
    }

    getSize() {
        return Math.sqrt(this.weight) / 3;
    }

    getGravity(x, y, weight, distance) {
        let dx = this.x - x;
        let dy = this.y - y;
        let G = weight / (distance * distance);
        this.stepX -= (dx * G) / 1000;
        this.stepY -= (dy * G) / 1000;
    }
}

class ClickStar extends Star {
    constructor(x, y) {
        super();

        this.x = x;
        this.y = y;

        this.stepX = (x > vw / 2) ? 0.2 : -0.2;
        this.stepY = 0;
    }
}

canvas.addEventListener('click', event => {
    starsArr.push(new ClickStar(event.x, event.y));
});

class Explosion {
    constructor(x, y, weight, size) {
        this.x = x;
        this.y = y;
        this.size = size / 2;
        this.opacity = 0.5;
        this.opacitySub = 0.003;
        this.colorG = 255;
        this.colorB = 255;

        this.isExist = true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.strokeStyle = `rgba(128, ${this.colorG}, ${this.colorB}, ${this.opacity})`;
        ctx.lineWidth = this.size / 2;
        ctx.stroke();

        this.size += 1;
        if (this.colorB > 1) this.colorB -= 2;
        if (this.colorG > 0) this.colorG--;
        this.opacity = (this.opacity >= this.opacitySub) ? this.opacity - this.opacitySub : 0
        if (this.opacity === 0) this.isExist = false;
    }
}

let starsArr = [];
let explosionsArr = [];

function checkStarsDistance() {
    for (let i = 0; i < starsArr.length - 1; i++) {
        for (let j = i+1; j < starsArr.length; j++) {
            let distance = getDistance(starsArr[i].x, starsArr[i].y, starsArr[j].x, starsArr[j].y);
            if (distance < Math.abs(starsArr[i].size - starsArr[j].size) * 1.5) confluence(starsArr[i], starsArr[j]);
            else {
                starsArr[i].getGravity(starsArr[j].x, starsArr[j].y, starsArr[j].weight, distance);
                starsArr[j].getGravity(starsArr[i].x, starsArr[i].y, starsArr[i].weight, distance);
            }
        }
    }
}

function confluence(starA, starB) {
    let [bigger, smaller] = (starA.weight > starB.weight) ? [starA, starB] : [starB, starA];
    bigger.weight += smaller.fuelWeight + smaller.usedWeight * 0.7;
    bigger.fuelWeight += smaller.fuelWeight;
    bigger.usedWeight += smaller.usedWeight / 2;
    bigger.temperature += smaller.fuelWeight * 0.05;

    //smaller.fuelWeight = 0;
    //smaller.usedWeight /= 2;
    smaller.isExist = false;
}

// ANIMATION
let frame = 0;
function animate() {
    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(background, bgX, bgY, bgW, bgH, 0, 0, vw, vh);

    starsArr.forEach( star => star.draw() );
    explosionsArr.forEach( exp => exp.draw() );
    
    checkStarsDistance();

    explosionsArr = explosionsArr.filter(exp => exp.isExist);
    starsArr = starsArr.filter(star => star.isExist);

    //if (frame % 10 === 0 && starsArr.length < maxStars) starsArr.push( new Star() );
    if (starsArr.length < maxStars) starsArr.push( new Star() );

    frame++;
    requestAnimationFrame(animate);
}

background.onload = function(){
    animate();
}
