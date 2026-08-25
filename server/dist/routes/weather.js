"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weather_js_1 = require("../data/weather.js");
const router = (0, express_1.Router)();
router.get("/current", (req, res) => {
    res.json(weather_js_1.spaceWeather);
});
exports.default = router;
//# sourceMappingURL=weather.js.map