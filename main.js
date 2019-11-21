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
    $("#container").append(`<span class="title">Select your Course</span>`);
    $("#container").append(`<div id="locations"></div>`);
    $("#locations").html("");
    for (let i = 0; i < courseOverview.courses.length; i++) {
        $("#locations").append(`
        <div class="location">
            <img src=${courseOverview.courses[i].image}>
            <div>
                <span style="color:white; font-size: 1.25em;">${courseOverview.courses[i].name}</span>
                </div>
                <button class="toggleDiffButton" onclick="toggleDifficulties(${i})">
            
                <span>Select Difficulty</span>
                <i class="fas fa-chevron-down"></i>
                </button>
            <div class="difficulties" id="difficulties${i}">
                
            </div>
        </div>
    `);
        toggleDifficulties(i);
    }
    if (localStorage.getItem("card") !== null) {
        $("#container").append(`<button onclick="loadPreviousCard()" class="defBtn">Load Previous Card</button>`);
    }

}

function toggleDifficulties(index) {
    let courseID = "#difficulties" + index;
    let isNotVisible = $(courseID).html() === undefined || $(courseID).html() === "";
    $(courseID).html("");
    if (isNotVisible) {
        for (let i = 0; i < courses[0][index].data.holes[0].teeBoxes.length; i++) {
            let teeBox = courses[0][index].data.holes[0].teeBoxes[i];
            $(courseID).append(`
            <button class="diffButton" style="background-color: ${teeBox.teeHexColor}" onclick="generateCard(${index}, ${i})">
                ${teeBox.teeType}
            </button>
        `);
        }
    }

}

function loadPreviousCard() {
    card = JSON.parse(localStorage.getItem("card"));
    for (let i = 0; i < card.players.length; i++) {
        let n = card.players[i].name;
        let h = card.players[i].holes;
        let p = card.players[i].playerNum;
        card.players[i] = new Player();
        card.players[i].name = n;
        card.players[i].holes = h;
        card.players[i].playerNum = p;
    }
    myCourseIndex = JSON.parse(localStorage.getItem("myCourseIndex"));
    myDifficultyIndex = JSON.parse(localStorage.getItem("myDifficultyIndex"));
    generateCardHTML();
    for (let i = 0; i < card.players.length; i++) {
        buildPlayerRow(i + 1, card.players[i].name, card.players[i].holes);
        card.players[i].setTotals();
    }
}

function generateCard(courseIndex, difficultyIndex) {
    card = new Card(courseIndex, difficultyIndex);
    myCourseIndex = courseIndex;
    myDifficultyIndex = difficultyIndex;
    clearAll();
    saveAll();
    generateCardHTML();
}

function buildColumns() {
    for (let i = 0; i < 22; i++) {
        $("#scorecard").append(`<div id="col${i}" class="col"></div>`);
    }
}

function setupTopRows() {
    //First Column
    let difficulty = card.difficulty.teeType[0].toUpperCase() + card.difficulty.teeType.substring(1);
    let textColor = "#a9aeb9";
    $(`#col0`).append(`<div class="rowbox">Hole</div>
                      <div class="rowbox" style="background-color: ${card.difficulty.teeHexColor}; color:${textColor}">${difficulty}</div>
                      <div class="rowbox">Par</div>
                      <div class="rowbox">HCP</div>
`);
    //Out column
    let parOutTotal = 0;
    let yardsOutTotal = 0;
    let hcpOutTotal = 0;
    for (let i = 0; i < 9; i++) {
        parOutTotal += card.holes[i].teeBoxes[myDifficultyIndex].par;
        yardsOutTotal += card.holes[i].teeBoxes[myDifficultyIndex].yards;
        hcpOutTotal += card.holes[i].teeBoxes[myDifficultyIndex].hcp;
    }
    $(`#col10`).append(`<div class="rowbox">OUT</div>
                      <div class="rowbox" style="background-color: ${card.difficulty.teeHexColor}; color:${textColor}">${yardsOutTotal}</div>
                      <div class="rowbox">${parOutTotal}</div>
                      <div class="rowbox">${hcpOutTotal}</div>
`);
    //In Column
    let parInTotal = 0;
    let yardsInTotal = 0;
    let hcpInTotal = 0;
    for (let i = 9; i < 18; i++) {
        parInTotal += card.holes[i].teeBoxes[myDifficultyIndex].par;
        yardsInTotal += card.holes[i].teeBoxes[myDifficultyIndex].yards;
        hcpInTotal += card.holes[i].teeBoxes[myDifficultyIndex].hcp;
    }
    $(`#col20`).append(`<div class="rowbox">IN</div>
                      <div class="rowbox" style="background-color: ${card.difficulty.teeHexColor}; color:${textColor}">${yardsInTotal}</div>
                      <div class="rowbox">${parInTotal}</div>
                      <div class="rowbox">${hcpInTotal}</div>
                      
`);
    //Total Column
    let parTotal = parOutTotal + parInTotal;
    let yardsTotal = yardsOutTotal + yardsInTotal;
    let hcpTotal = hcpOutTotal + hcpInTotal;
    $(`#col21`).append(`<div class="rowbox">TOT</div>
                      <div class="rowbox" style="background-color: ${card.difficulty.teeHexColor}; color:${textColor}">${yardsTotal}</div>
                      <div class="rowbox" id="parTotal">${parTotal}</div>
                      <div class="rowbox">${hcpTotal}</div>
`);
    for (let i = 0; i < 22; i++) {
        let holeNum = i > 9 ? i - 1 : i;
        let holeIndex = i > 9 ? i - 2 : i - 1;
        if ([0, 10, 20, 21].indexOf(i) === -1) {
            $(`#col${i}`).append(`
                 <div class="rowbox">${holeNum}</div>
                 <div class="rowbox" style="background-color: ${card.difficulty.teeHexColor}; color:${textColor}">${card.holes[holeIndex].teeBoxes[myDifficultyIndex].yards}</div>
                 <div class="rowbox">${card.holes[holeIndex].teeBoxes[myDifficultyIndex].par}</div>
                 <div class="rowbox">${card.holes[holeIndex].teeBoxes[myDifficultyIndex].hcp}</div>
`);
        }
    }
}

function buildPlayerRow(playerNum = card.players.length, name = "", holes = "") {
    for (let i = 0; i < 22; i++) {
        let holeNum = i > 9 ? i - 1 : i;
        switch (i) {
            case 0: //Player name
                $(`#col0`).append(`<input type="text" placeholder="Name" id="p${playerNum}name" class="nameInput" value="${name}">`);
                break;
            case 10: //Player Out
                $(`#col10`).append(`<div id="p${playerNum}o" class="rowbox">0</div>`);
                break;
            case 20: //Player In
                $(`#col20`).append(`<div id="p${playerNum}i" class="rowbox">0</div>`);
                break;
            case 21: //Total
                $(`#col21`).append(`<div id="p${playerNum}t" class="rowbox">0</div>`);
                break;
            default: //Holes (1-9 : index 1-9) - (10-18 : index 11:19)
                let holeText = "";
                if (holes !== "") {
                    holeText = card.players[playerNum - 1].holes[holeNum - 1];
                }
                $(`#col${i}`).append(`<input type="number" id="p${playerNum}h${holeNum}" class="rowbox" value="${holeText}">`);
        }
    }
}

function generateCardHTML() {
    $("#container").html("");
    $("#container").append(`<div id="card"></div>`);
    $("#card").append(`<div class="title">Golf Scorecard</div>`);
    $("#card").append(`<div id="buttons"></div>`);
    $("#buttons").append('<button class="defBtn" onclick="addPlayer()">Add Player</button>');
    $("#buttons").append('<button class="defBtn" onclick="returnToCourses()">Return to course select</button>');
    $("#buttons").append('<button class="defBtn" onclick="clearAll()">Clear All</button>');
    $("#buttons").append('<button class="defBtn" onclick="Player.gameEnd()">Game Finished</button>');
    $("#card").append(`<div id="scorecard"></div>`);
    buildColumns();
    setupTopRows();
    $("body").append(`<div id="playerMessages"></div>`);


    document.addEventListener('keyup', (event) => {
        if (event.target.id[event.target.id.length - 1] === "e") { //checking if its the nam"e"
            let targetPlayerIndex = Number(event.target.id[1]) - 1;
            card.players[targetPlayerIndex].name = event.target.value;
            let playerNames = [];
            for (let i = 0; i < card.players.length; i++){
                playerNames.push(card.players[i].name)
            }
            for (let i = 0; i < playerNames.length; i++){
                if (playerNames[i] ===  event.target.value && targetPlayerIndex !== i){
                    event.target.value = event.target.value + "_";
                    card.players[targetPlayerIndex].name = event.target.value;
                }
            }

        } else if (event.target.id[1] > 0) {
            let playerNum = Number(event.target.id[1]);
            card.players[playerNum - 1].setTotals();
        }
        saveAll();
    });
}

function addPlayer() {
    if (card.players.length <= 3) {
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
        this.done = false;
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

    static gameEnd() {
        $("#playerMessages").html("");
        for (let j = 0; j < card.players.length; j++) {
            let score = 0;
            for (let i = 0; i < card.players[j].holes.length; i++) {
                score += Number(card.players[j].holes[i]);
            }
            if (score > 0) {
                $("#playerMessages").append(`<div class="message">${card.players[j].name} scored ${score}. Better luck next time!</div>`)
            } else {
                $("#playerMessages").append(`<div class="message">${card.players[j].name} scored ${score}. On to the PGA!</div>`)
            }
        }

    }
}

function saveAll() {
    localStorage.setItem('card', JSON.stringify(card));
    localStorage.setItem('myCourseIndex', JSON.stringify(myCourseIndex));
    localStorage.setItem('myDifficultyIndex', JSON.stringify(myDifficultyIndex));
}

function returnToCourses() {
    $("#container").html("");
    loadCourseHTML();
}

function clearAll() {
    card.players = [];
    localStorage.clear();
    generateCardHTML();
}

function setup() {
    loadCourses();
}

setup();

//TODO: add a select to make it so you can change difficulty





