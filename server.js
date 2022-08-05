/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or
* distributed to other students.
*
* Name: Amnish Singh Arora Student ID: 120097217 Date: To Be Updated
*
* Online (Heroku) Link: ________________________________________________________
*
********************************************************************************/

const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const data = require("./modules/collegeData.js");
const { rejects } = require("assert");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.engine('.hbs', exphbs.engine({ 
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    helpers: {
        navLink: function(url, options) {
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + 
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }        
    }
}));

app.set('view engine', '.hbs');

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});



app.get("/", (req,res) => {
    res.render("home");
});

app.get("/test", (req, res) => {
    res.send(process.env.DATABASE_URL + "Testing");
});


app.get("/about", (req,res) => {
    res.render("about");
});

app.get("/htmlDemo", (req,res) => {
    res.render("htmlDemo");
});

app.get("/htmlDemo/:section", (req,res) => {
    res.render("htmlDemo", {
        section: req.params.section
    });
});

app.get("/students", (req, res) => {
    if (req.query.course) {
        data.getStudentsByCourse(req.query.course).then((data) => {
            if (data.length)
                res.render("students", {students: data});
            else
            res.render("students", {message: "No Results"});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    } else {
        data.getAllStudents().then((data) => {
            if (data.length)
                res.render("students", {students: data});
            else
                res.render("students", {message: "No Results"});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    }
});

app.get("/students/add", (req,res) => {
    data.getCourses()
    .then((data) => {
        res.render("addStudent", {
            courses: data
        });
    }).catch((err) => {
        console.log(err);
        res.render("addStudent", {
            courses: []            
        })
    });
});


app.post("/students/add", (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    });
});

app.get("/student/:studentNum", (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    data.getStudentByNum(req.params.studentNum).then((data) => {
        if (data) {
            viewData.student = data[0]; //store student data in the "viewData" object as "student"
        } else {
            viewData.student = null; // set student to null if none were returned
        }
    }).catch(() => {
        viewData.student = null; // set student to null if there was an error
    }).then(data.getCourses)
    .then((data) => {
        viewData.courses = data; // store course data in the "viewData" object as "courses"
        // loop through viewData.courses and once we have found the courseId that matches
        // the student's "course" value, add a "selected" property to the matching
        // viewData.courses object
        for (let i = 0; i < viewData.courses.length; i++) {
            if (viewData.courses[i].courseId == viewData.student.course) {
                viewData.courses[i].selected = true;
            }
        }
    }).catch(() => {
        viewData.courses = []; // set courses to empty if there was an error
    }).then(() => {
        if (viewData.student == null) { // if no student - return an error
            res.status(404).send("Student Not Found");
        } else {
            res.render("student", { viewData: viewData }); // render the "student" view
        }
    });
});

app.post("/student/update", (req, res) => {
    data.updateStudent(req.body).then(() => {
        res.redirect("/students");
    });
});

app.get("/students/delete/:studentNum", (req, res) => {
    data.deleteStudentByNum(req.params.studentNum)
    .then((data) => {
        res.redirect("/students");
    })
    .catch((err) => {
        
        res.status(500).send("Unable to Remove Student / Student not found)");
    });
});

app.get("/courses", (req,res) => {
    data.getCourses().then((data)=>{
        if (data.length)
            res.render("courses", {courses: data});
        else
        res.render("courses", {message: "No Results"});
    }).catch(err=>{
        res.render("courses", {message: "no results"});
    });
});

app.get("/course/:id", (req, res) => {
    data.getCourseById(req.params.id).then((data) => {
        if (data)
            res.render("course", { course: data[0] }); 
        else res.status(404).sendFile(__dirname + "/views/Error.html");
    }).catch((err) => {
        res.render("course",{message:"no results"}); 
    });
});

app.get("/courses/add", (req, res) => {
    res.render("addCourse");
});

app.post("/courses/add", (req, res) => {
    data.addCourse(req.body).then(()=>{
        res.redirect("/courses");
    })
    .catch((msg) => {
        console.log(msg);
    });
});

app.post("/course/update", (req, res) => {
    data.updateStudent(req.body).then(() => {
        res.redirect("/students");
    })
    .catch((msg) => {
        res.render("course", {
            error: msg
        });
    });
});

app.get("/course/delete/:id", (req, res) => {
    data.deleteCourseById(req.params.id)
    .then(() => {
        res.redirect("/courses");
    })
    .catch(() => {
        res.status("505").send("Unable to Remove Course / Course not found");
    });
});

app.use((req,res)=>{
    res.status(404).sendFile(__dirname + "/views/Error.html");
});


data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});
