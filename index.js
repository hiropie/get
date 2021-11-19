const five = require("johnny-five")
const client = require('socket.io-client')
const readline = require('readline')

const board = new five.Board({port: "COM6"}); //ポート名指定はWindowsで必要なため、
// const accessPoint = "http://localhost:3000"  //localtest
const accessPoint = "https://embryomonitor.herokuapp.com/" //heroku

const main = async () => {
      for(;;){
          const chamberNo = await prompt('Enter Chamber No:(1 or 2)');
          if(chamberNo == 1 || chamberNo == 2){
              break
          }
      }
};
  
/**
 * ユーザーに値を入力させる
 */
const prompt = async (msg) => {
    console.log(msg);
    const answer = await question('> ');
    return answer.trim();
};

/**
 * 標準入力を取得する
 */
const question = (question) => {
    const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });
    return new Promise((resolve) => {
        readlineInterface.question(question, (answer) => {
        resolve(answer);
        readlineInterface.close();
        });
    });
};

// 起動
(async () => {
    await main()
})()

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
    const socket = client.connect(accessPoint);
    socket.on('connect', ()=>{
        socket.emit("delete", null)

        setTimeout(function array(){
            tmp2 = tmp.toFixed(2)
            hum2 = hum.toFixed(2)
            let nowTime = Math.floor((new Date() - startTime)/1000)
            let data = {
                connectId: chamberNo,
                time: nowTime,
                tmp: tmp2,
                hum: hum2,
            }
            // console.log("sent")
            socket.emit("environment", data)
            setTimeout(array,5000);
        },5000)
    })
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