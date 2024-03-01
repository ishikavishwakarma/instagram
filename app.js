var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const MongoStore = require("connect-mongo");
var indexRouter = require('./routes/index');
var usersRouter = require('./models/userModel');
var expressSession = require("express-session");
const passport = require('passport');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressSession({
resave:false,
  saveUninitialized:false,
  secret:'heloo',
  store:MongoStore.create({
    mongoUrl:process.env.MONGODB_URL,
    autoRemove:"disabled",
    ttl: 1* 60 * 60
  })
}));
app.use(passport.authenticate("session"));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser())
passport.deserializeUser(usersRouter.deserializeUser());


passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
app.use(async (req, res, next) => {
  if (req.isAuthenticated()) {
    const user = await usersRouter.findOne({ username: req.session.passport.user });
    res.locals.user = user;
  } else {
    res.locals.user = null;
  }
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/userModel', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
