const express       = require("express");
const session       = require("express-session");
const hbs           = require("express-handlebars");
const mongoose      = require("mongoose");
const passport      = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt        = require("bcrypt");
const app           = express();

const PORT = process.env.PORT || 3000
const User = require("./models/User")

mongoose.connect("mongodb://localhost:27017/gamestop-api", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.engine("hbs", hbs.engine({extname: ".hbs"}))
app.set("view engine", "hbs")
app.use(express.static(__dirname + "/public"))
app.use(session({
    secret: "abc123",
    resave: false,
    saveUninitialized: true
}))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

//Authentication
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user)
    })
})

passport.use(new localStrategy((username, password, done) => {
    User.findOne({username}, (err, user) => {
        if(err) return done(err)
        if(!user) return done(null, false, {message: "Incorrect username."})

        bcrypt.compare(password, user.password, (err, res) => {
            if(err) return done(err)
            if(res === false) return done(null, false, {message: "Incorrect password"})

            return done(null, user)
        })
    })
}))


//Setup routes
require("./routes")(app, passport)

app.listen(PORT, () => console.log(`server running on port ${PORT}`))
