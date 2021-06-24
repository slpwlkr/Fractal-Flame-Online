var canvas, ctx, stats;
var width, height;
var imgData_pixel, imgData_canvas;
const framePixelDraws = 100000;

function init()
{   
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,1)';
    width = canvas.width;
    height = canvas.height;

    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild( stats.dom );

    imgData_pixel = ctx.createImageData(1,1);
    imgData_pixel.data[3] = 255;
    imgData_canvas = ctx.createImageData(width, height);

    window.requestAnimationFrame(tick);
};

function tick()
{   
    stats.begin();
    
    // draw_fillRect(framePixelDraws)
    // draw_putImageData_pixel(framePixelDraws);
    draw_putImageData_canvas(framePixelDraws);

    stats.end();
    window.requestAnimationFrame(tick);
}

function draw_fillRect(pixelDraws)
{
    for(var i=0;i<pixelDraws;i++)
    {
        ctx.fillRect(getRandomInt(0, width), getRandomInt(0, height),1,1);
    }
}

function draw_putImageData_pixel(pixelDraws)
{
    for(var i=0;i<pixelDraws;i++)
    {
        ctx.putImageData(imgData_pixel,getRandomInt(0, width), getRandomInt(0, height));
    }
}

function draw_putImageData_canvas(pixelDraws)
{
    for(var i=0;i<pixelDraws;i++)
    {
        imgData_canvas.data[getRandomInt(0, canvas.height)*canvas.width*4+getRandomInt(0, canvas.width)*4+3] = 255;
    }
    ctx.putImageData(imgData_canvas,0,0);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
}

window.onload = init;