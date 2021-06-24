var canvas, ctx, stats;
var width, height;
var imgData,histogram,maxFrequency=0;
var realTimeRenderStrength = 0.1;
var renderThreshold = 0;
var renderBrightness = 1.1;
var mainPoint;
var attractors, attractorMaxSize = 6, attractorMinSize=3;
var variationMaxSize = 6, chosenVariations;
var framePixelDraws = 10000, baseFramePixelDraws = 10000, lastTimestamp, frameCount;
var animationFrameHandle;


class Point {
    constructor(random=false, x=0, y=0, color=[0,0,0]) {
        if(random){
            this.randomize();
        }
        else {
            this.x = x;
            this.y = y;
            this.color = color;
        }
    }

    randomize() {
        this.x = getRandomFloat(-1,1);
        this.y = getRandomFloat(-1,1);
        this.color = getRandomColor();
    }
}

class Variation {
    constructor(nameIndex=0, weight=1){
        this.nameIndex = nameIndex;
        this.weight = weight;
    }

    static variationTotal = 36;

    static radius(x,y) { return Math.sqrt(x*x + y*y); }

    static radius_sq(x,y) { return x*x + y*y; }

    static theta(x,y) { return Math.atan2(x,y); }

    static phi(x,y) { return Math.atan2(y,x); }

    static Omega() {
        return (Math.random() > 0.5 ? 0 : Math.PI);
    }

    static Psi() {
        return Math.random();
    }

    static variationFunctions = [
        // 0.线性
        function linear(x,y,affineParams=[],weight=1) { 
            return [x, y]; 
        },
        // 1.正弦
        function sinusoidal(x,y,affineParams=[],weight=1) { 
            return [Math.sin(x), Math.sin(y)]; 
        },
        // 2.余弦
        function cosine(x,y,affineParams=[],weight=1) { 
            return [Math.cos(Math.PI*x)*Math.cosh(y), -Math.sin(Math.PI*x)*Math.sinh(y)]; 
        },
        // 3.正切
        function tangent(x,y,affineParams=[],weight=1) { 
            return [Math.sin(x)/Math.cos(y), Math.tan(y)]; 
        },
        // 4.双曲线
        function hyperbolic(x,y,affineParams=[],weight=1) { 
            return [Math.sin(Variation.theta(x,y))/Variation.radius(x,y), Variation.radius(x,y)*Math.cos(Variation.theta(x,y))]; 
        },
        // 5.极坐标
        function polar(x,y,affineParams=[],weight=1) { 
            return [Variation.theta(x,y)/Math.PI, Variation.radius(x,y)-1]; 
        },
        // 6.波
        function waves(x,y,affineParams=[],weight=1) { 
            let b = affineParams[1], c = affineParams[2], e=affineParams[4], f=affineParams[5];
            return [x+b*Math.sin(y/(c*c)), y+e*Math.sin(x/(f*f))]; 
        },
        // 7.自然指数
        function exponential(x,y,affineParams=[],weight=1) { 
            return [Math.exp(x-1)*Math.cos(Math.PI*y), Math.exp(x-1)*Math.sin(Math.PI*y)]; 
        },
        // 8.极坐标幂
        function power(x,y,affineParams=[],weight=1) { 
            let m1 = Math.pow(Variation.radius(x,y), Math.sin(Variation.theta(x,y)));
            return [m1*Math.cos(Variation.theta(x,y)), m1*Math.sin(Variation.theta(x,y))]; 
        },
        // 9.射线
        function rays(x,y,affineParams=[],weight=1) {
            let m1 = weight*Math.tan(Variation.Psi()*Math.PI*weight)/Variation.radius_sq(x,y);
            return [m1*Math.cos(x), m1*Math.sin(y)];
        },
        // 10.割线
        function secant(x,y,affineParams=[],weight=1) { 
            return [x, 1/(weight*Math.cos(weight*Variation.radius(x,y)))]; 
        },
        // 11.球面
        function spherical(x,y,affineParams=[],weight=1) {
            let m1 = 1/Variation.radius_sq(x,y);
            return [m1*x, m1*y]; 
        },
        // 12.漩涡
        function swirl(x,y,affineParams=[],weight=1) {
            let m1 = Variation.radius_sq(x,y), m2 = Math.sin(m1), m3 = Math.cos(m1);
            return [x*m2-y*m3, x*m3+y*m2]; 
        }, 
        // 13.马掌
        function horseshoe(x,y,affineParams=[],weight=1) {
            let m1 = 1/Variation.radius(x,y);
            return [m1*(x-y)*(x+y), m1*2*x*y]; 
        }, 
        // 14.方巾
        function handkerchief(x,y,affineParams=[],weight=1) {
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            return [m1*Math.sin(m2+m1), m1*Math.cos(m2-m1)]; 
        }, 
        // 15.心
        function heart(x,y,affineParams=[],weight=1){
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            return [m1*Math.sin(m2*m1), -m1*Math.cos(m2*m1)]; 
        },
        // 16.圆盘
        function disc(x,y,affineParams=[],weight=1){
            let m1 = Variation.theta(x,y)/Math.PI, m2 = Variation.radius(x,y)*Math.PI;
            return [m1*Math.sin(m2), m1*Math.cos(m2)]; 
        },
        // 17.螺旋
        function spiral(x,y,affineParams=[],weight=1){
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            return [1/m1*(Math.cos(m2)+Math.sin(m1)), 1/m1*(Math.sin(m2)-Math.cos(m1))]; 
        },
        // 18.环
        function ring(x,y,affineParams=[],weight=1){
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            let m3 = affineParams[2]*affineParams[2];
            let m4 = ((m1+m3)%(2*m3))-m3+m1*(1-m3);
            return [m4*Math.cos(m2),m4*Math.sin(m2)]; 
        },
        // 19.钻石
        function diamond(x,y,affineParams=[],weight=1){
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            return [Math.cos(m1)*Math.sin(m2), Math.cos(m2)*Math.sin(m1)];
        },
        // 20.鱼眼A
        function fisheye(x,y,affineParams=[],weight=1){
            let m1 = 2/(Variation.radius(x,y)+1);
            return [m1*y, m1*x];
        },
        // 21.鱼眼B
        function eyefish(x,y,affineParams=[],weight=1){
            let m1 = 2/(Variation.radius(x,y)+1);
            return [m1*x, m1*y];
        },
        // 22.爆米花
        function popcorn(x,y,affineParams=[],weight=1){
            let c = affineParams[2], f=affineParams[5];
            return (x+c*Math.sin(Math.tan(3*y)), y+f*Math.sin(Math.tan(3*x)))
        },
        // 23.风扇
        function fan(x,y,affineParams=[],weight=1){
            let t = Math.PI*affineParams[2]*affineParams[2], f=affineParams[5];
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            if((m2+f)%t > t/2){
                return [m1*Math.cos(m2-t/2), m1*Math.sin(m2-t/2)];
            }
            else{
                return [m1*Math.cos(m2+t/2), m1*Math.sin(m2+t/2)];
            }
        },
        // 24.气泡
        function bubble(x,y,affineParams=[],weight=1){
            let m1 = 4/(Variation.radius_sq(x,y)+4);
            return [m1*x, m1*y];
        },
        // 25.圆柱
        function cylinder(x,y,affineParams=[],weight=1){
            return [Math.sin(x),y];
        },
        // 26.拱
        function arch(x,y,affineParams=[],weight=1){
            let m1 = Variation.Psi()*Math.PI*weight;
            return [Math.sin(m1), Math.sin(m1)*Math.sin(m1)/Math.cos(m1)]
        },
        // 27.对角线
        function ex(x,y,affineParams=[],weight=1){
            let m1 = Variation.radius(x,y), m2 = Variation.theta(x,y);
            let p0 = Math.sin(m2+m1), p1 = Math.cos(m2-m1);
            let p2 = p0*p0*p0, p3 = p1*p1*p1;
            return [m1*(p2+p3), m1*(p2-p3)];
        },
        // 28.十字
        function cross(x,y,affineParams=[],weight=1){
            let m1 = Math.abs(1/(x*x-y*y));
            return [m1*x, m1*y];
        },
        // 29.刀刃  
        function blade(x,y,affineParams=[],weight=1){
            let m1 = Variation.Psi()*Variation.radius(x,y)*weight;
            return [x*(Math.cos(m1)+Math.sin(m1)),x*(Math.cos(m1)-Math.sin(m1))]
        },
        // 30.双三角
        function twintriangle(x,y,affineParams=[],weight=1){
            let m1 = Variation.Psi()*Variation.radius(x,y)*weight;
            let m2 = Math.sin(m1), m3 = Math.cos(m1);
            let t = Math.log10(m2*m2)+m3;
            return [x*t,x*(t-Math.PI*m2)];
        },
        // 31.朱利亚集
        function julia(x,y,affineParams=[],weight=1){
            let m1 = Math.sqrt(Variation.radius(x,y)), m2 = Variation.theta(x,y)/2+Variation.Omega();
            return [m1*Math.cos(m2), m1*Math.sin(m2)];
        },
        // 32.弯曲
        function bent(x,y,affineParams=[],weight=1){
            if(x>=0){
                if(y>=0){
                    return [x, y];
                }
                else{
                    return [x, y/2];
                }
            }
            else{
                if(y>=0){
                    return [2*x, y];
                }
                else{
                    return [2*x, y/2];
                }
            }
        },
        // 33.噪音
        function noise(x,y,affineParams=[],weight=1){
            let psi1 = Variation.Psi(), psi2 = 2*Math.PI*Variation.Psi();
            return [psi1*x*Math.cos(psi2), psi1*y*Math.sin(psi2)];
        },
        // 34.模糊
        function blur(x,y,affineParams=[],weight=1){
            let psi1 = Variation.Psi(), psi2 = 2*Math.PI*Variation.Psi();
            return [psi1*Math.cos(psi2), psi1*Math.sin(psi2)];
        },
        // 35.高斯模糊
        function gaussian(x,y,affineParams=[],weight=1){
            let psi_sum = -2, psi5 = 2*Math.PI*Variation.Psi();
            for(var i=0; i<4; i++){
                psi_sum += Variation.Psi();
            }
            return [psi_sum*Math.cos(psi5), psi_sum*Math.sin(psi5)];
        },
        // 36.方形
        function square(x,y,affineParams=[],weight=1){
            return [Variation.Psi()-0.5, Variation.Psi()-0.5];
        }
    ]

}

class Attractor {
    constructor(random=false, weight=1, affineParams=[1,0,0,0,1,0], color=[0,0,0]) {
        if(random){
            this.randomize();
        }
        else {
            this.weight = weight;
            this.affineParams = affineParams;
            this.color = color;
            this.variations=[];
            this.variations[0] = new Variation(false, 0, 1);
        }
    }

    //TODO: 参考inferno随机
    randomize(){
        this.weight = Math.random();
        this.affineParams = [];
        for(var i=0; i<6; i++){
            this.affineParams[i] = getRandomFloat(-1,1);
        }
        this.color = getRandomColor();

        // 创建variation,从给定范围选择不重复的类型，并归一化权重
        this.variations = [];
        let variationSize = getRandomInt(1,variationMaxSize);
        let chosenAttractorVariations =getRandomPermutation(variationMaxSize).slice(0,variationSize);
        let normalized_weight = [], weight_sum = 0;
        for(var i=0; i<variationSize; i++){
            this.variations[i] = new Variation(chosenVariations[chosenAttractorVariations[i]],Math.random());
            normalized_weight[i] = this.variations[i].weight;
            weight_sum += this.variations[i].weight;
        }

        normalized_weight[variationSize-1] = 1;
        for(var i=0; i<variationSize-1; i++){
            normalized_weight[i] = roundToDecimal((normalized_weight[i] / weight_sum), 3);
            this.variations[i].weight = normalized_weight[i];
            normalized_weight[variationSize-1] -= normalized_weight[i];
        }
        this.variations[variationSize-1].weight = roundToDecimal(normalized_weight[variationSize-1],3);
    }

    apply(point){
        let affinePoint = new Point();
        // 初始变换
        affinePoint.x = this.affineParams[0] * point.x + this.affineParams[1] * point.y + this.affineParams[2];
        affinePoint.y = this.affineParams[3] * point.x + this.affineParams[4] * point.y + this.affineParams[5];
        
        let newPoint = new Point();
        // 应用变体
        let variationSize = this.variations.length;
        for(var i=0; i<variationSize; i++) {
            let coordinate = Variation.variationFunctions[this.variations[i].nameIndex](affinePoint.x, affinePoint.y,this.affineParams,this.weight);
            let weight = this.variations[i].weight;
            newPoint.x += weight * coordinate[0];
            newPoint.y += weight * coordinate[1];
        }

        // 计算颜色
        for(var i=0; i<3; i++) {
            newPoint.color[i] = Math.round((this.color[i] + point.color[i])/2);
        }

        return newPoint;
    }
}

function init(){   
    canvas = document.getElementById("canvas");

    width = canvas.width;
    height = canvas.height;

    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0,0,width,height);
    // ctx.save();
    // ctx.translate(Math.round(width / 2), Math.round(height / 2))
    // ctx.scale(1,-1);

    // stats = new Stats();
    // stats.showPanel(0);
    // document.body.appendChild( stats.dom );
    ctx.fillRect(0,0,width,height);

    imgData = ctx.getImageData(0,0,width,height);

    histogram = new Uint32Array(width*height*4);

    mainPoint = new Point(true);

    attractors = [];
    chosenVariations = [];
    createChosenVariations(variationMaxSize);
    createAttractors();
    // createAttractors_sierpinski_triangle();
    // createAttractors_barnsley_fern();

    lastFrameTimestamp = performance.now();
    animationFrameHandle = window.requestAnimationFrame(tick);

};

function tick(timestamp){   
    // stats.begin();
    frameCount++;
    if(timestamp - lastFrameTimestamp >= 1000){
        lastFrameTimestamp = timestamp;
        if(frameCount > 59 && vm.calculating){
            framePixelDraws += 2000;
        }
        else {
            framePixelDraws = Math.max(framePixelDraws - 2000,baseFramePixelDraws);
        }
        frameCount = 0;
        
    }

    if(vm.calculating){
        drawFlame(framePixelDraws);
    }

    
    
    // stats.end();
    animationFrameHandle = window.requestAnimationFrame(tick);
}

function reset(){
    window.cancelAnimationFrame(animationFrameHandle);
    ctx.clearRect(0,0,width,height);
    ctx.fillRect(0,0,width,height);

    delete imgData, histogram, attractors, chosenVariations;
    maxFrequency=0;

    imgData = ctx.getImageData(0,0,width,height);

    histogram = new Uint32Array(width*height*4);

    mainPoint = new Point(true);

    attractors = [];
    chosenVariations = [];
    createChosenVariations(variationMaxSize);
    createAttractors();

    framePixelDraws = baseFramePixelDraws;
    animationFrameHandle = window.requestAnimationFrame(tick);
}

function createChosenVariations(size) {
    // use random_shuffle
    results = getRandomPermutation(Variation.variationTotal);
    chosenVariations = results.slice(0,size);
    // results = [];
    // results[0] = 12;
    console.log("variations: " +chosenVariations);
}

function createAttractors() {
    // normailize weight to 100
    let normalized_weight = [], weight_sum = 0;
    let size = getRandomInt(attractorMinSize,attractorMaxSize);
    
    for(var i=0; i<size; i++){
        attractors[i] = new Attractor(true);
        normalized_weight[i] = attractors[i].weight;
        weight_sum += attractors[i].weight;
    }

    normalized_weight[size-1] = 100;
    for(var i=0; i<size-1; i++){
        normalized_weight[i] = Math.round(normalized_weight[i] / weight_sum * 100);
        attractors[i].weight = normalized_weight[i];
        normalized_weight[size-1] -= normalized_weight[i];
    }
    attractors[size-1].weight = normalized_weight[size-1];

    console.log(attractors);
}

function createAttractors_sierpinski_triangle(){
    attractors[0] = new Attractor(false,33,[0.5,0,0,0,0.5,0],[255,0,0]);
    attractors[1] = new Attractor(false,33,[0.5,0,0,0,0.5,0.5],[0,255,0]);
    attractors[2] = new Attractor(false,34,[0.5,0,0.5,0,0.5,0],[0,0,255]);
}

function createAttractors_barnsley_fern(){
    attractors[0] = new Attractor(false,1,[0,0,0,0,0.16,0],[255,255,255]);
    attractors[1] = new Attractor(false,85,[0.85,0.04,0,-0.04,0.85,1.6],[0,255,0]);
    attractors[2] = new Attractor(false,7,[0.2,-0.26,0,0.23,0.22,1.6],[0,255,255]);
    attractors[3] = new Attractor(false,7,[-0.15,0.28,0,0.26,0.24,0.44],[255,255,0]);
}

function drawFlame(draws_time){
    let pointsInCanvas = 0;
    
    for(var i=0; i<draws_time; i++){
        let randomWeight = getRandomInt(0,100), j = 0;

        // 基于权重随机选择吸引子
        while(randomWeight > 0){
            if(randomWeight > attractors[j].weight){
                randomWeight -= attractors[j].weight;
                j++;
            }
            else {
                break;
            }
        }
        mainPoint = attractors[j].apply(mainPoint);
        pointsInCanvas += writePoint(mainPoint);
    }
    
    vm.increment(draws_time, pointsInCanvas)
    vm.setMaxFrequency(maxFrequency);
    ctx.putImageData(imgData,0,0);
}

function writePoint(point){   
    // project to imagedata coordinate
    dx = Math.round((point.x+1) * width / 2);
    dy = Math.round((point.y+1) * height / 2);


    // only render in canvas
    if(dx < width  && dx >= 0 && dy < height && dy >= 0){
        index = dy*width*4 + dx*4;
        for(var i = 0; i<3; i++){
            imgData.data[index + i] = point.color[i] * realTimeRenderStrength + imgData.data[index + i] * (1-realTimeRenderStrength);
            histogram[index+i] += point.color[i];
        }
        histogram[index+3]++;
        if(histogram[index + 3] > maxFrequency){
            maxFrequency = histogram[index + 3];
        }
        imgData.data[index + 3] = 255;

        return 1;
    }
    else{
        return 0;
    }
}

function renderHistogram(useLogarithm,gamma=1){
    for(var i=0; i<height; i++){
        for(var j=0; j<width; j++){
            let index = i*width*4+j*4, freq = histogram[index+3];
            if(freq!=0 && (freq/maxFrequency)>=renderThreshold){
                let alpha = (useLogarithm ? (Math.log(freq) / Math.log(maxFrequency)) : (freq / maxFrequency)) * renderBrightness;
            
                for(var k=0; k<3; k++){
                    imgData.data[index+k] = Math.pow(alpha, 1/gamma) * histogram[index+k] / freq;
                }
            }
            else if((freq/maxFrequency) < renderThreshold){
                for(var k=0; k<3; k++){
                    imgData.data[index+k] = 0;
                }
            }
        }
    }
    
    ctx.putImageData(imgData,0,0);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min; 
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min; 
}

function getRandomColor() {
    color = [];
    for(var i=0; i < 3; i++){
        color[i] = getRandomInt(0,255);
    }
    return color;
}

function getRandomPermutation(size){
    // fisher-yates shuffle modern version
    result = [];
    for(var i=0; i<size; i++){
        result[i] = i;
    }
    for(var i=size-1; i>0; i--){
        j = getRandomInt(0,i);
        if(j!=i){
            let temp = result[j];
            result[j] = result[i];
            result[i] = temp;
        }
    }
    return result;
}

function roundToDecimal(number, digit){
    let n = Math.pow(10,digit);
    return Math.round((number + Number.EPSILON) * n)/ n;
}

window.onload = init;

