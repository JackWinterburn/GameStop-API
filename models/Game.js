const { default: mongoose } = require("mongoose");

const GameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
})

const Game = mongoose.model("Game", GameSchema)

module.exports = Game