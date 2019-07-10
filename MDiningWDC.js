(function () {
    var myConnector = tableau.makeConnector();

    myConnector.getSchema = function (schemaCallback) {
        var cols = [{
            id: "date",
            alias: "Date",
            dataType: tableau.dataTypeEnum.date
        }, {
            id: "menu_item",
            alias: "Menu Item",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "meal",
            alias: "Meal",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "hall",
            alias: "Dining Hall",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "station",
            alias: "Station",
            dataType: tableau.dataTypeEnum.string
        }];
    
        var tableSchema = {
            id: "michiganDiningFeed",
            alias: "Dining menu at University of Michigan dining halls.",
            columns: cols
        };
    
        schemaCallback([tableSchema]);
    };

    myConnector.getData = function(table, doneCallback) {
        var dateObj = JSON.parse(tableau.connectionData),
        start_date = new Date(dateObj.startDate),
        end_date = new Date(dateObj.endDate);

        while (start_date <= end_date) {
            var year = start_date.getYear()+1900,
                month = ("0" + (start_date.getMonth() + 1)).slice(-2)                ,
                day = ("0" + (start_date.getDate() + 1)).slice(-2)
                api_url = "https://firestore.googleapis.com/v1beta1/projects/michigan-dining-menu/databases/(default)/documents/beta/" + year + "-" + month + "-" + day + "/halls/Mosher-Jordan/Dinner/";
            $.getJSON(api_url, function(resp) {
                var feat = resp.documents,
                    tableData = [];
                
                // Iterate over the JSON object
                if (feat) {
                    for (var i = 0, len = feat.length; i < len; i++) {
                        for (var j = 0, len = feat[i].fields.items.arrayValue.values.length; j < len; j++) {

                            metadata = feat[i].name.split("/");

                            tableData.push({
                                "date": metadata[6],
                                "menu_item": feat[i].fields.items.arrayValue.values[j].stringValue,
                                "meal": metadata[9],
                                "hall": metadata[8],
                                "station": metadata[10]
                            });
                        }
                    }
            
                    table.appendRows(tableData);
                }
            });

            start_date.setDate(start_date.getDate() + 1);
        }

        doneCallback();
    };

    tableau.registerConnector(myConnector);
    
    $(document).ready(function () {
        $("#submitButton").click(function() {
            var dateObj = {
                startDate: $('#start-date-one').val().trim(),
                endDate: $('#end-date-one').val().trim(),
            };
    
            function isValidDate(dateStr) {
                var d = new Date(dateStr);
                return !isNaN(d.getDate());
            }
    
            if (isValidDate(dateObj.startDate) && isValidDate(dateObj.endDate)) {
                tableau.connectionData = JSON.stringify(dateObj);
                tableau.connectionName = "MDining Feed";
                tableau.submit();
            } else {
                $('#errorMsg').html("Enter valid dates. For example, 2019-05-08.");
            }
        });
    });
})();