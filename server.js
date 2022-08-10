const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const data = require("./modules/collegeData.js");
const { rejects } = require("assert");
const clientSessions = require("client-sessions");
const { rmSync } = require("fs");

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

// Sample User for the app
const user = {
    name: "Amnish Singh",
    username: "amnish",
    password: "strong-password"
};

const MINUTES = 60 * 1000;
// Establishing the user session
app.use(clientSessions({
    cookieName: "session",
    secret: "long-long-secret-string",
    duration: 10*MINUTES,
    activeDuration: 1*MINUTES
}));

/* Setting up the routes */
// Routes could have been more organized, will take split them into different files in next project
app.get("/", validateUser, (req,res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: false
    });
});

app.post("/login", (req, res) => {
    // Handle Authentication
    const username = req.body.username;
    const password = req.body.password;

    if (username === user.username && password === user.password) { // Authenticated
        // Add the user on the session and redirect them to the dashboard page.
        req.session.user = user;
    
        res.redirect("/"); // Home Route
    } else {
        res.render("login", {
            error: "Invalid Username/Password. Please re-enter your credentials!",
            layout: false
        });
    }
});

app.get("/logout", (req, res) => {
    // End user session
    req.session.reset();
    // Back to login page 
    res.redirect("/login");
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

app.get("/students", validateUser, (req, res) => {
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

app.get("/students/add", validateUser, (req,res) => {
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


app.post("/students/add", validateUser, (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    });
});

app.get("/student/:studentNum", validateUser, (req, res) => {
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

app.post("/student/update", validateUser, (req, res) => {
    data.updateStudent(req.body).then(() => {
        res.redirect("/students");
    });
});

app.get("/students/delete/:studentNum", validateUser, (req, res) => {
    data.deleteStudentByNum(req.params.studentNum)
    .then((data) => {
        res.redirect("/students");
    })
    .catch((err) => {
        
        res.status(500).send("Unable to Remove Student / Student not found)");
    });
});

app.get("/courses", validateUser, (req,res) => {
    data.getCourses().then((data)=>{
        if (data.length)
            res.render("courses", {courses: data});
        else
        res.render("courses", {message: "No Results"});
    }).catch(err=>{
        res.render("courses", {message: "no results"});
    });
});

app.get("/course/:id", validateUser, (req, res) => {
    data.getCourseById(req.params.id).then((data) => {
        if (data)
            res.render("course", { course: data[0] }); 
        else res.status(404).sendFile(__dirname + "/views/Error.html");
    }).catch((err) => {
        res.render("course",{message:"no results"}); 
    });
});

app.get("/courses/add", validateUser, (req, res) => {
    res.render("addCourse");
});

app.post("/courses/add", validateUser, (req, res) => {
    data.addCourse(req.body).then(()=>{
        res.redirect("/courses");
    })
    .catch((msg) => {
        console.log(msg);
    });
});

app.post("/course/update", validateUser, (req, res) => {
    data.updateCourse(req.body).then(() => {
        res.redirect("/courses");
    })
    .catch((msg) => {
        res.render("course", {
            error: msg
        });
    });
});

app.get("/course/delete/:id", validateUser, (req, res) => {
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

/* Authorization Middleware */
function validateUser(req, res, next) {
    if (req.session.user) {
        next(); // Authorized, serve the content
    } else {
        res.redirect("/login"); // We are keeping it very simple here
    }
}