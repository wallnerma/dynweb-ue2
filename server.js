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
        <h1>Hausübung 2 | Startseite</h1>
        <h3>Spieltage der Deutschen Bundesliga Saison 2017/2018</h3>
        <p>&copy; {{name}}</p>
    </body>
    </html>`);

    app.templates.matchdays = hbs.compile(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Matchdays - UE2</title>
        </head>
        <body>
            {{> navigation}}
            <h2>1. Datensatz</h2>
              <table>
                <tr>
                  <th>Spieltag</th>
                  <th>Gegner</th>
                  <th>Ergebnis</th>
                  <th>Datum</th>
                  <th>Status</th>

                {{#each this}}
                <tr>
                  <td><a href="/matchdays/{{matchDay}}">{{matchDay}}</a></td>
                  <td>{{nameHomeClubShort}} gegen {{nameAwayClubShort}}</td>
                  <td>{{goalsHomeClub}} : {{goalsAwayClub}}</td>
                  <td>{{date}}</td>
                  <td>{{status}}</td>
                </tr>
                {{/each}}

                </table>
        </body>
        </html>`);

        app.templates.matchday = hbs.compile(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Matchdays - UE2</title>
            </head>
            <body>
                {{> navigation}}
                <h2>1. Datensatz</h2>
                  <table>
                    <tr>
                      <th>Spieltag</th>
                      <th>Gegner</th>
                      <th>Ergebnis</th>
                      <th>Datum</th>
                      <th>Status</th>

                    {{#each this}}
                    <tr>
                      <td>{{matchDay}}</td>
                      <td>{{nameHomeClubShort}} gegen {{nameAwayClubShort}}</td>
                      <td>{{goalsHomeClub}} : {{goalsAwayClub}}</td>
                      <td>{{date}}</td>
                      <td>{{status}}</td>
                    </tr>
                    {{/each}}

                    </table>
            </body>
            </html>`);

app.templates.matchday_old = hbs.compile(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Matchdays - UE2</title>
    </head>
    <body>
        {{> navigation}}
        <h2>1. Datensatz</h2>
          <ul>
            <li>Matchday: {{matchDay}}</li>
            <li>Name Home Club: {{nameHomeClub}}</li>
            <li>Name Home Club Short: {{nameHomeClubShort}}</li>
            <li>Name Away Club: {{nameAwayClub}}</li>
            <li>Name Away Club Short: {{nameAwayClubShort}}
            <li>Date: {{date}}</li>
            <li>Shortdate:  {{shortDate}}</li>
            <li>Status: {{status}}</li>
            <li>Goals Home Club: {{goalsHomeClub}}</li>
            <li>Goals Away Club: {{goalsAwayClub}}</li>
          </ul>
    </body>
    </html>`);

    app.templates.matchdays_old = hbs.compile(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Matchdays - UE2</title>
        </head>
        <body>
            {{> navigation}}
            <h2>1. Datensatz</h2>
              <ul>
                {{#each this}}
                  <li>Date: <a href="/matchdays/{{date}}">{{date}}</a></li>
                {{/each}}
              </ul>
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
        <li><a href="/firstdata">1. Datensatz</a></li>
        <li><a href="/matchdays">zu den Spieltagen</a></li>
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
        console.log(result[0]);
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
        name: "Marcus Wallner, Georg Wresnik"
    };
    response.write(app.templates.home(data));
}

function getMatchdays(request, response) {
    response.statusCode = 200;
    const data = app.fixtures;
    response.write(app.templates.matchdays(app.fixtures))
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
function getFirstFicturesRow(request, response){
  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html');
  //response.write("" + app.fixtures[1].matchDay);
  response.write(app.templates.matchday(app.fixtures[0]));
}
function getMatchDay(request, response, day){

  var day_Array = [];

  for(i = 0; i < app.fixtures.length; i++)
  {
    if(app.fixtures[i].matchDay === day)
    {
      console.log("added");
      day_Array.push(app.fixtures[i]);
    }
  }


  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html');
  response.write(app.templates.matchday(day_Array));
}


/* ********************* */
/* Setting up the server */
/* ********************* */

const server = http.createServer(function(request, response) {
    const parsedUrl = url.parse(request.url);
    console.log(parsedUrl);

    if ( !(request.method === 'GET') ) {
        response.statusCode = 405;
        response.write("405 Method Not Allowed");
    } else if (parsedUrl.pathname === '/') {
        getHome(request, response);
    } else if (parsedUrl.pathname === '/fixtures/count' || parsedUrl.pathname === '/fixtures/count/') {
        getFixturesCount(request, response);
    } else if (parsedUrl.pathname === '/filter' || parsedUrl.pathname === '/filter/') {
        getFilterPage(request, response);
    } else if (parsedUrl.pathname === '/firstdata' || parsedUrl.pathname === '/firstdata/') {
        getFirstFicturesRow(request, response);
    } else if (parsedUrl.pathname === '/matchdays') {
        getMatchdays(request, response);
    } else if (parsedUrl.pathname.startsWith('/matchdays/')) {
        getMatchDay(request, response,1);
    }

    else {
        response.statusCode = 404;
        response.write("404 Not Found");
    }

    response.end();
});

// Finally, we start the server
server.listen(3000);
