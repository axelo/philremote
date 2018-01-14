const express = require("express");
const request = require("superagent");
const path = require("path");

const app = express();

const promiseSerial = funcs =>
    funcs.reduce((promise, getPromise) =>
        promise.then(result =>
            getPromise().then(Array.prototype.concat.bind(result))),
        Promise.resolve([]))

const buttons = [
    "RedColour",
    "GreenColour",
    "YellowColour",
    "BlueColour",
    "Home",
    "Digit0",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Info",
    "CursorUp",
    "CursorDown",
    "CursorLeft",
    "CursorRight",
    "Confirm",
    "WatchTV",
    "ChannelStepUp",
    "ChannelStepDown",
    "Source",
    "Subtitle",
    "Find",
    "Online", // Aspect ratio
];

const sendButtonToTv = (tvIpAddr, buttonId) =>
    new Promise((resolve, reject) => {
        console.info(`Sending button ${buttonId} to tv`);

        request("POST", `http://${tvIpAddr}:1925/1/input/key`)
            .set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0")
            .retry()
            .send({
                key: buttonId
            })
            .end((err, res) => {
                if (err) {
                    return reject(err);
                }

                resolve(res.text);
            });
    });

app.use("/", express.static(path.join(__dirname, "../../client")));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/remote/:button", (req, res) => {
    const buttonIndex = buttons.indexOf(req.params.button);

    if (buttonIndex < 0) {
        return res.status(404).send("Unknown button");
    }

    sendButtonToTv("192.168.1.119", buttons[buttonIndex])
        .then(() => {
            res.status(200).send(req.params.button + " sent to tv");
        })
        .catch(err => {
            console.info("err", err);
            res.status(503).send("Something went wrong, try again");
        })
});

const listener = app.listen(5000, (opts) => {
    console.log("Server started at http://localhost:" + listener.address().port);
});
