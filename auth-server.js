const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

var userSchema = new Schema ({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://George:8AOOf1FsIXCQhLVG@themongodb.0peag.mongodb.net/testDB?retryWrites=true&w=majority" /*, {userNewUrlParser: true}*/);

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};


module.exports.registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords are not match!");
        } else {
            bcrypt.hash(userData.password, 10, (err, hash) => {
                if (err) {
                    reject("Error encrypting the password");
                } else {
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save((err) => {
                        if (err) {
                            if (err.code === 1100) {
                                reject("User name already taken!");
                            } else {
                                reject("There was an error creating the user: " + err);
                            }
                        } else {
                            resolve();
                        }
                    })
                }
            })
        }
    })
};


module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.find({userName: userData.userName})
        .exec()
        .then((users) => {
            bcrypt.compare(userData.password, users[0].password).then((res) => {
                if (res === true) {
                    users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                    User.update(
                        { userName: users[0].userName },
                        { $set: {loginHistory: users[0].loginHistory }},
                        { multi: false }
                    )
                    .exec()
                    .then(() => {
                        resolve(users[0])
                    })
                    .catch((err) => {
                        reject("Unable to find user: user" + err);
                    })
                } else {
                    reject(err, "Incorrect password: " + userData.userName);
                }

            })
        })
        .catch((err) => {
            reject(err, "Unable to find user: " + userData.userName);
        })
    })
};