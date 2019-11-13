let courses = [];
let coursePromises = [];
let courseOverview = [];

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
    let card = new Card(courseIndex, difficultyIndex);
    //draw the hole, difficulty, player
    $("#container").html("");
    $("#container").append(`<div class="title">Golf Scorecard</div>`);
    $("#container").append(`<div id="scorecard"></div>`);
    $("#scorecard").append(`
        <div class="col">
            <div class="rowbox">Hole</div>
            <div class="rowbox">${card.difficulty.teeType}</div>
            <div class="rowbox">Par</div>
        </div>
    `);
    for (let i = 0; i < 9; i++) {
        let colStr = `
        <div class="col">
            <div class="rowbox">${i + 1}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].yards}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].par}</div>`;
        for (let j = 0; j < card.players.length; j++) {
            colStr += `<div class="rowbox" id="p${j}h${i}">
                            <input type="text">
                       </div>`
        }
        colStr += `</div>`;
        $("#scorecard").append(colStr);
    }


    //in col
    let open = `<div class="col">`;
    let scores = `<div class="rowbox">OUT</div>`;
    scores += `<div class="rowbox"></div>` + `<div class="rowbox"></div>`;
    for (let i = 0; i < card.players.length; i++) {
        scores += `<div class="rowbox" id="p${i}o"></div>`
    }
    let end = `</div>`;
    let inScore = open + scores + end;
    $("#scorecard").append(inScore);


    for (let i = 9; i < 18; i++) {
        let colStr = `
        <div class="col">
            <div class="rowbox">${i + 1}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].yards}</div>
            <div class="rowbox">${card.holes[i].teeBoxes[difficultyIndex].par}</div>`;
        for (let j = 0; j < card.players.length; j++) {
            colStr += `<div class="rowbox" id="p${j}h${i}">
                        <input type="text">
                   </div>`
        }
        colStr += `</div>`;
        $("#scorecard").append(colStr);
    }
}




    class Card {
        constructor(courseIndex, difficultyIndex) {
            this.holes = courses[0][courseIndex].data.holes;
            this.players = [];
            this.difficulty = courses[0][courseIndex].data.holes[0].teeBoxes[difficultyIndex];
        }
    }


    function setup() {
        loadCourses();
    }

    setup();






