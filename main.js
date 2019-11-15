let courses = [];
let coursePromises = [];
let courseOverview = [];
let card;
let myCourseIndex;
let myDifficultyIndex;


function loadCourses() {
    let courseOverviewPromise = new Promise(((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                let contentStr = JSON.parse(this.responseText);
                resolve(contentStr);
            }
        };
        xhttp.open("GET", "https://golf-courses-api.herokuapp.com/courses", true);
        xhttp.send();
    }));
    courseOverviewPromise.then((content) => {
        //setup course selection
        courseOverview = content;
        for (let i = 0; i < content.courses.length; i++) {
            coursePromises.push(new Promise(((resolve, reject) => {
                let xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        let contentStr = JSON.parse(this.responseText);
                        resolve(contentStr);
                    }
                };
                xhttp.open("GET", `https://golf-courses-api.herokuapp.com/courses/${content.courses[i].id}`, true);
                xhttp.send();
            })));
        }
        Promise.all(coursePromises).then(content => {
            courses.push(content);
            loadCourseHTML();
        });

    });
}

function loadCourseHTML() {
    $("#locations").html("");
    for (let i = 0; i < courseOverview.courses.length; i++) {
        $("#locations").append(`
        <div class="location">
            <img src=${courseOverview.courses[i].image}>
            <span>${courseOverview.courses[i].name}</span>
            <button onclick="toggleDifficulties(${i})">
                <span>Select Difficulty</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="difficulties" id="difficulties${i}">
                
            </div>
        </div>
    `);
        toggleDifficulties(i);
    }
}

function toggleDifficulties(index) {
    let courseID = "#difficulties" + index;
    // console.log($(courseID).innerHTML);
    let isNotVisible = $(courseID).html() === undefined || $(courseID).html() === "";
    $(courseID).html("");
    if (isNotVisible) {
        console.log(courses[0][index].data.holes[0].teeBoxes);
        for (let i = 0; i < courses[0][index].data.holes[0].teeBoxes.length; i++) {
            let teeBox = courses[0][index].data.holes[0].teeBoxes[i];
            console.log(teeBox.teeHexColor);
            $(courseID).append(`
            <button style="background-color: ${teeBox.teeHexColor}" onclick="generateCard(${index}, ${i})">
                ${teeBox.teeType}
            </button>
        `);
        }
    }

}


function generateCard(courseIndex, difficultyIndex) {
    card = new Card(courseIndex, difficultyIndex);
    myCourseIndex = courseIndex;
    myDifficultyIndex = difficultyIndex;
    generateCardHTML();
}

function buildColumns() {
    for (let i = 0; i < 22; i++) {
        $("#scorecard").append(`<div id="col${i}" class="col"></div>`);
    }
}

function setupTopRows() {
    //First Column
    $(`#col0`).append(`<div class="rowbox">Hole</div>
                      <div class="rowbox">${card.difficulty.teeType}</div>
                      <div class="rowbox">Par</div>
`);
    //Out column
    let parOutTotal = 0;
    for (let i = 0; i < 9; i++) {
        parOutTotal += card.holes[i].teeBoxes[myDifficultyIndex].par;
    }
    console.log("Test: Par OUT:  " + parOutTotal);
    $(`#col10`).append(`<div class="rowbox">OUT</div>
                      <div class="rowbox"></div>
                      <div class="rowbox">${parOutTotal}</div>
`);
    //In Column
    let parInTotal = 0;
    for (let i = 9; i < 18; i++) {
        parInTotal += card.holes[i].teeBoxes[myDifficultyIndex].par;
    }
    console.log("Test: Par IN:  " + parInTotal);
    $(`#col20`).append(`<div class="rowbox">IN</div>
                      <div class="rowbox"></div>
                      <div class="rowbox">${parInTotal}</div>
                      
`);
    //Total Column
    let parTotal = parOutTotal + parInTotal;
    console.log("Test: Par Out:  " + parInTotal);
    $(`#col21`).append(`<div class="rowbox">TOT</div>
                      <div class="rowbox"></div>
                      <div class="rowbox">${parTotal}</div>
`);
    for (let i = 0; i < 22; i++) {
        let holeNum = i > 9 ? i - 1 : i;
        let holeIndex = i > 9 ? i - 2 : i - 1;
        if ([0, 10, 20, 21].indexOf(i) === -1) {
            $(`#col${i}`).append(`
                 <div class="rowbox">${holeNum}</div>
                 <div class="rowbox">${card.holes[holeIndex].teeBoxes[myDifficultyIndex].yards}</div>
                 <div class="rowbox">${card.holes[holeIndex].teeBoxes[myDifficultyIndex].par}</div>
`);
            console.log(holeNum);
        }
    }
}

function buildPlayerRow() {
    let playerNum = card.players.length;
    for (let i = 0; i < 22; i++) {
        let holeNum = i > 9 ? i - 1 : i;
        switch (i) {
            case 0: //Player name
                $(`#col0`).append(`<input type="text" placeholder="Name" class="nameInput">`);
                break;
            case 10: //Player Out
                $(`#col10`).append(`<div id="p${playerNum}o" class="rowbox"></div>`);
                break;
            case 20: //Player In
                $(`#col20`).append(`<div id="p${playerNum}i" class="rowbox"></div>`);
                break;
            case 21: //Total
                $(`#col21`).append(`<div id="p${playerNum}t" class="rowbox"></div>`);
                break;
            default: //Holes (1-9 : index 1-9) - (10-18 : index 11:19)
                $(`#col${i}`).append(`<input type="text" id="p${playerNum}h${holeNum}" class="rowbox">`);
        }
    }
}

function generateCardHTML() {
    $("#container").html("");
    $("#container").append(`<div id="card"></div>`);
    $("#card").append(`<div class="title">Golf Scorecard</div>`);
    $("#card").append(`<div id="scorecard"></div>`);
    buildColumns();
    setupTopRows();
    $("#card").append('<button class="newPlayerButton" onclick="addPlayer()">Add Player</button>');
    document.addEventListener('keyup', (event) => {
        if (event.target.id[1] > 0) {
            let playerNum = event.target.id[1];
            card.players[playerNum - 1].setTotals();
        }
    });
}


function addPlayer() {
    if(card.players.length <= 3){
        card.players.push(new Player());
        buildPlayerRow();
    }
}

class Card {
    constructor(courseIndex, difficultyIndex) {
        this.holes = courses[0][courseIndex].data.holes;
        this.players = [];
        this.difficulty = courses[0][courseIndex].data.holes[0].teeBoxes[difficultyIndex];
    }
}

class Player {
    constructor() {
        this.name = "";
        this.holes = [];
        for (let i = 0; i < 18; i++) {
            this.holes.push("");
        }
        this.playerNum = card.players.length + 1;
    }

    setHoles() {
        //get values from html inputs into this.holes
        for (let j = 0; j < 18; j++) {
            let id = "#p" + this.playerNum + "h" + (j + 1);
            this.holes[j] = $(id).val();
        }
    }

    setTotals() {
        this.setHoles();
        let outTotal = this.getOut();
        let inTotal = this.getIn();
        $(`#p${this.playerNum}o`).html(outTotal);
        $(`#p${this.playerNum}i`).html(inTotal);
        $(`#p${this.playerNum}t`).html(outTotal + inTotal);
    }

    getOut() {
        let out = 0;
        for (let i = 0; i < 9; i++) {
            out += Number(this.holes[i]);
        }
        return out;
    }

    getIn() {
        let inTot = 0;
        for (let i = 9; i < 18; i++) {
            inTot += Number(this.holes[i]);
        }
        return inTot;
    }
}


function setup() {
    loadCourses();
}
setup();

//TODO: add a select to make it so you can change difficulty
//TODO: make it mobile friendly by a media query that changes it to vertical format





