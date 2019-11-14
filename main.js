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
    updateCardHTML(courseIndex, difficultyIndex);
    document.addEventListener('keyup', () => {
        Player.setHoles();
        for (let i = 0; i < card.players.length; i++){
            console.log(card.players[i].getOut());
            // console.log(card.players[i].getIn());
            $(`#p${i}o`).html(card.players[i].getOut());
            $(`#p${i}i`).html(card.players[i].getIn());
        }
    });
}

function updateCardHTML(courseIndex, difficultyIndex){
    $("#container").html("");
    $("#container").append(`<div id="card"></div>`);
    $("#card").append(`<div class="title">Golf Scorecard</div>`);
    $("#card").append(`<div id="scorecard"></div>`);
    let leftBarStr = `
    <div class="col">
        <div class="rowbox">Hole</div>
        <div class="rowbox">${card.difficulty.teeType}</div>
        <div class="rowbox">Par</div>`;
    for (let j = 0; j < card.players.length; j++) {
        leftBarStr += `<div class="rowbox" id="p${j}">
                            <input type="text">
                       </div>`
    }
    leftBarStr += `</div>`;
    $("#scorecard").append(leftBarStr);
    for (let i = 0; i < 9; i++) {
        let colStr = `
        <div class="col">
            <div class="rowbox">${i + 1}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].yards}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].par}</div>`;
        for (let j = 0; j < card.players.length; j++) {
            colStr += `<div class="rowbox" >
                            <input type="text" id="p${j}h${i}">
                       </div>`
        }
        colStr += `</div>`;
        $("#scorecard").append(colStr);
    }


    //out col
    let open = `<div class="col">`;
    let scores = `<div class="rowbox">OUT</div>`;
    scores += `<div class="rowbox"></div>` + `<div class="rowbox"></div>`;
    for (let i = 0; i < card.players.length; i++) {
        scores += `<div class="rowbox" id="p${i}o"></div>`;
    }
    let end = `</div>`;
    let outScore = open + scores + end;
    $("#scorecard").append(outScore);


    for (let i = 9; i < 18; i++) {
        let colStr = `
        <div class="col">
            <div class="rowbox">${i + 1}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].yards}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].par}</div>`;
        for (let j = 0; j < card.players.length; j++) {
            colStr += `<div class="rowbox">
                            <input type="text" id="p${j}h${i}">
                      </div>`
        }
        colStr += `</div>`;
        $("#scorecard").append(colStr);
    }

    //in col
    let openIN = `<div class="col">`;
    let scoresIN= `<div class="rowbox">IN</div>`;
    scoresIN += `<div class="rowbox"></div>` + `<div class="rowbox"></div>`;
    for (let i = 0; i < card.players.length; i++) {
        scoresIN += `<div class="rowbox" id="p${i}i"></div>`;
    }
    let endIN = `</div>`;
    let inScore = openIN + scoresIN + endIN;
    $("#scorecard").append(inScore);
    $("#container").append(`<button onclick="addPlayer()">Add Player</button>`);
}

function addPlayer() {
    card.players.push(new Player());
    updateCardHTML(myCourseIndex, myDifficultyIndex);
}


class Card {
    constructor(courseIndex, difficultyIndex) {
        this.holes = courses[0][courseIndex].data.holes;
        this.players = [];
        this.difficulty = courses[0][courseIndex].data.holes[0].teeBoxes[difficultyIndex];
    }
}


class Player{
    constructor(){
        this.name = "";
        this.holes = [];
        for (let i = 0; i < 18; i++){
            this.holes.push("");
        }
    }
    static setHoles(){
        for (let i = 0; i < card.players.length; i++){
            for (let j = 0; j < 18; j++){
                let id = "#p" + i + "h" + j;
                card.players[i].holes[j] = $(id).val();
            }
        }
    }
    getOut(){
        let out = 0;
        for (let i = 0; i < 9; i++){
            out += Number(this.holes[i]);
        }
        return out;
    }
    getIn(){
        let inTot = 0;
        for (let i = 9; i < 18; i++){
            inTot += Number(this.holes[i]);
        }
        return inTot;
    }
}

function setup() {
    loadCourses();
}

setup();






