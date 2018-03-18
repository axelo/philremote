const express = require("express");
const request = require("superagent");
const path = require("path");
const dns = require("dns");
const os = require("os");
const ssdp = require("node-ssdp");

const app = express();

let knownTvIpAddress;

const getLocalIpAddress = () =>
    new Promise(resolve =>
        dns.lookup(os.hostname(), (_err, addr) =>
            resolve(addr)));

const promiseSerial = funcs =>
    funcs.reduce((promise, getPromise) =>
        promise.then(result =>
            getPromise().then(Array.prototype.concat.bind(result))),
        Promise.resolve([]))

// Example sequence to select 'Guide':
// /WatchTV/Confirm/Home/CursorRight/CursorRight/CursorRight/Confirm

const BUTTONS = [
    "Standby",
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
    "Back"
];

const BUTTON_SEQ_SEND_DELAY = 900;
const SEARCH_TV_TIMEOUT = 5000;

const searchForTvs = () =>
    new Promise(resolve => {
        const client = new ssdp.Client();
        const tvServerName = "IPI/1.0 UPnP/1.0 DLNADOC/1.50";

        client.on("response", (headers, _statusCode, rinfo) => {
            if (headers.SERVER === tvServerName) {
                clearTimeout(timerId);
                resolve(rinfo.address);
            }
        });

        client.search("ssdp:all");

        const timerId = setTimeout(resolve, SEARCH_TV_TIMEOUT);
    });

const sendButtonsToTv = (tvIpAddr, buttonIds) =>
    promiseSerial(buttonIds.map((id, i) => [
        () => sendButtonToTv(tvIpAddr, id),
        () => i === buttonIds.length - 1
            ? Promise.resolve()
            : new Promise(resolve => setTimeout(resolve, BUTTON_SEQ_SEND_DELAY))
    ]).reduce((flatArray, pair) =>
        flatArray.concat(pair), []));

const sendButtonToTv = (tvIpAddr, buttonId) =>
    new Promise((resolve, reject) => {
        console.info(`Sending button ${buttonId} to tv`);

        request("POST", `http://${tvIpAddr}:1925/1/input/key`)
            .set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0")
            .retry(3)
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

const getTvIpAddress = () => knownTvIpAddress
    ? Promise.resolve(knownTvIpAddress)
    : searchForTvs().then(foundTvIp =>
        knownTvIpAddress = foundTvIp || null
    );

const nocacheMiddleware = (req, res, next) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    next();
}

app.use("/", express.static(path.join(__dirname, "../../client")));

app.get("/api/remote/(:button)*", nocacheMiddleware, (req, res) => {
    const inputButtons = req.params[0].length > 0
        ? (req.params.button + req.params[0]).split("/")
        : [req.params.button];

    const buttonIndices = inputButtons.map(button => BUTTONS.indexOf(button));

    const unknownButtons = buttonIndices.map((i, j) => i < 0
        ? inputButtons[j]
        : null)
        .filter(b => b !== null);

    if (unknownButtons.length > 0) {
        return res.status(404).send("Unknown button(s) " + unknownButtons.join(" "));
    }

    const buttons = buttonIndices.map(i => BUTTONS[i]);

    getTvIpAddress().then(ipAddress => {
        if (!ipAddress) {
            return res.status(503).send("No compatible tv available");
        }

        return sendButtonsToTv(ipAddress, buttons)
            .then(() => {
                res.status(200).send(buttons.join(" ") + " sent to tv");
            })
            .catch(err => {
                console.error("err", err);
                res.status(500).send("Something went wrong, try again");
            })
    });
});

const serverPort = process.env.PORT || "5000";

const listener = app.listen(serverPort, (opts) => {
    getLocalIpAddress().then(localIpAddr => {
        console.log("Server started at",
            "http://localhost:" + listener.address().port,
            "alternative",
            "http://" + localIpAddr + ":" + listener.address().port);
    })
});
