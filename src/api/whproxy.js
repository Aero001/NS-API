/*
    API Route which allows for Roblox > Discord communication via webhooks.
    -> POST @ /api/remote/proxy/discord
*/

require("dotenv").config({ path: "src/data/.env" });

const APIRecords = require("./modules/APIRecords");

const rateLimit = require("express-rate-limit");
const limits = require("./modules/limits");
const axios = require("axios");

const BASE = "/api/remote";

module.exports = (app) => {
    // Sends a webhook request to Discord.
    app.post(`${BASE}/proxy/discord`, rateLimit(limits.POST), (req, res) => {
        const body = req.body;

        APIRecords.send({ type: "POST", endpoint: `${BASE}/proxy/discord`, payload: JSON.stringify(body) }).catch(console.error);

        // Validate required fields
        if (!body.webhookURL || typeof body.webhookURL !== "string" || !body.webhookURL.includes("https://discord.com/api/webhooks/") || !body.webhookPayload) {
            return res.status(400).send({
                status: "error",
                errorStatus: "internal",
                error: "Invalid payload syntax",
                statusCode: 400,
            });
        }

        const errorInfo = { state: false, error: "" };
        axios.post(body.webhookURL, JSON.parse(body.webhookPayload)).catch((err) => {
            errorInfo.state = true;
            errorInfo.error = err;
        });

        if (errorInfo.state) {
            const response = errorInfo.error.response;
            return res.status(response.status).send({
                status: "error",
                errorStatus: "external",
                stringError: errorInfo.error.toString(),
                errorData: response.data,
                statusCode: response.status,
            });
        }

        return res.status(200).send({
            status: "ok",
            statusCode: 200,
        });
    });
};
