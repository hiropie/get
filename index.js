const five = require("johnny-five");
const http = require("https")
let accessNum = 0;                 

const board = new five.Board({port: "COM6"}); //ポート名指定はWindowsで必要なため、

board.on('ready', function () {
    let startTime = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));;
    console.log(startTime);
    const push = new five.Led(7);
    const ben  = new five.Led(6);
    const bme280 = new five.IMU({
        controller: "BME280",
        address: 0x76, // optional
    });
    bme280.on("data", function(e,data) {
        if( this.barometer.pressure >90 ){      //気圧の初回値が変なので、異常値は読み飛ばす
        hum = this.hygrometer.relativeHumidity;
        tmp = this.temperature.celsius;
        //console.log("  celsius(摂氏)      : ", this.temperature.celsius);
        //console.log("  fahrenheit(華氏)   : ", this.temperature.fahrenheit);
        //console.log("  pressure(hPa)     : ", this.barometer.pressure *10);
        //console.log("  relative humidity(相対湿度) : ", hum);
        //console.log("--------------------------------------");
        //process.exit(); //終了
        }
    });
    
    //array()の中にTCPのプロトコルを書く
    //ArduinoのcatchにもTCPを書いて値を受け取る->DBに投げる
    setTimeout(function array(){
    let nowTime = Math.floor((new Date() - startTime)/1000)
    
    let opts = {
        host: 'embryomonitor.herokuapp.com/catch/',
        port: 443,
        path: "?time=" +nowTime+ "&tmp=" +tmp+ "&hum" +hum
    }
    http.get(opts,(res2)=>{
        console.log(nowTime+":"+tmp+":"+hum);
    })

    setTimeout(array,5000);
    },5000)
})

function toHour(time){
  let sec = Math.round((time % 60) % 60);
  let min = Math.floor(time / 60) % 60;
  let hour = Math.floor(time / 3600);
  
  return{
    time: time,
    hour: ("00" + hour).slice(-2),
    min: ("00" + min).slice(-2),
    sec: ("00" + sec).slice(-2),
  }
}