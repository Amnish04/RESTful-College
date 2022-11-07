const Sequelize = require('sequelize');
const Parser = require("./url-parser");
const { urlParser } = Parser;

/* 
    IMPORTANT: The hard coded version is for testing locally. It may not work all the time as postgres chnages credentials periodically. This is why I took the time 
               to implement a module that parses heroku config variables and creates a dynamic connection on runtime.
*/
let credentials; // This is unsafe
try {
    if (!process.env.DATABASE_URL) {
        throw "Invalid Connection String!";
    }
    credentials = urlParser.parseDatabaseUrl(process.env.DATABASE_URL);
}
catch(err) {
    credentials = urlParser.parseDatabaseUrl("postgres://collegedb_user:XELBI8rEXI141sHFlv0foAu89uOlO3az@dpg-cdkp8k5a49999psf9qbg-a.oregon-postgres.render.com:5432/collegedb");
}
// OLD DATABASE_URL --> postgres://ztnvxwguilmsrm:c5cf1a766f90ece5bd0e9443c80bc5579a864418515cca1ccc1b3bc5175bf593@ec2-3-213-228-206.compute-1.amazonaws.com:5432/d5vp1lfqo0ooi1

const sequelize = new Sequelize(credentials.database, credentials.user, credentials.password, {
    host: credentials.host,
    dialect: 'postgres',
    port: credentials.port,
    dialectOptions: {
    ssl: { rejectUnauthorized: false }
    },
    query:{ raw: true }
});

sequelize
.authenticate()
.then(function() {
    console.log('Connection has been established successfully.');
})
.catch(function(err) {
    console.log('Unable to connect to the database:', err);
});

/* Creating Data Models */

// Student Model
const Student = sequelize.define("Student", {
    studentNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressProvince: Sequelize.STRING,
    TA: Sequelize.BOOLEAN,
    status: Sequelize.STRING
});

// Course Model
const Course = sequelize.define("Course", {
    courseId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    courseCode: Sequelize.STRING,
    courseDescription: Sequelize.STRING
});

// Define model relationaship
Course.hasMany(Student, {
    foreignKey: "course"
});

// Courses and Students actually have a many-to-many relationship, so we should have had a bridging table called StudCourse as well, 
// but we wont' to do that in this assignment for the sake of simplicity


module.exports.initialize = function () {
    return new Promise( (resolve, reject) => {
        sequelize.sync().then(function() {
            resolve();
        }).catch(function() {
            reject("unable to sync the database");
        });
        return; // Optional
    });
}

module.exports.getAllStudents = function(){
    return new Promise((resolve, reject) => {
        Student.findAll()
        .then((data) => {
            resolve(data);
        })
        .catch((msg) => {
            reject("No results returned!" + msg ? (" " + msg) : "");
        });
    });
}

module.exports.getCourses = function(){
    return new Promise((resolve, reject) => {
        Course.findAll()
        .then((data) => {
            resolve(data);
        })
        .catch((msg) => {
            reject("No results returned!" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.getStudentByNum = function(num) {
    return new Promise(function (resolve, reject) {
        Student.findAll({
            where: {
                studentNum: num
            }
        }).then((data) => {
            resolve(data);
        }).catch((msg) => {
            reject("No results returned!" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.getStudentsByCourse = function (course) {
    return new Promise(function (resolve, reject) {
        Student.findAll({ where: {
                course: course
            }
        })
        .then((data) => {
            resolve(data);
        })
        .catch((msg) => {
            reject("No results returned!" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.getCourseById = function (id) {
    return new Promise(function (resolve, reject) {
        Course.findAll({
            where: {
                courseId: id
            }
        }).then((data) => {
            resolve(data);
        }).catch((msg) => {
            reject("No results returned!" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.addStudent = function (studentData) {
    return new Promise(function (resolve, reject) {
        // Make sure studentData.TA is not undefined
        studentData.TA = (studentData.TA) ? true : false;
        // Set empty values to null
        for (let property in studentData) {
            if (studentData[property] === undefined || studentData[property].length === 0) {
                studentData[property] = null;
            }
        }
        Student.create(studentData)
        .then((data) => {
            resolve("Successfully created" + data ? (" " + data) : "");
        })
        .catch((msg) => {
            reject("Unable to create student" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.updateStudent = function (studentData) {
    return new Promise(function (resolve, reject) {
        // Make sure studentData.TA is not undefined
        studentData.TA = (studentData.TA) ? true : false;
        // Set empty values to null
        for (let property in studentData) {
            if (!studentData[property] || studentData[property].length === 0) {
                studentData[property] = null;
            }
        }
        // Update
        Student.update( studentData, {
            where: {
                studentNum: studentData.studentNum
            }
        })
        .then((data) => {
            resolve("Successfully Updated" + data ? (" " + data) : "");
        })
        .catch((msg) => {
            reject("Unable to update student" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.deleteStudentByNum = function(studentNum) {
    return new Promise((resolve, reject) => {
        Student.destroy({where: {
                studentNum: studentNum
            }
        })
        .then(() => {
            resolve();
        })
        .catch((err) => {
            reject(err);
        })
    });
};

module.exports.addCourse = function(courseData) {
    return new Promise(function (resolve, reject) {
        // Set empty values to null
        for (let property in courseData) {
            if (!courseData[property] || courseData[property].length === 0) {
                courseData[property] = null;
            }
        }
        // CRUD Operation
        Course.create(courseData)
        .then((data) => {
            resolve("Successfully created course" + data ? (" " + data) : "");
        })
        .catch((msg) => {
            reject("Unable to create course" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.updateCourse = function(courseData) {
    return new Promise((resolve, reject) => {
        // Set empty values to null
        for (let property in courseData) {
            if (!courseData[property] || courseData[property].length === 0) {
                courseData[property] = null;
            }
        }
        console.log(courseData);
        // CRUD Operation
        Course.update(courseData, {
            where: {
                courseId: courseData.courseId
            }
        })
        .then((data) => {
            resolve("Successfully updated course" + data ? (" " + data) : "");
        })
        .catch((msg) => {
            reject("Unable to update course" + msg ? (" " + msg) : "");
        });
    });
};

module.exports.deleteCourseById = function(id) {
    return new Promise((resolve, reject) => {
        Course.destroy({
            where: {
                courseId: id
            }
        }).then((data) => {
            resolve(data);
        }).catch((msg) => {
            reject(msg);
        });
    });
};
