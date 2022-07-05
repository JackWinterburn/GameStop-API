const express       = require("express")
const session       = require("express-session")
const bodyParser    = require("body-parser")
const hbs           = require("express-handlebars")
const mongoose      = require("mongoose")
const passport      = require("passport")
const localStrategy = require("passport-local").Strategy
const bcrypt        = require("bcrypt")
const app           = express()
const Game          = require("./models/Game")

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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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


function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) return next()
    res.redirect("/login")
}

function isLoggedOut(req, res, next) {
    if(!req.isAuthenticated()) return next()
    res.redirect("/")
}



//Setup routes

app.get("/", isLoggedIn, async (req, res) => {
    await Game.find({}, (err, games) => {
        if(!err) res.render("index", {title: "Games", games: games})
        else throw err
    }).lean().clone().catch(err => console.error(err))
})

app.get("/login", isLoggedOut, (req, res) => {
    const response ={
        title: "Login",
        error: req.query.error
    }
    res.render("login", response);
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login?error=true"
}));

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
})

app.get("/add", isLoggedIn, (req, res) => {
    res.render("add", {title: "Add game"})
})

app.post("/add", (req, res) => {
    let title = req.body.title, price = req.body.price
    const newGame = new Game({
        title,
        price
    })
    newGame.save()
    res.redirect("/")
})

app.get("/game", async (req, res) => {
    let gameId = req.query.id
    const exists = await Game.exists({_id: gameId})
    if (exists) {
        const game = await Game.findOne({_id: gameId})
        res.render("game", {title: "Game", name: game.title, price: game.price, id: game._id})
    } else {
        res.render("error", {title: "error"})
    }
})

app.post("/delete", async (req, res) => {
    let gameId = req.query.id
    const exists = await Game.exists({_id: gameId})
    if (exists) {
        await Game.deleteOne({_id: gameId})
        res.redirect("/")
    } else {
        res.render("error", {title: "error"})
    }
})

app.post("/edit", async (req, res) => {
    let gameId = req.query.id
    let title = req.body.title
    let price = req.body.price
    const exists = await Game.exists({_id: gameId})
    if (exists) {
        await Game.updateOne({_id: gameId}, { $set: {title, price}})
        res.redirect("/")
    } else {
        res.render("error", {title: "error"})
    }
})

app.listen(PORT, () => console.log(`server running on port ${PORT}`))
