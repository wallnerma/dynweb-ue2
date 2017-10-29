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
        <title>{{title}} - UE2</title>
    </head>
    <body>
        {{> navigation}}
        <h1>Hausübung 2 | Startseite</h1>
        <h3>Spieltage der Deutschen Bundesliga Saison 2017/2018</h3>
    </body>
    {{> footer}}
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
            <h2>Matchdays</h2>
            <form action="/matchdays" method="get">
            <input type="text" name="team">
            <button type="submit">Filtern</button>
        </form>
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
        {{> footer}}
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
                <h2>Detail - Ansicht</h2>
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
            {{> footer}}
            </html>`);

// Preparing template partials
const navigationPartial =
    `<ul style="list-style: none; padding: 0">
        <li><a href="/">Home</a></li>
        <li><a href="/matchdays">zu den Spieltagen</a></li>
        <li><a href="/filter">Matchsuche</a></li>
    </ul>`;
hbs.registerPartial('navigation', navigationPartial);

const headerPartial =
    `<head>
        <meta charset="UTF-8">
        <title>{{title}} - UE2</title>
    </head>`;
hbs.registerPartial('header',headerPartial);

const footerPartial =
  `<footer>&copy; Georg Wresnik & Marcus Wallner 2017</footer>`;

hbs.registerPartial("footer", footerPartial);


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
        title: "Home"
    };
    response.write(app.templates.home(data));
}

function getMatchdays(request, response) {
    response.statusCode = 200;
    const data = app.fixtures;
    response.write(app.templates.matchdays(app.fixtures))
}

function getFilterPage(request, response, search) {

  var searchitem = search.split('=')[1].toLowerCase();
  var filter_Array = [];

  for(i = 0; i < app.fixtures.length; i++)
  {
    if(app.fixtures[i].nameHomeClubShort.toLowerCase() === searchitem || app.fixtures[i].nameAwayClubShort.toLowerCase() === searchitem)
    {
      filter_Array.push(app.fixtures[i]);
    }
  }

  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html');
  response.write(app.templates.matchday(filter_Array));
}

function getMatchDay(request, response, day){

  var day_Array = [];

  for(i = 0; i < app.fixtures.length; i++)
  {
    if(app.fixtures[i].matchDay === day)
    {
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
    var queryObject = parsedUrl.query;

    if ( !(request.method === 'GET') ) {
        response.statusCode = 405;
        response.write("405 Method Not Allowed");
    } else if (parsedUrl.pathname === '/') {
        getHome(request, response);
    } else if (parsedUrl.pathname === '/fixtures/count' || parsedUrl.pathname === '/fixtures/count/') {
        getFixturesCount(request, response);
    }else if (queryObject){
      getFilterPage(request,response,queryObject);
    }else if (parsedUrl.pathname === '/matchdays') {
        getMatchdays(request, response);
    }else if (parsedUrl.pathname.split('/')[1] === "matchdays" && parsedUrl.pathname.split('/')[2]) {
        let day = parseInt(parsedUrl.pathname.split('/')[2])
        getMatchDay(request, response,day);
    }
    else {
        response.statusCode = 404;
        response.write("404 Not Found");
    }

    response.end();
});

// Finally, we start the server
server.listen(3000);
