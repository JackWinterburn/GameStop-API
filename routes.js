const Game = require("./models/Game")

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) return next()
    res.redirect("/login")
}

function isLoggedOut(req, res, next) {
    if(!req.isAuthenticated()) return next()
    res.redirect("/")
}

module.exports = (app, passport) => {
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
}