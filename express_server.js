const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = function (length) {
  return Math.round(
    Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)
  )
    .toString(36)
    .slice(1);
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const findUserByEmail = function (email) {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

const urlsForUser = function (id) {
  const userUrl = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userUrl[url] = urlDatabase[url];
    }
  }
  return userUrl;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/urls/error");
  }
  const templateVars = {
    urls: urlsForUser(req.cookies.user_id),
    user: users[req.cookies.user_id],
  };
  return res.render("urls_index", templateVars);
});

app.get("/urls/error", (req, res) => {
  res.render("urls_noID",)
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(400).send("Only account holders may create short urls");
  }

  let longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send("longURL not found");
  }

  const urlHasHttp = longURL.slice(0, 4) === "http";
  if (!urlHasHttp) {
    longURL = "http://" + longURL;
  }

  const shortURL = generateRandomString(6);
  const userID = req.cookies.user_id;
  urlDatabase[shortURL] = { longURL, userID };
  console.log("++++++++++", urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  console.log("hello");
  if (!req.cookies.user_id) {
    return res.redirect("/urls/error");
  }
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  for (let user in users) {
    if (users[user].id === req.cookies.user_id) {
      const templateVars = {
        shortURL,
        longURL,
        urls: urlDatabase,
        user: users[user],
      };
      res.render("urls_show", templateVars);
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.clearCookie("user_id");
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/urls/error");
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send("longURL not found");
  }
  
  const urlHasHttp = longURL.slice(0, 4) === "http";
  if (!urlHasHttp) {
    longURL = "http://" + longURL;
  }
  
  if (!req.cookies.user_id) {
    return res.redirect("/urls/error");
  }

  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (password === "" || email === "") {
    return res.status(403).send("missing login field");
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(403).send("this user account doesn't exist");
  }
  // unsecure method: if (user.password !== password) {
    if (bcrypt.compareSync(password, user.hashedPassword) === false) {
    return res.status(403).send("this password is incorrect");
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (password === "" || email === "") {
    return res.status(400).send("missing registration field");
  }

  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send("this user already exists");
  }

  const userId = generateRandomString(6);
  users[userId] = {
    id: userId,
    email,
    hashedPassword,
  };
  console.log(users[userId]);
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
