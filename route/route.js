const express = require("express");
const baseController = require("../controllers/controller");

const router = express.Router();

router.route("/incoming-call").post(baseController.incoming);
router.route("/respond").post(baseController.response);
router.route("/conversation").get(baseController.getChat);
router.route("/appointment").get(baseController.getAppointmentData);

module.exports = router;
