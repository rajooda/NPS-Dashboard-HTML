var nps_data = [];
var tbodyEl;

var selectedUnit = "";
var selectedPU = "";
var selectedDU = "";
var selectedCountry = "";
var selectedCity = "";
var selectedEmpJL = "";
var selectedBPHREmpJL = "";

var infosysCompanies = [];

var countriesForFilteredDU = [];
var empJLforFilteredDU = [];
var bphrEmpJLArray = [];
var bphrEmpJMedianNPSArray = [];

google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawChart);

var empJLArray = []

function init() {
    populateUnits();
}


function populateUnits() {

    getUniqueBPHREmpJL();

    var unitSelectEl = document.getElementById("units");
    fetch('http://127.0.0.1:3000/getUnits')
        .then(response => response.json())
        .then(data => {
            var units = data.data;
            for (var i = 0; i < units.length; i++) {
                if (units[i].empUnit != null && units[i].empUnit != "empUnit") {
                    var option = document.createElement("option");
                    option.text = units[i].empUnit;
                    option.value = units[i].empUnit;
                    unitSelectEl.add(option);
                }
            }
            selectedUnit = units[0].empUnit; // set the selected Unit to the first element of the units array
            populatePUs(units[0].empUnit);
            updateMedians();
        })
        .catch(error => console.error(error));

}

function populatePUs(unit) {

    var puSelectEl = document.getElementById("PUs");
    puSelectEl.options.length = 0;

    fetch('http://127.0.0.1:3000/getPUs?u=' + selectedUnit)
        .then(response => response.json())
        .then(data => {
            var pus = data.data;
            for (var i = 0; i < pus.length; i++) {
                if (pus[i].empPU != null) {
                    var option = document.createElement("option");
                    option.text = pus[i].empPU;
                    option.value = pus[i].empPU;
                    puSelectEl.add(option);
                }
            }
            selectedPU = pus[0].empPU;
            populateDUs(pus[0].empPU);// first PU hopefully not null 
        })
        .catch(error => console.error(error));

}

function populateDUs(selectedPU) {
    var duSelectEl = document.getElementById("DUs");
    duSelectEl.options.length = 0;

    fetch('http://127.0.0.1:3000/getDUs?p=' + selectedPU)
        .then(response => response.json())
        .then(data => {
            var dus = data.data;
            for (var i = 0; i < dus.length; i++) {
                if (dus[i].empDU != null) {
                    var option = document.createElement("option");
                    option.text = dus[i].empDU;
                    option.value = dus[i].empDU;
                    duSelectEl.add(option);
                }
            }
            selectedDU = dus[0].empDU;
            populateBPHRNPS(dus[0].empDU);
        })
        .catch(error => console.error(error));
}

function changedUnit() {
    var unitSelectEl = document.getElementById("units");
    selectedUnit = unitSelectEl.value;
    populatePUs(selectedUnit);
}

function changedPU() {
    var puSelectEl = document.getElementById("PUs");
    selectedPU = puSelectEl.value;
    populateDUs(selectedPU);
}

function changedDU() {
    var duSelectEl = document.getElementById("DUs");
    selectedDU = duSelectEl.value;
    const filteredBPHR = populateBPHRNPS(selectedDU);
}

function changedDUJL() {

    var dujlEl = document.getElementById("DUJL");
    var selectedJL = dujlEl.value;

    var ducountryEl = document.getElementById("DUCuntries");
    var selectedCountry = ducountryEl.value;


    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://127.0.0.1:3000/getBPHRsWithFilters?d=" + selectedDU + "&jl=" + selectedJL + "&country=" + selectedCountry, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            updateTheBPHRTable(result);
        })
        .catch((error) => console.error(error));
}

function changedDUCountry() {

    var ducountryEl = document.getElementById("DUCuntries");
    var duJLEl = document.getElementById("DUJL");
    var selectedCountry = ducountryEl.value;

    if (selectedCountry == "All") {
        duJLEl.options.length = 0;
        var o = document.createElement("option");
        o.text = "All";
        o.value = "All";
        duJLEl.append(o);
        populateBPHRNPS(selectedDU);
    } else {
        getJLsforFilteredBPHR(selectedDU, selectedCountry);
    }
}

function getUniqueBPHREmpJL() {
    bphrEmpJLArray = [];
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://127.0.0.1:3000/getAllBPHREmpJLs", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            bphrEmpJLArray = Array.from(result.data);
        })
        .catch((error) => {
            console.error(error)
        });
}

function populateBPHRNPS(selectedDU) {

    //getBPHRsWithFilters
    countriesForFilteredDU = [];


    fetch('http://127.0.0.1:3000/getBPHRs?d=' + selectedDU)
        .then(response => response.json())
        .then(data => {
            updateTheBPHRTable(data);
        }
        )
        .catch(error => console.error(error));

    populateCountryFilter(selectedDU);
}

function populateCountryFilter(selectedDU) {

    var countriesForFilteredDUElement = document.getElementById("DUCuntries");
    countriesForFilteredDUElement.options.length = 0;
    countriesForFilteredDU = [];

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://127.0.0.1:3000/getUniqueCountriesForSelectedDU?d=" + selectedDU, requestOptions)
        .then((response) => response.json())
        .then((result) => {

            if (result.data.length > 1)
                countriesForFilteredDU.push("All");

            result.data.forEach(C => {
                countriesForFilteredDU.push(C.empCountry);
            });

            // console.log(countriesForFilteredDU);

            countriesForFilteredDU.forEach(CC => {

                var o = document.createElement("option");
                o.text = CC;
                o.value = CC;
                countriesForFilteredDUElement.appendChild(o);

            });

            getJLsforFilteredBPHR(selectedDU, countriesForFilteredDU[0]);
        })
        .catch((error) => console.error(error));
}

function updateTheBPHRTable(params) {

    var bphrNPSTableBodyEl = document.getElementById("bphrNPSTableBody");
    clearNPSTable();
    nps_data = [];

    var bphrs = params.data;
    var npsTableEl = document.getElementById("bphrNPSTable");
    nps_data.push(['BPHR Partner', 'NPS', { role: 'style' }]);
    bphrs.forEach(element => {
        var medianNPS = getMedianNPS(element.bphrEmpJL);
        // console.log("median in the table is = " + medianNPS);

        element.JLMedian = medianNPS;
        var table_row = document.createElement("tr");
        var ElementKeys = Object.entries(element);
        var d = [];

        var elementColor = "#" + (Math.abs(element.NPS + 50)).toString(16) + "00" + (Math.abs(element.NPS)).toString(16);


        d.push(element.bphrName, element.NPS, elementColor);
        nps_data.push(d);
        ElementKeys.forEach(k => {
            var tdEl = document.createElement("td");
            if (k[0] == "bphrName") {
                tdEl.classList.add("bphrNameClass");
                tdEl.addEventListener('click', getBPHRDetails);
            }
            tdEl.innerText = k[1];
            table_row.append(tdEl);
        });
        bphrNPSTableBodyEl.append(table_row);

    });
    var bphrDUNPSChartBox = document.getElementById("NPSChart");
    drawChart(nps_data, bphrDUNPSChartBox, "DU NPS Chart");
}

function clearNPSTable() {

    tbodyEl = document.getElementById("bphrNPSTableBody");
    while (tbodyEl.firstChild) {
        // The list is LIVE so it will re-index each call
        tbodyEl.removeChild(tbodyEl.firstChild);
    }
}

function getMedianNPS(bphrEmpJL) {
    var result = null;
    bphrEmpJMedianNPSArray.forEach(x => {
        if (x.bphrEmpJL == bphrEmpJL) {
            // console.log("x.bphrEmpJL = " + x.bphrEmpJL + " bphrEmpJL = " + bphrEmpJL + " median = " + x.medianNPS);
            result = x.medianNPS;
        }
    });
    return result;
};

function getBPHRDetails(clickedName) {
    document.getElementById("modalTitle").innerHTML = clickedName.currentTarget.innerHTML;
    showModal();
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    var unit_nps_data = [];
    unit_nps_data.push(['Unit', 'NPS Score', { role: 'style' }]);
    fetch("http://127.0.0.1:3000/getBPHRMappedUnits?bphr=" + clickedName.currentTarget.innerHTML, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var unit_npsData = result.data;
            unit_npsData.forEach(element => {
                var elementColor = "#" + (Math.abs(element.NPS + 50)).toString(16) + "00" + (Math.abs(element.NPS)).toString(16);
                unit_nps_data.push([element.empUnit, element.NPS, elementColor]);
            });

            var unitNPSChartEl = document.getElementById("Modalchart1");
            drawChart(unit_nps_data, unitNPSChartEl, "Unit-NPS Score");
        })
        .catch((error) => console.error(error));


    // PU nps data

    var pu_nps_data = [];
    pu_nps_data.push(['PU', 'NPS Score', { role: 'style' }]);

    fetch("http://127.0.0.1:3000/getBPHRMappedPUs?bphr=" + clickedName.currentTarget.innerHTML, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var pu_npsData = result.data;
            pu_npsData.forEach(element => {
                var elementColor = "#" + (Math.abs(element.NPS + 50)).toString(16) + "00" + (Math.abs(element.NPS)).toString(16);
                pu_nps_data.push([element.empPU, element.NPS, elementColor]);
            });
            var puNPSChartEl = document.getElementById("Modalchart2");
            drawChart(pu_nps_data, puNPSChartEl, "PU-NPS Score");
        })
        .catch((error) => console.error(error));


    // DU nps data

    var du_nps_data = [];
    du_nps_data.push(['DU', 'NPS Score', { role: 'style' }]);

    fetch("http://127.0.0.1:3000/getBPHRMappedDUs?bphr=" + clickedName.currentTarget.innerHTML, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var du_npsData = result.data;
            du_npsData.forEach(element => {
                var elementColor = "#" + (Math.abs(element.NPS + 50)).toString(16) + "00" + (Math.abs(element.NPS)).toString(16);
                du_nps_data.push([element.empDU, element.NPS, elementColor]);
            });
            var duNPSChartEl = document.getElementById("Modalchart3");
            drawChart(du_nps_data, duNPSChartEl, "DU-NPS Score");
        })
        .catch((error) => console.error(error));


    // NPS as function of empJL
    //Modalchart5

    var jl_nps_data = [];
    jl_nps_data.push(['JL', 'NPS Score', { role: 'style' }]);

    fetch("http://127.0.0.1:3000/getBPHRNPSbyEmpJL?bphr=" + clickedName.currentTarget.innerHTML, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var npsData = result.data;
            npsData.forEach(element => {
                var elementColor = "#" + (Math.abs(element.NPS + 50)).toString(16) + "00" + (Math.abs(element.NPS)).toString(16);
                jl_nps_data.push([element.empJL, element.NPS, elementColor]);
            });
            var jlNPSChartEl = document.getElementById("Modalchart5");

            drawChart(jl_nps_data, jlNPSChartEl, "JL-NPS Score");
        })
        .catch((error) => console.error(error));


    getCountryNPS(clickedName.currentTarget.innerHTML);

    drawRaringDetailsChart(clickedName.currentTarget.innerHTML);
}

function getJLsforFilteredBPHR(filteredDU, filteredCountry) {

    var duJLEl = document.getElementById("DUJL");
    duJLEl.options.length = 0;
    empJLforFilteredDU = [];
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://127.0.0.1:3000/getDistinctEmpJLforFilteredDUAndCountry?d=" + filteredDU + "&c=" + filteredCountry, requestOptions)
        .then((response) => response.json())
        .then((result) => {

            if (result.data.length > 1)
                empJLforFilteredDU.push("All");

            result.data.forEach(r => {
                empJLforFilteredDU.push(r.empJL);
            });
            // console.log(empJLforFilteredDU);
            //now populate the JL filter

            empJLforFilteredDU.forEach(j => {
                var o = document.createElement("option");
                o.text = j;
                o.value = j;
                duJLEl.append(o);
            });

            if (result.data.length > 1) {
                // update table with JL = All and selected Country
                selectedJL = "All";
            }

            if (result.data.length == 1) {
                //update table with whatever JL in [0] position and the selected Country
                selectedJL = empJLforFilteredDU[0];
            }

            changedDUJL();

        })
        .catch((error) => console.error(error));
}

function drawChart(barchart_data, chartBox, chartTitle) {

    // Set Data
    const data = google.visualization.arrayToDataTable(barchart_data);
    const chartWidth = document.getElementsByClassName("home-chartcontainer")[0].clientWidth;
    const chartHeight = document.getElementsByClassName("home-chartcontainer")[0].clientHeight;

    console.log("chartWidth = " + chartWidth + " chartHeight = " + chartHeight);
    // Set Options
    const options = {
        'title': chartTitle,
        'width': chartWidth,
        'height': chartHeight
    };

    // Draw
    const chart = new google.visualization.ColumnChart(chartBox);
    chart.draw(data, options);
}

function updateMedians() {

    getMedianNPSforBPHREmpJL();

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch("http://127.0.0.1:3000/getMedianNPSByEMPJL?j=2", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var data = result.data;
            document.getElementById("jl2Value").innerHTML = data.MedianNPS;
            document.getElementById("jl2Label").innerHTML = "JL " + data.jl;

        })
        .catch((error) => console.error(error));

    fetch("http://127.0.0.1:3000/getMedianNPSByEMPJL?j=3", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var data = result.data;
            document.getElementById("jl3Value").innerHTML = data.MedianNPS;
            document.getElementById("jl3Label").innerHTML = "JL " + data.jl;

        })
        .catch((error) => console.error(error));

    fetch("http://127.0.0.1:3000/getMedianNPSByEMPJL?j=4", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var data = result.data;
            document.getElementById("jl4Value").innerHTML = data.MedianNPS;
            document.getElementById("jl4Label").innerHTML = "JL " + data.jl;

        })
        .catch((error) => console.error(error));

    fetch("http://127.0.0.1:3000/getMedianNPSByEMPJL?j=5", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var data = result.data;
            document.getElementById("jl5Value").innerHTML = data.MedianNPS;
            document.getElementById("jl5Label").innerHTML = "JL " + data.jl;

        })
        .catch((error) => console.error(error));

    fetch("http://127.0.0.1:3000/getMedianNPSByEMPJL?j=6", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var data = result.data;
            document.getElementById("jl6Value").innerHTML = data.MedianNPS;
            document.getElementById("jl6Label").innerHTML = "JL " + data.jl;

        })
        .catch((error) => console.error(error));

    fetch("http://127.0.0.1:3000/getMedianNPSByEMPJL?j=7", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            var data = result.data;
            document.getElementById("jl7Value").innerHTML = data.MedianNPS;
            document.getElementById("jl7Label").innerHTML = "JL " + data.jl;

        })
        .catch((error) => console.error(error));
}


function getMedianNPSforBPHREmpJL() {
    bphrEmpJLArray.forEach(j => {
        mForBJL(j);
    });
}

