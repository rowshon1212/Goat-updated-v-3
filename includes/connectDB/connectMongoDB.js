module.exports = async function (uriConnect) {
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);

    const mongoose = require("mongoose");

    const threadModel = require("../models/mongodb/thread.js");
    const userModel = require("../models/mongodb/user.js");
    const dashBoardModel = require("../models/mongodb/userDashBoard.js");
    const globalModel = require("../models/mongodb/global.js");

    await mongoose.connect(uriConnect);

    return {
        threadModel,
        userModel,
        dashBoardModel,
        globalModel
    };
};