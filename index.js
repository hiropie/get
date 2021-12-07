const five = require("johnny-five");
const client = require('socket.io-client');
const readline = require('readline');


// const accessPoint = "http://localhost:8080"  //localtest
const accessPoint = "https://embryomonitor.herokuapp.com/"; //heroku url
let chamberNo = "";
let COMNo = "";
let timelist = [];
let tmplist = [];
let humlist = [];
let data = {
    connectId: chamberNo,
    time: timelist,
    tmp: tmplist,
    hum: humlist
};

let startTime;
let doFlag = 0;
let count = 1;
let downer = 0;
let pushcheck = 0;
const pushTime = 3000;
const openTime = 2000;
const injectionInterval = 15;
const target = 52;


//標準出力からチャンバーを区別する
const ChamberGet = async () => {
    for (; ;) {
        chamberNo = await prompt('Enter Chamber No:(A or B)');
        if (chamberNo == "A" || chamberNo == "B") {
            break;
        }
    }
};

const COMGet = async () => {
    COMNo = await prompt('Enter COM No:');
}

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
}

// 起動
(async () => {
    await ChamberGet();
    await COMGet();
    boardDo();
})();

function boardDo() {
    const board = new five.Board({ port: "COM" + COMNo }); //ポート名指定はWindowsで必要なため、

    board.on('ready', function () {
        startTime = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));;
        console.log(startTime);
        const push = new five.Led(7);
        const ben = new five.Led(6);
        const bme280 = new five.IMU({
            controller: "BME280",
            address: 0x76, // optional
        });
        bme280.on("data", function (e, data) {
            if (this.barometer.pressure > 90) {      //気圧の初回値が変なので、異常値は読み飛ばす
                tmp = this.temperature.celsius;
                hum = this.hygrometer.relativeHumidity;
                //console.log("  celsius(摂氏)      : ", this.temperature.celsius);
                //console.log("  fahrenheit(華氏)   : ", this.temperature.fahrenheit);
                //console.log("  pressure(hPa)     : ", this.barometer.pressure *10);
                //console.log("  relative humidity(相対湿度) : ", hum);
                //console.log("--------------------------------------");
                //process.exit(); //終了
            }
        });

        const socket = client.connect(accessPoint);
        socket.emit("delete", chamberNo);
        console.log("delete sent");

        socket.on("DataSentStart", () => {
            console.log("Start")
            let count = 0;
            setTimeout(function array() {
                let nowTime = Math.floor((new Date() - startTime) / 1000);
                tmp2 = tmp.toFixed(2);
                hum2 = hum.toFixed(2);

                // pushcheck = humControl(hum2);
                console.log("Count=> " + count);
                console.log("time => " + nowTime);
                console.log("tmp  => " + tmp2);
                console.log("hum  => " + hum2);
                console.log("-------------------------")


                let data1 = {
                    connectId: chamberNo,
                    time: nowTime,
                    tmp: tmp2,
                    hum: hum2,
                }
                // timelist[count] = nowTime;
                // tmplist[count] = tmp2;
                // humlist[count] = hum2;

                // count++;
                // if (count == 59) {
                //     console.log("<<<<<<<<sent>>>>>>>>");
                //     socket.emit("environment", data);
                //     count = 0;
                //     timelist = [];
                //     tmplist = [];
                //     humlist = [];
                // }

                socket.emit("environment", data1);
                setTimeout(array, 60000);
            }, 60000);
        });

        socket.on("dataReq", () => {
            console.log("<<<<<<<<sent>>>>>>>>");
            socket.emit("environment", data);
            count = 0;
            timelist = [];
            tmplist = [];
            humlist = [];
        })

        // function humControl(humidity) {
        //     let nowTime = new Date() - startTime;
        //     let check = 0;

        //     if (humidity > target) {
        //         doFlag = 1;
        //     }

        //     if (doFlag == 0) {
        //         if ((nowTime) > (injectionInterval * 60 * 1000 * count)) {
        //             console.log(nowTime);
        //             injection();
        //             count++;
        //             check = 1;
        //         }
        //     } else if (doFlag == 1 && humidity < target) {
        //         downer++;
        //     }

        //     if (downer > 9) {
        //         console.log(nowTime);
        //         injection();

        //         downer = 0;
        //         check = 1;
        //     }
        //     return check;
        // }

        // function injection() {
        //     ben.on();
        //     push.on();
        //     console.log("open");
        //     setTimeout(() => {
        //         push.off();
        //     }, pushTime);

        //     setTimeout(() => {
        //         ben.off();
        //         console.log("close");
        //     }, openTime);
        // }
    })
}


function toHour(time) {
    let sec = Math.round((time % 60) % 60);
    let min = Math.floor(time / 60) % 60;
    let hour = Math.floor(time / 3600);

    return {
        time: time,
        hour: ("00" + hour).slice(-2),
        min: ("00" + min).slice(-2),
        sec: ("00" + sec).slice(-2),
    }
}