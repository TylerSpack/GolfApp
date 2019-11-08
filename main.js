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

function setup() {
    loadCourses();

}


setup();


function loadCourseHTML() {
    $("#container").html("");
    for (let i = 0; i < courseOverview.courses.length; i++) {
        $("#container").append(`
        <div class="location">
            <img src=${courseOverview.courses[i].image}>
            <span>${courseOverview.courses[i].name}</span>
        </div>
    `);
    }
}



