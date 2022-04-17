export default class Countdown{
    countdown;
    defaultTime;
    interval;
    callback;
    get timeLeft(){
        return this.countdown;
    }
    get isRunning(){
        return this.interval != null;
    }
    constructor(time, run = false, callback){
        this.defaultTime = time;
        this.countdown = time;
        this.callback = callback;
        if(run){
            this.StartCountdown();
        }
    }
    StartCountdown(){
        this.StopCountdown();
        this.interval = setInterval(()=>{
            this.countdown--;
            if(this.countdown <= 0){
                this.StopCountdown();
                this.callback();
            }
        },1000);
    }
    StopCountdown(){
        clearInterval(this.interval);
        this.interval = null;
    }
    RestartCountdown(){
        this.StopCountdown();
        this.countdown = this.defaultTime;
        this.StartCountdown();
    }
    SetDefaultTime(time){
        this.defaultTime = time;
    }
    SetCallback(callback){
        this.callback = callback;
    }
}