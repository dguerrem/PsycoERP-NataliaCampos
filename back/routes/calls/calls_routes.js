const express = require("express");
const router = express.Router();

const { crearLlamada, actualizarLlamada } = require("../../controllers/calls/calls_controller");

router.post("/", crearLlamada);
router.put("/:id", actualizarLlamada);

module.exports = router;
