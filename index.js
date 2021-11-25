const five = require("johnny-five")
const client = require('socket.io-client')
const readline = require('readline')

const board = new five.Board({ port: "COM6" }); //ポート名指定はWindowsで必要なため、
// const accessPoint = "http://localhost:3000"  //localtest
const accessPoint = "https://embryomonitor.herokuapp.com/" //heroku
let chamberNo
let pushCount = 1
let humCheck = 0
let target = 52
let downer = 0

//標準出力からチャンバーを区別する
const main = async () => {
    for (; ;) {
        chamberNo = await prompt('Enter Chamber No:(1 or 2)');
        if (chamberNo == 1 || chamberNo == 2) {
            break
        }
    }
};

// 起動
(async () => {
    await main()
})()

board.on('ready', function () {
    let startTime = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));;
    console.log(startTime);
    const push = new five.Led(7)
    const ben = new five.Led(6)
    const oxySensor = new five.Sensor("A0")
    const bme280 = new five.IMU({
        controller: "BME280",
        address: 0x76, // optional
    });
    bme280.on("data", function (e, data) {
        if (this.barometer.pressure > 90) {      //気圧の初回値が変なので、異常値は読み飛ばす
            let hum = this.hygrometer.relativeHumidity;
            let tmp = this.temperature.celsius;
            if (hum > target) {
                humCheck = 1
            }
        }
    });

    oxySensor.on("data", function () {
        let oxygen
    })

    setTimeout(function intervalPush() {
        if (target == 0) {
            if ((new Date() - startTime) > (900000 * pushCount)) {
                open()
                pushCount++
            }
        } else if (humCheck == 1 && hum < target) {
            downer++
        }

        if (downer > 9) {
            open()
        }

        setTimeout(intervalPush(), 1000)
    }, 1000)

    const socket = client.connect(accessPoint);
    socket.on('connect', () => {
        socket.emit("delete", chamberNo)

        setTimeout(function array() {

            let oxy2 = oxygen.toFixed(2)
            let tmp2 = tmp.toFixed(2)
            let hum2 = hum.toFixed(2)
            let nowTime = Math.floor((new Date() - startTime) / 1000)
            let data = {
                connectId: chamberNo,
                time: nowTime,
                tmp: tmp2,
                hum: hum2,
                oxygen: oxy2,
            }
            // console.log("sent")
            socket.emit("environment", data)
            setTimeout(array, 5000);
        }, 5000)
    })
})


// ユーザーに値を入力させる
const prompt = async (msg) => {
    console.log(msg);
    const answer = await question('> ');
    return answer.trim();
};


// 標準入力を取得する
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

function open() {
    ben.on()
    push.on()
    setTimeout(() => {
        setTimeout(() => {
            push.off()
        }, 500)
        ben.off()
    }, 4500)
}