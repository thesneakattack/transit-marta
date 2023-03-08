$(function () {
  getPredictionData([5342, 5366, 5344]);
});

function filterJSON(jsonObject, filterKey, filterValue) {
  jsonObject = jsonObject.filter(function (entry) {
    return entry[filterKey] === filterValue;
  });
  return jsonObject;
}

function predictionsByStop(predictions) {
  relatedData = predictions.included;
  predictions = predictions.data;
  //Create an object/hashmap, then format the resulting object into an array
  //https://stackoverflow.com/questions/60960874/group-by-array-of-objects-by-a-nested-key

  //group predictions by route id:
  let groupedData = {};

  let routeDirectionNames = [];
  let routeDirectionDestinations = [];
  let routeDetails = [];
  let stopDetails = [];
  let relatedInfo = {};
  let details = [];
  relatedData.forEach((relation) => {
    if (relation.type === "route") {
      routeDetails[relation.id] = relation.attributes;
      routeDirectionNames[relation.id] = relation.attributes.direction_names;
      routeDirectionDestinations[relation.id] =
        relation.attributes.direction_destinations;
    }
    if (relation.type === "stop") {
      stopDetails[relation.id] = relation.attributes;
    }
    relatedInfo[relation.id] = relation;
    details[relation.id] = relation;
  });
  // console.log(details);
  // console.log(relatedData);
  predictions.forEach(function (prediction) {
    const stop_id = prediction.relationships.stop.data.id;
    const route_id = prediction.relationships.route.data.id;
    const direction_id = prediction.attributes.direction_id;
    const trip_id = prediction.relationships.trip.data.id;
    const headsign_name = details[trip_id].attributes.headsign;
    // console.log(headsign_name);

    prediction.trip_details = details[trip_id];
    let stop = groupedData[stop_id];
    if (!stop) {
      stop = {
        // routes: [],
      };
      groupedData[stop_id] = stop;
    }

    let route = groupedData[stop_id][route_id];

    if (!route) {
      route = {
        directions: [],
        all_vehicles: [],
      };
      groupedData[stop_id][route_id] = route;
    }
    route.all_vehicles.push(prediction);
    let direction = route.directions[direction_id];
    if (!direction) {
      direction = {
        direction_id: direction_id,
        name: routeDirectionNames[route_id][direction_id],
        destination: routeDirectionDestinations[route_id][direction_id],
        vehicles: [],
        headsigns: [],
      };
      groupedData[stop_id][route_id].directions[direction_id] = direction;
    }
    if (prediction.attributes.departure_time !== null) {
      route.directions[direction_id].vehicles.push(prediction);
    }
    // console.log(prediction.trip_details.id);
    // console.log(prediction.relationships.trip.data.id);
    // console.log(headsign_name);
    let headsign = route.directions[direction_id].headsigns[headsign_name];
    if (!headsign) {
      headsign = {
        vehicles: [],
      };
      groupedData[stop_id][route_id].directions[direction_id].headsigns[
        headsign_name
      ] = headsign;
    }
    if (prediction.attributes.departure_time !== null) {
      let nowTime = moment().format();
      let arrivalTime = moment(prediction.attributes.arrival_time);
      let arrivalSeconds = arrivalTime.diff(nowTime, "seconds");
      if (arrivalSeconds > 0) {
        route.directions[direction_id].headsigns[headsign_name].vehicles.push(
          prediction
        );
      }
    }
  });

  groupedData = Object.entries(groupedData).map((stopItem) => ({
    stop_id: stopItem[0],
    routes: stopItem[1],
    details: details[stopItem[0]],
  }));

  groupedData.forEach(function (stopItem) {
    stopItem.routes = Object.entries(stopItem.routes).map((routeItem) => ({
      route_id: routeItem[0],
      predictions: routeItem[1],
      direction_names: routeDirectionNames[routeItem[0]],
      direction_destinations: routeDirectionDestinations[routeItem[0]],
      details: details[routeItem[0]],
    }));
    stopItem.routes.forEach(function (routeItem) {
      routeItem.predictions.directions =
        routeItem.predictions.directions.filter((direction) => direction);
      routeItem.predictions.directions.forEach(function (direction) {
        direction.headsigns = Object.entries(direction.headsigns).map(
          (headsignItem) => ({
            name: headsignItem[0],
            vehicles: headsignItem[1].vehicles,
          })
        );
      });
    });
  });
  // groupedData.forEach(function (stopData) {
  //   delete stopData.routes;
  // });
  // remove direction for groupedData with no matching predictions
  // groupedData.forEach(function (stop) {
  //   stop.routes.directions = stop.routes.directions.filter((item) => item);
  // });

  return groupedData;
}

function buildLayout(stops) {
  $("#transit-data").empty();
  var transitHeader =
    '<div class="transitHeader"><span>' +
    // "MBTA ARRIVAL TIMES" +
    "</span></div>";
  if (!$(".transitHeader").length) {
    $(transitHeader).appendTo("#transit-data");
  }
  //loop through stops
  stops.forEach(function (stop) {
    let stopElement = ".stop." + stop.stop_id;
    if (!$(stopElement).length) {
      let stopHeader = `<div class="stopHeader"></div>`;
      let stopBody = `<div class="stopBody"></div>`;
      let stopContainer =
        `<div class="stop ` +
        stop.stop_id +
        `">` +
        stopHeader +
        stopBody +
        `</div>`;
      $(stopContainer).appendTo("#transit-data");
      let stopName =
        `<span class="stopName">` + stop.details.attributes.name + `</span>`;
      $(stopName).appendTo(stopElement + " .stopHeader");
      //loop through routes
      stop.routes.forEach(function (route) {
        console.log(route.details.attributes.color);
        let routeElement = stopElement + " .route." + route.route_id;
        if (!$(routeElement).length) {
          let routeColor = "#" + route.details.attributes.color;
          let routeHeader = `<div class="routeHeader"></div>`;
          let routeBody = `<div class="routeBody"></div>`;
          let routeContainer =
            `<div class="route ` +
            route.route_id +
            `">` +
            routeHeader +
            routeBody +
            `</div>`;

          $(routeContainer).appendTo(stopElement + " .stopBody");

          let routeName =
            `<span class="routeName">` + route.route_id + `</span>`;
          $(routeName).appendTo(routeElement + " .routeHeader");
          $(routeElement + " .routeHeader").css("background-color", routeColor);
        }
        route.predictions.directions.reverse();
        //loop through loop through directions
        route.predictions.directions.forEach(function (direction) {
          let directionElement =
            routeElement + " .direction." + direction.direction_id;
          if (!$(directionElement).length) {
            let directionHeader = `<div class="directionHeader"></div>`;
            let directionBody = `<div class="directionBody"></div>`;
            let directionContainer =
              `<div class="direction ` +
              direction.direction_id +
              `">` +
              directionHeader +
              directionBody +
              `</div>`;
            $(directionContainer).appendTo(routeElement + " .routeBody");
            let directionName =
              `<span class="directionName">` + direction.name + `</span>`;
            let directionDestination =
              `<span class="directionDestination"> to ` +
              direction.destination +
              `</span>`;
            $(directionName).appendTo(directionElement + " .directionHeader");
          }
          // console.log(direction);
          direction.headsigns.forEach(function (headsign, index) {
            let headsignElement = directionElement + " .headsign." + index;

            if (!$(headsignElement).length) {
              // console.log(headsignElement);

              let headsignHeader = `<div class="headsignHeader"></div>`;
              let headsignBody = `<div class="headsignBody"></div>`;
              let headsignContainer =
                `<div class="headsign ` +
                index +
                `">` +
                headsignHeader +
                headsignBody +
                `</div>`;
              $(headsignContainer).appendTo(
                directionElement + " .directionBody"
              );
              // let headsignName;
              let headsignHTML = printHeadsign(headsign.name);
              let headsignInfo =
                `<div class="headsignInfo">` + headsignHTML + `</div>`;
              $(headsignInfo).appendTo(headsignElement + " .headsignHeader");
              console.log(headsign.name, headsign.vehicles);
              let arrivalCounter = 0;
              let arrivalLimit = 2;

              headsign.vehicles.forEach(function (prediction) {
                let arrivalStatus = printArrival(prediction);
                if (arrivalStatus && arrivalCounter < arrivalLimit) {
                  arrivalCounter++;
                  let arrival =
                    `<div class="arrivalTime">` + arrivalStatus + `</div>`;
                  $(arrival).appendTo(headsignElement + " .headsignBody");
                }

                // $(headsignElement).html(prediction.attributes.arrival_time);
              });
            }
            //loop through loop through vehicles, limit 2 per headsign
          });
        });
      });
    }
  });
}
function printArrival(prediction) {
  let nowTime = moment().format();
  let arrivalTime = moment(prediction.attributes.arrival_time);
  let arrivalStatus = prediction.attributes.status;
  let arrivalSeconds = arrivalTime.diff(nowTime, "seconds");
  let arrivalMinutes = arrivalTime.diff(nowTime, "minutes");

  let arrivalValue;
  console.log(arrivalSeconds + " seconds / " + arrivalMinutes + " minutes");
  if (arrivalSeconds > 0) {
    arrivalValue = arrivalMinutes;
    if (arrivalSeconds <= 60) arrivalValue = "1"; //APPROACHING or "1 min"
    if (arrivalSeconds <= 30) arrivalValue = "ARR"; //ARRIVING
    // if (arrivalSeconds <= 90 && predication.attributes.status === "STOPPED_AT") arrivalValue = "BRD";
    if (arrivalMinutes === 0) console.log(prediction);
    if (arrivalMinutes > 90) arrivalValue = "90+";

    arrivalHTML = `<div class="arrivalValue">` + arrivalValue + `</div>`;
    if (arrivalStatus === null && arrivalValue !== "ARR") {
      arrivalHTML += `<div class="min">` + `min` + `</div>`;
    }

    return arrivalHTML;
    // return prediction;
  } else {
    return false;
  }
}
function printHeadsign(headsignName) {
  let headsignHTML;
  if (headsignName.includes(" via ")) {
    let headsignNameParts = headsignName.split(" via ");
    let substring = "via " + headsignNameParts[1];
    headsignHTML =
      `<div>` +
      headsignNameParts[0] +
      `</div>` +
      `<div class="via">` +
      substring +
      `</div>`;
  } else {
    headsignHTML = `<div>` + headsignName + `</div>`;
  }
  return headsignHTML;
}
function emptyInfo(stops) {
  var transitHeader =
    '<div class="transitHeader"><span>' +
    "EST. ARRIVAL TIMES" +
    "</span></div>";
  if (!$(".transitHeader").length) {
    $(transitHeader).appendTo("#transit-data");
  }
  //loop through stops
  stops.forEach(function (stop) {
    let stopElement = ".stop." + stop.stop_id;
    if (!$(stopElement).length) {
      //loop through routes
      stop.routes.forEach(function (route) {
        let routeElement = stopElement + " .route." + route.route_id;
        if (!$(routeElement).length) {
        }
        //loop through loop through directions
        route.predictions.directions.forEach(function (direction) {
          let directionElement =
            routeElement + " .direction." + direction.direction_id;
          if (!$(directionElement).length) {
          }
          //loop through loop through vehicles, limit 2 per direction
          direction.vehicles.slice(0, 2).forEach(function (prediction) {
            // console.log(prediction);
          });
        });
      });
    }
  });
}
function displayArrivalTimes(stops) {
  emptyInfo(stops);
  //loop through stops
  // stops.forEach(function (stop) {
  //   let routeInfoContent =
  //     `<div class="routeInfoContent ` + stop.stop_id + `"></div>`;
  //   $(routeInfoContent).appendTo("#transit-data");
  //   let routeInfoHeader =
  //     `<div class="routeName"><span>` + stop.stop_id + `</span></div>`;
  //   $(routeInfoHeader).appendTo(".routeInfoContent." + stop.stop_id);
  //   //loop through routes
  //   stop.routes.forEach(function (route) {
  //     //loop through loop through directions
  //     route.predictions.directions.forEach(function (direction) {
  //       //loop through loop through vehicles, limit 2 per direction
  //       direction.vehicles.slice(0, 2).forEach(function (prediction) {
  //         console.log(prediction);
  //       });
  //     });
  //   });
  // });
}

function getStationData(stationId) {
  var params = {
    // Request parameters
    endpoint: "https://api-v3.mbta.com/predictions?",
    api_key: "762f3ef5fa03489e8c581ee3d1ed129a",
    sort: "arrival_time",
    "filter[stop]": "5342",
  };
  $.ajax({
    url: "./xhr_proxy.php?" + $.param(params),
    beforeSend: function (xhrObj) {
      console.log("fetching data...");
      // Request headers
      // xhrObj.setRequestHeader("api_key","c1fa65ecb69b4ba0a711da5004b4b25b");
    },
    timeout: 3000,
    type: "GET",
    cache: true,
    crossdomain: true,
    dataType: "json",
    // Request body
    // data: "{body}",
  })
    .done(function (data) {
      // console.log(data);
      // DATA SHOULD ALREADY BE SORTED BY WAITING_TIME OR NEXT_ARR (NOT SURE YET)
      // FILTER RESULT DATA BY STATION NAME
      var stationData = filterJSON(data, "STATION", stationId);
      // GROUP DATA BY TRAIN LINES (GOLD, RED, ETC) in lineList
      var dataByLine = [];
      lineList.forEach((line) => {
        line.forEach((element) => {
          var stationName = element[0];
          var lineName = element[1];

          // STORE EACH LINE'S DATA IN AN ARRAY FOR ITERATION
          dataByLine.push(filterJSON(stationData, "LINE", lineName));
          // EMPTY EACH STATION/LINE'S TABLE BEFORE REFRESHING
          $(
            "#transit-data .platformGroup .table." +
              stationName +
              "." +
              lineName
          ).empty();
        });
      });
      console.log(dataByLine);
      // ITERATE THROUGH STATION DATA GROUPED BY LINE
      $(dataByLine).each(function () {
        var trainEtaData = this;
        // RESATURATE NESTED TRAIN LINE TABLE
        $(trainEtaData).each(function () {
          var train = this;
          var text =
            "<div class='trainLabel'><span class='circle " +
            train.LINE +
            "'>" +
            train.DIRECTION +
            "</span><span class='destination'>" +
            train.DESTINATION +
            "</span></div>" +
            "<div class='arrivalTime'>" +
            train.WAITING_TIME +
            "</div>";
          $('<div class="clearfix">' + text + "</div>").appendTo(
            "#transit-data .platformGroup .table." +
              train.STATION.replaceAll(" ", "-") +
              "." +
              train.LINE
          );
        });
      });

      setTimeout(function () {
        getStationData(stationId);
      }, 20000);
    })
    .fail(function () {
      // $("#outboundData tbody, #inboundData tbody").html("<tr><td colspan='2'>LOADING . . .</td></tr>");
      console.log("retry");
      setTimeout(function () {
        getStationData(stationId);
      }, 70000);
    });
}

function getPredictionData(stopIds) {
  var params = {
    // Request parameters
    endpoint: "https://api-v3.mbta.com/predictions?",
    api_key: "762f3ef5fa03489e8c581ee3d1ed129a",
    sort: "departure_time,arrival_time,direction_id",
    "filter[stop]": stopIds.toString(),
    include: "stop,route,trip,vehicle",
  };
  $.ajax({
    url: "./xhr_proxy.php?" + $.param(params),
    beforeSend: function (xhrObj) {
      console.log("fetching data...");
      // Request headers
      // xhrObj.setRequestHeader("api_key","c1fa65ecb69b4ba0a711da5004b4b25b");
    },
    timeout: 3000,
    type: "GET",
    cache: true,
    crossdomain: true,
    dataType: "json",
    // Request body
    // data: "{body}",
  })
    .done(function (response) {
      let includedData = response.included;

      let predictionData = response;
      let stopPredictions = predictionsByStop(predictionData);
      buildLayout(stopPredictions);
      // console.log(stopPredictions);

      // displayArrivalTimes(stopPredictions, includedData);

      setTimeout(function () {
        getPredictionData(stopIds);
      }, 60000);

      //  setTimeout(loadTransit("40070"), 20000);
    })
    .fail(function (error) {
      setTimeout(function () {
        getPredictionData(stopIds);
      }, 30000);
    });
}
