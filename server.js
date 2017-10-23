const http = require('http');
const url = require('url');
const fs = require('fs');
const hbs = require('handlebars');
const parseCSV = require('csv-parse');


/* *********************** */
/* Application State setup */
/* *********************** */

// Through JavaScript's closure mechanism we can access and use the `app`
// variable in functions later.
const app = {
    fixtures: [],
    templates: {}
};

// Preparing templates
app.templates.home = hbs.compile(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Startseite - UE2</title>
    </head>
    <body>
        {{> navigation}}
        <h1>Übung 2 | Startseite</h1>
        <p>&copy; {{name}}</p>
    </body>
    </html>`);

app.templates.filterPage = hbs.compile(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Filter - UE2</title>
    </head>
    <body>
        {{> navigation}}
        <h1>Übung 2 | Filter</h1>
        <form action="/fixtures" method="get">
            <input type="text" name="team">
            <button type="submit">Filtern</button>
        </form>
    </body>
    </html>`);

// Preparing template partials
const navigationPartial =
    `<ul style="list-style: none; padding: 0">
        <li><a href="/">Home</a></li>
        <li><a href="/fixtures/count">Anzahl Spieltage</a></li>
        <li><a href="/filter">Matchsuche</a></li>
    </ul>`;
hbs.registerPartial('navigation', navigationPartial);

// Reading the example data once
// Beware of asynchronicity!!! To understand, see the log messages in the console.
console.log("Before reading CSV");
fs.readFile('deutsche-bundesliga-2017-2018-fixtures.csv', 'utf-8', function(err, data) {
    if (err) throw err;
    const options = {
        "columns": true,
        "auto_parse": true,
        "auto_parse_date": true
    };
    parseCSV(data, options, function(err, result) {
        console.log("Setting app's fixtures property, finally!!!");
        app.fixtures = result;
    });
});
console.log("After reading CSV");


/* ************************************* */
/* Functions to produce actual responses */
/* ************************************* */

function getHome(request, response) {
    response.statusCode = 200;
    const data = {
        name: "Robert Möstl"
    };
    response.write(app.templates.home(data));
}

function getFilterPage(request, response) {
    response.statusCode = 200;
    response.write(app.templates.filterPage({}));
}

function getFixturesCount(request, response) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain');
    response.write("" + app.fixtures.length);
}


/* ********************* */
/* Setting up the server */
/* ********************* */

const server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url);

    if (parsedUrl.pathname === '/') {
        getHome(request, response);
    } else if (parsedUrl.pathname === '/fixtures/count') {
        getFixturesCount(request, response);
    } else if (parsedUrl.pathname === '/filter') {
        getFilterPage(request, response);
    } else {
        response.statusCode = 404;
        response.write("404 Not Found");
    }

    response.end();
});

// Finally, we start the server
server.listen(3000);
