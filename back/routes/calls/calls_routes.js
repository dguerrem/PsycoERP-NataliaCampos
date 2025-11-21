const express = require("express");
const router = express.Router();

const { crearLlamada } = require("../../controllers/calls/calls_controller");

router.post("/", crearLlamada);

module.exports = router;
