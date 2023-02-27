$(function loadTransit() {
  var lineList = [
    [
      ["NORTH-AVE-STATION", "RED"],
      ["NORTH-AVE-STATION", "GOLD"],
    ],
  ];

  var platformGroup = "";
  for (var i = 0; i < lineList.length; i++) {
    platformGroup += '<div class="platformGroup ' + i + '">';
    var stationTable = "";
    for (let j = 0; j < lineList[i].length; j++) {
      var element = lineList[i][j];
      stationTable +=
        '<div class="table ' + element[0] + " " + element[1] + '"></div>';
    }
    platformGroup += stationTable;
    platformGroup += "</div>";
  }

  var transitHeader =
    '<div class="transitHeader"><span>' +
    "EST. ARRIVAL TIMES" +
    "</span></div>";
  $(transitHeader).appendTo("#transit-data");
  var stationNameHeader =
    '<div class="stationName"><span>' + "NORTH AVE STATION" + "</span></div>";
  $(stationNameHeader).appendTo("#transit-data");
  $(platformGroup).appendTo("#transit-data");
  function filterJSON(jsonObject, filterKey, filterValue) {
    jsonObject = jsonObject.filter(function (entry) {
      return entry[filterKey] === filterValue;
    });
    return jsonObject;
  }

  function getStationData(stationId) {
    var params = {
      // Request parameters
      endpoint:
        "http://developer.itsmarta.com/RealtimeTrain/RestServiceNextTrain/GetRealtimeArrivals?",
      apikey: "1685d8f3-3277-401d-8b2b-140a9fe4fc82",
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

        // [{"DESTINATION":"Hamilton E Holmes","DIRECTION":"W","EVENT_TIME":"12\/27\/2013 12:29:42 PM","LINE":"BLUE","NEXT_ARR":"12:29:52 PM","STATION":"VINE CITY STATION","TRAIN_ID":"101206","WAITING_SECONDS":"-31"
        // ,"WAITING_TIME":"Boarding"},{"DESTINATION":"Airport",
        // "DIRECTION":"S","EVENT_TIME":"12\/27\/2013 12:30:06 PM","LINE":"GOLD","NEXT_ARR":"12:30:16 PM","STATION":"GARNETT STATION","TRAIN_ID":"302506","WAITING_SECONDS":"-7",
        // "WAITING_TIME":"Boarding"},…]
        // var timeStamp = data.tmst.substr(data.tmst.indexOf(' ')+1);
        // timeStamp = Date.parse(timeStamp);
        // // console.log(timeStamp);
        // // console.log(data);
        // $("#transit-data .table."+stationId).empty();

        // var trainEtaData = data.eta;
        // var trainPlatforms = _.keys(_.countBy(trainEtaData, function(trainEtaData) { return trainEtaData.stpDe; })) ;
        // var stationName = _.keys(_.countBy(trainEtaData, function(trainEtaData) { return trainEtaData.staNm; })) ;
        // var trainDirection = _.keys(_.countBy(trainEtaData, function(trainEtaData) { return trainEtaData.trDr; })) ;
        // // var stopId = _.keys(_.countBy(trainEtaData, function(trainEtaData) { return trainEtaData.stpId; })) ;

        // var stationNameHeader = '<div class="stationName">' + stationName[0] + '</div>';

        // $(stationNameHeader).appendTo("#transit-data .table."+stationId);
        // var directionHeader = '';
        // var heading = '';
        // for (var i = 0; i < trainPlatforms.length; i++) {
        //   switch (trainDirection[i]) {
        //     case '1':
        //     if(stationId === ("40160")){
        //       heading = 'Eastbound';
        //     }else{
        //       heading = 'Northbound';
        //     }
        //       break;

        //     case '5':
        //     if(stationId === ("40160")){
        //       heading = 'Westbound';
        //     }else{
        //       heading = 'Southbound';
        //     }
        //       break;

        //     default:
        //       break;
        //   }

        //     var platformSeperator = '<div class="platformSeperator">' + trainPlatforms[i] + '</div>';
        //     $(platformSeperator).appendTo("#transit-data .table."+stationId);
        //     $(data.eta).each(function () {

        //           this.prdt = moment(Date.parse(this.prdt.substr(this.prdt.indexOf(' ')+1))).format('YYYY-MM-DD HH:mm:ss');
        //           this.arrT = moment(Date.parse(this.arrT.substr(this.arrT.indexOf(' ')+1))).format('YYYY-MM-DD HH:mm:ss');
        //           this.minutes = moment(moment(this.arrT).diff(moment(this.prdt))).format('m');

        //           this.status = this.minutes + ' min';
        //           if(parseInt(this.minutes) == 0) {this.status = 'Due';}
        //           if(parseInt(this.isApp) == 1) {this.status = 'Due';}
        //           if(parseInt(this.isDly) == 1) {this.status = 'Delayed';}
        //           // console.log(this.status);

        //           if (this.stpDe === trainPlatforms[i]) {
        //               var tblRow = '<div class="clearfix trainLine ' + this.rt + this.destSt + '">'
        //                 + '<span class="destinationName">' + this.destNm + '</span>'
        //                 + '<span class="arrivalTime">' + this.status + '</span>'
        //                 // + '<span class="arrivalTime">' + this.minutes + '</span>'
        //                 + '</div>';

        //             console.log(this);
        //              $(tblRow).fadeIn(700).appendTo("#transit-data .table."+stationId);

        //           };

        //     });
        // };

        setTimeout(function () {
          getStationData(stationId);
        }, 20000);
      })
      .fail(function () {
        // $("#outboundData tbody, #inboundData tbody").html("<tr><td colspan='2'>LOADING . . .</td></tr>");
        console.log("retry");
        setTimeout(function () {
          getStationData(stationId);
        }, 5000);
      });
  }

  function getStopData(stopId, routeId, groupNum) {
    var params = {
      // Request parameters
      key: "c1fa65ecb69b4ba0a711da5004b4b25b",
      stpid: stopId,
      rt: routeId,
      max: "2",
    };
    // console.log($.param(params));
    $.ajax({
      url: "./transit-atlanta-marta/marta_proxy.php?" + $.param(params),
      beforeSend: function (xhrObj) {
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
        var timeStamp = data.tmst.substr(data.tmst.indexOf(" ") + 1);
        timeStamp = Date.parse(timeStamp);
        // console.log(timeStamp);
        // $("#transit-data .stopGroup ."+groupNum+" .stationName").remove();
        $("#transit-data .stopGroup .table." + stopId + "." + routeId).empty();

        var trainEtaData = data.eta;
        if (trainEtaData !== null) {
          if (Array.isArray(trainEtaData)) {
            console.log(trainEtaData);
            var trainPlatforms = _.keys(
              _.countBy(trainEtaData, function (trainEtaData) {
                return trainEtaData.stpDe;
              })
            );
            var stationName = _.keys(
              _.countBy(trainEtaData, function (trainEtaData) {
                return trainEtaData.staNm;
              })
            );
            var trainDirection = _.keys(
              _.countBy(trainEtaData, function (trainEtaData) {
                return trainEtaData.trDr;
              })
            );
            var stpId = _.keys(
              _.countBy(trainEtaData, function (trainEtaData) {
                return trainEtaData.stpId;
              })
            );
            var rt = _.keys(
              _.countBy(trainEtaData, function (trainEtaData) {
                return trainEtaData.rt;
              })
            );

            var colorCode = "c" + rt[0];
            var colorLabel = '<span class="label ' + colorCode + '">';
            switch (rt[0]) {
              case "Brn":
                colorLabel += "Brown";
                break;
              case "Org":
                colorLabel += "Orange";
                break;
              case "Red":
                colorLabel += "Red";
                break;
              case "Blue":
                colorLabel += "Blue";
                break;
              case "P":
                colorLabel += "Purple";
                break;
              default:
                break;
            }
            colorLabel += "</span>";
            if (stationName[0] == "LaSalle/Van Buren") {
              colorLabel =
                '<span class="label cBrn">Brown</span><span class="label cOrg">Orange</span>';
              colorCode = "cBrnOrange";
            }

            var stationNameHeader =
              '<div class="stationName">' +
              colorLabel +
              '<span class="name">' +
              stationName[0] +
              "</span></div>";
            console.log(stopId + " - " + routeId + " Line Data:");
            console.log(stationName);
            console.log(rt);
            console.log(data);
            if (
              (stationName[0] !== undefined && trainDirection[0] === "1") ||
              (stationName[0] === "Quincy" && trainDirection[0] === "5")
            ) {
              if (
                !$("#transit-data .stopGroup." + groupNum + " .stationName")
                  .length
              ) {
                $(stationNameHeader).prependTo(
                  "#transit-data .stopGroup." + groupNum
                );
              }
            }
            var directionHeader = "";
            for (var i = 0; i < trainPlatforms.length; i++) {
              directionHeader = trainPlatforms[i];
              // console.log(trainDirection[i]+':'+stpId[i]);

              var platformSeperator =
                '<div class="platformSeperator">' + directionHeader + "</div>";
              $(platformSeperator).appendTo(
                "#transit-data .stopGroup .table." + stopId + "." + routeId
              );
              // console.log('its an array');
              $(trainEtaData).each(function () {
                this.prdt = moment(
                  Date.parse(this.prdt.substr(this.prdt.indexOf(" ") + 1))
                ).format("YYYY-MM-DD HH:mm:ss");
                this.arrT = moment(
                  Date.parse(this.arrT.substr(this.arrT.indexOf(" ") + 1))
                ).format("YYYY-MM-DD HH:mm:ss");
                this.minutes = moment(
                  moment(this.arrT).diff(moment(this.prdt))
                ).format("m");

                this.status = this.minutes + " min";
                if (parseInt(this.minutes) == 0) {
                  this.status = "Due";
                }
                if (parseInt(this.isApp) == 1) {
                  this.status = "Due";
                }
                if (parseInt(this.isDly) == 1) {
                  this.status = "Delayed";
                }
                // console.log(this.status);

                if (this.stpDe === trainPlatforms[i]) {
                  var tblRow =
                    '<div class="clearfix trainLine ' +
                    this.rt +
                    this.destSt +
                    '">' +
                    // + '<span class="destinationName">' + this.destNm + '</span>'
                    '<span class="arrivalTime">' +
                    this.status +
                    "</span>" +
                    // + '<span class="arrivalTime">' + this.minutes + '</span>'
                    "</div>";

                  // console.log(this);
                  $(tblRow)
                    .fadeIn(700)
                    .appendTo(
                      "#transit-data .stopGroup .table." +
                        stopId +
                        "." +
                        routeId
                    );
                }
              });
            }
          } else {
            console.log("single result");
            console.log(trainEtaData);
            var trainPlatforms = trainEtaData.stpDe;
            var stationName = trainEtaData.staNm;
            var trainDirection = trainEtaData.trDr;
            var stpId = trainEtaData.stpId;
            var rt = trainEtaData.rt;

            var colorCode = "c" + rt;
            var colorLabel = '<span class="label ' + colorCode + '">';
            switch (rt) {
              case "Brn":
                colorLabel += "Brown";
                break;
              case "Org":
                colorLabel += "Orange";
                break;
              case "Red":
                colorLabel += "Red";
                break;
              case "Blue":
                colorLabel += "Blue";
                break;
              case "P":
                colorLabel += "Purple";
                break;
              default:
                break;
            }
            colorLabel += "</span>";
            if (stationName == "LaSalle/Van Buren") {
              colorLabel =
                '<span class="label cBrn">Brown</span><span class="label cOrg">Orange</span>';
              colorCode = "cBrnOrange";
            }
            var stationNameHeader =
              '<div class="stationName">' +
              colorLabel +
              '<span class="name">' +
              stationName +
              "</span></div>";
            console.log(stopId + " - " + routeId + " Line Data:");
            console.log(stationName);
            console.log(rt);
            console.log(data);
            if (
              (stationName !== undefined && trainDirection === "1") ||
              (stationName === "Quincy" && trainDirection === "5")
            ) {
              $(stationNameHeader).prependTo(
                "#transit-data .stopGroup." + groupNum
              );
            }
            switch (trainDirection) {
              case "1":
                if (stpId === "30030") {
                  directionHeader = "Eastbound";
                  // console.log('check');
                } else {
                  directionHeader = "Northbound";
                }
                break;

              case "5":
                if (stpId === "30031") {
                  directionHeader = "Westbound";
                  // console.log('check');
                } else {
                  directionHeader = "Southbound";
                }
                break;

              default:
                break;
            }

            var platformSeperator =
              '<div class="platformSeperator">' + directionHeader + "</div>";
            $(platformSeperator).appendTo(
              "#transit-data .stopGroup .table." + stopId + "." + routeId
            );
            // console.log('its an array');
            $(trainEtaData).each(function () {
              console.log(this);

              this.prdt = moment(
                Date.parse(this.prdt.substr(this.prdt.indexOf(" ") + 1))
              ).format("YYYY-MM-DD HH:mm:ss");
              this.arrT = moment(
                Date.parse(this.arrT.substr(this.arrT.indexOf(" ") + 1))
              ).format("YYYY-MM-DD HH:mm:ss");
              this.minutes = moment(
                moment(this.arrT).diff(moment(this.prdt))
              ).format("m");

              this.status = this.minutes + " min";
              if (parseInt(this.minutes) == 0) {
                this.status = "Due";
              }
              if (parseInt(this.isApp) == 1) {
                this.status = "Due";
              }
              if (parseInt(this.isDly) == 1) {
                this.status = "Delayed";
              }
              // console.log(this.status);

              if (this.stpDe === trainPlatforms) {
                var tblRow =
                  '<div class="clearfix trainLine ' +
                  this.rt +
                  this.destSt +
                  '">' +
                  // + '<span class="destinationName">' + this.destNm + '</span>'
                  '<span class="arrivalTime">' +
                  this.status +
                  "</span>" +
                  // + '<span class="arrivalTime">' + this.minutes + '</span>'
                  "</div>";

                // console.log(this);
                $(tblRow)
                  .fadeIn(700)
                  .appendTo(
                    "#transit-data .stopGroup .table." + stopId + "." + routeId
                  );
              }
            });
          }
        } else {
          console.log("null data");
          console.log(stopId + " - " + routeId + " Line Data:");
          console.log(data);
        }

        setTimeout(function () {
          getStopData(stopId, routeId, groupNum);
        }, 60000);

        //  setTimeout(loadTransit("40070"), 20000);
      })
      .fail(function (error) {
        // $("#outboundData tbody, #inboundData tbody").html("<tr><td colspan='2'>LOADING . . .</td></tr>");
        //  console.log(error);
        setTimeout(function () {
          getStopData(stopId, routeId, groupNum);
        }, 30000);
      });
  }

  var stationId = "NORTH AVE STATION";
  getStationData(stationId);
});
