const express = require("express");
const router = express.Router();

const { crearLlamada, actualizarLlamada, eliminarLlamada } = require("../../controllers/calls/calls_controller");

router.post("/", crearLlamada);
router.put("/:id", actualizarLlamada);
router.delete("/:id", eliminarLlamada);

module.exports = router;
