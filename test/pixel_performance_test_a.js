const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgba(0,0,0,1)';

function draw()
{   
    limit = 5000000;

    const t0 = performance.now();

    // draw_fillRect(limit);
    // draw_putImageData_single(limit);
    draw_putImageData_canvas(limit);

    const t1 = performance.now();

    let text = document.createElement("p");
    text.innerText = `fill: ${limit} points in ${t1-t0} ms.`;
    document.body.appendChild(text);
    // console.log(`fill: ${limit} points in ${t1-t0} ms.`)
};

window.onload = draw;

function draw_fillRect(limit)
{
    for(var i=0;i<limit;i++){
        ctx.fillRect(getRandomInt(0, canvas.width), getRandomInt(0, canvas.height),1,1);
    }
}

function draw_putImageData_single(limit)
{
    var imgData = ctx.createImageData(1,1);
    imgData.data[3] = 255;

    for(var i=0;i<limit;i++){
        ctx.putImageData(imgData,getRandomInt(0, canvas.width), getRandomInt(0, canvas.height));
    }
}

function draw_putImageData_canvas(limit)
{
    var imgData = ctx.createImageData(canvas.width,canvas.height);

    for(var i=0;i<limit;i++){
        imgData.data[getRandomInt(0, canvas.height)*canvas.width*4+getRandomInt(0, canvas.width)*4+3] = 255;
    }
    ctx.putImageData(imgData,0,0);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
}