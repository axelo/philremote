const express = require("express");
const request = require("superagent");
const path = require("path");
const dns = require("dns");
const os = require("os");
const ssdp = require("node-ssdp");
const debounce = require("lodash.debounce");

const app = express();

let knownTvIpAddress;

const getLocalIpAddress = () =>
    new Promise(resolve =>
        dns.lookup(os.hostname(), (err, addr) =>
            resolve(addr)));

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

const searchForTvs = () =>
    new Promise(resolve => {
        const address = {};
        const client = new ssdp.Client();
        const tvServerName = "IPI/1.0 UPnP/1.0 DLNADOC/1.50";

        const done = debounce(() => {
            resolve(Object.keys(address));
        }, 250);

        client.on("response", (headers, _statusCode, rinfo) => {
            if (headers.SERVER === tvServerName) {
                address[rinfo.address] = rinfo.address;
            }

            done();
        });

        client.search("ssdp:all");

        done();
    });

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

const nocacheMiddleware = (req, res, next) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    next();
}

app.use("/", express.static(path.join(__dirname, "../../client")));

app.get("/api/remote/:button", nocacheMiddleware, (req, res) => {
    const buttonIndex = buttons.indexOf(req.params.button);

    if (buttonIndex < 0) {
        return res.status(404).send("Unknown button");
    }

    const getTvIpAddress = knownTvIpAddress
        ? Promise.resolve(knownTvIpAddress)
        : searchForTvs().then(foundTvIps =>
            knownTvIpAddress = foundTvIps.length > 0
                ? foundTvIps[0]
                : null
        );

    getTvIpAddress.then(ipAddress => {
        if (!ipAddress) {
            return res.status(503).send("No compatible tv available");
        }

        return sendButtonToTv(ipAddress, buttons[buttonIndex])
            .then(() => {
                res.status(200).send(req.params.button + " sent to tv");
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
