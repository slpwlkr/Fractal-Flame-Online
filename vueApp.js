const app = Vue.createApp({
    data() {
        return {
            calculating : true,
            pointsCalculated : 0,
            pointsInCanvas: 0,
            maxFrequency : 0,
            autoResetThreshold : 0.1
        }
    },
    methods: {
        increment(ptCalc, ptIn){
            this.pointsCalculated += ptCalc;
            this.pointsInCanvas += ptIn;
        },
        toggleCalculation(){
            // this.calculating ? window.cancelAnimationFrame(animationFrameHandle) : window.requestAnimationFrame(tick);
            this.calculating = !this.calculating;
        },
        renderImage(){
            renderHistogram(true);
        },
        setMaxFrequency(freq){
            this.maxFrequency = freq;
        },
        resetAndReroll(){
            reset();
            this.calculating = true;
            this.pointsCalculated = 0;
            this.pointsInCanvas = 0;
            this.maxFrequency = 0;
        },
        saveImage(){
            var link = document.getElementById('save-image-link');
            link.setAttribute('download', `flame_${Date.now()}.png`);
            link.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
            link.click();
        },
        checkAutoReset(){
            if(this.drawPercentage < this.autoResetThreshold){
                this.resetAndReroll();
                console.log('autoReset');
            }
        }
    },
    computed: {
        drawPercentage(){
            return ((this.pointsInCanvas / this.pointsCalculated) * 100).toFixed(2);
        }
    },
    watch: {
        pointsCalculated(val) {
            if(val>10000){
                this.checkAutoReset();
            }
        }
    }
})

const vm = app.mount('#app');