const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const data = require("./modules/collegeData.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.engine('.hbs', exphbs.engine({ 
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        navLink: function(url, options){
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

app.get("/about", (req,res) => {
    res.render("about");
});

app.get("/htmlDemo", (req,res) => {
    res.render("htmlDemo");
});

app.get("/students", (req, res) => {
    if (req.query.course) {
        data.getStudentsByCourse(req.query.course).then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    } else {
        data.getAllStudents().then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    }
});

app.get("/students/add", (req,res) => {
    res.render("addStudent");
});


app.post("/students/add", (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    });
  });

app.get("/student/:studentNum", (req, res) => {
    data.getStudentByNum(req.params.studentNum).then((data) => {
        res.render("student", { student: data }); 
    }).catch((err) => {
        res.render("student", {message: "no results"})
    });
});

app.post("/student/update", (req, res) => {
    data.updateStudent(req.body).then(() => {
        res.redirect("/students");
    });
});

app.get("/courses", (req,res) => {
    data.getCourses().then((data)=>{
        res.render("courses", {courses: data});
    }).catch(err=>{
        res.render("courses", {message: "no results"});
    });
});

app.get("/course/:id", (req, res) => {
    data.getCourseById(req.params.id).then((data) => {
        res.render("course", { course: data }); 
    }).catch((err) => {
        res.render("course",{message:"no results"}); 
    });
});

app.use((req,res)=>{
    res.status(404).send("Page Not Found");
});


data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

