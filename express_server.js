const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

function generateRandomString(length) {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console

  let longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send("longURL not found");
  }

  const urlHasHttp = longURL.slice(0, 4) === "http";
  if (!urlHasHttp) {
    longURL = "http://" + longURL;
  }
  
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = longURL;
  console.log("++++++++++", urlDatabase);
  res.redirect(`/urls/${shortURL}`)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console

  let longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send("longURL not found");
  }

  const urlHasHttp = longURL.slice(0, 4) === "http";
  if (!urlHasHttp) {
    longURL = "http://" + longURL;
  }
  
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  console.log("++++++++++", urlDatabase);
  res.redirect(`/urls/${shortURL}`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});